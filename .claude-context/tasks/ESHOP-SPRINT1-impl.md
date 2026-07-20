# E-shop Sprint 1 — Order Model + API (Implementation Log)

**Task:** #86
**Commit:** 51613f5
**Status:** DONE

## What was implemented

### 1. Prisma Schema Changes (`prisma/schema.prisma`)
- **OrderStatus enum**: Added `AWAITING_PAYMENT`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`. Removed `IN_TRANSIT`.
- **Order model**: Expanded with 15+ fields — `customerId`, contact fields (`contactEmail`, `contactPhone`, `contactName`), shipping fields (`packetaPointId`, `packetaPointName`, `packetaPointCity`), `paymentMethod`, `shippingCost`, `promoCode`, `promoDiscount`, `comgateTransId`, `locale`, `completedAt`. Made `salonId` nullable.
- **OrderItem model**: Added snapshot fields (`productName`, `lengthCm`, `color`, `sku`).
- **Customer model**: Added `orders Order[]` relation.

### 2. Order Workflow Refactor (`src/lib/order-workflow.ts`)
- Renamed `IN_TRANSIT` → `SHIPPED` in `updateOrderStatus` signature
- Expanded `validTransitions` to support new statuses (PAID, PROCESSING, etc.)

### 3. Admin Orders API (`src/app/api/orders/[id]/route.ts`)
- IN_TRANSIT → SHIPPED throughout
- Added null guards for `salonId` on ALL salon notification calls
- Updated status validation to include new statuses
- Fixed `salonId: null` → `undefined` conversion for `completeSale`

### 4. New Files

#### `src/lib/shipping.ts`
- `SHIPPING_COSTS` constant (PACKETA: 89 CZK, CZECH_POST: 119 CZK, rest: 0)
- `FREE_SHIPPING_THRESHOLD` = 2000 CZK
- `getShippingCost(method, orderTotal)` function

#### `src/lib/order-to-sale.ts`
- `createSaleFromOrder(orderId, userId)` — 2-step pattern: deactivate reservations in tx → completeSale outside tx → link Order→Sale → create invoice → send invoice email
- `generateOrderNumber(tx, prefix)` — format `E{YYYY}{NNNN}`

#### `src/app/api/public/stock-check/route.ts`
- POST endpoint for checking stock availability
- Returns `{ allAvailable, items: [{ variantId, available, inStock, availableToOrder, estimatedLeadDays }] }`

#### `src/app/api/public/orders/route.ts`
- Full guest checkout flow: rate limit (5/hour/IP) → validate → stock check → upsert customer → retail pricing → promo code → shipping cost → create Order+Items+Reservations in $transaction → Comgate (CARD) or bank info (TRANSFER)
- Reservation expiry: CARD=30min, TRANSFER=48h

### 5. Comgate Callback Extension (`src/app/api/comgate/callback/route.ts`)
- Added Order lookup fallback when Payment not found (for e-shop orders)
- PAID: updates Order status → finds OWNER user → calls `createSaleFromOrder()`
- CANCELLED: updates Order status + releases reservations
- Guard: logs error if no OWNER user exists in DB

## Reviewer corrections applied
1. Reservation expiry: CARD=30min, TRANSFER=48h (not 24h)
2. Comgate callback: getSystemUserId guard if no OWNER exists
3. NotificationType enum kept as-is (ORDER_IN_TRANSIT independent from OrderStatus SHIPPED)
