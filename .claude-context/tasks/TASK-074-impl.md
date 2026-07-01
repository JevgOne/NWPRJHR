# TASK-074: Telegram notifikace pri zruseni objednavky — Implementation

## What was done

Added Telegram notification when an order is cancelled (both salon-initiated and admin-initiated).

## Changes

### `src/lib/telegram.ts`
- Added `notifyOrderCancelled()` function
- Bilingual CZ/RU format consistent with other notifications
- Differentiated messages for salon vs admin cancellation
- Uses `sendTelegramMessage()` (no buttons — informational only)

### `src/app/api/orders/[id]/route.ts`
- Added `notifyOrderCancelled` import
- Extended `orderCheck` query to include `_count: { select: { items: true } }` for item count
- Added `notifyOrderCancelled()` call after existing in-app notifications in the cancel action
- `.catch(() => {})` to prevent Telegram failures from blocking the cancel flow

## No new files. No DB migrations. 2 file edits.
