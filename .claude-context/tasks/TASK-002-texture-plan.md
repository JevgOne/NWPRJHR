# TASK-002: Add texture (struktura vlasu) everywhere

## Audit Summary

**Texture is ALREADY present in:**
- Prisma schema (`texture String?` on Product)
- Zod validations (`createProductSchema`, `updateProductSchema`)
- Product serializer (`product-serializer.ts`)
- Admin: product create form (`CreateProductForm.tsx`) — autocomplete input
- Admin: product list (`ProductListClient.tsx`) — TextureSwatch badge
- Admin: product detail (`ProductDetailClient.tsx`) — TextureSwatch badge (read-only)
- Public: offer page (`ProductsShowcase.tsx`) — filter + badge on cards
- Public: product detail (`offer/[id]/page.tsx`) — TextureSwatch + link
- Salon: catalog (`CatalogClient.tsx`) — texture badge
- All relevant API endpoints serve texture
- `TextureSwatch` component + `hair-textures.ts` utility

**Texture is MISSING in:**
1. **Homepage slider** (`HeroProductSlider.tsx`) — has `texture` in interface but never renders it
2. **Stock-in form** (`StockInForm.tsx`) — no texture info displayed when selecting product
3. **Admin product detail** — texture is displayed but NOT editable (no way to change texture on existing product)

---

## Fix Plan

### Fix 1: Homepage slider — display texture badge
**File:** `src/components/public/HeroProductSlider.tsx`

**STATUS: ALREADY IMPLEMENTED** — Texture badge has been added next to origin badge in VariantCard. Origin and texture are now wrapped in a flex container with `gap-1`. No further changes needed.

---

### Fix 2: Stock-in form — show product texture info
**File:** `src/app/(app)/inventory/stock-in/page.tsx` and `src/components/inventory/StockInForm.tsx`

**Step 2a:** Pass texture from page to StockInForm

**File:** `src/app/(app)/inventory/stock-in/page.tsx`
**Line 30:** Add `texture` to the product options mapping:

**Before (lines 26-35):**
```tsx
const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    variants: p.variants.map((v) => ({
      id: v.id,
      lengthCm: v.lengthCm,
      color: v.color,
    })),
  }));
```

**After:**
```tsx
const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    texture: p.texture,
    variants: p.variants.map((v) => ({
      id: v.id,
      lengthCm: v.lengthCm,
      color: v.color,
    })),
  }));
```

**Step 2b:** Update StockInForm to accept and display texture

**File:** `src/components/inventory/StockInForm.tsx`

**Change 1 — Update ProductOption interface (line 13):**
```tsx
interface ProductOption {
  id: string;
  name: string;
  category: string;
  texture?: string | null;   // <-- ADD THIS
  variants: { id: string; lengthCm: number; color: string }[];
}
```

**Change 2 — Show texture in product dropdown options (line 139):**

**Before:**
```tsx
<option key={p.id} value={p.id}>
  {p.name}
</option>
```

**After:**
```tsx
<option key={p.id} value={p.id}>
  {p.name}{p.texture ? ` — ${p.texture}` : ""}
</option>
```

**Change 3 — Show texture info below product selector, after the `</select>` tag (after line 142):**

Add after the closing `</select>` and before the closing `</div>`:
```tsx
{selectedProduct?.texture && (
  <p className="mt-1 text-xs text-violet-600 font-medium">
    {selectedProduct.texture}
  </p>
)}
```

**Lines changed:** ~8 lines across 2 files

---

### Fix 3: Admin product detail — make texture editable
**File:** `src/app/(app)/products/[id]/ProductDetailClient.tsx`

**What:** Make the texture badge clickable/editable for owners, using the existing PUT `/api/products/[id]` endpoint which already accepts `texture` via `updateProductSchema`.

**Approach:** Add an inline edit for texture — when owner clicks the texture badge (or an "edit" icon next to it), show a small autocomplete dropdown (similar to CreateProductForm), save via PUT on selection.

**Detailed implementation:**

**Change 1 — Add imports (top of file):**
```tsx
import { TEXTURE_OPTIONS } from "@/lib/hair-textures";
```
(already imports `TextureSwatch`)

**Change 2 — Add state for texture editing (inside component, after line 47):**
```tsx
const [editingTexture, setEditingTexture] = useState(false);
const [textureValue, setTextureValue] = useState(product.texture ?? "");
const textureRef = useRef<HTMLDivElement>(null);

const saveTexture = useCallback(async (newTexture: string) => {
  await fetch(`/api/products/${product.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texture: newTexture || null }),
  });
  setEditingTexture(false);
  router.refresh();
}, [product.id, router]);
```

**Change 3 — Add useRef import (line 1):**
```tsx
import { useState, useCallback, useRef } from "react";
```

**Change 4 — Add click-outside handler (inside component):**
```tsx
useEffect(() => {
  if (!editingTexture) return;
  function handleClick(e: MouseEvent) {
    if (textureRef.current && !textureRef.current.contains(e.target as Node)) {
      setEditingTexture(false);
    }
  }
  document.addEventListener("mousedown", handleClick);
  return () => document.removeEventListener("mousedown", handleClick);
}, [editingTexture]);
```

(Also add `useEffect` to the import on line 1)

**Change 5 — Replace texture display (lines 110-115) with editable version:**

**Before:**
```tsx
{product.texture && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700">
    <TextureSwatch texture={product.texture} size={20} />
    {product.texture}
  </span>
)}
```

**After:**
```tsx
{isOwner ? (
  <div ref={textureRef} className="relative">
    <button
      type="button"
      onClick={() => setEditingTexture(!editingTexture)}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
    >
      {textureValue ? (
        <>
          <TextureSwatch texture={textureValue} size={20} />
          {textureValue}
        </>
      ) : (
        <span className="text-violet-400">+ {t("product.texture")}</span>
      )}
    </button>
    {editingTexture && (
      <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-lg border border-line shadow-lg">
        {TEXTURE_OPTIONS.map((opt) => (
          <button
            key={opt.name}
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-rose/10 text-left"
            onClick={() => {
              setTextureValue(opt.name);
              saveTexture(opt.name);
            }}
          >
            <span>{opt.icon}</span>
            <span>{opt.name}</span>
          </button>
        ))}
        {textureValue && (
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 text-left border-t border-line"
            onClick={() => {
              setTextureValue("");
              saveTexture("");
            }}
          >
            {t("common.remove")}
          </button>
        )}
      </div>
    )}
  </div>
) : product.texture ? (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700">
    <TextureSwatch texture={product.texture} size={20} />
    {product.texture}
  </span>
) : null}
```

**Lines changed:** ~50 lines (mostly new UI code)

---

## Summary

| # | File | What | Lines |
|---|------|------|-------|
| 1 | `src/components/public/HeroProductSlider.tsx` | Add texture badge to slider cards | ~6 |
| 2a | `src/app/(app)/inventory/stock-in/page.tsx` | Pass `texture` to StockInForm | +1 |
| 2b | `src/components/inventory/StockInForm.tsx` | Display texture in product selector | ~8 |
| 3 | `src/app/(app)/products/[id]/ProductDetailClient.tsx` | Make texture editable for owners | ~50 |

**Total files:** 4
**Risk:** Low — additive changes, no logic changes to existing functionality
**Dependencies:** None — all APIs already support texture read/write

## Testing

1. Homepage: verify texture badge appears on slider cards for products that have texture set
2. Stock-in: select a product with texture, verify texture label shown below dropdown and in option text
3. Admin product detail (as OWNER): click texture badge, select new texture, verify save + refresh shows updated value
4. Admin product detail (as EMPLOYEE): verify texture is displayed but NOT editable
5. Verify existing texture displays on offer page, product detail, salon catalog are unaffected
