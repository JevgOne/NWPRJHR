# ESHOP-FIX-P1: IN_TRANSIT→SHIPPED + Kč oprava

**Status:** DONE
**Commit:** 7bbe1f5
**Date:** 2026-07-20

## Provedené opravy

### P1: IN_TRANSIT → SHIPPED (admin frontend)

OrderStatus enum byl přejmenován z IN_TRANSIT na SHIPPED v Sprint 1 (Prisma schema),
ale admin UI stále používal starou hodnotu.

**Opravené soubory:**
1. `src/app/(app)/orders/OrdersClient.tsx` — statusColors, statuses array, display logic
2. `src/app/(app)/orders/[id]/OrderDetailClient.tsx` — STATUS_CONFIG, statusLabel, action button (KRITICKÉ: řádek 260 posílal `{ status: "IN_TRANSIT" }` ale API přijímá jen SHIPPED), includes check
3. `src/app/(salon)/salon/DashboardClient.tsx` — statusColors, statusKey
4. `messages/cs.json`, `messages/ru.json`, `messages/uk.json` — translation keys: `inTransit`→`shipped`, `markInTransit`→`markShipped`

**Záměrně NEMĚNĚNO:**
- `src/lib/notifications.ts` — ORDER_IN_TRANSIT je NotificationType (samostatný Prisma enum), NE OrderStatus. Sprint 1 implementace explicitně uvádí: "NotificationType enum kept as-is (ORDER_IN_TRANSIT independent from OrderStatus SHIPPED)". Route.ts řádek 184 správně mapuje SHIPPED status na ORDER_IN_TRANSIT notification type.

### Kontrolor fix: "Kc" → "Kč"

**Opravený soubor:**
- `src/app/[locale]/(public)/checkout/CheckoutClient.tsx` — 8 výskytů "Kc" → "Kč"

## Verifikace

- TypeScript check: PASS (0 errors)
- Žádné zbývající IN_TRANSIT reference ve frontend kódu (mimo NotificationType context)
- Žádné zbývající "Kc" ve checkout
