# TASK-071: Performance — pomalé načítání produktů a admin panelu

**Status:** Analýza hotova
**Datum:** 2026-07-05

## Hlavní příčina: Turso latence + Vercel region

- **Vercel region:** `cdg1` (Paříž) — `vercel.json`
- **Turso DB:** Remote SQLite přes HTTP (`@prisma/adapter-libsql`)
- Každý Prisma dotaz = HTTP roundtrip na Turso = 50-200ms
- **Potřeba ověřit:** Turso DB region — pokud není v EU West, latence se násobí

---

## Problém 1: Dashboard — 12 uncached DB dotazů (P1)

**Soubor:** `src/app/(app)/dashboard/page.tsx:54-132`

Server component volá 12 Prisma/raw SQL dotazů při každém page load:
1. `sale.aggregate` — prodeje za měsíc
2. Raw SQL — stock by category (GROUP BY)
3. `invoice.aggregate` — otevřené faktury
4. `salon.count` — aktivní salony
5. `sale.aggregate` — celkové prodeje
6. `saleItem.aggregate` — celkové gramy
7. Raw SQL — low stock variants (JOIN + GROUP BY + HAVING)
8. `stockMovement.findMany` — posledních 6 pohybů (include variant.product)
9. `return.count` — pending vrácení
10. `order.count` — nové objednávky
11. `notification.count` — nepřečtené notifikace
12. `salon.count` — pending registrace

Pozitiva: Jsou v `Promise.all`, takže jedou paralelně.
Problém: Žádný caching — 12 HTTP roundtripů na Turso při každém refreshi.

### Fix
```typescript
import { unstable_cache } from "next/cache";

const getCachedDashboardData = unstable_cache(
  async (userId: string) => {
    // ... všech 12 dotazů zde
  },
  ["dashboard-data"],
  { revalidate: 30, tags: ["dashboard"] }
);
```

---

## Problém 2: AppShell — 3 client-side API cally (P1)

**Soubor:** `src/components/AppShell.tsx:27-49`

Po každém route change (klientský useEffect):
- `fetch("/api/salons?archived=false&approved=false")` — pending registrace
- `fetch("/api/inquiries?status=NEW")` — nové poptávky
- `fetch("/api/notifications?unread=true&limit=1")` — nepřečtené notifikace

Navíc notifikace se pollují každých 60s.

### Fix (varianta A — server-side counts)
V `src/app/(app)/layout.tsx` předat counts jako props:
```typescript
const [pendingRegs, newInquiries, unreadNotifs] = await Promise.all([
  prisma.salon.count({ where: { approved: false, archived: false } }),
  prisma.inquiry.count({ where: { status: "NEW" } }),
  prisma.notification.count({ where: { recipientId: session.user.id, read: false } }),
]);
return <AppShell session={session} badgeCounts={{ pendingRegs, newInquiries, unreadNotifs }}>{children}</AppShell>;
```

### Fix (varianta B — cached API)
Přidat `unstable_cache` s 30s revalidate na badge count API.

---

## Problém 3: Public products — dvojitý load (P2)

**Server:** `src/app/(public)/offer/page.tsx:39-53` — načítá produkty pro JSON-LD schema
**Client:** `src/app/(public)/offer/ProductsShowcase.tsx:139-149` — znovu načítá přes `fetch("/api/public/products")`

Dvojitý DB hit — jednou na serveru, jednou na klientu.

### Fix
Předat produkty jako props ze server componentu:
```typescript
// page.tsx
const products = await getCachedAllProducts();
return <ProductsShowcase initialProducts={products} userRole={userRole} discountPct={discountPct} />;

// ProductsShowcase.tsx
export function ProductsShowcase({ initialProducts, ...props }) {
  const [allProducts, setAllProducts] = useState(initialProducts);
  // Odstraní useEffect fetch
}
```

---

## Problém 4: Login latence — bcrypt na serverless (P2)

**Soubor:** `src/lib/auth.ts:42-58`

Pipeline:
1. `prisma.user.findUnique` — 1 DB roundtrip (~100ms)
2. `bcrypt.compare` — CPU bound, ~100-300ms na serverless (12 rounds)
3. `prisma.salon.findUnique` — 1 DB roundtrip (pro salon users, paralelně s bcrypt)
4. `logAudit` — 1 DB write

Body 2+3 jsou v `Promise.all` (dobře).

### Fix
- Snížit bcrypt rounds z 12 na 10 (stále bezpečné, 4x rychlejší)
- Nebo: přejít na `@node-rs/argon2` (ale breaking change pro existující hashe)
- `logAudit` může být fire-and-forget (neblokovat response)

---

## Problém 5: Admin products — include all variants (P2)

**Soubor:** `src/app/(app)/products/page.tsx:15-19`

```typescript
prisma.product.findMany({
  where: { archived: false },
  include: { variants: { where: { active: true } } },
})
```

Načítá **všech 16 sloupců** každé varianty. Na listu stačí count + základní info.

### Fix
```typescript
prisma.product.findMany({
  where: { archived: false },
  select: {
    id: true, name: true, category: true, photos: true, origin: true,
    texture: true, colorTone: true, archived: true, slug: true,
    _count: { select: { variants: { where: { active: true } } } },
    variants: {
      where: { active: true },
      select: { id: true, lengthCm: true, color: true, retailPricePerGram: true },
    },
  },
})
```

---

## Problém 6: Sales API — include everything (P3)

**Soubor:** `src/app/api/sales/route.ts:103-116`

```typescript
include: {
  items: true,
  discounts: { include: { bearers: { include: { partner: true } } } },
  salon: true,
  customer: true,
  user: true,
}
```

Na listu 50 prodejů načítá celé relační stromy.

### Fix
Pro list endpoint použít `select`:
```typescript
select: {
  id: true, saleNumber: true, customerType: true, status: true,
  totalAmount: true, completedAt: true, paymentType: true,
  salon: { select: { name: true } },
  customer: { select: { name: true } },
  user: { select: { name: true } },
  _count: { select: { items: true } },
}
```

---

## Problém 7: Chybí unstable_cache na klíčových stránkách (P2)

Stránky bez cache (volají DB při každém requestu):
| Stránka | Soubor | Dotazy |
|---------|--------|--------|
| `/offer` | `src/app/(public)/offer/page.tsx` | product.findMany + salon.findUnique |
| `/dashboard` | `src/app/(app)/dashboard/page.tsx` | 12 dotazů |
| `/products` (admin) | `src/app/(app)/products/page.tsx` | product.findMany + getAllStockNumbers |
| `/kadernice` | `src/app/(public)/kadernice/page.tsx` | stylist.findMany |
| Homepage | `src/app/(public)/page.tsx` | stylist.findMany |

### Fix
Public pages: `revalidate: 60` (1 min)
Admin pages: `revalidate: 15-30` (15-30s)

---

## Problém 8: Turso cold start + connection (P3)

**Soubor:** `src/lib/db.ts`

Prisma client se vytváří s `PrismaLibSql` adaptérem. V produkci na Vercelu je singleton (globalForPrisma), ale po cold startu (~5 min neaktivity) se musí znovu vytvořit.

### Fix — Turso Embedded Replicas
```typescript
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
  syncUrl: process.env.TURSO_SYNC_URL, // remote URL for sync
  syncInterval: 60, // sync every 60s
});
```

Čtení z lokální repliky = ~0ms latence. Zápisy jdou na remote.

---

## Schema indexy — stav

Existující indexy jsou **dostatečné**:
- `products`: `@@index([category])`, `@@index([archived])`
- `variants`: `@@index([productId])`, `@@unique([productId, lengthCm, color])`
- `deliveries`: `@@index([variantId, stockedAt])`, `@@index([variantId, remainingGrams, stockedAt])`
- `sales`: `@@index([status])`, `@@index([completedAt])`, `@@index([salonId])`
- `reservations`: `@@index([variantId, active])`

Chybí jen: `@@index([completedAt, status])` na `Sale` pro dashboard aggregate (composite index pro rozsahový dotaz + filtr).

---

## Implementační priorita

| # | Fix | Dopad | Složitost | Priorita |
|---|-----|-------|-----------|----------|
| 1 | `unstable_cache` na dashboard (30s) | Vysoký | Nízká | **P1** |
| 2 | Badge counts z layout serveru do AppShell | Vysoký | Nízká | **P1** |
| 3 | Produkty jako props do ProductsShowcase | Střední | Nízká | **P1** |
| 7 | Ověřit Vercel/Turso region match | Vysoký | Triviální | **P1** |
| 4 | `select` místo `include` na admin products | Střední | Nízká | P2 |
| 5 | `select` místo `include` na sales list API | Střední | Nízká | P2 |
| 8 | Public pages cache (offer, kadernice) | Střední | Nízká | P2 |
| 6 | Turso embedded replicas | Velmi vysoký | Střední | P2 |
| 9 | Composite index `[completedAt, status]` na Sale | Nízký | Triviální | P3 |

**Quick wins (P1):** Sníží TTFB admin panelu o 50-70%. Implementace ~1-2 hodiny.
**Biggest impact (P2 #6):** Turso embedded replicas — 0ms read latency.
