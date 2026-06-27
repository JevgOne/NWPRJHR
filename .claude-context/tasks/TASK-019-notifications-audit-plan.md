# TASK-019: Audit & Fix Missing In-App Notifications

## Summary

Comprehensive audit of all API endpoints that should generate in-app notifications.
The `NotificationType` enum defines 13 types. The `src/lib/notifications.ts` helper provides
`createNotification`, `createNotificationForRole`, and `createSalonNotification` with
full i18n support (cs/uk/ru). Translation templates already exist for all 13 types.

---

## Current State: What Already Works

| NotificationType    | Where Created                                      | Recipient   | Status |
|---------------------|----------------------------------------------------|-------------|--------|
| NEW_ORDER           | `src/app/api/orders/route.ts:87`                   | OWNER       | OK     |
| ORDER_CONFIRMED     | `src/app/api/orders/[id]/route.ts:73`              | Salon user  | OK     |
| ORDER_REJECTED      | `src/app/api/orders/[id]/route.ts:93`              | Salon user  | OK     |
| ORDER_READY         | `src/app/api/orders/[id]/route.ts:114`             | Salon user  | OK     |
| ORDER_IN_TRANSIT    | `src/app/api/orders/[id]/route.ts:114`             | Salon user  | OK     |
| INVOICE_ISSUED      | `src/app/api/orders/[id]/route.ts:185` (complete)  | Salon user  | PARTIAL |
| INVOICE_PAID        | `src/app/api/payments/route.ts:97`                 | Salon user  | OK     |
| INCOMING_PAYMENT    | `src/app/api/payments/route.ts:89`                 | OWNER       | OK     |
| SAMPLE_REQUEST      | `src/app/api/samples/route.ts:65`                  | OWNER       | OK     |
| RETURN_REQUEST      | `src/app/api/returns/route.ts:78`                  | OWNER       | OK     |
| PAYMENT_REMINDER    | `src/lib/reminders.ts:66`                          | Salon user  | OK     |
| NEW_INQUIRY         | `src/app/api/public/inquiry/route.ts:118`          | OWNER       | OK     |
| REGISTRATION        | `src/app/api/public/register-salon/route.ts`       | OWNER       | OK     |

---

## Gaps Found: Missing Notifications

### GAP 1: INVOICE_ISSUED missing for standalone invoice creation
- **File:** `src/app/api/invoices/route.ts:77` (POST)
- **Problem:** When an invoice is created directly (not via order complete flow), NO notification is sent to the salon.
- **Fix:** After `createInvoiceFromSale()` call, add `createSalonNotification` with type `INVOICE_ISSUED`.
- **Code pattern:**
```typescript
import { createSalonNotification } from "@/lib/notifications";

// After invoice creation (line 80):
if (invoice.salonId) {
  createSalonNotification({
    salonId: invoice.salonId,
    type: "INVOICE_ISSUED",
    data: { invoiceId: invoice.id, invoiceNumber: invoice.number },
  }).catch(() => {});
}
```

### GAP 2: Contact form has NO in-app notification
- **File:** `src/app/api/public/contact/route.ts`
- **Problem:** Contact form sends email + Telegram but NO in-app notification for OWNER.
- **Issue:** There is no `CONTACT_MESSAGE` type in NotificationType enum.
- **Fix (Option A — recommended):** Use `NEW_INQUIRY` type (closest match) for contact messages too.
- **Fix (Option B):** Add new `CONTACT_MESSAGE` to the NotificationType enum (requires schema change + migration + translation templates).
- **Recommended:** Option A for now (no schema change needed).
- **Code pattern:**
```typescript
import { createNotificationForRole } from "@/lib/notifications";

// After contactMsg creation:
createNotificationForRole({
  role: "OWNER",
  type: "NEW_INQUIRY",
  title: `Kontaktni formular: ${name}`,
  message: `${name} (${email}) odeslal zpravu pres kontaktni formular.`,
  data: { contactMessageId: contactMsg.id, name, email },
}).catch(() => {});
```

### GAP 3: Order cancel has NO notification
- **File:** `src/app/api/orders/[id]/route.ts:212` (cancel action)
- **Problem:** When a salon cancels their order, OWNER is not notified. When OWNER/EMPLOYEE cancels, the salon is not notified.
- **Issue:** There is no `ORDER_CANCELLED` type in NotificationType enum.
- **Fix:** Use `ORDER_REJECTED` type for cancellation notifications (closest existing type).
- **Code pattern:**
```typescript
// After cancelOrder(id) call (line 212):
if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
  // Salon cancelled → notify owners
  const salon = await prisma.salon.findUnique({ where: { id: orderCheck.salonId }, select: { name: true } });
  createNotificationForRole({
    role: "OWNER",
    type: "ORDER_REJECTED",
    title: `Objednavka zrusena salonem`,
    message: `Salon "${salon?.name ?? ""}" zrusil objednavku.`,
    data: { orderId: id, salonName: salon?.name },
  }).catch(() => {});
} else {
  // Owner/employee cancelled → notify salon
  createSalonNotification({
    salonId: orderCheck.salonId,
    type: "ORDER_REJECTED",
    data: { orderId: id, orderNumber: orderCheck.orderNumber },
  }).catch(() => {});
}
```

### GAP 4: Sample request status updates have NO notification
- **File:** `src/app/api/samples/[id]/route.ts` (PUT)
- **Problem:** When OWNER changes sample status (SENT, RETURNED, WRITTEN_OFF), the salon is NOT notified.
- **Fix:** Notify salon user when sample is SENT (the most useful status for salon to know).
- **Code pattern:**
```typescript
import { createSalonNotification } from "@/lib/notifications";

// After sampleRequest.update (line 40):
if (body.status === "SENT" && sample.salonId) {
  createSalonNotification({
    salonId: sample.salonId,
    type: "SAMPLE_REQUEST",
    title: "Vzorek odeslan",
    message: "Vas pozadovany vzorek byl odeslan.",
    data: { sampleId: id },
  }).catch(() => {});
}
```

### GAP 5: Salon approval has NO notification for the salon user
- **File:** `src/app/api/salons/[id]/route.ts:107` (PUT)
- **Problem:** When OWNER approves a salon (sets `approved: true`), the salon user gets NO notification. This is the single most important notification for B2B flow — the salon is waiting to know if they got approved!
- **Fix:** Detect when `approved` changes from `false` to `true` and notify salon.
- **Code pattern:**
```typescript
import { createSalonNotification } from "@/lib/notifications";

// Before the update, check current state:
const currentSalon = await prisma.salon.findUnique({ where: { id }, select: { approved: true } });

// After salon.update (line 107-108):
if (parsed.data.approved === true && currentSalon && !currentSalon.approved) {
  createSalonNotification({
    salonId: id,
    type: "REGISTRATION",
    title: "Registrace schvalena",
    message: "Vase registrace byla schvalena. Nyni muzete objednavat.",
    data: { salonId: id },
  }).catch(() => {});
}
```

### GAP 6: Order completion has NO notification for the salon
- **File:** `src/app/api/orders/[id]/route.ts` (complete action, lines 123-195)
- **Problem:** When an order is completed, the salon only gets `INVOICE_ISSUED` notification but NOT a notification about the order being completed/delivered.
- **Fix:** Add notification after the complete transaction, before the invoice notification.
- **Code pattern:**
```typescript
// After the complete transaction result (before sale creation):
createSalonNotification({
  salonId: result.salonId,
  type: "ORDER_CONFIRMED",  // reuse — no "COMPLETED" type exists
  title: "Objednavka dokoncena",
  message: "Vase objednavka byla dokoncena a faktura vystavena.",
  data: { orderId: id },
}).catch(() => {});
```
- **Note:** This is lower priority since INVOICE_ISSUED already fires. Consider whether this creates too many notifications.

### GAP 7: Complaint status changes have NO notification
- **File:** `src/app/api/complaints/[id]/route.ts` (PUT)
- **Problem:** When complaint status changes (e.g., RESOLVED), no one is notified. Since complaints are OWNER-only, this is low priority.
- **Priority:** LOW — complaints are internal OWNER workflow.

### GAP 8: Reviews have NO in-app notification
- **File:** `src/app/api/reviews/route.ts` (POST)
- **Problem:** When a negative review is added, only Telegram notification is sent, no in-app.
- **Priority:** LOW — reviews are added by staff (OWNER/EMPLOYEE), so they already know.

---

## Priority Order for Implementation

### HIGH PRIORITY (must fix):
1. **GAP 5** — Salon approval notification → Most critical for B2B user experience
2. **GAP 1** — INVOICE_ISSUED for standalone invoice creation → Salon expects invoice notification
3. **GAP 3** — Order cancel notification → Both sides need to know about cancellations

### MEDIUM PRIORITY (should fix):
4. **GAP 2** — Contact form in-app notification → Owner might miss contact messages
5. **GAP 4** — Sample sent notification → Salon wants to know sample is on the way

### LOW PRIORITY (nice to have):
6. **GAP 6** — Order completion notification (partially covered by INVOICE_ISSUED)
7. **GAP 7** — Complaint status changes (internal workflow)
8. **GAP 8** — Review notification (staff-initiated action)

---

## Files to Modify

| File | Gap | Change |
|------|-----|--------|
| `src/app/api/salons/[id]/route.ts` | GAP 5 | Add import + notification on approval |
| `src/app/api/invoices/route.ts` | GAP 1 | Add import + notification after creation |
| `src/app/api/orders/[id]/route.ts` | GAP 3 | Add notification on cancel action |
| `src/app/api/public/contact/route.ts` | GAP 2 | Add import + in-app notification |
| `src/app/api/samples/[id]/route.ts` | GAP 4 | Add import + notification on SENT |

---

## No Schema Changes Required

All fixes use existing NotificationType values. No Prisma schema change or SQL migration needed.

## Helper Library

All three helper functions are ready to use from `src/lib/notifications.ts`:
- `createNotificationForRole({ role, type, title, message, data })` — for OWNER notifications
- `createSalonNotification({ salonId, type, data })` — for salon user notifications (auto-translated)
- `createNotification({ recipientId, type, title, message, data })` — for specific user
