# TASK-054: Product SKU Code System

## Goal

Design a human-readable SKU (Stock Keeping Unit) code system for identifying product variants. SKUs must be:
- Short, memorable, and typeable
- Unique per variant
- Parseable back to category + texture + color + length
- Usable on labels, in admin, on public site, in inquiry forms

---

## 1. SKU Format

### Lead's Proposal: `L-RV-2-60`

Analysis: Good start but needs refinement.

### Recommended Format: `L-RV-02-60`

```
{Category}-{Texture}-{Color(zero-padded)}-{Length}
```

| Segment | Values | Example |
|---------|--------|---------|
| **Category** (1 char) | `V` = VIRGIN, `L` = LUXE, `S` = STANDARD, `X` = SALE | `L` |
| **Texture** (2 chars) | `RV` = Rovne, `MV` = Mirne vlnite, `VL` = Vlnite, `KU` = Kudrnate | `RV` |
| **Color** (2 digits, zero-padded) | `01`..`10` (from HAIR_COLORS keys) | `02` |
| **Length** (2-3 digits) | Raw cm value | `60` |

**Full example:** `L-RV-02-60` = Luxe, Rovne, barva 2, 60cm

### Why zero-pad color?

Colors are `"1"` through `"10"`. Without padding, `L-RV-1-60` and `L-RV-10-60` sort inconsistently and look unbalanced. `01`..`10` solves both.

### Why NOT include origin?

Origin is a Product-level attribute, not Variant-level. Two variants of the same product already share origin. Including it would make SKUs longer without adding disambiguation value (variants are unique by `[productId, lengthCm, color]`).

### Why NOT include processingType?

Currently all products created via stock-in use `processingType: "OTHER"`. When processing type becomes meaningful, it would be a Product-level differentiator (same product won't have two processing types). Adding it now would make SKUs longer for no benefit.

### Abbreviation Maps (constants)

```typescript
// src/lib/sku.ts

export const SKU_CATEGORY_MAP: Record<string, string> = {
  VIRGIN: "V",
  LUXE: "L",
  STANDARD: "S",
  SALE: "X",
};
export const SKU_CATEGORY_REVERSE = Object.fromEntries(
  Object.entries(SKU_CATEGORY_MAP).map(([k, v]) => [v, k])
);

export const SKU_TEXTURE_MAP: Record<string, string> = {
  "Rovné": "RV",
  "Mírně vlnité": "MV",
  "Vlnité": "VL",
  "Kudrnaté": "KU",
};
export const SKU_TEXTURE_REVERSE = Object.fromEntries(
  Object.entries(SKU_TEXTURE_MAP).map(([k, v]) => [v, k])
);
```

### Edge Cases

| Case | Resolution |
|------|-----------|
| Product has `texture: null` | Use `"XX"` placeholder. Display as `L-XX-02-60` |
| Color code is non-numeric (future) | Truncate/hash to 2 chars, e.g. `"custom-red"` → `CR` |
| SALE category | Prefix `X`. SALE products are repurposed variants — SKU still unique |
| Same category+texture, different products | SKU is per-variant, and two variants from different products CAN have the same generated SKU. This is OK — the SKU identifies the product TYPE, not the specific database record. See "Uniqueness" section below. |

---

## 2. Storage Strategy

### Recommendation: **Generate dynamically** (computed, not stored)

**Why NOT a stored field:**

1. **SKU is deterministic** — it's a pure function of `(product.category, product.texture, variant.color, variant.lengthCm)`. Storing it duplicates data.
2. **No sync risk** — if category or texture changes, stored SKU would be stale. Dynamic generation is always correct.
3. **No migration complexity** — no schema change, no backfill, no null handling.
4. **No unique constraint issues** — two products with identical attributes SHOULD have the same type-code.

**Implementation:**

```typescript
// src/lib/sku.ts

export function generateSku(
  category: string,
  texture: string | null | undefined,
  color: string,
  lengthCm: number,
): string {
  const cat = SKU_CATEGORY_MAP[category] ?? "?";
  const tex = texture ? (SKU_TEXTURE_MAP[texture] ?? "XX") : "XX";
  const col = color.padStart(2, "0");
  const len = String(lengthCm);
  return `${cat}-${tex}-${col}-${len}`;
}

export function parseSku(sku: string): {
  category: string;
  texture: string;
  color: string;
  lengthCm: number;
} | null {
  const parts = sku.split("-");
  if (parts.length !== 4) return null;
  const [cat, tex, col, len] = parts;
  const category = SKU_CATEGORY_REVERSE[cat];
  const texture = SKU_TEXTURE_REVERSE[tex];
  const lengthCm = parseInt(len);
  if (!category || !texture || isNaN(lengthCm)) return null;
  return { category, texture, color: String(parseInt(col)), lengthCm };
}
```

### Uniqueness Consideration

Two different products (e.g., "Luxe Vlasy — Rovne" from Ukraine and "Luxe Vlasy — Rovne" from Belarus) will produce the same SKU for the same color+length variant. This is **intentional** — the SKU identifies the product specification, not the inventory source. The database `variant.id` (cuid) remains the unique identifier.

If unique-per-variant SKU is needed in the future, append a product sequence number: `L-RV-02-60-1`, `L-RV-02-60-2`. But this adds complexity with no current benefit.

---

## 3. Display Locations

### 3a. Admin — Product Detail Page

**File:** `src/app/(app)/products/[id]/ProductDetailClient.tsx`

In the VariantTable, add a "SKU" column. The SKU is computed from the product's category + texture and the variant's color + lengthCm.

```
| SKU          | Délka | Barva | Cena/g  | Sklad  |
| L-RV-02-60   | 60cm  | 2     | 150 Kč  | 320g   |
```

**Changes to VariantTable.tsx:**
- Accept `category` and `texture` as additional props (passed from ProductDetailClient)
- Import `generateSku` from `@/lib/sku`
- Add SKU column as first column, with a copy-to-clipboard button
- Monospace font for SKU (`font-mono text-xs`)

**Estimated changes:** ~15 lines in VariantTable.tsx, ~3 lines in ProductDetailClient.tsx (pass props)

### 3b. Admin — Product List / Grid

**File:** `src/components/products/ProductGridCard.tsx` (if it exists) or wherever the product list renders

Show SKU range on the card, e.g. `L-RV-01..10-40..80` or simply the category+texture prefix `L-RV`.

**Lower priority.** The full SKU is variant-level, so a product card can only show the common prefix.

### 3c. Public — Product Detail Page

**File:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx`

Display SKU in the product info section, near the price/stock area. When a customer selects a specific color+length variant, show the exact SKU.

**Where:** In the right column, after the price display or in the variant selection area. The AddToInquiryForm already knows `selectedColor` and `selectedLength` — pass `category` and `texture` to compute SKU.

**Changes to AddToInquiryForm.tsx:**
- Add `category` and `texture` props
- Import `generateSku`
- When both color and length are selected, display: `<span className="font-mono text-xs text-muted">SKU: {sku}</span>`
- Place below the quantity selector or below the selected variant info

**Also update JSON-LD:** Replace `sku: product.id` (line 611 of page.tsx) with `sku: generateSku(...)` for the default/first variant. For multi-variant products, the JSON-LD `hasVariant` entries should each have their own SKU.

### 3d. Inquiry Form / Cart

**File:** `src/app/[locale]/(public)/inquiry-cart/InquiryCartClient.tsx`

Show SKU next to each item in the inquiry cart. The cart items already contain `productId`, `color`, `lengthCm` — but they DON'T contain `category` or `texture`.

**Options:**
1. **Add category + texture to cart item** — modify `useInquiryCart` to store these when adding. Requires changing the `InquiryCartItem` interface and `addItem` call.
2. **Look up product data** — fetch product details when rendering cart. Adds API call.
3. **Store computed SKU directly** — add `sku: string` to `InquiryCartItem`, compute at add-time.

**Recommended: Option 3** — simplest, no extra API calls, localStorage already has all item data.

**Changes:**
- `src/lib/inquiry-cart.ts`: Add `sku?: string` to `InquiryCartItem`
- `AddToInquiryForm.tsx`: Pass `sku` in `addItem()` call
- `InquiryCartClient.tsx`: Display `item.sku` if available

### 3e. SKU QR Codes (Sklad Organization)

**IMPORTANT: This is a SEPARATE system from existing delivery/variant QR codes.**

| | Existing Variant QR | New SKU QR |
|---|---|---|
| **Encodes** | URL: `/sales/new?variantId=XXX` | SKU string: `L-RV-02-60` |
| **Purpose** | POS — scan to start a sale for this variant | Warehouse — identify product type on shelf/drawer |
| **Scope** | Specific database variant (cuid) | Product specification (category+texture+color+length) |
| **Used by** | `NewSaleWizard.tsx` (auto-add item from QR scan) | Visual lookup, inventory organization |
| **Already exists** | Yes — `QrLabelSheet.tsx`, `VariantTable.tsx`, `InventoryClient.tsx`, `StockInForm.tsx` | No — needs to be built |

#### Existing QR Infrastructure (reuse)

- **`qrcode` package** — already in `package.json` (`^1.5.4`)
- **`src/lib/qr-code.ts`** — `generateQRCodeDataUrl()` and `generateQRCodeBuffer()` utilities
- **`src/components/inventory/QrLabelSheet.tsx`** — printable label sheet with 40x30mm thermal printer support (Miibot D520)
- **`src/app/globals.css` lines 76-109** — print CSS for `@page { size: 40mm 30mm }` and `.qr-label` class
- **`VariantTable.tsx`** — QR modal popup (line 62-66), generates variant QR on click

#### What to Build

**A. SKU QR column/button in VariantTable (admin product detail)**

Add a second QR button next to the existing one (or replace, depending on UX preference). The existing QR button generates a POS URL QR. The new button generates a SKU QR.

**Recommended approach:** Keep existing QR button for POS. Add the SKU text prominently in the variant row (see section 3a). Add a small "print SKU label" action that generates a QR encoding just the SKU string.

**Changes to `src/components/products/VariantTable.tsx`:**
- The QR modal (line 62-66) currently generates POS URL. Add a toggle or second button for "SKU QR" that encodes the SKU string instead of the URL.
- Or: make the printable label include BOTH the POS QR and the SKU text.

**B. SKU on existing QrLabelSheet (enhance)**

**File:** `src/components/inventory/QrLabelSheet.tsx`

The existing label already shows: product name, length, color, category, barcode/id. It needs to also show the **SKU code** as prominent human-readable text.

**Changes:**
- Add `texture` to the `LabelData` interface (currently missing — needed to compute SKU)
- Import `generateSku` from `@/lib/sku`
- Replace the fragmented display (separate lines for length, color, category) with the **SKU code** as the primary identifier text:

```
Current label layout:        Improved layout:
┌──────────────────────┐    ┌──────────────────────┐
│ [QR]  Product Name   │    │ [QR]  L-RV-02-60     │  ← SKU prominent
│       60 cm          │    │       Product Name    │
│       2              │    │       60cm · Barva 2  │
│       LUXE           │    │       id: abc123      │
│       abc123         │    │                       │
└──────────────────────┘    └──────────────────────┘
```

The QR code on the label can encode EITHER the POS URL (current behavior) or the SKU string. **Recommendation: keep the POS URL in the QR** (more actionable when scanned) but add the SKU as large human-readable text on the label. The label then serves dual purpose: scan for POS, read for organization.

**C. SKU QR in Inventory page**

**File:** `src/app/(app)/inventory/InventoryClient.tsx`

The inventory page already has QR modal functionality (line 66-69). The SKU text should be displayed in the inventory table rows and included in the QR modal popup alongside the existing POS QR.

**D. Standalone SKU QR API (optional, lower priority)**

**File:** `src/app/api/sku-qr/route.ts` (new)

A simple API that takes a SKU string and returns a QR code PNG. Useful for:
- External label printers that can fetch images via URL
- Integration with future warehouse management tools

```typescript
// GET /api/sku-qr?sku=L-RV-02-60
// Returns: PNG image of QR code encoding "L-RV-02-60"
```

This is optional and can be deferred.

#### Where SKU QR is NOT shown

- **Public website** — customers see SKU text only, never QR codes
- **Inquiry cart** — SKU text only

### 3f. Invoices (Faktury)

**File:** `src/lib/invoicing.ts` — `formatItemDescription()` function (line 13-26)

Current format: `"Luxe Vlasy — Rovne, 60cm, 2"`
New format: `"Luxe Vlasy — Rovne, 60cm, 2 (L-RV-02-60)"`

**Changes:**
- Import `generateSku` from `@/lib/sku`
- `formatItemDescription()` already receives `product: Product` and `variant: Variant` — all data available
- Append SKU in parentheses: `return \`${name}, ${variant.lengthCm}cm, ${variant.color} (${generateSku(product.category, product.texture, variant.color, variant.lengthCm)})\`;`

**Also affects:** `src/lib/credit-note.ts` if it uses the same function (verify at impl time).

**Estimated changes:** 3 lines in `invoicing.ts`

### 3g. Email Templates

**File:** `src/lib/email-templates.ts`

**Inquiry confirmation email** (`getInquiryConfirmationEmail`, line 305):
- Currently: `items` array has `{ productName, lengthCm, color, quantity, unit }` — NO category/texture
- **Problem:** email template doesn't have access to category/texture to compute SKU
- **Solution:** Add optional `sku?: string` to the items interface. Caller must compute and pass it.
- Text format: `"- Luxe Vlasy — Rovne — 60 cm, 2, 100g (L-RV-02-60)"`
- HTML format: add `<span style="color:#9c8682;font-family:monospace;font-size:12px;">(L-RV-02-60)</span>` after item details

**Order confirmation email** (`getOrderConfirmationEmail`, line 469):
- Currently: `items` array has `{ productName, lengthCm, color, grams, pieces }` — NO category/texture
- Same solution: add optional `sku?: string` field
- Display in same format as inquiry

**Callers that need updating:**
- `src/app/api/public/inquiry/route.ts` — builds inquiry items for email, has access to product data via DB
- `src/app/api/orders/[id]/route.ts` — builds order items for email

**Estimated changes:** ~10 lines in `email-templates.ts`, ~5 lines per caller

### 3h. Telegram Notifications

**File:** `src/lib/telegram.ts`

**`notifyInquiry()`** (line 134):
- Currently shows: `productName` + `lengthCm cm · color · quantity+unit`
- Add SKU: `productName` + `\n   SKU: L-RV-02-60` + `\n   lengthCm cm · color · quantity+unit`
- **Problem:** items interface has `{ productName, lengthCm, color, quantity, unit }` — no category/texture
- **Solution:** Add optional `sku?: string` to the items interface. Caller passes it.

**`notifyRestock()`** (line 266):
- Currently shows: `productName` + `variant` (e.g. "60 cm · 2")
- Add SKU to the variant line: `variant` → `variant · SKU: L-RV-02-60`
- **Caller:** `src/lib/stock-in.ts` (line 86-93) — has access to product + variant data, can compute SKU

**`notifyLowStock()`** (line 282):
- Currently: `productName · variant — remaining Xg`
- Add SKU to each item line
- **Caller:** needs to pass SKU (check where `notifyLowStock` is called)

**Estimated changes:** ~15 lines across `telegram.ts` + ~10 lines across callers

### 3i. Public — ProductGridCard

**File:** `src/components/public/ProductGridCard.tsx`

The ProductGridCard already has access to `product.category` and `product.texture` via the `ProductGridCardProduct` interface (lines 27-39). However, showing full per-variant SKU on a grid card is impractical (cards show multiple variants).

**Recommendation:** Show the **category+texture prefix** as a small label: e.g. `L-RV` on the card. This helps customers reference products in messages/calls.

**Changes:**
- Import `SKU_CATEGORY_MAP`, `SKU_TEXTURE_MAP` from `@/lib/sku`
- Add a small `<span className="font-mono text-[10px] text-muted">L-RV</span>` near the product name or category badge
- Full SKU only shown on product detail page after selecting variant

**Estimated changes:** ~5 lines

### 3j. Inquiry Submission (API side)

**File:** `src/app/api/public/inquiry/route.ts`

When an inquiry is submitted, the API:
1. Saves items to DB (InquiryItem model)
2. Sends email confirmation
3. Sends Telegram notification

All three should include SKU. The API handler fetches product data for each item to get productName. At that point, `product.category` and `product.texture` are available — compute SKU there and pass to email/Telegram functions.

**Changes:** ~5 lines to compute SKU when building notification data

---

## 4. Migration Script (Backward Compatibility)

### Dynamic SKU = No Migration Needed

Since SKU is computed, not stored, there is no migration. All existing variants automatically get SKUs when the code deploys.

### Optional: Verification Script

A one-time script to verify all existing variants produce valid SKUs (no `?` or `XX` segments from missing data):

```typescript
// scripts/verify-skus.ts
import { prisma } from "../src/lib/db";
import { generateSku } from "../src/lib/sku";

async function main() {
  const variants = await prisma.variant.findMany({
    where: { active: true },
    include: { product: { select: { category: true, texture: true, name: true } } },
  });

  let invalid = 0;
  for (const v of variants) {
    const sku = generateSku(v.product.category, v.product.texture, v.color, v.lengthCm);
    if (sku.includes("?") || sku.includes("XX")) {
      console.log(`WARN: ${v.product.name} ${v.lengthCm}cm/${v.color} → ${sku} (texture: ${v.product.texture})`);
      invalid++;
    }
  }
  console.log(`\n${variants.length} variants checked, ${invalid} with incomplete SKU`);
}
main();
```

Products with `texture: null` will generate SKUs like `L-XX-02-60`. This is expected for legacy products. The fix is to update the product's texture in admin, not a migration.

---

## 5. Backward Compatibility

The only concern is that `InquiryCartItem` in localStorage won't have `sku` for carts created before deployment. The display code should handle `item.sku` being undefined with a graceful fallback (show nothing, or compute from item data if category/texture are available).

---

## File Change Summary

### P0 — Core SKU Infrastructure + Admin Display

| File | Action |
|------|--------|
| `src/lib/sku.ts` | **CREATE** — `generateSku()`, `parseSku()`, abbreviation maps |
| `src/components/products/VariantTable.tsx` | **MODIFY** — add SKU column with copy button, SKU QR option in QR modal |
| `src/app/(app)/products/[id]/ProductDetailClient.tsx` | **MODIFY** — pass category/texture to VariantTable |
| `src/components/inventory/QrLabelSheet.tsx` | **MODIFY** — add `texture` to LabelData, show SKU as primary text on label |

### P1 — Invoices, Emails, Telegram, Public Site

| File | Action |
|------|--------|
| `src/lib/invoicing.ts` | **MODIFY** — add SKU to `formatItemDescription()` (line 13-26) |
| `src/lib/telegram.ts` | **MODIFY** — add optional `sku` to `notifyInquiry` items, add SKU to `notifyRestock`/`notifyLowStock` |
| `src/lib/email-templates.ts` | **MODIFY** — add optional `sku` to inquiry/order item interfaces, display in text+HTML |
| `src/app/api/public/inquiry/route.ts` | **MODIFY** — compute SKU when building email/Telegram notification data |
| `src/lib/stock-in.ts` | **MODIFY** — pass SKU to `notifyRestock()` |
| `src/app/(app)/inventory/InventoryClient.tsx` | **MODIFY** — show SKU text in inventory rows, pass texture to QrLabelSheet |
| `src/app/[locale]/(public)/offer/[...slug]/page.tsx` | **MODIFY** — update JSON-LD `sku` field, pass category/texture to AddToInquiryForm |
| `src/app/[locale]/(public)/offer/[...slug]/AddToInquiryForm.tsx` | **MODIFY** — accept category/texture props, display SKU when variant selected |
| `src/components/public/ProductGridCard.tsx` | **MODIFY** — show category+texture prefix (e.g. `L-RV`) as small label |

### P2 — Inquiry Cart + Verification

| File | Action |
|------|--------|
| `src/lib/inquiry-cart.ts` | **MODIFY** — add optional `sku` to InquiryCartItem |
| `src/app/[locale]/(public)/inquiry-cart/InquiryCartClient.tsx` | **MODIFY** — display SKU per item |
| `scripts/verify-skus.ts` | **CREATE** — one-time script to check all variants produce valid SKUs |

### P3 — Optional Enhancements

| File | Action |
|------|--------|
| `src/app/api/sku-qr/route.ts` | **CREATE** (optional) — GET endpoint returning QR PNG for a SKU string |

**Total: 3 new files, 14 modified files**

---

## Implementation Notes

### Core
1. **No i18n needed** — SKU codes are language-independent (abbreviations are Latin-script codes, not translations)
2. **No Prisma changes** — no new fields, no migration, no schema changes
3. **Single source of truth** — `generateSku()` in `src/lib/sku.ts` is the ONLY place that builds SKUs. All consumers import from there.
4. **Searchable** — in the future, add SKU search to admin product list by parsing the search query through `parseSku()` and filtering by the extracted attributes
5. **Copy-to-clipboard** — in admin VariantTable, each SKU cell should have a small copy icon. Use `navigator.clipboard.writeText(sku)` on click

### QR-Specific
6. **Reuse `qrcode` package** — already installed (`^1.5.4`), already dynamically imported in VariantTable/QrLabelSheet/InventoryClient/StockInForm
7. **Two QR systems coexist:**
   - **POS QR** (existing): encodes `/sales/new?variantId=XXX` — for scanning to start a sale. Keep as-is.
   - **SKU QR** (new): encodes plain text `L-RV-02-60` — for warehouse shelf labels, visual organization
8. **Print labels keep POS QR inside the QR image** (most actionable when scanned), but add SKU as prominent human-readable text on label
9. **QrLabelSheet already has thermal printer CSS** — `@page { size: 40mm 30mm }` in globals.css. No print CSS changes needed.
10. **VariantTable QR modal** — existing modal shows POS QR (line 62-66). Add SKU text below the QR image in the modal, with its own copy button. Optionally add a tab/toggle to show "SKU QR" (encoding just the SKU string) vs "POS QR" (encoding the sale URL).

### Invoices / Emails / Telegram
11. **Invoice item description** — `formatItemDescription()` in `invoicing.ts` (line 13-26) is the single function that formats item descriptions for ALL invoices (sales, promo, credit notes). Adding SKU there covers all invoice types.
12. **Email item interfaces** — inquiry and order email item types don't have category/texture. Adding `sku?: string` as optional field is backward-compatible. Callers compute SKU from DB data before passing.
13. **Telegram notifications** — `notifyInquiry` and `notifyRestock` in `telegram.ts` — add SKU to existing message format. The `sku` field is optional in item interfaces for backward compatibility.
14. **Server-side only** — invoice/email/Telegram functions run on server, can import `generateSku` directly (no dynamic import needed like on client).

---

## Example SKUs for Current Products

Assuming products follow the naming pattern `{Category} Vlasy — {Texture}`:

| Product | Variant | SKU |
|---------|---------|-----|
| Luxe Vlasy — Rovne | color 2, 60cm | `L-RV-02-60` |
| Luxe Vlasy — Rovne | color 5, 40cm | `L-RV-05-40` |
| Virgin Vlasy — Vlnite | color 1, 80cm | `V-VL-01-80` |
| Standard Vlasy — Kudrnate | color 10, 50cm | `S-KU-10-50` |
| Sale (texture null) | color 3, 30cm | `X-XX-03-30` |
