# IMPL: TASK-099 — Notifikační zvoneček — dokončení

## Status: DONE

## Změněné soubory (5)

### 1. src/lib/notifications.ts
- Přidán `"inquiryId"` do `entityKey` union type ve funkci `deleteNotificationsForEntity`

### 2. src/app/api/orders/[id]/route.ts
- Přidán `deleteNotificationsForEntity("orderId", id).catch(() => {})` do case "reject" (po createSalonNotification)
- Při odmítnutí objednávky se nyní smažou staré NEW_ORDER notifikace ze zvonečku

### 3. src/app/api/inquiries/[id]/route.ts
- Přidán import `deleteNotificationsForEntity` z `@/lib/notifications`
- Přidán cleanup při statusu CANCELLED: `deleteNotificationsForEntity("inquiryId", id).catch(() => {})`
- Při zrušení inquiry se nyní smažou NEW_INQUIRY notifikace

### 4. src/app/api/cron/expire-reservations/route.ts
- Přidán import `deleteNotificationsForEntity`
- Po expiraci objednávek se volá cleanup pro každé orderId
- Staré NEW_ORDER notifikace pro expirované objednávky se smažou

### 5. src/components/NotificationBell.tsx
- `NEW_CONTACT`: změněno z `/inquiries` na `/notifications` (sjednoceno s NotificationsClient)
- `REGISTRATION`: změněno z `/registrations` na `d.salonId ? /salons/${d.salonId} : /registrations` (sjednoceno s NotificationsClient)

## Validace
- TypeScript: `npx tsc --noEmit` — PASS
- Všechny `.catch(() => {})` — neblokující operace, konzistentní s existujícím vzorem
