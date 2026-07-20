# E-shop Sprint 2 — Checkout Frontend (Implementation Log)

**Task:** #89
**Commit:** 8b023ef
**Status:** DONE

## What was implemented

### 1. InquiryCartItem price tracking (`src/lib/inquiry-cart.tsx`)
- Added `pricePerUnit?: number` field (halere per gram or per piece, retail)
- Backwards compatible — existing cart items without price still work in inquiry mode

### 2. AddToInquiryForm price passthrough (`AddToInquiryForm.tsx`)
- Added `retailPricePerPiece` to `PickerVariant` interface
- `handleAdd()` now computes `pricePerUnit` using reviewer's correction:
  - BY_PIECE: `retailPricePerPiece ?? pricePerPiece ?? 0`
  - BY_GRAM: `retailPricePerGram`

### 3. Stock-check API extension (`src/app/api/public/stock-check/route.ts`)
- Now accepts EITHER `variantId` OR `productId+lengthCm+color` per item
- Uses Prisma `@@unique([productId, lengthCm, color])` for lookup
- Returns resolved `variantId` so checkout can use it for order submission

### 4. InquiryCartClient checkout button (`InquiryCartClient.tsx`)
- "Proceed to checkout" button appears when any item has `pricePerUnit > 0`
- Subtitle "or send non-binding inquiry below" keeps existing flow accessible

### 5. Checkout page (`src/app/[locale]/(public)/checkout/`)
- `page.tsx`: Server component with metadata, SEO alternates, noindex
- `CheckoutClient.tsx`: 4-step wizard with visual stepper

#### Step 1 — Contact
- First name, last name, email (required), phone, note (optional)
- Reuses inquiry translations for labels

#### Step 2 — Shipping
- Personal delivery, Pickup, Packeta (with PacketaWidget), Czech Post
- Dynamic pricing: shows "Free" when order >= FREE_SHIPPING_THRESHOLD
- Packeta point selection required validation

#### Step 3 — Payment
- Transfer (bank) or Card (Comgate)
- Promo code input with validation (reuses existing API)
- Terms & conditions checkbox (links to /obchodni-podminky)

#### Step 4 — Summary
- Item list with line totals
- Price breakdown: items, discount, shipping, total
- Contact & shipping method summary
- Submit button: "Order & pay by transfer" or "Pay by card"

#### Submit flow
1. Stock check via `/api/public/stock-check` (with productId+lengthCm+color)
2. Get resolved variantIds from response
3. Submit to `/api/public/orders` with resolved variantIds
4. CARD: redirect to Comgate URL
5. TRANSFER: show bank account details (account, IBAN, VS, amount)

### 6. Translations (messages/cs.json, uk.json, ru.json)
- ~35 new keys in `public.checkout` namespace per language
- 2 new keys in `public.inquiry` (proceedToCheckout, orSendInquiry)
- 2 new metadata keys (checkoutTitle, checkoutDescription)

## Reviewer corrections applied
1. pricePerUnit BY_GRAM vs BY_PIECE: Uses `retailPricePerPiece ?? pricePerPiece` for BY_PIECE
2. stock-check API: Extended to accept `productId+lengthCm+color` lookup
