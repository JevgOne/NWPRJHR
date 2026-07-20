# TASK-048: Add length, weight, category info to QR code display

**Status:** Plan ready
**Author:** Planner
**Date:** 2026-07-15

---

## Context

User wants QR code labels/modals to show more info: length (cm), weight (grams), category (Luxe/Panenske etc). Currently the QR modal (popup) shows ONLY the QR image + download button — no product info.

---

## Current state

### 3 QR display locations:

| Location | Component | What it shows | Data available |
|----------|-----------|---------------|----------------|
| Inventory table — per-row QR button | `InventoryClient.tsx` lines 362-378 | QR image + download button | `item.product.name`, `item.product.category`, `item.lengthCm`, `item.color`, `item.availableGrams` |
| Product edit — variant card QR button | `VariantTable.tsx` lines 420-435 | QR image + download button | `variant.lengthCm`, `variant.color`, `variant.id` (NO product name/category) |
| Print labels sheet | `QrLabelSheet.tsx` lines 96-126 | QR + productName + lengthCm + color + category + barcode | Full info already shown |

**QrLabelSheet already shows all the info the user wants.** Only the popup modals are missing it.

---

## Fix plan

### 1. InventoryClient.tsx — expand QR modal state

**Current state:** `qrModal` stores only `{ variantId, dataUrl }`.

**Change:** Expand to include product info:

```typescript
// Line 53: Change state type
const [qrModal, setQrModal] = useState<{
  variantId: string;
  dataUrl: string;
  productName: string;
  category: string;
  lengthCm: number;
  color: string;
  availableGrams: number;
} | null>(null);
```

**Change `openQr` (line 55):** Accept full item data instead of just variantId:

```typescript
const openQr = async (item: StockItem) => {
  try {
    const QRCode = await import("qrcode");
    const url = `${window.location.origin}/sales/new?variantId=${item.variantId}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 300, errorCorrectionLevel: "M", margin: 2 });
    setQrModal({
      variantId: item.variantId,
      dataUrl,
      productName: item.product.name,
      category: item.product.category,
      lengthCm: item.lengthCm,
      color: item.color,
      availableGrams: item.availableGrams,
    });
  } catch (e) {
    console.error("QR generation failed:", e);
  }
};
```

**Update call site (line 337):** `openQr(item)` instead of `openQr(item.variantId)`.

**Update modal (lines 362-378):** Add info below QR image:

```tsx
{qrModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setQrModal(null)}>
    <div className="bg-white rounded-xl shadow-xl p-6 max-w-xs w-full mx-4" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ink">QR kod</h3>
        <button onClick={() => setQrModal(null)} className="text-muted hover:text-ink text-lg leading-none">&times;</button>
      </div>
      <img src={qrModal.dataUrl} alt="QR" className="w-full max-w-[250px] mx-auto" />
      {/* NEW: Product info */}
      <div className="mt-3 space-y-1 text-center">
        <p className="text-sm font-medium text-ink">{qrModal.productName}</p>
        <p className="text-xs text-muted">
          {qrModal.lengthCm} cm · {colorName(qrModal.color)} · {qrModal.availableGrams} g
        </p>
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${categoryBadgeClass(qrModal.category)}`}>
          {tCat(qrModal.category.toLowerCase())}
        </span>
      </div>
      <button onClick={downloadQr} className="mt-4 w-full py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors">
        {t("downloadQr")}
      </button>
    </div>
  </div>
)}
```

The `categoryBadgeClass` helper is already inline at lines 297-301. Extract or duplicate it.

### 2. VariantTable.tsx — pass product info as props

**Current props:** `productId`, `variants`, `isOwner`. Missing product name and category.

**Change VariantTableProps (line 33):** Add `productName` and `category`:

```typescript
interface VariantTableProps {
  productId: string;
  productName: string;    // NEW
  category: string;       // NEW
  variants: VariantData[];
  isOwner: boolean;
}
```

**Update parent** `ProductDetailClient.tsx` line 536:
```tsx
<VariantTable
  productId={product.id}
  productName={product.name}     // NEW
  category={product.category}    // NEW
  variants={product.variants ?? []}
  isOwner={isOwner}
/>
```

**Expand qrModal state** (same pattern as InventoryClient):

```typescript
const [qrModal, setQrModal] = useState<{
  variantId: string;
  dataUrl: string;
  lengthCm: number;
  color: string;
} | null>(null);
```

**Update openQr** to accept variant data:

```typescript
const openQr = async (variant: VariantData) => {
  try {
    const QRCode = await import("qrcode");
    const url = `${window.location.origin}/sales/new?variantId=${variant.id}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 300, errorCorrectionLevel: "M", margin: 2 });
    setQrModal({ variantId: variant.id, dataUrl, lengthCm: variant.lengthCm, color: variant.color });
  } catch (e) {
    console.error("QR generation failed:", e);
  }
};
```

**Update modal** to show info (productName and category come from props):

```tsx
{qrModal && (
  ...
  <div className="mt-3 space-y-1 text-center">
    <p className="text-sm font-medium text-ink">{productName}</p>
    <p className="text-xs text-muted">
      {qrModal.lengthCm} cm · {colorName(qrModal.color)}
    </p>
    <span className="...">{category}</span>
  </div>
  ...
)}
```

Note: VariantTable doesn't have stock grams info (no `availableGrams` on VariantData). The `stockMap` is fetched async but may not be loaded when QR opens. Can optionally show grams from stockMap if available:

```typescript
const stock = stockMap.get(qrModal.variantId);
// Show: {stock ? `${stock.availableGrams} g` : ""}
```

---

## Files to edit

| # | File | Change | Priority |
|---|------|--------|----------|
| 1 | `src/app/(app)/inventory/InventoryClient.tsx` | Expand qrModal state + add product info to modal | **HIGH** |
| 2 | `src/components/products/VariantTable.tsx` | Expand qrModal state + add info to modal + accept productName/category props | **HIGH** |
| 3 | `src/app/(app)/products/[id]/ProductDetailClient.tsx` | Pass productName + category to VariantTable | **LOW** (1 line change) |

**QrLabelSheet.tsx does NOT need changes** — it already shows all the info.

---

## Summary

| What | Current | Fix |
|------|---------|-----|
| QR modal (Inventory) | QR image + download only | Add product name, length, color, grams, category badge |
| QR modal (Product edit) | QR image + download only | Add product name, length, color, category badge |
| QR print labels | Already shows full info | No change needed |

**3 files to edit, minimal changes** — expand state objects + add info display below QR image in the modal.
