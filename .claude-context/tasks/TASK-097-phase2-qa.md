# QA Report — TASK-097 Phase 2
**Commit:** f51b752  
**Datum:** 2026-07-20  
**Reviewer:** kontrolor

## Rozsah QA

1. Tvůrce v kalendáři (creator/createdBy)
2. Týdenní pohled (week view)
3. Sloupec slevy v rezervacích

---

## 1. Tvůrce v kalendáři

### Schema (prisma/schema.prisma)
- `Delivery.createdByUserId String?` + `createdByUser User? @relation("DeliveriesCreated", ...)` — line 337-338 ✓
- `ProductReservation.createdByUserId String` + `createdByUser User @relation("ReservationsCreated", ...)` — line 1184-1185 ✓

### stock-in.ts (src/lib/stock-in.ts)
- `createdByUserId: userId` nastaveno při `tx.delivery.create()` — line 63 ✓

### API: src/app/api/reservations/route.ts
- Calendar select (view === "calendar") zahrnuje `createdByUser: { select: { name: true } }` — lines 72-73 ✓
- List (non-calendar) `include` neobsahuje `createdByUser` — výchozí správně, ReservationsClient.tsx ho nepotřebuje ✓

### API: src/app/api/deliveries/route.ts
- `include: { createdByUser: { select: { name: true } } }` — line 43-44 ✓

### delivery-serializer.ts (src/lib/api/delivery-serializer.ts)
- `DeliveryWithRelations` typ má `createdByUser?: { name: string | null } | null` — line 6 ✓
- `base` objekt serializuje `createdByName: delivery.createdByUser?.name ?? null` — line 28 ✓
- Dostupné pro OWNER i EMPLOYEE (v `base`), NULL pro SALON ✓

### sale-serializer.ts (src/lib/api/sale-serializer.ts)
- `SaleWithRelations` typ má `user: { id: string; name: string | null; email: string | null; role: Role }` — line 15 ✓
- `base` objekt serializuje `userName: sale.user.name` — line 69 ✓
- Dostupné pro OWNER i EMPLOYEE (přes `base`), SALON dostane jen minimální data (bez userName) ✓

### ReservationsCalendar.tsx — interface typy
- `CalendarReservation.createdByUser?: { name: string | null } | null` ✓
- `CalendarSale.userName?: string | null` ✓
- `CalendarDelivery.createdByName?: string | null` ✓
- `CalendarOrder` — nemá dedikované pole tvůrce, zobrazuje `contactName` (záměrně, objednávky jsou anonymní/B2B) ✓

### Detail panel v kalendáři
- Rezervace: `{tCal("createdBy")}: {r.createdByUser.name}` ✓
- Prodej: `{tCal("createdBy")}: {s.userName}` ✓
- Naskladnění: `{tCal("stockedBy")}: {dl.createdByName}` ✓
- Objednávka: `{tCal("orderedBy")}: {o.contactName}` ✓

### Překlady (messages/cs.json, uk.json, ru.json) — line 2984-2986
- `createdBy`: "Vytvořil/a" / "Створив/ла" / "Создал(а)" ✓
- `orderedBy`: "Objednal/a" / "Замовив/ла" / "Заказал(а)" ✓
- `stockedBy`: "Naskladnil/a" / "Оприбуткував/ла" / "Оприходовал(а)" ✓

**Verdict sekce 1: PASS**

---

## 2. Týdenní pohled (Week View)

### ReservationsCalendar.tsx
- State `viewMode: "month" | "week"` ✓
- `currentWeekStart` — pondělí výpočet `(dow + 6) % 7` ✓
- `from`/`to` useMemo adaptuje se na viewMode ✓
- `byDayWeek` useMemo s klíčem `${year}-${month}-${day}` ✓
- `WeekDayEntry` komponenta: `<Link>` s tečkou + emoji + label + amount ✓
- 7-sloupcový grid s hlavičkami `DAY_NAMES[adjusted]` + datum ✓
- Toggle tlačítka `tCal("month")` / `tCal("week")` ✓
- Navigace prevWeek/nextWeek ±7 dní ✓
- Týdenní label formát: `dd.mm. — dd.mm.yyyy` ✓

**Verdict sekce 2: PASS**

---

## 3. Sloupec slevy v rezervacích

### Interface ReservationRow (ReservationsClient.tsx)
- `discountPercent?: number | null` — line 21 ✓
- `discountAmount?: number | null` — line 22 ✓

### JSX (ReservationsClient.tsx, lines 135-144 a 176-183)
- Sloupec hlavička: `{t("discount")}` v `<th>` ✓
- Zobrazení: `{r.discountAmount && r.discountAmount > 0 ? <span className="text-red-600">-{formatCZK(r.discountAmount)} ({(r.discountPercent ?? 0) / 100}%)</span> : "—"}` ✓
- Červené zobrazení při slevě, jinak `—` ✓
- Procento děleno 100 (basispoints → %) ✓
- Částka přes `formatCZK()` (halere → CZK) ✓

### API (reservations/route.ts)
- Non-calendar select přes Prisma `include` — automaticky zahrnuje `discountPercent`, `discountAmount` z modelu ✓

**Verdict sekce 3: PASS**

---

## Celkový verdikt: PASS

Všechny tři oblasti fáze 2 jsou implementovány správně:
- Tvůrce je dohledán přes správné DB relace a serializován ve všech relevantních serializérech
- Týdenní pohled má kompletní implementaci (state, výpočty, grid, navigace, překlady)
- Sloupec slevy správně zobrazuje červeně částku + procento, nebo `—`

Žádné chyby ani nesrovnalosti nenalezeny.
