# QA Report: E-shop Sprint 3 — Admin + Platby + Emaily

**Datum:** 2026-07-20
**QA:** KONTROLOR
**Status: SCHVÁLEN S JEDNÍM NÁLEZEM**

---

## Výsledky kontroly 14 bodů

| # | Oblast | Status | Detail |
|---|--------|--------|--------|
| 1 | Admin orders API — B2B/Retail filtr | PASS | `type` parametr, B2B/RETAIL/ALL, customer include |
| 2 | mark-paid — createSaleFromOrder + REVERT | PASS | KP #1 plně implementován |
| 3 | ship-packeta — Packeta API + tracking | PASS | createPacket(), status SHIPPED, tracking nastaveno |
| 4 | ship-manual — tracking ID, SHIPPED | PASS | body.trackingId → DB, email odesílán |
| 5 | complete — 3 větve | NÁLEZ (minor) | Viz bod #1 níže |
| 6 | Email šablony — 3 nové, cs/uk/ru | PASS | Funkce existují v email-templates.ts:853/992/1084 |
| 7 | Email triggery | PASS | public/orders POST, comgate callback, admin akce |
| 8 | QR SPAYD v CheckoutClient | PASS | SPD*1.0*ACC:IBAN*AM:X*CC:CZK*X-VS:VS, client-side qrcode |
| 9 | Expire-reservations — Order Reservation | PASS | expiresAt lookup, deaktivace, cancel AWAITING_PAYMENT |
| 10 | OrdersClient — B2B/Retail tabs, 11 statusů | PASS | Tabs pro OWNER/EMPLOYEE, statusColors rozšířeny |
| 11 | OrderDetailClient — sekce + tlačítka | NÁLEZ (minor) | Viz bod #2 níže |
| 12 | expiresAt nastaveno při tvorbě rezervací | PASS | CARD=30min, TRANSFER=48h v public/orders/route.ts:227-228 |
| 13 | SaleType RETAIL pro e-shop objednávky | PASS | `customerType: "RETAIL"` v order-to-sale.ts:43 |
| 14 | TypeScript check | PASS | `npx tsc --noEmit` — 0 chyb |

---

## Nález #1: complete akce — retail větev nastavuje status PAID dočasně (minor)

**Soubor:** `src/app/api/orders/[id]/route.ts:435-437`

```ts
if (orderToComplete.status !== "PAID" && !orderToComplete.saleId) {
  // Set to PAID temporarily for createSaleFromOrder flow
  await prisma.order.update({ where: { id }, data: { status: "PAID" } });
}
```

**Popis:** Retail větev complete akce nastavuje status na `PAID` před voláním `createSaleFromOrder()`. `createSaleFromOrder()` pak tento status přepíše na `PROCESSING` (po úspěchu). Problém: pokud `createSaleFromOrder()` selže, catch blok revertuje na `orderToComplete.status` (původní — např. SHIPPED/DELIVERED). Dočasný PAID stav tak nezůstane.

**Riziko:** Nízké — revert je správný. Ale dočasný PAID stav je viditelný v DB po dobu volání `createSaleFromOrder()` (typicky < 1s). Akceptovatelné.

---

## Nález #2: ship-packeta / ship-manual — UI podmínka PROCESSING/READY, API akceptuje PAID/PROCESSING (minor)

**Soubory:** `OrderDetailClient.tsx:348-355` vs `orders/[id]/route.ts:280`

**UI** zobrazuje tlačítka ship-packeta a ship-manual pro `["PROCESSING", "READY"]`.
**API** akceptuje `["PAID", "PROCESSING"]`.

**Nesoulad:** Zákazník zaplatí kartou → order je `PAID` → `createSaleFromOrder` přejde na `PROCESSING`. Ale pokud admin chce odeslat z `PAID` (bez přechodu přes PROCESSING), UI tlačítko se nezobrazí. V praxi to není problém protože `createSaleFromOrder` vždy nastaví `PROCESSING` — admin uvidí tlačítko. Ale teoreticky pokud `createSaleFromOrder` selže a order zůstane `PAID`, admin nemůže odeslat z UI.

**Závěr:** Neblokující — v normálním flow order přejde přes PROCESSING. Opravitelné v budoucím sprintu přidáním `PAID` do UI podmínky.

---

## Ověřené body

### KP #1 — mark-paid revert (PASS)
`orders/[id]/route.ts:246-254` — catch blok správně revertuje `PAID → AWAITING_PAYMENT, paidAt: null`. ✓

### KP #2 — expiresAt nastaveno (PASS)
`public/orders/route.ts:226-228`:
```ts
const reservationMinutes = data.paymentMethod === "CARD" ? 30 : 48 * 60;
const expiresAt = new Date(Date.now() + reservationMinutes * 60 * 1000);
```
Reservace při tvorbě objednávky mají `expiresAt` — cron je najde. ✓

### Expire-reservations cron (PASS)
Přidaná sekce v cron route hledá `Reservation` s `active: true, expiresAt: { lt: now }`, deaktivuje je, canceluje `AWAITING_PAYMENT` objednávky a invaliduje stock cache. Notifikuje OWNER. ✓

### SPAYD QR v CheckoutClient (PASS)
`CheckoutClient.tsx:269-296` — client-side `import("qrcode")`, SPAYD string: `SPD*1.0*ACC:IBAN*AM:X.XX*CC:CZK*X-VS:VS`. Používá `orderResult.paymentInfo.iban` z API response. ✓

### Email triggery (PASS)
- Objednávka vytvořena → `public/orders/route.ts:293` volá `getRetailOrderConfirmationEmail` ✓
- Comgate PAID → `comgate/callback/route.ts:70-77` volá `getRetailPaymentReceivedEmail` ✓
- mark-paid → `orders/[id]/route.ts:257-266` volá `getRetailPaymentReceivedEmail` ✓
- ship-packeta → `orders/[id]/route.ts:331-342` volá `getRetailOrderShippedEmail` ✓
- ship-manual → `orders/[id]/route.ts:381-390` volá `getRetailOrderShippedEmail` ✓

### complete — 3 větve (PASS s výhradou)
1. `saleId` existuje → jen COMPLETED (retail po mark-paid)
2. `!salonId` (retail bez Sale) → temp PAID + createSaleFromOrder
3. `salonId` (B2B) → původní completeSale() flow

### SaleType RETAIL (PASS)
`order-to-sale.ts:41-43`: `customerType = orderData.salonId ? "SALON" : "RETAIL"` — správně. ✓

### Admin orders API (PASS)
`api/orders/route.ts:17-31`: `type=B2B` → `salonId: { not: null }`, `type=RETAIL` → `customerId: { not: null }, salonId: null`. Include `customer: { select: { name, email } }`. ✓

### OrdersClient — 11 statusů + B2B/Retail tabs (PASS)
`statusColors` má AWAITING_PAYMENT, PAID, PROCESSING, DELIVERED. B2B/Retail/ALL tabs jen pro staff (`isStaff`). ✓

### OrderDetailClient — sekce a tlačítka (PASS s výhradou)
Kontakt/doprava/platba sekce přítomny. Tlačítka mark-paid, ship-packeta, ship-manual implementována. STATUS_CONFIG rozšířen. ✓

---

## Build check

`npx tsc --noEmit` — 0 chyb. ✓

---

## Závěr

**Implementace SCHVÁLENA.** Všechny kritické opravy z review aplikovány. 2 drobné nálezy (complete dočasný PAID stav, ship UI podmínka) jsou neblokující a nevyžadují opravu před nasazením.
