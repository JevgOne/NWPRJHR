# TASK #14 — BUG: Pomale nacteni admin panelu a produktu

**Datum:** 2026-06-28
**Agent:** planovac

---

## SOUHRN

Analyzoval jsem vsechny admin stranky a API endpointy. Nasel jsem **1 kriticky N+1 bug** a **2 stredni problemy**. Dashboard je dobre optimalizovany (12 paralelnich queries). Hlavni problem je v salon katalogu.

---

## NALEZENE PROBLEMY

### 1. KRITICKY: N+1 queries v salon katalogu

**Soubor:** `src/app/api/salon-portal/catalog/route.ts` r.48-76

**Problem:** Pro KAZDOU variantu KAZDEHO produktu se vola zvlast `getStockNumbers(v.id)`:
```typescript
product.variants.map(async (v) => {
  const stock = await getStockNumbers(v.id);  // 2 SQL dotazy na KAZDOU variantu!
})
```

**Dopad:** Pri 50 produktech × 10 variantech = **1000 SQL dotazu** na jedno nacteni katalogu. 
Na Turso (remote DB) s latenci ~20ms/query = **20 sekund** cekani.

**FIX:** Nahradit za `getAllStockNumbers()` (uz existuje v `src/lib/stock.ts`):
```typescript
const stockMap = await getAllStockNumbers();  // 2 SQL dotazy CELKEM
// pak pro kazdou variantu:
const stock = stockMap.get(v.id);
```

**Reference:** Stejny pattern je SPRAVNE pouzity v:
- `src/app/api/public/products/route.ts` r.75 ✅
- `src/app/(public)/offer/[slug]/page.tsx` r.72 ✅
- `src/app/(app)/inventory/page.tsx` r.27 ✅

---

### 2. STREDNI: Dashboard nacita vsechny dodavky s variantami

**Soubor:** `src/app/(app)/dashboard/page.tsx` r.73-85

**Problem:** `prisma.delivery.findMany({ where: { remainingGrams: { gt: 0 } }, select: { ... variant: { ... product: { ... } } } })`

Nacita VSECHNY dodavky s kladnym stavem + joiny na variant + product. S rostoucim poctem dodavek bude pomalejsi.

**Alternativa:** Raw SQL aggregate:
```sql
SELECT p.category,
       SUM(d.remainingGrams) as grams,
       SUM(d.remainingGrams * d.purchasePricePerGramCZK) as valuePurchase,
       SUM(d.remainingGrams * v.retailPricePerGram) as valueRetail
FROM deliveries d
JOIN variants v ON d.variantId = v.id
JOIN products p ON v.productId = p.id
WHERE d.remainingGrams > 0
GROUP BY p.category
```

Vraci 4 radky misto potencialne stovek dodavek.

**Priorita:** Stredni — neni to akutne, ale bude problem s rusten.

---

### 3. STREDNI: Admin products API nema paginaci

**Soubor:** `src/app/api/products/route.ts` r.26-36

**Problem:** `prisma.product.findMany({ ... })` vraci VSECHNY produkty bez limitu. S 500+ produkty bude pomalejsi.

**FIX:** Pridat paginaci (page/limit parametry), nebo lazy loading v ProductListClient.

**Priorita:** Stredni — aktualne pravdepodobne desitky produktu.

---

## CO JE V PORADKU

| Stranka | Optimalizace | Status |
|---------|-------------|--------|
| Dashboard | 12x `Promise.all`, raw SQL pro low stock | ✅ OK |
| Inventory | `getAllStockNumbers()` (2 queries) | ✅ OK |
| Product detail (public) | `getAllStockNumbers()` + slug redirect | ✅ OK |
| Public products API | `getAllStockNumbers()` | ✅ OK |
| Orders | Client-side paginace | ✅ OK |
| Products (admin) | Nema paginaci, ale ne fatalni | ⚠ OK zatim |

---

## IMPLEMENTACNI PLAN

### Faze 1: Fix N+1 v katalogu (KRITICKE)

**Soubor:** `src/app/api/salon-portal/catalog/route.ts`

Zmena:
```diff
+ import { getAllStockNumbers } from "@/lib/stock";
- import { getStockNumbers } from "@/lib/stock";

  // Inside GET handler:
+ const stockMap = await getAllStockNumbers();

  const allProducts = products.map((product) => {
-   const allVariants = await Promise.all(
-     product.variants.map(async (v) => {
-       const stock = await getStockNumbers(v.id);
+   const allVariants = product.variants.map((v) => {
+       const stock = stockMap.get(v.id);
        return {
          id: v.id,
          lengthCm: v.lengthCm,
          color: v.color,
          pricePerGram: price,
-         availableGrams: stock.availableGrams,
-         availablePieces: stock.availablePieces,
+         availableGrams: stock?.availableGrams ?? 0,
+         availablePieces: stock?.availablePieces ?? 0,
        };
-     })
-   );
+   });

    const variants = allVariants.filter((v) => v.availableGrams > 0);
```

Tato zmena meni funkci z `async` na synchronni (uvnitr `.map`), takze `Promise.all` wrapper uz neni potreba.

Pozor: `loyaltyDiscount` a `hairdresserDiscountPct` se pocitaji PER-request (ne per-variant), takze cenovy vypocet zustane stejny — jen `price` se pocita ze synchronniho kontextu.

### Faze 2: Dashboard aggregate (STREDNI, MUZE POCKAT)

Nahradit `deliveriesWithProduct` za raw SQL aggregate.

### Faze 3: Products paginace (NIZKA, MUZE POCKAT)

Pridat `?page=1&limit=20` do admin products API.

---

## SOUBORY K UPRAVE

| Soubor | Akce | Priorita |
|--------|------|----------|
| `src/app/api/salon-portal/catalog/route.ts` | N+1 → bulk stock query | KRITICKA |
| `src/app/(app)/dashboard/page.tsx` | Raw SQL aggregate (volitelne) | STREDNI |
| `src/app/api/products/route.ts` | Paginace (volitelne) | NIZKA |

---
