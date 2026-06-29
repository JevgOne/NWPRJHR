# TASK-003: QR kod produktu pri naskladneni -> odkaz na prodej

## Overview

After stocking in a product (creating a Delivery), generate a QR code linking to the product's public page (`https://hairland.cz/offer/{productId}`) and display it so the user can print it as a label/sticker for the physical product.

## Current State

- **QR library**: `src/lib/qr-code.ts` — already has `generateQRCodeDataUrl()` and `generateQRCodeBuffer()` using `qrcode` npm package
- **Stock-in form**: `src/components/inventory/StockInForm.tsx` — after success, does `router.push("/inventory")` (line 114)
- **Delivery API**: `src/app/api/deliveries/route.ts` POST — returns the created Delivery (has `variantId` but not `productId` directly)
- **Delivery model**: has `barcode` field, links to Variant -> Product
- **Product URL**: `/offer/{productId}` (uses CUID id, slug exists but page uses id)
- **Site URL**: `process.env.NEXT_PUBLIC_SITE_URL || "https://hairland.cz"`

## Architecture Decision

**Approach: Show QR success dialog in StockInForm after delivery creation**

Instead of redirecting to `/inventory` after stock-in, show a success screen with:
1. Confirmation message
2. QR code linking to the product's public page
3. Print button (for label printing)
4. "Done" button to navigate to inventory

The QR code will be generated client-side using a new API endpoint, or directly using the `qrcode` package in the browser (it supports browser environments).

**Chosen: Client-side QR generation** — the `qrcode` npm package works in browser, avoiding an extra API call. The URL is deterministic: `{SITE_URL}/offer/{productId}`.

## Implementation Plan

### Step 1: Extend Delivery API response to include productId
**File:** `src/app/api/deliveries/route.ts`

The POST response currently returns the bare `Delivery` object which has `variantId` but not `productId`. We need to include productId for the QR code URL.

**Change (line 62-78):** After `stockIn()`, fetch the variant to get `productId`.

**Before:**
```typescript
const delivery = await stockIn(
  { ...data, barcode: data.barcode || generateBarcode(), ... },
  session.user.id
);

return NextResponse.json(delivery, { status: 201 });
```

**After:**
```typescript
const delivery = await stockIn(
  { ...data, barcode: data.barcode || generateBarcode(), ... },
  session.user.id
);

const variant = await prisma.variant.findUnique({
  where: { id: delivery.variantId },
  select: { productId: true, product: { select: { name: true, slug: true } } },
});

return NextResponse.json({
  ...delivery,
  productId: variant?.productId,
  productName: variant?.product.name,
  productSlug: variant?.product.slug,
}, { status: 201 });
```

**Lines changed:** ~8

---

### Step 2: Update StockInForm to show QR success screen
**File:** `src/components/inventory/StockInForm.tsx`

**Change 1 — Add imports and state:**
```typescript
import QRCode from "qrcode";  // works in browser
```

Add new state (after line 51):
```typescript
const [successData, setSuccessData] = useState<{
  productId: string;
  productName: string;
  deliveryBarcode: string;
  grams: number;
} | null>(null);
const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
```

**Change 2 — After successful POST (replace lines 114-115):**

**Before:**
```typescript
router.push("/inventory");
router.refresh();
```

**After:**
```typescript
const result = await res.json();
const siteUrl = window.location.origin;
const productUrl = `${siteUrl}/offer/${result.productId}`;

const qr = await QRCode.toDataURL(productUrl, {
  errorCorrectionLevel: "M",
  width: 300,
  margin: 2,
});

setSuccessData({
  productId: result.productId,
  productName: result.productName ?? selectedProduct?.name ?? "",
  deliveryBarcode: result.barcode ?? "",
  grams: parseInt(totalGrams),
});
setQrDataUrl(qr);
```

**Change 3 — Add success screen render (before the main form return):**

After the existing state declarations and before `return (<Card>...)`, add:

```tsx
if (successData && qrDataUrl) {
  return (
    <Card>
      <div className="max-w-md mx-auto text-center space-y-4 py-4">
        {/* Success icon */}
        <div className="w-14 h-14 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-lg font-bold text-ink">{t("stockedSuccess")}</h2>
        <p className="text-sm text-muted">
          {successData.productName} — {successData.grams} g
        </p>

        {/* QR Code */}
        <div className="bg-white border border-line rounded-xl p-4 inline-block">
          <img
            src={qrDataUrl}
            alt="QR product link"
            className="w-[200px] h-[200px] mx-auto"
          />
          <p className="text-xs text-muted mt-2 font-mono">
            {successData.deliveryBarcode}
          </p>
        </div>

        <p className="text-xs text-muted">
          {t("qrLinkDesc")}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const printWindow = window.open("", "_blank", "width=400,height=500");
              if (printWindow) {
                printWindow.document.write(`
                  <html>
                    <head><title>${successData.productName}</title></head>
                    <body style="text-align:center;font-family:sans-serif;padding:20px;">
                      <img src="${qrDataUrl}" width="200" height="200" />
                      <p style="font-family:monospace;font-size:12px;margin-top:8px;">${successData.deliveryBarcode}</p>
                      <p style="font-size:14px;margin-top:4px;">${successData.productName}</p>
                      <p style="font-size:12px;color:#888;">${successData.grams} g</p>
                    </body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.print();
              }
            }}
          >
            {t("printLabel")}
          </Button>
          <Button
            type="button"
            onClick={() => {
              router.push("/inventory");
              router.refresh();
            }}
          >
            {tCommon("done")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

**Lines changed:** ~80

---

### Step 3: Add translation keys
**Files:** Translation JSON files for cs, uk, ru

Add to `stock` namespace:
```json
{
  "stockedSuccess": "Naskladneno!",
  "qrLinkDesc": "QR kod vede na stranku produktu v e-shopu",
  "printLabel": "Tisknout stitek"
}
```

And to `common` namespace (if not already present):
```json
{
  "done": "Hotovo"
}
```

**Check existing keys:**

<needs_verification>
Grep for "done" key in cs translation file to see if it already exists.
</needs_verification>

---

### Step 4: Verify `qrcode` package is available for browser
**File:** `package.json`

The `qrcode` package is already installed (used by `src/lib/qr-code.ts`). It supports both Node.js and browser environments. The browser import `import QRCode from "qrcode"` should work with Next.js bundler.

If there's a bundling issue with the Node.js-specific parts, use dynamic import:
```typescript
const QRCode = await import("qrcode");
const qr = await QRCode.toDataURL(productUrl, { ... });
```

---

## Summary

| # | File | What | Lines |
|---|------|------|-------|
| 1 | `src/app/api/deliveries/route.ts` | Include productId/productName in POST response | ~8 |
| 2 | `src/components/inventory/StockInForm.tsx` | QR success screen with print button | ~80 |
| 3 | Translation files (cs, uk, ru) | Add `stockedSuccess`, `qrLinkDesc`, `printLabel` keys | ~9 |

**Total files:** 4-5
**Risk:** Low — additive change, replaces `router.push` with success screen
**Dependencies:** `qrcode` npm package (already installed)

## Testing

1. Go to `/inventory/stock-in`, fill in a delivery, submit
2. After success: verify QR code is shown with product name, grams, and barcode
3. Scan QR code with phone — should open `/offer/{productId}` on hairland.cz
4. Click "Print label" — verify print dialog opens with QR + barcode + product info
5. Click "Done" — navigate to `/inventory`
6. Verify the old flow (direct redirect) no longer happens
