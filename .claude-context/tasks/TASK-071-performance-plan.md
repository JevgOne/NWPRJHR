# TASK-071: Performance — pomalé načítání produktů a admin panelu

## Analýza problému

Turso je remote SQLite DB. Každý Prisma dotaz = HTTP roundtrip přes internet (~50-150ms per query). Aktuální kód nemá žádné cachování na serverové straně (kromě `Cache-Control` header na public products API).

---

## Nalezené bottlenecky (seřazeno dle priority)

### 1. KRITICKÉ: Dashboard — 12 paralelních DB dotazů

**Soubor**: `src/app/(app)/dashboard/page.tsx:54-132`

Dashboard spouští **12 paralelních Prisma dotazů** v jednom `Promise.all`:
1. `sale.aggregate` (sales this month)
2. `delivery.findMany` (all deliveries with remaining stock + variant + product)
3. `invoice.aggregate` (open invoices)
4. `salon.count` (active salons)
5. `sale.aggregate` (total sales ever)
6. `saleItem.aggregate` (total grams sold)
7. `$queryRawUnsafe` (low stock variants — JOIN + GROUP BY)
8. `stockMovement.findMany` (recent 6 movements + variant + product)
9. `return.count` (pending)
10. `order.count` (new)
11. `notification.count` (unread)
12. `salon.count` (pending registrations)

I když jsou paralelní, to je **12 HTTP roundtripů** k Turso (~50-150ms each). Celkový čas: ~150-500ms jen na DB.

**Problém navíc**: Dotaz #2 (`delivery.findMany` where remainingGrams > 0) stahuje VŠECHNY delivery záznamy jen kvůli výpočtu stockValue. S rostoucím inventářem bude pomalejší.

**Řešení**:
- Nahradit `delivery.findMany` (dotaz #2) jedním `$queryRawUnsafe` s SUM + GROUP BY:
  ```sql
  SELECT 
    p.category,
    SUM(d.remainingGrams) as totalGrams,
    SUM(d.remainingGrams * d.purchasePricePerGramCZK) as purchaseValue,
    SUM(d.remainingGrams * v.retailPricePerGram) as retailValue
  FROM deliveries d
  JOIN variants v ON d.variantId = v.id
  JOIN products p ON v.productId = p.id
  WHERE d.remainingGrams > 0
  GROUP BY p.category
  ```
  To nahradí stahování N řádků jedním 4-řádkovým výsledkem.

- Cachovat dashboard data pomocí Next.js `unstable_cache` s `revalidate: 60` (1 minuta). Dashboard data se mění pomalu.

### 2. KRITICKÉ: getAllStockNumbers() — voláno na 7 místech, NIKDY cachováno

**Soubor**: `src/lib/stock.ts:74-129`

Funkce `getAllStockNumbers()` spouští **2 raw SQL dotazy** (deliveries GROUP BY + reservations GROUP BY). Je volána na **7 místech**:
1. `dashboard/page.tsx` (ne přímo, ale přes delivery.findMany)
2. `products/page.tsx`
3. `inventory/page.tsx`
4. `api/public/products/route.ts`
5. `api/salon-portal/catalog/route.ts`
6. `api/stock/route.ts`
7. `offer/[slug]/page.tsx` (2x!)

**Řešení**:
- Přidat in-memory cache s TTL (~30s) uvnitř `getAllStockNumbers()`:
  ```ts
  let cachedStock: { data: Map<string, StockNumbers>; timestamp: number } | null = null;
  const STOCK_CACHE_TTL = 30_000; // 30 seconds

  export async function getAllStockNumbers(): Promise<Map<string, StockNumbers>> {
    if (cachedStock && Date.now() - cachedStock.timestamp < STOCK_CACHE_TTL) {
      return cachedStock.data;
    }
    // ... existing queries ...
    cachedStock = { data: map, timestamp: Date.now() };
    return map;
  }
  
  export function invalidateStockCache() {
    cachedStock = null;
  }
  ```
- Volat `invalidateStockCache()` po stock-měnících operacích (delivery create, sale complete, return).

### 3. VYSOKÉ: AppShell — 2 API calls na KAŽDÉM načtení stránky

**Soubor**: `src/components/AppShell.tsx:27-43`

Při každém načtení admin stránky se volají:
1. `GET /api/salons?archived=false&approved=false` — pro badge count registrací
2. `GET /api/notifications?unread=true&limit=1` — pro badge count notifikací (+ polling každých 30s)

Tyto volání nejsou cachovány a probíhají na každé stránce.

**Řešení**:
- Server-side: Předat `pendingRegCount` a `unreadCount` z layoutu jako props (jeden dotaz při SSR)
- Nebo: Přidat Cache-Control header na tyto API endpointy s `max-age=30`
- Polling interval zvýšit z 30s na 60s

### 4. STŘEDNÍ: Admin products API — include bez select

**Soubor**: `src/app/api/products/route.ts:29-33`

```ts
prisma.product.findMany({
  where,
  include: { variants: { where: { active: true } } },
  orderBy: { createdAt: "desc" },
});
```

`include: { variants: true }` stahuje VŠECHNA pole variant (včetně costPricePerGram, purchasePrice atd.). Pro listing stačí `select` s potřebnými poli.

Stejný pattern na:
- `src/app/(app)/products/page.tsx:15-19` — server-side products page
- `src/app/api/salon-portal/catalog/route.ts:29-38` — salon catalog

**Řešení**: Nahradit `include` za `select` se specifickými poli:
```ts
variants: {
  where: { active: true },
  select: { id: true, lengthCm: true, color: true, wholesalePricePerGram: true, retailPricePerGram: true, sellingMode: true, pricePerPiece: true, retailPricePerPiece: true },
}
```

### 5. STŘEDNÍ: Public products API — stock se nepočítá z cache

**Soubor**: `src/app/api/public/products/route.ts:45-81`

Má `Cache-Control: s-maxage=60, stale-while-revalidate=300` header, ale **tělo funkce** stále volá `getAllStockNumbers()` na každý request. CDN cache pomůže jen pokud je za CDN.

**Řešení**: Přidat `unstable_cache` kolem celého query:
```ts
import { unstable_cache } from "next/cache";

const getCachedProducts = unstable_cache(
  async (category, origin, ...) => { /* existing logic */ },
  ["public-products"],
  { revalidate: 60 }
);
```

### 6. STŘEDNÍ: Offer detail page — getAllStockNumbers() voláno 2x

**Soubor**: `src/app/(public)/offer/[slug]/page.tsx:92` a `:751`

`getAllStockNumbers()` je voláno dvakrát na stejné stránce — jednou v hlavní funkci a jednou v recommendation sekci.

**Řešení**: Volat jednou a předat výsledek jako argument.

### 7. NÍZKÉ: LoyaltySettings dotazy bez cache

**Soubor**: `src/lib/loyalty.ts:10-19` a `:29-33`

`getLoyaltyDiscount()` a `calculateTier()` volají DB pokaždé. Loyalty settings se mění extrémně zřídka.

**Řešení**: In-memory cache s TTL 5 minut:
```ts
let cachedSettings: LoyaltySettings[] | null = null;
let cachedAt = 0;
```

---

## Implementační plán (pořadí dle dopadu)

### Fáze 1: Okamžitý dopad (low-hanging fruit)

| # | Co | Soubor | Dopad |
|---|---|--------|-------|
| 1 | In-memory cache pro `getAllStockNumbers()` (30s TTL) | `src/lib/stock.ts` | Eliminuje 2 SQL dotazy na 7 místech |
| 2 | In-memory cache pro loyalty settings (5min TTL) | `src/lib/loyalty.ts` | Eliminuje DB dotaz na každém catalog/order |
| 3 | Fix duplicitní `getAllStockNumbers()` na offer detail | `src/app/(public)/offer/[slug]/page.tsx` | Eliminuje 2 zbytečné SQL dotazy |

### Fáze 2: Dashboard optimalizace

| # | Co | Soubor | Dopad |
|---|---|--------|-------|
| 4 | Nahradit `delivery.findMany` za SQL s GROUP BY | `src/app/(app)/dashboard/page.tsx` | Namísto N řádků → 4 řádky |
| 5 | `unstable_cache` kolem dashboard dotazů (60s) | `src/app/(app)/dashboard/page.tsx` | Dashboard se renderuje z cache |

### Fáze 3: Select optimalizace

| # | Co | Soubor | Dopad |
|---|---|--------|-------|
| 6 | `select` místo `include` na products API | `src/app/api/products/route.ts` | Menší payload z DB |
| 7 | `select` místo `include` na products page | `src/app/(app)/products/page.tsx` | Menší payload z DB |
| 8 | `select` místo `include` na salon catalog | `src/app/api/salon-portal/catalog/route.ts` | Menší payload z DB |

### Fáze 4: Caching veřejných stránek

| # | Co | Soubor | Dopad |
|---|---|--------|-------|
| 9 | `unstable_cache` na public products API | `src/app/api/public/products/route.ts` | Celý response z cache |
| 10 | Snížit AppShell polling z 30s na 60s | `src/components/AppShell.tsx` | Méně API volání |

---

## Soubory k úpravě

| Soubor | Změna |
|--------|-------|
| `src/lib/stock.ts` | In-memory cache + invalidace |
| `src/lib/loyalty.ts` | In-memory cache |
| `src/app/(app)/dashboard/page.tsx` | SQL optimalizace + unstable_cache |
| `src/app/api/products/route.ts` | select místo include |
| `src/app/(app)/products/page.tsx` | select místo include |
| `src/app/api/salon-portal/catalog/route.ts` | select místo include |
| `src/app/api/public/products/route.ts` | unstable_cache |
| `src/app/(public)/offer/[slug]/page.tsx` | Deduplikace getAllStockNumbers |
| `src/components/AppShell.tsx` | Polling interval 30s→60s |

---

## Očekávaný dopad

- **Dashboard**: z ~500ms → ~50ms (cache hit) nebo ~200ms (cache miss s optimalizovanými dotazy)
- **Products page**: z ~300ms → ~100ms (stock cache + select optimalizace)
- **Public offer**: z ~400ms → ~50ms (unstable_cache)
- **Salon catalog**: z ~300ms → ~100ms (stock cache + select)
- **Celkové API volání**: -40% díky cachování a deduplikaci

## Poznámky

- `unstable_cache` je Next.js feature pro server-side caching — funguje s Data Cache
- In-memory cache v Node.js procesu je efektivní pro single-instance deployment (Vercel/similar)
- Pro multi-instance: zvážit Turso embedded replicas (read replicas na edge) — to je ale větší změna
- Stock invalidace je kritická — po prodeji/příjmu musí být stock aktuální
- NEPOUŽÍVAT `revalidateTag` pokud projekt nepoužívá tag-based cache (ověřit Next.js 16 docs)
