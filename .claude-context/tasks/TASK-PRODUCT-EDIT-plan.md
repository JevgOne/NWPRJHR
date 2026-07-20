# TASK: Full Admin Product Edit Page

## Goal

Transform the current view-oriented `ProductDetailClient` into a full editing experience.
The user should be able to edit ALL product attributes that are available during product creation,
plus manage variants (edit all fields, deactivate) and view/edit deliveries — all from the product detail page.

---

## Current State Analysis

### What CAN be edited today (ProductDetailClient.tsx)
- Texture (click badge → dropdown)
- ColorTone (click badge → dropdown)
- Description (generate bio button only, no manual edit)
- Photos & Video (PhotoUpload component)
- SEO fields (meta title, description, OG image)
- Variant prices (inline click-to-edit in VariantTable)
- Variant availableToOrder toggle (in VariantTable)

### What CANNOT be edited today
- **Product**: name, nameUk, nameRu, category, origin, processingType, slug
- **Product**: description (manual text edit — only auto-generate)
- **Variants**: lengthCm, color, sellingMode, pricePerPiece, retailPricePerPiece
- **Variants**: deactivation/removal from this page (API exists but no UI)
- **Deliveries**: not shown at all on product detail page

### Existing API Support
| Endpoint | Methods | Notes |
|---|---|---|
| `PUT /api/products/[id]` | Partial update | `updateProductSchema` — all fields optional |
| `PUT /api/variants/[id]` | Partial update | `updateVariantSchema` — prices, sellingMode, active, availableToOrder |
| `DELETE /api/variants/[id]` | Soft-delete | Sets `active: false` |
| `POST /api/products/[id]/variants` | Batch create | `createVariantsSchema` |
| `GET /api/deliveries?variantId=X` | List | Filtered by variant |
| `PUT /api/deliveries/[id]` | Partial update | Only barcode, note, receivedInvoiceFile |
| `GET /api/deliveries/[id]` | Detail | Includes stock movements |

### API Gaps (need new endpoints or schema changes)
1. **Variant lengthCm/color update** — `updateVariantSchema` doesn't include `lengthCm` or `color`.
   These have a unique constraint `@@unique([productId, lengthCm, color])`, so changing them
   requires validation to prevent duplicates.
2. **Delivery deletion** — No DELETE endpoint exists for deliveries.
   Deliveries with `remainingGrams > 0` should NOT be deletable (stock integrity).
   Deliveries with `remainingGrams === 0` could be soft-deleted or marked archived.

---

## Implementation Plan

### Phase 1: Product Attribute Editing (Core)

**File: `src/app/(app)/products/[id]/ProductDetailClient.tsx`**

Refactor the top Card section to add edit mode. Add an "Edit" button that toggles the product header
from display mode to inline edit mode.

**Changes:**
1. Add state: `editMode` boolean, `editValues` object for all product fields
2. In edit mode, replace the static `<h1>` with editable fields:
   - **Name (CS)**: text input, pre-filled with `product.name`
   - **Name (UK)**: text input, pre-filled with `product.nameUk`
   - **Name (RU)**: text input, pre-filled with `product.nameRu`
   - **Category**: 4-button selector (VIRGIN/LUXE/STANDARD/SALE), same as CreateProductForm
   - **Origin**: autocomplete dropdown using `ORIGIN_OPTIONS` from `@/lib/origin-flags`
   - **ProcessingType**: dropdown (CLIP_IN, TAPE_IN, KERATIN, WEFT, MICRO_RING, OTHER)
   - **Texture**: keep existing dropdown (already works)
   - **ColorTone**: keep existing dropdown (already works)
   - **Description (CS)**: textarea, manual edit
   - **Description (UK)**: textarea
   - **Description (RU)**: textarea
   - **Slug**: text input with auto-slugify preview (from `@/lib/slugify`)
3. Add "Save" and "Cancel" buttons
4. Save calls `PUT /api/products/${product.id}` with changed fields only
5. On success: exit edit mode, `router.refresh()`

**UI Layout in edit mode:**
```
[Cancel]                                        [Save]
┌─────────────────────────────────────────────────────┐
│ Name (CS):  [________________________]              │
│ Name (UK):  [________________________]              │
│ Name (RU):  [________________________]              │
│                                                     │
│ Category:   [VIRGIN] [LUXE] [STANDARD] [SALE]       │
│ Origin:     [autocomplete dropdown_____]            │
│ Processing: [dropdown_________________]             │
│ Texture:    (keep existing badge dropdown)          │
│ ColorTone:  (keep existing badge dropdown)          │
│                                                     │
│ Description (CS): [textarea_______________]         │
│ Description (UK): [textarea_______________]         │
│ Description (RU): [textarea_______________]         │
│                                                     │
│ Slug:       [auto-or-manual____________]            │
└─────────────────────────────────────────────────────┘
```

**No API changes needed** — `updateProductSchema` already accepts all these fields as optional.

**Imports to add:**
- `ORIGIN_OPTIONS` from `@/lib/origin-flags`
- `slugify` from `@/lib/slugify`

**Estimated size:** ~150 lines added to ProductDetailClient.tsx

---

### Phase 2: Enhanced Variant Editing

**File: `src/components/products/VariantTable.tsx`**

Extend the existing inline editing to cover ALL variant fields, not just prices.

**Changes to VariantTable:**
1. Add per-variant action menu (three-dot button or row actions):
   - "Edit" — opens inline edit for that variant row
   - "Deactivate" — calls `DELETE /api/variants/[id]` (sets active=false), with confirmation dialog
2. Inline edit mode per variant row should allow editing:
   - `costPricePerGram` (already works)
   - `wholesalePricePerGram` / `retailPricePerGram` (already works)
   - `sellingMode` toggle (BY_GRAM ↔ BY_PIECE)
   - `pricePerPiece` (shown when sellingMode = BY_PIECE)
   - `retailPricePerPiece` (shown when sellingMode = BY_PIECE)
3. Add visual indicator for deactivated variants (already has `opacity-30` for `!active`)
4. Add "Reactivate" option for inactive variants (calls `PUT /api/variants/[id]` with `{ active: true }`)

**Changes to `src/lib/validations/product.ts` — `updateVariantSchema`:**
Add `lengthCm` and `color` fields:
```typescript
lengthCm: z.number().int().positive().max(150).optional(),
color: z.string().min(1).max(100).optional(),
```

**Changes to `src/app/api/variants/[id]/route.ts` — PUT handler:**
Add duplicate validation when `lengthCm` or `color` changes:
```typescript
if (parsed.data.lengthCm !== undefined || parsed.data.color !== undefined) {
  const newLength = parsed.data.lengthCm ?? existing.lengthCm;
  const newColor = parsed.data.color ?? existing.color;
  const duplicate = await prisma.variant.findUnique({
    where: {
      productId_lengthCm_color: {
        productId: existing.productId,
        lengthCm: newLength,
        color: newColor,
      },
    },
  });
  if (duplicate && duplicate.id !== id) {
    return NextResponse.json(
      { error: "Variant with this length and color already exists" },
      { status: 409 }
    );
  }
}
```

**Estimated size:** ~80 lines changed in VariantTable, ~15 lines in variant API, ~5 lines in validation schema

---

### Phase 3: Delivery Management Section

**File: `src/app/(app)/products/[id]/ProductDetailClient.tsx`**

Add a new Card section below the variants section that shows all deliveries for this product's variants.

**Changes:**

1. Add new state for deliveries data and loading
2. Fetch deliveries from `/api/deliveries?variantId=X` for each variant (or add a new endpoint)
3. Display deliveries in a collapsible table grouped by variant

**New API endpoint needed: `GET /api/products/[id]/deliveries`**

Create `src/app/api/products/[id]/deliveries/route.ts`:
- Returns all deliveries for all variants of the product
- Avoids N+1 by querying deliveries where variant.productId matches
- OWNER only

```typescript
const deliveries = await prisma.delivery.findMany({
  where: { variant: { productId: id } },
  include: { supplier: true, variant: { select: { id: true, lengthCm: true, color: true } } },
  orderBy: { stockedAt: "desc" },
});
```

**Delivery table columns:**
| Column | Notes |
|---|---|
| Variant | `{lengthCm}cm / {color}` |
| Supplier | supplier.name |
| Date | stockedAt formatted |
| Initial | initialGrams (g) or initialPieces (ks) |
| Remaining | remainingGrams (g) or remainingPieces (ks) |
| Purchase price | purchasePricePerGramRaw + currency |
| Barcode | with copy button |
| Note | editable |
| Actions | Edit note, Edit barcode |

**Delivery inline editing:**
- Click on note → edit inline → save via `PUT /api/deliveries/[id]`
- Click on barcode → edit inline → save via `PUT /api/deliveries/[id]`
- These are the only fields the existing `deliveryUpdateSchema` allows

**Delivery deletion:**
Not implemented in this phase. Deliveries represent stock history and deleting them
would break stock integrity. If needed in the future, a separate task should handle
soft-deletion of zero-remaining deliveries with proper audit trail.

**Estimated size:**
- New API route: ~40 lines
- DeliveryTable component or inline section: ~120 lines

---

### Phase 4: Polish & UX Improvements

1. **Confirmation dialogs**: Use existing `confirm()` or add a simple modal for:
   - Category change (affects pricing tiers)
   - Variant deactivation
2. **Unsaved changes warning**: If editMode is active and user navigates away, warn via `beforeunload`
3. **Loading states**: Show spinner/disabled state during saves
4. **Toast feedback**: After successful saves, brief success message (if toast system exists, otherwise console)
5. **Slug auto-generation**: When name changes in edit mode, suggest slug update

---

## File Change Summary

| File | Action | Phase |
|---|---|---|
| `src/app/(app)/products/[id]/ProductDetailClient.tsx` | MODIFY — add edit mode for product attributes + delivery section | 1, 3 |
| `src/components/products/VariantTable.tsx` | MODIFY — add sellingMode toggle, deactivate action, reactivate | 2 |
| `src/lib/validations/product.ts` | MODIFY — add lengthCm, color to updateVariantSchema | 2 |
| `src/app/api/variants/[id]/route.ts` | MODIFY — add duplicate check for lengthCm/color changes | 2 |
| `src/app/api/products/[id]/deliveries/route.ts` | CREATE — new GET endpoint for product deliveries | 3 |

**Total: 4 modified files + 1 new file**

---

## What NOT to Do

- **Do NOT create a separate `/products/[id]/edit` route** — keep everything on the existing detail page with inline/toggle edit mode. This is consistent with how texture/colorTone/prices already work.
- **Do NOT add delivery deletion** — stock integrity concern. Deliveries are immutable records of stock-in events.
- **Do NOT refactor into a shared ProductForm** between create and edit — the creation flow is a wizard with stock-in and the edit page is field-by-field updates. The UX is fundamentally different.
- **Do NOT change the existing inline price editing in VariantTable** — it works well, just extend it.
- **Do NOT add hard-delete for variants** — keep the existing soft-delete (active=false) pattern.

---

## Testing Checklist

- [ ] Edit product name (CS/UK/RU) → verify all three names update
- [ ] Change category → verify badge updates
- [ ] Change origin → verify flag/badge updates
- [ ] Change processingType → verify badge updates
- [ ] Edit slug → verify uniqueness
- [ ] Edit description manually → verify text persists
- [ ] Toggle variant sellingMode BY_GRAM ↔ BY_PIECE → verify piece price fields appear/hide
- [ ] Edit variant pricePerPiece → verify save
- [ ] Deactivate variant → verify opacity change and "Reactivate" option appears
- [ ] Reactivate variant → verify opacity returns to normal
- [ ] View deliveries for product → verify all variants' deliveries shown
- [ ] Edit delivery note inline → verify save
- [ ] Edit delivery barcode inline → verify save
- [ ] Cancel edit mode without saving → verify no changes persisted
- [ ] Navigate away with unsaved changes → verify warning

---

## Dependencies

- No external package additions needed
- All required UI components already exist (Input, Button, Card)
- All required data libraries already imported or available (ORIGIN_OPTIONS, TEXTURE_OPTIONS, COLOR_TONE_OPTIONS, slugify)
- Existing API endpoints cover most needs — only 1 new endpoint required

## Implementation Order

**Phase 1 → Phase 2 → Phase 3 → Phase 4**

Each phase is independently deployable. Phase 1 alone provides significant value
by enabling editing of product name, category, and origin — the most commonly needed changes.
