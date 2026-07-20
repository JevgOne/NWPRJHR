# QA Report — TASK-082: Rezervační systém s platbou

**Datum:** 2026-07-16
**Kontrolor:** QA Agent
**Build:** PASS
**TypeScript:** PASS (0 chyb)

---

## 1. SIMPLIFY — Zbytečná složitost? Duplikace?

### Pozitivní nálezy:
- `reservations.ts` je dobře strukturovaná, každá funkce má jednu odpovědnost
- `generateReservationNumber()` je čistá, bez zbytečné složitosti
- Cenová logika v `createProductReservation()` opakuje pattern ze sales — přijatelné, není zbytečná abstrakcexistence jen pro rezervace
- `expireOverdueReservations()` — dvě DB volání (findMany + updateMany) místo jednoho updateMany. Lze optimalizovat na přímý updateMany bez findMany, ale výkon není kritický pro rezervace.

### Problémy nalezeny:

**[MINOR] Hardcoded CZ strings v UI komponentách:**
- `ReservationDetailClient.tsx:224` — `"Zákazník"` / `"Customer"` rozhoduje pomocí `tCommon("all") === "Vše"` — špatný pattern pro i18n, křehké
- `ReservationDetailClient.tsx:233,275,313` — stejný anti-pattern pro "Interní poznámka", "Opravdu zrušit?", "Vytvořil"
- `ReservationsClient.tsx:136` — stejný pattern pro header "Zákazník"/"Customer"
- **Doporučení:** Přidat tyto stringy do `messages/*.json`, nebo alespoň do `reservation` namespace

**[MINOR] `NewReservationForm.tsx:229` — label `contactInfo` použit jako label pro pole `note`:**
```tsx
<Input
  label={t("contactInfo")}  // ← "Kontaktní údaje" použito jako label pro Note pole
  placeholder={contactName || ""}
  value={note}
  onChange={(e) => setNote(e.target.value)}
/>
```
Pole se jmenuje `note` ale má label `contactInfo` — matoucí pro uživatele.

**[MINOR] `expireOverdueReservations()` — zbytečné dvě DB volání:**
```ts
// Lze zjednodušit na jeden updateMany:
const result = await prisma.productReservation.updateMany({
  where: { status: "PENDING", paymentDueDate: { lt: now } },
  data: { status: "EXPIRED" },
});
return result.count;
```
Momentální implementace dělá findMany a pak updateMany, ale potřebuje count — OK jako je, ale findMany je nadbytečné.

---

## 2. DEBUG — Build a TypeScript

### `npx tsc --noEmit`
**PASS** — žádné TypeScript chyby

### `npx next build`
**PASS** — build prosel bez chyb

Všechny 3 routes jsou přítomny ve výstupu buildu:
- `ƒ /reservations`
- `ƒ /reservations/[id]`
- `ƒ /reservations/new`

---

## 3. REVERZNÍ KONTROLA — Odpovídá implementace plánu?

### Phase 1: DB Model ✅
- `ProductReservation` model existuje v `prisma/schema.prisma` (řádky 1081-1127)
- `ProductReservationStatus` enum: PENDING, PAID, COMPLETED, EXPIRED, CANCELLED ✅
- Relace na Variant, Salon, Customer, User (reservationsCreated) ✅
- NotificationType enum rozšířen: RESERVATION_CREATED, RESERVATION_PAID, RESERVATION_EXPIRED ✅
- Všechny indexy přítomny ✅

**CHYBÍ:** Relace `productReservation` na modelu `Sale` (plán řádek 113: "Add to Sale: `productReservation ProductReservation?`"). Model Sale `saleId` je v ProductReservation, ale zpětná relace na Sale chybí. Funkcionálně to nevadí (saleId je v product_reservations), ale plán to explicitně požadoval.

**CHYBÍ:** Relace na modelu `Invoice` (plán řádek: "invoice relation added on Invoice model"). `invoiceId` je v ProductReservation ale zpětná relace na Invoice není přidána.

### Phase 2: Business Logic ✅
- `createProductReservation()` ✅ — validace varianty, B2B slevy, reservationNumber, paymentDueDate +3 dny
- `markReservationPaid()` ✅
- `completeReservation()` ✅
- `cancelReservation()` ✅
- `expireOverdueReservations()` ✅

**CHYBÍ:** Plán uvádí `cancelReservation` má "If invoice was created, cancel the invoice". Implementace toto nedělá — pouze mění status na CANCELLED. Pro aktuální stav (invoiceId se nepoužívá) je to přijatelné.

**CHYBÍ:** Notifikace v `markReservationPaid()` a `expireOverdueReservations()` — plán říká "Sends notification". V `markReservationPaid()` notifikace není, je jen v API route (OK pattern). V `expireOverdueReservations()` taky není — notifikace je v cron route (OK).

### Phase 3: API Routes ✅
- `GET /api/reservations` — list s filtry, pagination, role-based access ✅
- `POST /api/reservations` — vytvoření, auth, validace Zod ✅
- `GET /api/reservations/[id]` — detail, role-based access ✅
- `POST /api/reservations/[id]` — akce: mark_paid, complete, cancel, update ✅
- Audit log pro všechny akce ✅

**POZOROVÁNÍ:** Akce `complete` vytváří Sale pomocí `completeSale()` a pak `createInvoiceFromSale()`. Invoice creation je wrapped v try/catch jako optional — OK. Ale `companyId` pro fakturu přichází z request body bez validace — pokud `body.companyId` není poskytnuto, fakturu nevytvoří (catch blok). Přijatelné.

### Phase 4: Admin UI ✅
- `reservations/page.tsx` — server component, auth check ✅
- `reservations/ReservationsClient.tsx` — status filtry, tabulka, pagination ✅
- `reservations/new/page.tsx` — server component, redirect pro SALON/HAIRDRESSER ✅
- `reservations/new/NewReservationForm.tsx` — CustomerSelect, product picker, quantity, deadline, price preview ✅
- `reservations/[id]/page.tsx` — server component ✅
- `reservations/[id]/ReservationDetailClient.tsx` — status banner, akce, sale link ✅

**CHYBÍ:** `reservations/loading.tsx` — plán ho vyžadoval, soubor existuje (globem ověřeno: `loading.tsx` je v adresáři).

**CHYBÍ v UI:** Akce "update" na detail stránce není vystavena v UI (je jen v API). Plán ji nezmiňuje explicitně pro UI, takže OK.

**DETAIL PROBLEM:** `ReservationDetailClient.tsx` — při akci `doAction("complete")` se po úspěchu jen znovu načte rezervace (status = COMPLETED), ale uživatel nedostane informaci o nově vytvořeném prodeji ani invoice. Prodej link se zobrazí pouze pokud `reservation.saleId` je nastaveno — to závisí na tom jestli se znovu načtená data obsahují `saleId`. Mělo by fungovat správně po reload.

### Phase 5: Navigace ✅
- `AppShell.tsx` — `/reservations` přidáno do groupSales sekce ✅
- `messages/cs.json` — `nav.reservations` + `reservation` sekce kompletní ✅
- `messages/uk.json` — přítomno ✅
- `messages/ru.json` — přítomno ✅

### Phase 6: Cron ✅
- `src/app/api/cron/expire-reservations/route.ts` ✅
- Autorizace přes `x-cron-secret` header ✅
- Notifikace při expiraci ✅

---

## Souhrn problémů

| # | Závažnost | Popis | Soubor |
|---|-----------|-------|--------|
| 1 | MINOR | i18n anti-pattern — stringy rozhodovány přes `tCommon("all") === "Vše"` místo proper klíčů | ReservationDetailClient.tsx, ReservationsClient.tsx |
| 2 | MINOR | Pole `note` má label `contactInfo` — matoucí pro uživatele | NewReservationForm.tsx:229 |
| 3 | INFO | Zpětné relace Sale→ProductReservation a Invoice→ProductReservation chybí v schématu | schema.prisma |
| 4 | INFO | `expireOverdueReservations()` — zbytečný findMany, lze nahradit přímým updateMany | reservations.ts |
| 5 | INFO | `cancelReservation()` neruší invoice (plán to zmiňoval) | reservations.ts |

---

## Závěr

**Implementace je funkční a build/TypeScript prochází bez chyb.** Všechny klíčové požadavky uživatele jsou splněny:
- Rezervace fungují
- Musí se zaplatit (paymentDueDate, status PENDING→PAID)
- Expirace nepřijatých rezervací (cron)
- Konverze zaplacené rezervace na Sale

Kritické problémy: **0**
Minor problémy: **2** (i18n anti-pattern, špatný label pro note pole)
Info: **3** (chybějící zpětné relace v schema, optimalizace)

**Doporučení:** Lze nasadit. Minor problémy lze opravit v příštím průchodu.
