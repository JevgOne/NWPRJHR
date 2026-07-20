# QA Report — Task #40: CreateProductForm.tsx rewrite (commit 0ac20f6)

**Datum:** 2026-07-15  
**Výsledek: PASS (1 minor finding)**

---

## 1. Auto-generated name — PASS ✅

`namePreview = texture ? \`${catNames.cs} — ${texture}\` : catNames.cs`

Vzorec shodný s `deliveries/route.ts` řádek 105:
```ts
name: `${catNames.cs} — ${data.texture}`
```
Konzistentní. `CATEGORY_NAMES` definovány lokálně v komponentě — shodné hodnoty (VIRGIN → "Panenské Vlasy", LUXE → "Luxe Vlasy" atd.).

---

## 2. processingType hardcoded "OTHER" — PASS ✅

```ts
processingType: "OTHER",  // v handleSubmit
```
Select s `PROCESSING_TYPES` odstraněn z JSX. UI uživateli typ nezobrazuje. ✅

---

## 3. Inline variant creator → POST /api/products/{id}/variants — PASS ✅

Odesílaná data:
```ts
{ variants: [{ lengthCm: parseInt(v.lengthCm), color: v.color, wholesalePricePerGram: 0, retailPricePerGram: 0 }] }
```

API endpoint (`variants/route.ts`) přijímá `createVariantsSchema`, kde:
- `lengthCm`: required ✅
- `color`: required ✅
- `wholesalePricePerGram`: required ✅
- `retailPricePerGram`: optional (fallback = wholesalePricePerGram) ✅

Validace před odesláním: `validVariants = variants.filter(v => v.lengthCm && v.color)` — prázdné řádky se nepošlou. ✅

Chybějící error handling: pokud variant POST selže, form přesto přesměruje na produktovou stránku (není `await` s check res.ok). Viz Minor finding níže.

---

## 4. i18n klíče namePreview — PASS ✅

`product.namePreview` přítomno ve všech 3 souborech:
- `cs.json:606`: "Název produktu" ✅
- `uk.json:606`: "Назва продукту" ✅
- `ru.json:606`: "Название продукта" ✅

Namespace: `product.namePreview` — použití v komponentě: `t("product.namePreview")` ✅

---

## 5. product.ts — processingType default "OTHER" — PASS ✅

```ts
// src/lib/validations/product.ts
z.enum(["CLIP_IN", "TAPE_IN", "KERATIN", "WEFT", "MICRO_RING", "OTHER"]).default("OTHER"),
```
Default nastaven. ✅

---

## 6. TypeScript: 0 chyb ✅

---

## 7. Konzistence s deliveries/route.ts — PASS ✅

deliveries/route.ts řádek 105: `name: \`${catNames.cs} — ${data.texture}\``
CreateProductForm.tsx řádek 52: `namePreview = texture ? \`${catNames.cs} — ${texture}\` : catNames.cs`

Oba vzorce shodné (s graceful fallback bez textury). ✅

---

## Minor finding

**Variant POST response není kontrolován:**
```ts
await fetch(`/api/products/${product.id}/variants`, { ... });
router.push(`/products/${product.id}`);  // vždy se provede
```
Pokud variant POST vrátí 400/500, user je přesměrován na stránku produktu bez variant a bez chybové hlášky. Nízká priorita (validace probíhá na frontendu před odesláním), ale robustnější by bylo `if (!varRes.ok) { setError(...); return; }`.

---

## Závěr

Task #38 PASS. Auto-name, processingType hardcode, inline variant creator, i18n — vše správně. Shoda s deliveries/route.ts potvrzena.
