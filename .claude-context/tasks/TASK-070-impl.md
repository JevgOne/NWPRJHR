# TASK-070: Slevový kód při objednávce/poptávce — Implementation

## What was done

Integrated promo code support into both B2B order flow (salon catalog) and public inquiry flow.

## Changes

### Database (Turso SQL)
- `orders` table: added `promoCode TEXT`, `promoDiscount INTEGER`
- `inquiries` table: added `promoCode TEXT`

### Prisma Schema
- `prisma/schema.prisma`: Added `promoCode` and `promoDiscount` fields to `Order` model, `promoCode` to `Inquiry` model

### Backend
- `src/lib/validations/salon.ts`: Added `promoCode` to `createOrderSchema`
- `src/lib/order-workflow.ts`: `createOrder()` now accepts `promoCode` param, validates against DB, calculates discount (PERCENT or FIXED), subtracts from estimatedTotal, increments `usedCount` in transaction
- `src/app/api/orders/route.ts`: Passes `promoCode` from request to `createOrder()`
- `src/app/api/public/inquiry/route.ts`: Added `promoCode` to schema, validates & increments `usedCount`, stores on inquiry, includes in notification email

### Frontend — B2B Catalog (`src/app/(salon)/salon/catalog/CatalogClient.tsx`)
- Added promo code input with validate button in floating cart bar
- Calls `/api/promo-codes/validate` endpoint (authenticated)
- Shows green badge with discount info when valid
- Shows strikethrough original price + discounted price
- Sends validated promo code with order submission
- Remove/clear promo code support

### Public Promo Validate Endpoint (`src/app/api/public/promo-codes/validate/route.ts`)
- NEW: Public endpoint for promo code validation without auth
- Rate limited (10 requests/minute per IP)
- Validates code existence, active status, date range, max uses
- Returns code info (discountType, discountValue, description) on success

### Frontend — Public Inquiry (`src/app/(public)/inquiry-cart/InquiryCartClient.tsx`)
- Added real-time promo code validation using `/api/public/promo-codes/validate`
- Input field with "Apply" button — validates before submission
- Green success badge with checkmark, code name, and discount info when valid
- "Remove" button to clear applied code
- Error message for invalid codes
- Only validated codes are sent with inquiry submission

### Frontend — Admin Order Detail (`src/app/(app)/orders/[id]/OrderDetailClient.tsx`)
- Updated interface to include `promoCode` and `promoDiscount`
- Shows subtotal, promo discount line, and final total when promo was applied

### i18n (all 3 locales: cs, uk, ru)
- `salonPortal`: promoCodePlaceholder, applyPromo, promoInvalid
- `public.inquiry`: promoCodeLabel, promoCodePlaceholder, promoApply, promoApplied, promoRemove, promoInvalid
- `orderManagement`: subtotal, promoCode

## Files changed
- `prisma/schema.prisma`
- `src/lib/validations/salon.ts`
- `src/lib/order-workflow.ts`
- `src/app/api/orders/route.ts`
- `src/app/api/public/inquiry/route.ts`
- `src/app/api/public/promo-codes/validate/route.ts` (NEW)
- `src/app/(salon)/salon/catalog/CatalogClient.tsx`
- `src/app/(public)/inquiry-cart/InquiryCartClient.tsx`
- `src/app/(app)/orders/[id]/OrderDetailClient.tsx`
- `messages/cs.json`
- `messages/uk.json`
- `messages/ru.json`

## Plan alignment
All items from TASK-070-plan.md have been implemented:
1. **PromoCodeInput** — inlined into both CatalogClient and InquiryCartClient (reusable component not created as the two UIs differ enough — B2B shows price calculations, public shows informational badge)
2. **Public validate endpoint** — `/api/public/promo-codes/validate` with rate limiting
3. **CatalogClient integration** — real-time validation, price display with discount
4. **Validation schema + API orders** — promoCode in schema, order-workflow validates & applies
5. **InquiryCartClient integration** — real-time validation with apply/remove, validated code sent with submission
6. **API inquiry** — server-side validation, usedCount increment, stored on inquiry
7. **i18n translations** — all keys in cs/uk/ru
