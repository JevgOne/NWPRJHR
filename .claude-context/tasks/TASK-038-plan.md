# TASK-038: Fix /products/new form — wrong fields, missing lengths

**Status:** Plan ready
**Author:** Planner
**Date:** 2026-07-15

---

## Context

User: form on `/products/new` has wrong fields and is missing variants (lengths). "TO TAKHLE NEBYLO."

**Key insight:** Products are created AUTOMATICALLY during stock-in (stock-in wizard in `src/app/api/deliveries/route.ts` lines 83-117). Stock-in wizard takes category + origin + texture + color + length and auto-creates Product (with auto-generated name) + Variant. The form `/products/new` is a **manual alternative** that doesn't match how the business actually works.

---

## Problems identified

### Problem 1: Product name is manual — should be auto-generated

**Current:** 3 text inputs (CZ/UK/RU) for manual name entry.
**Correct:** Name is auto-generated from category + texture (as in stock-in):
```
"Panenske Vlasy — Mirne vlnite"   (cs)
```

Pattern from `deliveries/route.ts` lines 60-63, 102-107:
```typescript
const CATEGORY_NAMES = {
  VIRGIN: { cs: "Panenske Vlasy", uk: "...", ru: "..." },
  LUXE: { cs: "Luxe Vlasy", ... },
  ...
};
// name: `${catNames.cs} — ${data.texture}`
```

**Fix:** Remove manual name fields. Auto-generate after category + texture are selected. Show preview.

### Problem 2: "Typ zpracovani" (processingType) MUST be removed

**Current:** Dropdown with CLIP_IN, TAPE_IN, KERATIN, WEFT, MICRO_RING, OTHER.
**Problem:** Hairland sells RAW hair, NOT processed products. Clip-in/tape-in is custom processing — should never be on product card.

**DB constraint:** `processingType` is **required** in Prisma schema (ProcessingType enum, no `?`). Stock-in wizard auto-sets `processingType: "OTHER"` (line 109).

**Fix (minimal):**
- Remove processingType from CreateProductForm UI
- Hardcode `processingType: "OTHER"` in handleSubmit
- No schema/DB change needed
- ProductDetailClient already hides the badge when = "OTHER" (line 239)

### Problem 3: Missing variant fields (length, color)

**Current:** Form creates Product WITHOUT variants. User must then go to product detail and add variants via VariantBatchCreate — a two-step process.
**Problem:** User doesn't know/want two-step process. Wants to enter everything at once.

**Fix:** Add inline "Variants" section to CreateProductForm:
- Fields: `lengthCm` (number), `color` (text/autocomplete), `wholesalePricePerGram` (number)
- Button "+ Add variant" for multiple variants
- On submit: 1) POST `/api/products` 2) POST `/api/products/{id}/variants`

### Problem 4: ColorTone — not broken but could be auto-detected

ColorTone field works (autocomplete with color circles). Stock-in wizard uses `autoColorTone(data.color)` for automatic assignment.

**Fix:** Optional — auto-detect colorTone from variant color (like stock-in does).

---

## Implementation plan

### Step 1: Remove unnecessary fields from CreateProductForm.tsx

**REMOVE:**
- `name` input (CZ) — replaced by auto-generated
- `nameUk` input (UK) — auto-generated
- `nameRu` input (RU) — auto-generated
- `description` input — generated automatically via product-bio
- `processingType` dropdown — hardcode "OTHER"

**KEEP:**
- `category` dropdown
- `origin` autocomplete
- `texture` autocomplete
- `colorTone` autocomplete
- `photos` (PhotoUpload)
- `slug` input

### Step 2: Auto-generate name

Add to CreateProductForm:

```typescript
const CATEGORY_NAMES: Record<string, { cs: string; uk: string; ru: string }> = {
  VIRGIN: { cs: "Panenske Vlasy", uk: "Натуральне Волосся", ru: "Натуральные Волосы" },
  LUXE: { cs: "Luxe Vlasy", uk: "Люкс Волосся", ru: "Люкс Волосы" },
  STANDARD: { cs: "Standard Vlasy", uk: "Стандарт Волосся", ru: "Стандарт Волосы" },
  SALE: { cs: "Vyprodej", uk: "Розпродаж", ru: "Распродажа" },
};

// Compute auto-name from selected category + texture
const selectedCategory = watch("category"); // or use state
const autoName = selectedCategory && texture
  ? `${CATEGORY_NAMES[selectedCategory]?.cs ?? selectedCategory} — ${texture}`
  : "";
```

Show preview below category/texture: `"Product will be created as: Panenske Vlasy — Mirne vlnite"`

In handleSubmit, set:
```typescript
const data = {
  name: autoName,
  nameUk: `${CATEGORY_NAMES[cat]?.uk} — ${texture}`,
  nameRu: `${CATEGORY_NAMES[cat]?.ru} — ${texture}`,
  processingType: "OTHER",
  // ... rest
};
```

### Step 3: Add inline variant creator

Add below photos section:

```tsx
// State for variants
const [variants, setVariants] = useState<Array<{
  lengthCm: number;
  color: string;
  wholesalePricePerGram: number;
}>>([]);

// UI: inline form + list
<div>
  <h3>Varianty</h3>
  {variants.map((v, i) => (
    <div key={i}>
      {v.lengthCm} cm · {v.color} · {v.wholesalePricePerGram/100} CZK/g
      <button onClick={() => removeVariant(i)}>x</button>
    </div>
  ))}
  <div>
    <input placeholder="Delka (cm)" type="number" />
    <input placeholder="Barva" />
    <input placeholder="Nakupni cena/g" type="number" />
    <button>+ Pridat</button>
  </div>
</div>
```

On submit, after product creation:
```typescript
if (variants.length > 0) {
  await fetch(`/api/products/${product.id}/variants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variants }),
  });
}
```

### Step 4: Update validation schema

In `src/lib/validations/product.ts`:
- Make `processingType` optional with default "OTHER"

```typescript
processingType: z.enum([...]).optional().default("OTHER"),
```

### Step 5: Update API route

In `src/app/api/products/route.ts` POST handler:
- Default processingType to "OTHER" if not provided

---

## Files to edit

| # | File | Change | Priority |
|---|------|--------|----------|
| 1 | `src/app/(app)/products/new/CreateProductForm.tsx` | Major rewrite — remove name/description/processingType, add auto-name + inline variants | **CRITICAL** |
| 2 | `src/lib/validations/product.ts` | Make processingType optional with default "OTHER" | **HIGH** |
| 3 | `src/app/api/products/route.ts` | Default processingType to "OTHER" in POST | **HIGH** |

**Optional:** Extract CATEGORY_NAMES to shared `src/lib/category-names.ts` (currently duplicated in `deliveries/route.ts`).

---

## DB schema

**No schema/migration change needed.** processingType stays required in DB, but UI hides it and sends "OTHER".

---

## Summary

| What | Current | Fix |
|------|---------|-----|
| Name | 3 manual text inputs | Auto-generate from category + texture |
| processingType | Dropdown (CLIP_IN etc.) | Remove from UI, hardcode "OTHER" |
| Description | Manual textarea | Remove (auto-generated via product-bio) |
| Variants | Missing entirely | Add inline variant creator |
| ColorTone | Works but manual | Keep as-is (optional: auto-detect) |

**Files to edit: 3** (CreateProductForm.tsx, product.ts validation, products/route.ts API)
