# TASK-071 QA Report — Fáze 1 (cache related products + B2B settings)

**Commit:** d0a82be
**Datum QA:** 2026-07-14
**QA provedl:** Kontrolor

---

## ✅ Co je hotové a odpovídá zadání

### 1.1 Cache related products query
- `getCachedRelatedCandidates()` zabaleno v `unstable_cache` ✅
- Cache klíč: `["related-product-candidates"]` ✅ (plán specifikoval `["related-products"]` — implementace použila `["related-product-candidates"]`, věcně ekvivalentní)
- Revalidate: 120s ✅
- Tags: `["products"]` ✅
- Inline IIFE na řádku ~987 nyní volá `getCachedRelatedCandidates(product.id)` místo přímého `prisma.product.findMany()` ✅
- Soubor: `src/app/[locale]/(public)/offer/[...slug]/page.tsx` ✅

### 1.2 B2B settings in-memory cache
- Nový soubor `src/lib/b2b-pricing.ts` vytvořen ✅
- `getCachedB2BSettings()` s 5min TTL (300_000 ms) ✅
- `invalidateB2BCache()` exportována ✅
- Default hodnoty: hairdresserDiscountPct=2000, salonDiscountPct=3000 ✅

**Aktualizace 5 volajících:**
- `offer/[...slug]/page.tsx:346` — `getCachedB2BSettings()` ✅
- `offer/page.tsx:96` — `getCachedB2BSettings()` ✅
- `offer/[...slug]/CategoryPage.tsx:161` — `getCachedB2BSettings()` ✅
- `offer/[...slug]/AttributeLandingPage.tsx:172` — `getCachedB2BSettings()` ✅
- `api/salon-portal/catalog/route.ts:26` — `getCachedB2BSettings()` ✅

**Cache invalidace:**
- `api/b2b-settings/route.ts:70` — `invalidateB2BCache()` voláno po upsert ✅

---

## ❌ Co chybí nebo neodpovídá

Nic chybějícího v rámci Fáze 1.

---

## ⚠️ Co potřebuje pozornost

### Build chyba — NESOUVISÍ s Fází 1

Build (`npm run build`) selhal s TypeScript chybou:

```
./src/app/api/sales/route.ts:120:26
Type error: Argument of type ... is not assignable to parameter of type 'SaleWithRelations'
```

**Příčina:** `src/app/api/sales/route.ts` je aktuálně modifikovaný v rámci Fáze 2 (in_progress). 
Commit d0a82be tento soubor NEzměnil (ověřeno `git show d0a82be --stat`).

**Stav Fáze 1:** TypeScript kontrola bez `sales/route.ts` a `sale-serializer.ts` vrací 0 chyb — Fáze 1 je TypeScript-clean ✅.

**Akce:** Implementátor Fáze 2 musí opravit typovou chybu v `sales/route.ts` — `serializeSaleForRole()` očekává plné `SaleWithRelations` objekty, ale `select` vrací pouze částečné fieldy.

---

## Verdikt

**Fáze 1: SCHVÁLENA** ✅

Implementace 1.1 a 1.2 přesně odpovídá plánu v TASK-071-performance-plan-v2.md sekce 1.1 a 1.2.
Typové chyby v buildu jsou způsobeny WIP změnami Fáze 2, nikoliv Fází 1.
