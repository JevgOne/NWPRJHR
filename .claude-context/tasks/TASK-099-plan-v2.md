# PLAN: TASK-099 — Notifikacni zvonecek — dokonceni

## Stav implementace

### CO UZ JE HOTOVO

1. **getNotificationUrl** v `NotificationBell.tsx:17-54` — pokryva vsechny NotificationType:
   - NEW_ORDER, ORDER_CONFIRMED, ORDER_READY, ORDER_IN_TRANSIT, ORDER_REJECTED → `/orders/{orderId}` (fallback `/orders`)
   - INVOICE_ISSUED, INVOICE_PAID, INCOMING_PAYMENT, PAYMENT_REMINDER → `/invoices/{invoiceId}` (fallback `/invoices`)
   - RETURN_REQUEST → `/returns/{returnId}` (fallback `/returns`)
   - NEW_COMPLAINT → `/complaints/{complaintId}` (fallback `/complaints`)
   - RESERVATION_CREATED, RESERVATION_PAID, RESERVATION_EXPIRED → `/reservations/{reservationId}` (fallback `/reservations`)
   - SAMPLE_REQUEST → `/samples`
   - NEW_INQUIRY, NEW_CONTACT → `/inquiries`
   - NEW_REVIEW → `/reviews`
   - REGISTRATION → `/registrations`
   - REFERRAL_USED → `/referrals`

2. **getNotificationUrl** v `NotificationsClient.tsx:17-56` — stejna logika, mala odlisnost:
   - REGISTRATION → `d.salonId ? /salons/{salonId} : /registrations` (lepsi nez v Bell)
   - NEW_CONTACT → `/notifications` (odlisne od Bell kde jde na `/inquiries`)

3. **deleteNotificationsForEntity** v `notifications.ts:400-423` — funkce existuje a funguje:
   - Filtruje unread notifikace podle JSON data pole
   - Maze vsechny nalezene

4. **Storno objednavek** (`orders/[id]/route.ts:634`):
   - `deleteNotificationsForEntity("orderId", id)` — VOLANO pri cancel

5. **Storno rezervaci** (`reservations/[id]/route.ts:194`):
   - `deleteNotificationsForEntity("reservationId", id)` — VOLANO pri cancel

---

### CO ZBYVA OPRAVIT

#### PROBLEM 1: Reject objednavky NEmazze notifikace

**Soubor:** `src/app/api/orders/[id]/route.ts`, radek 180-210 (case "reject")

Kdyz admin ODMITNE (reject) objednavku, vytvori se notifikace pro salon (ORDER_REJECTED), ale NEMAZOU se puvodni notifikace (napr. NEW_ORDER). To znamena ze zvonecek stale ukazuje "Nova objednavka" pro objednavku ktera uz byla odmitnuta.

**FIX:** Pridat `deleteNotificationsForEntity("orderId", id)` do reject bloku.

```typescript
// Po radku 206 (za createSalonNotification)
// Clean up old notifications for rejected order
deleteNotificationsForEntity("orderId", id).catch(() => {});
```

#### PROBLEM 2: Expirace rezervaci NEmazze notifikace

**Soubor:** `src/app/api/cron/expire-reservations/route.ts`

Kdyz cron job automaticky expiruje rezervace/objednavky:
- Expiruje ProductReservation → vytvari RESERVATION_EXPIRED notifikaci
- Zrusi AWAITING_PAYMENT objednavky → vytvari notifikaci
- ALE NEMAZE puvodni RESERVATION_CREATED/RESERVATION_PAID notifikace

**FIX:** Po expiraci zavolat cleanup pro kazdy expired entity.

```typescript
// Po radku 14 (po expireOverdueReservations)
// Pozn: expireOverdueReservations nevraci IDs — potreba upravit
// nebo provest hromadny cleanup vsech expired RESERVATION notifikaci

// Pro order expirace (radek 50-57):
for (const orderId of orderIds) {
  deleteNotificationsForEntity("orderId", orderId as string).catch(() => {});
}
```

**POZOR:** `expireOverdueReservations()` nevraci IDs expirovanych rezervaci. Bude treba:
- Bud upravit funkci aby vracela IDs
- Nebo preskocit cleanup pro ProductReservation expirace (RESERVATION_EXPIRED se vytvori vzdy, takze uzivatel uvideli notifikaci o expiraci)

**DOPORUCENI:** Pro expiraci rezervaci staci pridat cleanup objednavek (radek 48-57). Expirace ProductReservation vytvari novou notifikaci (RESERVATION_EXPIRED) ktera je uzivatelsky jasna — cleanup puvodniho RESERVATION_CREATED neni kriticka.

#### PROBLEM 3: Inquiry storno NEmazze notifikace

**Soubor:** `src/app/api/inquiries/[id]/route.ts`

Kdyz admin nastavi inquiry status na CANCELLED:
- Zmeni status v DB
- ALE NEMAZE NEW_INQUIRY notifikaci

**FIX:** Pridat cleanup po zmene statusu na CANCELLED.

```typescript
// Po radku 52 (za revalidateTag)
if (body.status === "CANCELLED") {
  deleteNotificationsForEntity("inquiryId" as any, id).catch(() => {});
}
```

**POZOR:** `deleteNotificationsForEntity` nepodporuje `"inquiryId"` v type union. Je treba:
1. Pridat `"inquiryId"` do type union v `notifications.ts:401`
2. Nebo najit notifikace podle dat manualne

**DOPORUCENI:** Pridat `"inquiryId"` do entityKey union type:
```typescript
export async function deleteNotificationsForEntity(
  entityKey: "orderId" | "reservationId" | "invoiceId" | "returnId" | "complaintId" | "inquiryId",
  entityId: string
): Promise<number> {
```

A v `api/public/inquiry/route.ts:219` pridat `inquiryId` do notifikacnich dat (uz tam je na radku 219).

#### PROBLEM 4: Nekonzistence getNotificationUrl

**NotificationBell.tsx vs NotificationsClient.tsx:**

| Typ | Bell | Client | Spravne |
|-----|------|--------|---------|
| NEW_CONTACT | `/inquiries` | `/notifications` | Zalezi na preferenci — `/notifications` je logictejsi |
| REGISTRATION | `/registrations` | `d.salonId ? /salons/{salonId} : /registrations` | Client verze je lepsi |

**FIX:** Sjednotit obe implementace. Doporucuji pouzit verzi z `NotificationsClient.tsx` i v `NotificationBell.tsx`:
- REGISTRATION: `d.salonId ? /salons/${d.salonId} : /registrations`
- NEW_CONTACT: `/notifications` (nebo lepsi: `/inquiries` pokud ma contact data)

---

## SOUBORY K UPRAVE

| # | Soubor | Zmena | Obtiznost |
|---|--------|-------|-----------|
| 1 | `src/app/api/orders/[id]/route.ts:209` | Pridat `deleteNotificationsForEntity("orderId", id)` po reject | Jednoduche |
| 2 | `src/app/api/cron/expire-reservations/route.ts:48-57` | Pridat cleanup notifikaci pro expirovane objednavky | Stredni |
| 3 | `src/lib/notifications.ts:401` | Pridat `"inquiryId"` do entityKey union | Jednoduche |
| 4 | `src/app/api/inquiries/[id]/route.ts:50-52` | Pridat deleteNotificationsForEntity pri CANCELLED | Jednoduche |
| 5 | `src/components/NotificationBell.tsx:17-54` | Sjednotit s NotificationsClient (REGISTRATION, NEW_CONTACT) | Jednoduche |

---

## PORADI IMPLEMENTACE

1. **notifications.ts** — pridat `"inquiryId"` do entityKey (1 radek)
2. **orders/[id]/route.ts** — pridat cleanup pri reject (1 radek)
3. **inquiries/[id]/route.ts** — pridat import + cleanup pri CANCELLED (3 radky)
4. **expire-reservations/route.ts** — pridat cleanup pro expirovane objednavky (3 radky)
5. **NotificationBell.tsx** — sjednotit getNotificationUrl s NotificationsClient (2 zmeny)

**Celkem: 5 souboru, ~10 radku zmeny**

---

## VERIFIKACE

Po implementaci:
1. Vytvorit objednavku → odmitnou ji → overit ze NEW_ORDER notifikace zmizela ze zvonecku
2. Vytvorit rezervaci → zrusit ji → overit ze RESERVATION_CREATED zmizela
3. Zrusit inquiry (CANCELLED) → overit ze NEW_INQUIRY zmizela
4. Kliknout na kazdý typ notifikace → overit navigaci funguje
5. Specificke testy:
   - Kliknout na REGISTRATION notifikaci → ma jit na /salons/{id}
   - Kliknout na NEW_CONTACT → ma jit na /notifications

---

## RIZIKA

- **Nizke** — vsechny zmeny jsou catch(() => {}) neblokujici operace
- `deleteNotificationsForEntity` uz funguje pro orderId a reservationId — pridani dalsich je konzistentni
- Jediny "prekvapeni" scenar: pokud uzivatel uz precetl (read=true) notifikaci, NEsmaze se (funkce maze jen unread) — to je OK, prectenou notifikaci neni treba mazat
