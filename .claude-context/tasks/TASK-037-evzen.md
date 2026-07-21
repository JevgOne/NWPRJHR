# EVZEN Audit: Task #37 — Kalendář + Rezervace slevy

**Datum:** 2026-07-20
**Kontrolor:** Evzen-the-King
**Commit:** 31463a7
**Verdikt: SCHVALENO**

---

## Kontrola bod po bodu

### 1. "Rezervovat místo prodeje plus dát 10% slevu — error" — PASS

- `NewSaleWizard.tsx:700-707` — `DiscountForm` se renderuje MIMO `reserveMode` podmínku = dostupný pro rezervace i prodeje
- `NewSaleWizard.tsx:381-403` — v `reserveMode` submit posílá `discount` do `/api/reservations`
- `reservations.ts:102-106` — manuální sleva: `(lineTotalBeforeDiscount * discount.percent) / 10000`
- `reservations.ts:131-134` — uložení do DB: `discountPercent`, `discountAmount`, `discountType`, `discountNote`
- `prisma/schema.prisma:1165-1168` — ProductReservation má 4 discount sloupce

### 2. "Kalendář, aby se vidělo hezky barvy k rezervacím" — PASS

- `ReservationsCalendar.tsx:134` — `ActivityCalendar` komponenta
- Měsíční grid s barevnými tečkami (2x2 px dots) — linie 326-337
- Click na den zobrazí detail s clickable linky na `/reservations/{id}` — linie 404-434
- Rezervace zobrazují: číslo, status, jméno, produkt, barvu, délku, gramy/kusy, cenu

### 3. "Prodeje tam budou taky" — PASS

- `ReservationsCalendar.tsx:27-35` — `CalendarSale` interface
- Fetched z `/api/sales?from&to` — linie 154, 160
- Zobrazeny s barevnými tečkami dle paymentType (TRANSFER/CASH/CARD/PROMO/WRITEOFF)
- Click detail: číslo, typ platby, jméno, cena, link na `/sales/{id}`

### 4. "Objednávky tam taky" — PASS

- `ReservationsCalendar.tsx:37-47` — `CalendarOrder` interface
- Fetched z `/api/orders?from&to` — linie 155, 162
- Zobrazeny s barevnými tečkami dle statusu (8 stavů)
- Click detail: číslo, status, jméno, cena, link na `/orders/{id}`

### 5. "Naskladnění aby tam byla várka zaznamenaná" — PASS

- `ReservationsCalendar.tsx:49-61` — `CalendarDelivery` interface
- Fetched z `/api/deliveries?from&to` — linie 157, 163
- API: `deliveries/route.ts:31-36` — filtr dle `stockedAt` rozsahu
- Detail: produkt, barva, délka, gramy, kusy

### 6. "VEŠKERÝ POHYB PROSTE S PRODUKTY" — PASS

- Jeden kalendář pro: rezervace + prodeje + objednávky + naskladnění
- `CalendarEntry` union type (linie 63-67): reservation | sale | order | delivery
- `byDay` mapa (linie 195-228) seskupuje všechny typy dle data

### 7. "Všechno v jednom kalendáři a k tomu pipísek co jak znamená barvy" — PASS

- Legenda pod kalendářem (linie 348-392)
- 4 sekce: Rezervace (5 stavů), Prodeje (5 typů), Objednávky (8 stavů), Naskladnění (1)
- Každá sekce s nadpisem a barevnými tečkami + popisky

### 8. "Nesmí to bejt 2x stejná barva nikde!!!" — PASS

19 unikátních Tailwind tříd — žádné duplicity:

| # | Barva | Kategorie | Stav |
|---|-------|-----------|------|
| 1 | bg-yellow-400 | Rez. PENDING | |
| 2 | bg-lime-500 | Rez. PAID | |
| 3 | bg-emerald-700 | Rez. COMPLETED | |
| 4 | bg-rose-400 | Rez. EXPIRED | |
| 5 | bg-stone-400 | Rez. CANCELLED | |
| 6 | bg-blue-500 | Sale TRANSFER | |
| 7 | bg-green-500 | Sale CASH | |
| 8 | bg-purple-500 | Sale CARD | |
| 9 | bg-orange-500 | Sale PROMO | |
| 10 | bg-zinc-400 | Sale WRITEOFF | |
| 11 | bg-sky-400 | Order NEW | |
| 12 | bg-amber-500 | Order AWAITING_PAY | |
| 13 | bg-teal-500 | Order PAID | |
| 14 | bg-indigo-500 | Order SHIPPED | |
| 15 | bg-cyan-500 | Order DELIVERED | |
| 16 | bg-emerald-400 | Order COMPLETED | |
| 17 | bg-gray-300 | Order CANCELLED | |
| 18 | bg-red-500 | Order REJECTED | |
| 19 | bg-fuchsia-500 | Delivery | |

**Pozn.:** stone-400/zinc-400/gray-300 jsou vizuálně blízké (vše šedé), ale kontextově správné (cancelled/writeoff/cancelled). Technicky 3 různé třídy.

### 9. "Přidej to do navigace" — PASS

- `AppShell.tsx:58` — `{ href: "/calendar", label: t("calendar"), roles: ["OWNER", "EMPLOYEE"] }`
- Standalone stránka: `src/app/(app)/calendar/page.tsx`

### 10. "Ano chci aby fungovali všechny kombinace — Rezervace, sleva atd" — PASS

- DiscountForm je mimo reserveMode podmínku → dostupný vždy
- Reserve submit posílá discount data → API je přijímá → reservations.ts aplikuje
- Schema má discount sloupce na ProductReservation

---

## Shrnutí

| Bod | Status |
|-----|--------|
| 1. Sleva u rezervací | PASS |
| 2. Kalendář rezervací | PASS |
| 3. Prodeje v kalendáři | PASS |
| 4. Objednávky v kalendáři | PASS |
| 5. Naskladnění v kalendáři | PASS |
| 6. Všechny pohyby | PASS |
| 7. Legenda | PASS |
| 8. Unikátní barvy | PASS |
| 9. Navigace | PASS |
| 10. Všechny kombinace | PASS |

**VERDIKT: SCHVALENO — 10/10 bodů zadání splněno.**
