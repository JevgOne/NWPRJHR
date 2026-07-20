# TASK-051: Full Admin Product Edit Page

## Goal

Transform the current view-oriented `ProductDetailClient` into a full editing experience.
The user should be able to edit ALL product attributes that are available during product creation,
plus manage variants (edit all fields, deactivate) and manage deliveries (view, edit, delete/correct)
— all from the product detail page.

**Key user pain point:** User accidentally stocks in wrong quantity (e.g. 2 pieces instead of 1)
and has no way to correct it from the UI.

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
- **Deliveries**: not shown at all on product detail page, no edit/delete UI anywhere

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
   Unique constraint `@@unique([productId, lengthCm, color])` requires duplicate validation.
2. **Delivery deletion** — No DELETE endpoint. Delivery model has relations: `stockMovements`,
   `saleItems`, `returns`, `complaints` — must check all before allowing deletion.
3. **Delivery quantity correction** — `deliveryUpdateSchema` only allows barcode/note/invoiceFile.
   Need to add `remainingGrams`, `remainingPieces`, `initialGrams`, `initialPieces` editing
   for OWNER with proper stock recalculation.
4. **Product deliveries listing** — No endpoint to get all deliveries for a product (across variants).

---

## Implementation Plan

### Phase 1: Product Attribute Editing (Core)

**File: `src/app/(app)/products/[id]/ProductDetailClient.tsx`**

Refactor the top Card section to add edit mode. Add an "Edit" button (pencil icon or text)
that toggles the product header from display mode to inline edit mode.

**Changes:**
1. Add state: `editMode` boolean, `editValues` object for all product fields
2. In edit mode, replace the static `<h1>` with editable fields:
   - **Name (CS)**: text input, pre-filled with `product.name`
   - **Name (UK)**: text input, pre-filled with `product.nameUk`
   - **Name (RU)**: text input, pre-filled with `product.nameRu`
   - **Category**: 4-button selector (VIRGIN/LUXE/STANDARD/SALE), same style as CreateProductForm
   - **Origin**: autocomplete dropdown using `ORIGIN_OPTIONS` from `@/lib/origin-flags`
   - **ProcessingType**: dropdown (CLIP_IN, TAPE_IN, KERATIN, WEFT, MICRO_RING, OTHER)
   - **Texture**: keep existing dropdown (already works)
   - **ColorTone**: keep existing dropdown (already works)
   - **Description (CS)**: textarea, manual edit
   - **Description (UK)**: textarea
   - **Description (RU)**: textarea
   - **Slug**: text input with auto-slugify preview (from `@/lib/slugify`)
3. Add "Save" and "Cancel" buttons at top of edit form
4. Save calls `PUT /api/products/${product.id}` with changed fields only (diff against original)
5. On success: exit edit mode, `router.refresh()`

**UI Layout in edit mode:**
```
┌─────────────────────────────────────────────────────┐
│ [Cancel]                                    [Save]  │
│                                                     │
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

**No API changes needed** — `updateProductSchema` already accepts all fields as optional.

**Imports to add:**
- `ORIGIN_OPTIONS` from `@/lib/origin-flags`
- `slugify` from `@/lib/slugify`

**Estimated size:** ~150 lines added to ProductDetailClient.tsx

---

### Phase 2: Enhanced Variant Editing

**File: `src/components/products/VariantTable.tsx`**

Extend the existing inline editing to cover ALL variant fields, not just prices.

**Changes to VariantTable:**
1. Add per-variant action menu (three-dot `...` button at row end):
   - "Edit" — opens inline edit mode for that variant row
   - "Deactivate" — calls `DELETE /api/variants/[id]` (sets active=false), with `confirm()` dialog
   - "Reactivate" — shown for inactive variants, calls `PUT /api/variants/[id]` with `{ active: true }`
2. Inline edit mode per variant row should allow editing:
   - `costPricePerGram` (already works via click-to-edit)
   - `wholesalePricePerGram` / `retailPricePerGram` (already works)
   - `sellingMode` toggle (BY_GRAM ↔ BY_PIECE) — small toggle button
   - `pricePerPiece` (shown when sellingMode = BY_PIECE)
   - `retailPricePerPiece` (shown when sellingMode = BY_PIECE)
3. Deactivated variants already show `opacity-30` — add "Deactivated" label and reactivate button
4. Save all changed variant fields in one `PUT /api/variants/[id]` call

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

Add a new Card section below variants that shows all deliveries for this product.

#### 3A. New API: List product deliveries

**Create `src/app/api/products/[id]/deliveries/route.ts`:**
- `GET` — returns all deliveries for all variants of the product
- OWNER only
- Avoids N+1 by querying deliveries where `variant.productId` matches

```typescript
const deliveries = await prisma.delivery.findMany({
  where: { variant: { productId: id } },
  include: {
    supplier: true,
    variant: { select: { id: true, lengthCm: true, color: true } },
  },
  orderBy: { stockedAt: "desc" },
});
```

#### 3B. Delivery quantity correction (edit remainingGrams/Pieces)

**Modify `src/lib/validations/delivery.ts` — `deliveryUpdateSchema`:**

Add fields for quantity correction:
```typescript
export const deliveryUpdateSchema = z.object({
  barcode: z.string().max(100).optional(),
  note: z.string().max(1000).optional(),
  receivedInvoiceFile: z.string().optional(),
  // NEW: quantity correction fields (OWNER only)
  remainingGrams: z.number().int().min(0).optional(),
  remainingPieces: z.number().int().min(0).optional(),
  initialGrams: z.number().int().min(0).optional(),
  initialPieces: z.number().int().min(0).optional(),
});
```

**Modify `src/app/api/deliveries/[id]/route.ts` — PUT handler:**

After the update, if `remainingGrams` or `remainingPieces` changed:
1. Log a `StockMovement` of type `CORRECTION` to create audit trail
2. Invalidate stock cache via `invalidateStockCache()` from `@/lib/stock`

```typescript
// After prisma.delivery.update:
if (parsed.data.remainingGrams !== undefined || parsed.data.remainingPieces !== undefined) {
  const gramsChange = (parsed.data.remainingGrams ?? existing.remainingGrams) - existing.remainingGrams;
  const piecesChange = (parsed.data.remainingPieces ?? existing.remainingPieces) - existing.remainingPieces;

  await prisma.stockMovement.create({
    data: {
      type: "CORRECTION",
      deliveryId: id,
      variantId: existing.variantId,
      userId: session.user.id,
      grams: gramsChange,
      pieces: piecesChange,
      note: `Manual correction by ${session.user.email}`,
    },
  });

  invalidateStockCache();
}
```

**Note:** Check if `StockMovement.type` enum includes `CORRECTION`. If not, add it to the Prisma schema.

#### 3C. Delivery deletion

**Add DELETE handler to `src/app/api/deliveries/[id]/route.ts`:**

Safety rules:
- OWNER only
- **BLOCK deletion if delivery has any `saleItems`** — this delivery has been used in sales, cannot delete
- **BLOCK deletion if delivery has any `returns` or `complaints`** — linked records exist
- If delivery has `stockMovements` — delete them too (cascade within transaction)
- Use `prisma.$transaction` to atomically delete stockMovements + delivery
- After deletion: `invalidateStockCache()`, `revalidatePath("/inventory")`

```typescript
export async function DELETE(request, { params }) {
  // Auth: OWNER only
  const { id } = await params;

  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: {
      _count: { select: { saleItems: true, returns: true, complaints: true } },
    },
  });

  if (!delivery) return 404;

  // Block if used in sales/returns/complaints
  if (delivery._count.saleItems > 0 || delivery._count.returns > 0 || delivery._count.complaints > 0) {
    return NextResponse.json(
      { error: "Cannot delete delivery with linked sales, returns, or complaints" },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    prisma.stockMovement.deleteMany({ where: { deliveryId: id } }),
    prisma.delivery.delete({ where: { id } }),
  ]);

  logAudit({ action: "DELETE", entity: "Delivery", entityId: id, ... });
  invalidateStockCache();
  revalidatePath("/inventory");

  return NextResponse.json({ ok: true });
}
```

#### 3D. Delivery table UI

**Delivery table columns:**
| Column | Notes |
|---|---|
| Variant | `{lengthCm}cm / {color}` badge |
| Supplier | supplier.name |
| Date | stockedAt formatted (DD.MM.YYYY) |
| Initial | initialGrams g / initialPieces ks |
| Remaining | remainingGrams g / remainingPieces ks — **click to edit** |
| Purchase price | purchasePricePerGramRaw + currency |
| Barcode | with copy button — click to edit |
| Note | click to edit |
| Actions | Delete button (red, with confirm dialog) |

**Inline editing flow:**
- Click on remaining/note/barcode → inline input → blur/Enter saves via `PUT /api/deliveries/[id]`
- Delete button → `confirm("Opravdu smazat dodávku?")` → `DELETE /api/deliveries/[id]`
- If delete blocked (has sales), show error toast/alert

**Estimated size:**
- New GET API route: ~40 lines
- DELETE handler addition: ~40 lines
- PUT handler modification: ~25 lines
- Delivery section in ProductDetailClient: ~150 lines
- Validation schema change: ~5 lines

---

### Phase 4: Polish & UX

1. **Confirmation dialogs**: `confirm()` for:
   - Category change (may affect pricing tiers)
   - Variant deactivation
   - Delivery deletion
   - Quantity correction (show old → new values)
2. **Unsaved changes warning**: `beforeunload` event when editMode active
3. **Loading states**: Disabled buttons + spinner during saves
4. **Error feedback**: `alert()` or inline error message for failed saves
5. **Slug auto-generation**: When name changes in edit mode, auto-suggest slug

---

## File Change Summary

| # | File | Action | Phase |
|---|---|---|---|
| 1 | `src/app/(app)/products/[id]/ProductDetailClient.tsx` | MODIFY — add edit mode for product attrs + delivery section | 1, 3D |
| 2 | `src/components/products/VariantTable.tsx` | MODIFY — add sellingMode toggle, deactivate/reactivate actions | 2 |
| 3 | `src/lib/validations/product.ts` | MODIFY — add lengthCm, color to updateVariantSchema | 2 |
| 4 | `src/app/api/variants/[id]/route.ts` | MODIFY — add duplicate check for lengthCm/color changes | 2 |
| 5 | `src/app/api/products/[id]/deliveries/route.ts` | CREATE — new GET endpoint for product deliveries | 3A |
| 6 | `src/lib/validations/delivery.ts` | MODIFY — add remaining/initial fields to deliveryUpdateSchema | 3B |
| 7 | `src/app/api/deliveries/[id]/route.ts` | MODIFY — add quantity correction logic + DELETE handler | 3B, 3C |
| 8 | `prisma/schema.prisma` | MODIFY (maybe) — add CORRECTION to StockMovement type enum if missing | 3B |

**Total: 6-7 modified files + 1 new file**

---

## Schema Change Check

Verify if `StockMovement.type` enum already has `CORRECTION`:
```
grep -A 10 "enum MovementType" prisma/schema.prisma
```
If not present, add `CORRECTION` to the enum and run `npx prisma db push`.

---

## What NOT to Do

- **Do NOT create a separate `/products/[id]/edit` route** — keep everything on the existing detail page
  with inline/toggle edit mode. Consistent with existing texture/colorTone/price editing pattern.
- **Do NOT refactor into a shared ProductForm** between create and edit — create is a wizard with
  stock-in, edit is field-by-field updates. Fundamentally different UX.
- **Do NOT allow delivery deletion if it has saleItems** — stock/financial integrity.
  User must contact admin to handle those manually.
- **Do NOT hard-delete variants** — keep existing soft-delete (active=false) pattern.
- **Do NOT change the existing inline price editing** in VariantTable — it works well, just extend it.

---

## Testing Checklist

### Product Editing (Phase 1)
- [ ] Click "Edit" → form appears with pre-filled values
- [ ] Edit product name (CS/UK/RU) → Save → all three names update
- [ ] Change category → Save → badge updates
- [ ] Change origin → Save → flag/badge updates
- [ ] Change processingType → Save → badge updates
- [ ] Edit description manually → Save → text persists
- [ ] Edit slug → Save → verify uniqueness (API returns 400 if duplicate)
- [ ] Cancel edit mode → no changes persisted

### Variant Editing (Phase 2)
- [ ] Toggle variant sellingMode BY_GRAM ↔ BY_PIECE → piece price fields appear/hide
- [ ] Edit variant pricePerPiece → save succeeds
- [ ] Deactivate variant → confirm dialog → opacity change + "Reactivate" visible
- [ ] Reactivate variant → opacity returns to normal
- [ ] Change variant lengthCm/color → save with duplicate check

### Delivery Management (Phase 3)
- [ ] View deliveries section → all variants' deliveries shown
- [ ] Edit delivery note inline → save succeeds
- [ ] Edit delivery barcode inline → save succeeds
- [ ] Edit remaining grams → confirm → StockMovement CORRECTION created → stock updated
- [ ] Delete delivery (no sales) → confirm → delivery removed → stock recalculated
- [ ] Delete delivery (has sales) → error shown, deletion blocked
- [ ] Edit initial grams/pieces → save succeeds

### General (Phase 4)
- [ ] Navigate away with unsaved changes → browser warning
- [ ] All saves show loading state (button disabled)
- [ ] Failed saves show error message

---

## Dependencies

- No external packages needed
- All UI components exist (Input, Button, Card)
- All data libraries available (ORIGIN_OPTIONS, TEXTURE_OPTIONS, COLOR_TONE_OPTIONS, slugify)
- `invalidateStockCache` from `@/lib/stock` already exists
- `logAudit` from `@/lib/audit` already exists

## Implementation Order

**Phase 1 → Phase 2 → Phase 3 → Phase 4**

Each phase is independently deployable. Phase 1 provides immediate value (editing product name/category/origin).
Phase 3 solves the user's most acute pain point (delivery correction/deletion).
