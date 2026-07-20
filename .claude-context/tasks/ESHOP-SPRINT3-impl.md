# E-shop Sprint 3 — Implementace

**Datum:** 2026-07-20
**Implementátor:** IMPL agent
**Status:** HOTOVO

---

## Přehled změn

### 1. Admin orders API — B2B/Retail filtr (KROK 1)
**Soubor:** `src/app/api/orders/route.ts`
- Přidán `type` query parametr (`B2B` | `RETAIL` | null = ALL)
- B2B filtr: `salonId: { not: null }`
- RETAIL filtr: `customerId: { not: null }, salonId: null`
- Přidán `customer` include do GET odpovědi

### 2. Admin order detail — customer include (KROK 2)
**Soubor:** `src/app/api/orders/[id]/route.ts`
- Přidán `customer: { select: { name, email } }` do GET include

### 3. Nové API akce (KROK 4)
**Soubor:** `src/app/api/orders/[id]/route.ts`

#### mark-paid
- Nastaví status PAID + paidAt
- Volá `createSaleFromOrder()`
- **Kritický fix #1:** Při selhání `createSaleFromOrder` revertuje status na AWAITING_PAYMENT
- Odesílá payment received email

#### ship-packeta
- Volá `createPacket()` z `src/lib/packeta.ts`
- Nastaví SHIPPED + packetaPacketId + packetaBarcode
- Odesílá shipped email s Packeta tracking URL

#### ship-manual
- Nastaví SHIPPED + volitelný shippingTrackingId
- Odesílá shipped email

#### complete (přepsáno)
- 3 větve: existující sale → jen complete, retail → createSaleFromOrder, B2B → completeSale(SALON)

### 4. Email šablony (KROK 6)
**Soubor:** `src/lib/email-templates.ts`
- `getRetailOrderConfirmationEmail()` — potvrzení objednávky s položkami, dopravou, promo slevou, platebními údaji pro TRANSFER
- `getRetailOrderShippedEmail()` — oznámení o odeslání, tracking URL pro Packetu
- `getRetailPaymentReceivedEmail()` — potvrzení přijetí platby
- Všechny 3 šablony mají cs/uk/ru překlady

### 5. Email triggery
- `src/app/api/public/orders/route.ts` — odesílá potvrzovací email po vytvoření objednávky
- `src/app/api/comgate/callback/route.ts` — odesílá payment received email po úspěšné platbě kartou
- `src/app/api/orders/[id]/route.ts` — odesílá shipped/payment received emaily z admin akcí

### 6. QR SPAYD platba (KROK 5)
**Soubor:** `src/app/[locale]/(public)/checkout/CheckoutClient.tsx`
- QR kód SPAYD generován client-side pomocí `qrcode` knihovny
- Zobrazen v TRANSFER Thank You sekci CheckoutClient (varianta 1 z review #4)
- SPAYD formát: `SPD*1.0*ACC:IBAN*AM:X*CC:CZK*X-VS:VS`

### 7. Expire-reservations cron (KROK 7)
**Soubor:** `src/app/api/cron/expire-reservations/route.ts`
- Přidána expiry pro Order Reservation (model `Reservation` s `expiresAt`)
- Deaktivuje expired reservace (`active: false`)
- Zruší AWAITING_PAYMENT objednávky
- Invaliduje stock cache
- Notifikuje vlastníky
- **Kritický fix #2:** expiresAt JIŽ se nastavuje v `public/orders/route.ts` (CARD=30min, TRANSFER=48h) — potvrzeno v kódu

### 8. Frontend — OrdersClient.tsx
- B2B/Retail tab přepínač (jen pro OWNER/EMPLOYEE)
- Rozšířené statusy: AWAITING_PAYMENT, PAID, PROCESSING, DELIVERED
- Rozšířená tabulka: orderNumber, customer (salon/retail), totalAmount, payment, shipping, status

### 9. Frontend — OrderDetailClient.tsx
- Kontaktní údaje sekce (retail objednávky)
- Doprava sekce (Packeta point, tracking ID, barcode)
- Platba sekce (metoda, zaplaceno kdy, celkem)
- Nové akční tlačítka: mark-paid, ship-packeta, ship-manual, mark delivered
- Input pro tracking ID u manuálních zásilek
- Rozšířené statusy v STATUS_CONFIG

### 10. Překlady
- 30+ nových klíčů v `messages/cs.json`, `messages/uk.json`, `messages/ru.json`
- Klíče pro statusy, akce, sekce detailu, platební/dopravní metody

---

## Kritické opravy z review

1. **KP #1 (mark-paid revert):** Implementováno — při selhání createSaleFromOrder se status vrátí na AWAITING_PAYMENT
2. **KP #2 (expiresAt):** Potvrzeno — expiresAt se JIŽ nastavuje v public/orders/route.ts řádky 225-226
3. **Doporučení #4 (TRANSFER flow):** Zvolen varianta 1 — QR zůstává v CheckoutClient Thank You sekci

## TypeScript
`npx tsc --noEmit` — PASS, žádné chyby
