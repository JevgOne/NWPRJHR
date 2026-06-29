# TASK-002: Add texture (struktura vlasu) everywhere — Implementation

## Status: DONE

## Changes

### Fix 1: Homepage slider — texture badge
**File:** `src/components/public/HeroProductSlider.tsx`

Added texture badge next to origin badge in VariantCard. Combined origin+texture into a single flex row with `gap-1` to handle both/either/neither gracefully. Uses same violet-100/violet-700 badge style as rest of the app.

### Fix 2: Stock-in form — texture info
**Files:**
- `src/app/(app)/inventory/stock-in/page.tsx` — passes `texture` from Prisma product to StockInForm
- `src/components/inventory/StockInForm.tsx` — added `texture` to ProductOption interface, shows texture in dropdown option text (`name — texture`), shows violet texture label below product selector when product is selected

### Fix 3: Admin product detail — editable texture
**File:** `src/app/(app)/products/[id]/ProductDetailClient.tsx`

For OWNER: texture badge is now a button that opens a dropdown with TEXTURE_OPTIONS. Clicking an option saves via PUT `/api/products/[id]` and refreshes. Delete option clears texture (sends `null`). For non-owners: read-only badge display (unchanged).

Added imports: `useRef`, `useEffect`, `TEXTURE_OPTIONS`.
Added state: `editingTexture`, `textureValue`, `textureRef`.
Added: `saveTexture` callback, click-outside handler.

### Supporting: Zod schema update
**File:** `src/lib/validations/product.ts`

Added `.nullable()` to texture field so `texture: null` can be sent to clear the value via PUT.

## Files Changed

| File | Change |
|------|--------|
| `src/components/public/HeroProductSlider.tsx` | Display texture badge on slider cards |
| `src/app/(app)/inventory/stock-in/page.tsx` | Pass texture to StockInForm |
| `src/components/inventory/StockInForm.tsx` | Show texture in product selector |
| `src/app/(app)/products/[id]/ProductDetailClient.tsx` | Editable texture for owners |
| `src/lib/validations/product.ts` | Allow nullable texture in update schema |

## Verification

- `npx tsc --noEmit` — passes with zero errors
