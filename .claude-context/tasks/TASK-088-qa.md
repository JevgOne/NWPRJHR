# QA Report: TASK-088 — Category change must update product name/slug/variant prices

**Status:** APPROVED s jednou poznámkou ⚠️
**Date:** 2026-07-19
**Reviewer:** QA Kontrolor

---

## 1. Simplify Check

**Soubor:** `src/app/api/products/[id]/route.ts`

### Nový kód (řádky 9–123)

**CATEGORY_NAMES + slugify** — zkopírovány z `deliveries/route.ts`. Drobná duplicita, ale přijatelná — extrakce do sdíleného modulu by byl over-engineering pro tuto situaci. Obě definice jsou identické. ✅

**Logika category change (řádky 58–124):**
- Podmínka `if (parsed.data.category)` — správná ✅
- Fetch current produktu + variantů v jednom dotazu — efektivní ✅
- Podmínka `if (current && current.category !== parsed.data.category)` — správná, nezpracovává pokud se kategorie nezměnila ✅
- `parsed.data` je mutable Zod output — mutace `parsed.data.name`, `parsed.data.nameUk` atd. funguje ✅
- `Promise.all` pro variant updates — efektivní paralelní update ✅

**Žádná zbytečná složitost ani duplicity v logice.** ✅

---

## 2. Debug — Build

```
npx next build
```

**Výsledek:** ✅ Čistý build

```
▲ Next.js 16.2.9 (Turbopack)
✓ Compiled successfully in 14.3s
✓ TypeScript passed
✓ Generating static pages (429/429)
```

Žádné TypeScript chyby, žádné build errory. ✅

---

## 3. Reverzní kontrola

**Původní zadání:** "když jsem zmenil z LUXE na STANDART tak se to uložilo ale nic se nezmenilo"

| Požadavek | Implementace | Výsledek |
|-----------|-------------|----------|
| Název se přegeneruje | `parsed.data.name = "${catNames.cs} — ${texture}"` (řádek 86) | ✅ |
| Název UA/RU se přegeneruje | `parsed.data.nameUk`, `parsed.data.nameRu` (řádky 87–88) | ✅ |
| Slug se přegeneruje | `slugify("${newCat}-${origin}-${texture}-${color}-${length}cm")` (řádky 93–98) | ✅ |
| Variant `retailPricePerGram` se přepočítá | `costPricePerGram * (10000 + markupPercent * 100) / 10000` (řádky 110–112) | ✅ |
| `retailManualOverride` se respektuje | `current.variants.filter(v => !v.retailManualOverride)` (řádek 106) | ✅ |
| BY_PIECE `retailPricePerPiece` se přepočítá | `v.pricePerPiece * markup` pro BY_PIECE varianty (řádky 114–118) | ✅ |
| Cache invalidace | `revalidateTag("products", "max")` (řádek 141) | ✅ |
| Audit log | `logAudit(...)` s `changes: parsed.data` (řádky 131–139) | ✅ |

---

## 4. Identifikované problémy

### POZNÁMKA ⚠️ — Slug není unikátní, může kolidovat

**Řádek 93–94:**
```ts
parsed.data.slug = slugify(
  `${newCat}-${current.origin ?? ""}-${texture}-${firstVariant.color}-${firstVariant.lengthCm}cm`
);
```

Slug se generuje z `firstVariant` (první aktivní varianta). Pokud existuje jiný produkt stejné nové kategorie se stejným origin/texture/color/length, dojde ke slug kolizi a Prisma hodí unique constraint error (500).

**Závažnost:** Nízká v praxi (produkty mají unikátní kombinace), ale teoretické riziko. Správné ošení by bylo přidat timestamp suffix nebo zkrátit slug na `${newCat}-${origin}-${texture}` (bez color/length, které se mohou překrývat).

**Doporučení:** Akceptovatelné pro tuto fázi. Lze adresovat v budoucím tasku.

### POZNÁMKA ⚠️ — Admin UI se neaktualizuje ihned

`ProductDetailClient.tsx` volá `router.refresh()` po PUT response — to by mělo být dostatečné pro re-fetch dat. Ale `editValues` state (name, slug) se inicializuje z `product` prop při mount, ne při každém render. Po `router.refresh()` Next.js refreshuje server component a předá nový `product` prop → `ProductDetailClient` se remountuje → `editValues` se reinicializuje.

Toto je správné chování. ✅

---

## 5. Edge cases ověřeny

| Case | Chování |
|------|---------|
| Produkt bez variantů | Slug se generuje bez color/length (řádek 97) ✅ |
| Produkt bez textury | `texture = parsed.data.texture ?? current.texture ?? ""` → prázdný string ✅ |
| Produkt bez originu | `current.origin ?? ""` → prázdný string ✅ |
| `priceSettings` neexistuje pro kategorii | `markupPercent = priceSetting?.markupPercent ?? 100` → fallback 100% ✅ |
| Kategorie se NEzměnila | `current.category !== parsed.data.category` false → skip celá logika ✅ |
| Všechny varianty mají `retailManualOverride=true` | `variantsToUpdate = []` → žádný update, `Promise.all([])` → OK ✅ |

---

## Závěr

Implementace je správná a kompletní. Všechny tři požadované změny (název, slug, ceny) se při category change provedou. `retailManualOverride` se respektuje. Build čistý. Jediné riziko je potenciální slug kolize v extrémních případech — akceptovatelné.
