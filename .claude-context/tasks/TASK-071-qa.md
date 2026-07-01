# TASK-071 QA Report — Performance optimalizace (implementace)

**Datum:** 2026-07-01
**Agent:** kontrolor
**Verze:** TASK-071 implementace (fáze 1-4)

---

## Co bylo zkontrolováno

1. `src/lib/stock.ts` — in-memory cache 30s TTL + `invalidateStockCache()`
2. `src/lib/loyalty.ts` — in-memory cache 5min TTL + `invalidateLoyaltyCache()`
3. `src/lib/stock-in.ts` — cache invalidace po naskladnění
4. `src/lib/sales.ts` — cache invalidace po prodeji
5. `src/lib/order-workflow.ts` — cache invalidace po `createOrder`, `rejectOrder`, `cancelOrder`
6. `src/app/api/loyalty-settings/route.ts` — loyalty cache invalidace po update nastavení
7. `src/app/(app)/dashboard/page.tsx` — SQL GROUP BY místo JS aggregate
8. `src/components/AppShell.tsx` — polling interval notifikací
9. TypeScript build — `npx tsc --noEmit`
10. Next.js build — `npx next build`

---

## Výsledky kontroly

### 1. Stock cache — 30s TTL

**PASS**

- `src/lib/stock.ts:71-72` — `let cachedStock` + `STOCK_CACHE_TTL = 30_000` ✅
- `stock.ts:86-88` — cache check před SQL queries ✅
- `stock.ts:140` — cache set po výpočtu ✅
- `stock.ts:74-76` — `invalidateStockCache()` exportována, nulluje `cachedStock` ✅

### 2. Loyalty cache — 5min TTL

**PASS**

- `src/lib/loyalty.ts:5-7` — `let cachedSettings` + `LOYALTY_CACHE_TTL = 300_000` ✅
- `loyalty.ts:13-21` — `getCachedSettings()` shared helper s TTL kontrolou ✅
- `calculateTier()` a `getLoyaltyDiscount()` oba volají `getCachedSettings()` ✅
- `loyalty.ts:9-11` — `invalidateLoyaltyCache()` exportována ✅

**Poznámka:** `calculatePoints()` v `loyalty.ts:59` stále volá `prisma.loyaltySettings.findFirst()` přímo bez cache. Nízký dopad (volá se jen při prodeji), ale nekonzistentní.

### 3. Cache invalidace — všechny call sites

**PASS**

| Soubor | Funkce | Invaliduje |
|--------|--------|-----------|
| `src/lib/stock-in.ts:94` | po naskladnění delivery | `invalidateStockCache()` ✅ |
| `src/lib/sales.ts:259` | po dokončení prodeje | `invalidateStockCache()` ✅ |
| `src/lib/order-workflow.ts:184` | `createOrder()` | `invalidateStockCache()` ✅ |
| `src/lib/order-workflow.ts:246` | `rejectOrder()` | `invalidateStockCache()` ✅ |
| `src/lib/order-workflow.ts:302` | `cancelOrder()` | `invalidateStockCache()` ✅ |
| `src/app/api/loyalty-settings/route.ts:37` | po update loyalty settings | `invalidateLoyaltyCache()` ✅ |

### 4. Dashboard SQL GROUP BY

**PASS**

- Stará `prisma.delivery.findMany()` **není přítomna** v dashboard/page.tsx ✅
- Nový `prisma.$queryRawUnsafe` s `GROUP BY p.category` na `dashboard/page.tsx:74-86` ✅
- Vrací max 4 řádky (1 per kategorie) místo N delivery řádků ✅
- JS agregace nyní pracuje s `stockByCategory` arrayem (4 záznamy):
  - `totalStockGrams`, `stockValuePurchase`, `stockValueRetail` — správně z SQL výsledků ✅
  - `catMap` buildován ze `stockByCategory` ✅

### 5. Notification polling — 60s

**PASS**

- `src/components/AppShell.tsx:42` — `setInterval(fetchUnread, 60000)` ✅
- Původní 30s interval zdvojnásoben na 60s ✅

### 6. Build

**PASS**

- `npx tsc --noEmit` — 0 chyb ✅
- `npx next build` — čistý build, všechny routes OK ✅

---

## Nalezené problémy

### PROBLÉM 1 — INFORMAČNÍ: `calculatePoints()` obchází loyalty cache

**Soubor:** `src/lib/loyalty.ts:59`

```typescript
export async function calculatePoints(...) {
  const settings = await prisma.loyaltySettings.findFirst({ // přímý DB call
    where: { tier: "BRONZE" },
  });
```

Mohlo by použít `getCachedSettings()` místo přímého DB volání. Dopad minimální — volá se jen při prodeji, ne per-request.

### PROBLÉM 2 — INFORMAČNÍ: Cache je process-level (in-memory), ne sdílená

In-memory cache platí jen pro danou serverless instanci — na Vercel více instancí nevidí vzájemně svůj cache stav. TTL 30s je rozumný kompromis; sdílená cache (Redis) by byla over-engineering pro tuto velikost.

Žádná akce potřeba.

---

## Souhrn

| Oblast | Verdikt |
|--------|---------|
| Stock cache 30s TTL | ✅ PASS |
| Loyalty cache 5min TTL | ✅ PASS |
| Cache invalidace (6 call sites) | ✅ PASS |
| Dashboard SQL GROUP BY | ✅ PASS |
| Notification polling 60s | ✅ PASS |
| TypeScript build | ✅ PASS |
| Next.js build | ✅ PASS |

## Verdikt

**PASS**

Všechny 4 fáze implementace jsou přítomny a správně implementovány. Cache TTL hodnoty odpovídají specifikaci (30s / 5min). Invalidace pokrývá všechny stock-mutating operace. Dashboard SQL optimization eliminuje JS-side agregaci. Build bez chyb.
