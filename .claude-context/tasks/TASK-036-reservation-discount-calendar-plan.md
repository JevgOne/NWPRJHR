# Rezervace — sleva + kalendář + všechny kombinace

**Task:** #36
**Datum:** 2026-07-20

---

## Současný stav

### Sleva u rezervací:
- **NewSaleWizard.tsx ř. 688-698:** `{!reserveMode && ( <DiscountForm ... /> )}` — DiscountForm je SKRYTÝ v reserveMode
- **NewReservationForm.tsx:** Žádná sleva — jen automatický B2B discount z `createProductReservation()`
- **reservations.ts ř. 61-68:** `createProductReservation()` aplikuje POUZE automatický B2B discount (salon/hairdresser), NEMÁ manuální slevu
- **Zod schema (validations/reservation.ts):** Žádná discount pole
- **ProductReservation model (schema.prisma ř. 1141-1187):** Žádná discount pole (discountAmount, discountPercent, discountType)
- **ReservationDetailClient.tsx:** Nezobrazuje slevu — jen lineTotal

### Kalendář:
- **NEEXISTUJE** — rezervace mají jen tabulkový list (ReservationsClient.tsx) s filtry a paginací
- GET `/api/reservations` vrací paginated list s `paymentDueDate`

### Kombinace:
- **Salon + rezervace:** Funguje (customerType=SALON, salonId, B2B auto-discount)
- **Retail + rezervace:** Funguje (customerType=RETAIL, retailPrice)
- **BY_PIECE + rezervace:** Funguje (sellingMode check v createProductReservation ř. 57-58)
- **BY_GRAM + rezervace:** Funguje
- **Salon + rezervace + MANUÁLNÍ sleva:** NEFUNGUJE (DiscountForm skrytý)
- **Retail + rezervace + MANUÁLNÍ sleva:** NEFUNGUJE (DiscountForm skrytý)

---

## Implementace

### Část A: Manuální sleva u rezervací

#### Krok A1: Schema — přidat discount pole do ProductReservation

**Soubor:** `prisma/schema.prisma`

Přidat do modelu ProductReservation (po `sellingMode`):

```prisma
  // Discount
  discountPercent   Int?              // basis points (1500 = 15%)
  discountAmount    Int?              // halere
  discountType      String?           // "STANDARD" | "MARKETING" | "PERSONAL"
  discountNote      String?           // counterPerformanceNote pro MARKETING
```

**POZNÁMKA:** Nepoužíváme relaci na Discount model (ten je navázaný na Sale). Rezervace ukládá discount inline — teprve při completion se vytvoří Discount na Sale.

Po změně: `npx prisma db push`

#### Krok A2: Zod schema — přidat discount

**Soubor:** `src/lib/validations/reservation.ts`

```ts
export const createReservationSchema = z.object({
  // ... existující pole
  discount: z.object({
    percent: z.number().int().min(100).max(10000),
    type: z.enum(["STANDARD", "MARKETING", "PERSONAL"]),
    counterPerformanceNote: z.string().max(500).optional(),
    bearerPartnerIds: z.array(z.string()).optional(),
  }).optional(),
});
```

#### Krok A3: reservations.ts — aplikovat manuální slevu

**Soubor:** `src/lib/reservations.ts`

**3.1 Rozšířit CreateReservationInput:**

```ts
export interface CreateReservationInput {
  // ... existující
  discount?: {
    percent: number;
    type: "STANDARD" | "MARKETING" | "PERSONAL";
    counterPerformanceNote?: string;
    bearerPartnerIds?: string[];
  };
}
```

**3.2 V createProductReservation(), po výpočtu lineTotal (ř. 90-93):**

```ts
// Apply manual discount (overrides B2B automatic discount display but keeps base price)
let discountAmount = 0;
if (input.discount && input.discount.percent > 0) {
  discountAmount = roundHalereUp((lineTotal * input.discount.percent) / 10000);
}
const finalLineTotal = roundHalereUp(lineTotal - discountAmount);
```

**3.3 V prisma.productReservation.create (ř. 102-122):**

```ts
data: {
  // ... existující
  lineTotal: finalLineTotal,
  discountPercent: input.discount?.percent ?? null,
  discountAmount: discountAmount || null,
  discountType: input.discount?.type ?? null,
  discountNote: input.discount?.counterPerformanceNote ?? null,
},
```

**DŮLEŽITÉ:** `pricePerUnit` zůstává PŘED manuální slevou (obsahuje jen B2B discount). Manuální sleva se aplikuje na celkovou částku (`lineTotal`). Toto je konzistentní s tím jak funguje sleva v sales (subtotal → discountAmount → totalAmount).

#### Krok A4: NewSaleWizard — zobrazit DiscountForm i v reserveMode

**Soubor:** `src/app/(app)/sales/new/NewSaleWizard.tsx`

**Změna ř. 688-698:**

```tsx
// BYLO:
{!reserveMode && (
  <Card>
    <DiscountForm ... />
  </Card>
)}

// NOVÉ:
<Card>
  <DiscountForm
    discount={discount}
    onChange={setDiscount}
    subtotal={subtotal}
    isOwner={isOwner}
  />
</Card>
```

Prostě odstraníme `{!reserveMode && ( ... )}` wrapper.

**Změna v handleSubmit (ř. 381-414) — poslat discount do API:**

```ts
if (reserveMode) {
  const item = items[0];
  const body = {
    customerType,
    salonId: salonId ?? undefined,
    customerId: customerId ?? undefined,
    variantId: item.variantId,
    grams: item.sellByGrams ? item.grams : (item.sellingMode === "BY_PIECE" ? 0 : item.grams),
    pieces: item.sellByGrams ? 0 : item.pieces,
    paymentDueDate,
    note: reservationNote || undefined,
    discount: discount          // NOVÉ
      ? {
          percent: discount.percent,
          type: discount.type,
          counterPerformanceNote: discount.counterPerformanceNote || undefined,
          bearerPartnerIds:
            discount.bearerPartnerIds.length > 0
              ? discount.bearerPartnerIds
              : undefined,
        }
      : undefined,
  };
  // ... rest unchanged
}
```

**Summary sekce (ř. 783-805):** Discount se UŽ zobrazuje správně protože `discountAmount` se počítá z `discount.percent` a `subtotal` (ř. 105-108) — funguje v obou módech.

#### Krok A5: Reservation complete — předat discount do Sale

**Soubor:** `src/app/api/reservations/[id]/route.ts`

V `case "complete":` (ř. 100-167), přidat discount do completeSale:

```ts
const sale = await completeSale(
  {
    customerType: res.customerType,
    salonId: res.salonId ?? undefined,
    customerId: res.customerId ?? undefined,
    items: [
      {
        variantId: res.variantId,
        grams: res.grams,
        pieces: res.pieces,
      },
    ],
    note: `Reservation ${res.reservationNumber}`,
    // NOVÉ — předat discount pokud existuje
    discount: res.discountPercent
      ? {
          percent: res.discountPercent,
          type: (res.discountType ?? "STANDARD") as "STANDARD" | "MARKETING" | "PERSONAL",
          counterPerformanceNote: res.discountNote ?? undefined,
        }
      : undefined,
  },
  session.user.id
);
```

**POZNÁMKA:** `bearerPartnerIds` se při completion NEPŘEDÁVAJÍ — ty se ukládají jen informativně v rezervaci. Pokud je třeba je zachovat, musí se přidat i `bearerPartnerIds` pole do ProductReservation modelu (JSON string). Pro MVP to není nutné.

#### Krok A6: ReservationDetailClient — zobrazit slevu

**Soubor:** `src/app/(app)/reservations/[id]/ReservationDetailClient.tsx`

**6.1 Rozšířit interface ReservationDetail:**

```ts
discountPercent?: number | null;
discountAmount?: number | null;
discountType?: string | null;
discountNote?: string | null;
```

**6.2 V product info tabulce (ř. 198-205), přidat řádek slevy:**

Mezi `</tbody>` a footer `<div>`, pokud `reservation.discountAmount > 0`:

```tsx
{reservation.discountAmount && reservation.discountAmount > 0 && (
  <div className="px-4 py-2 border-t border-line flex justify-between items-center text-sm">
    <span className="text-muted">
      {t("discount")} ({(reservation.discountPercent ?? 0) / 100}%)
    </span>
    <span className="text-red-600 font-medium">
      -{formatCZK(reservation.discountAmount)} CZK
    </span>
  </div>
)}
```

#### Krok A7: ReservationsClient — zobrazit slevu v tabulce (volitelné)

Toto je volitelné — sleva se zobrazí v detailu. V tabulce stačí `lineTotal` (který už je po slevě).

---

### Část B: Kalendář rezervací

#### Krok B1: API — kalendářní endpoint

**Soubor:** `src/app/api/reservations/route.ts`

Rozšířit GET o `view=calendar` query param:

```ts
const view = sp.get("view"); // "list" (default) | "calendar"

if (view === "calendar") {
  const from = sp.get("from"); // ISO date
  const to = sp.get("to");     // ISO date
  
  if (!from || !to) {
    return NextResponse.json({ error: "from and to required for calendar view" }, { status: 400 });
  }

  const calendarWhere: any = {
    ...where, // zachovat salon filter pro B2B
    paymentDueDate: {
      gte: new Date(from),
      lte: new Date(to),
    },
  };

  const reservations = await prisma.productReservation.findMany({
    where: calendarWhere,
    orderBy: { paymentDueDate: "asc" },
    select: {
      id: true,
      reservationNumber: true,
      status: true,
      paymentDueDate: true,
      lineTotal: true,
      grams: true,
      pieces: true,
      sellingMode: true,
      contactName: true,
      variant: {
        select: {
          color: true,
          lengthCm: true,
          product: { select: { name: true } },
        },
      },
      salon: { select: { name: true } },
      customer: { select: { name: true } },
    },
  });

  return NextResponse.json({ data: reservations });
}
```

#### Krok B2: Kalendářní komponenta

**Soubor:** `src/app/(app)/reservations/ReservationsCalendar.tsx` (NOVÝ soubor)

Měsíční kalendář:
- Mřížka 7x5 (Po-Ne × 4-5 týdnů)
- Každý den zobrazí barevné tečky/čipy rezervací
- Barvy podle statusu: PENDING=amber, PAID=green, EXPIRED=red, CANCELLED=gray, COMPLETED=emerald
- Klik na den → rozbalí list rezervací pro daný den
- Navigace měsíců (< měsíc >)
- Dnes zvýrazněn

**Datová struktura:**
```ts
interface CalendarReservation {
  id: string;
  reservationNumber?: string;
  status: string;
  paymentDueDate: string;
  lineTotal: number;
  grams: number;
  pieces: number;
  sellingMode: string;
  contactName?: string | null;
  variant: {
    color: string;
    lengthCm: number;
    product: { name: string };
  };
  salon?: { name: true } | null;
  customer?: { name: true } | null;
}
```

**UI layout:**
```
┌─────────────────────────────────────────┐
│  < Červenec 2026 >     [Seznam] [Kalendář] │
├─────┬─────┬─────┬─────┬─────┬─────┬─────┤
│ Po  │ Út  │ St  │ Čt  │ Pá  │ So  │ Ne  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│     │     │ 1   │ 2   │ 3   │ 4   │ 5   │
│     │     │     │ 🟡  │     │     │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 6   │ 7   │ 8   │ 9   │ 10  │ 11  │ 12  │
│     │ 🟢🔴│     │     │ 🟡  │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

Klik na 7. → rozbalí:
┌────────────────────────────────┐
│ 7. 7. 2026                     │
│ ● RES-20260707-001 — PAID     │
│   Salon Krása, Virgin 60cm    │
│   150g — 12 500 CZK           │
│ ● RES-20260707-002 — EXPIRED  │
│   Jan Novák, Luxe 40cm        │
│   80g — 6 400 CZK             │
└────────────────────────────────┘
```

**Implementace:** Čistý React, žádná knihovna. Měsíční mřížka se generuje z Date API.

#### Krok B3: ReservationsClient — přidat přepínač seznam/kalendář

**Soubor:** `src/app/(app)/reservations/ReservationsClient.tsx`

Přidat toggle nad filtry:

```tsx
const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

// V header:
<div className="flex gap-2">
  <button
    className={viewMode === "list" ? "active" : ""}
    onClick={() => setViewMode("list")}
  >
    {t("listView")}
  </button>
  <button
    className={viewMode === "calendar" ? "active" : ""}
    onClick={() => setViewMode("calendar")}
  >
    {t("calendarView")}
  </button>
</div>

// Pod filtry:
{viewMode === "list" ? (
  // stávající tabulka
) : (
  <ReservationsCalendar />
)}
```

---

### Část C: Překlady

**Soubory:** `messages/cs.json`, `messages/uk.json`, `messages/ru.json`

**Nové klíče v `reservation`:**

```json
{
  "discount": "Sleva",
  "listView": "Seznam",
  "calendarView": "Kalendář",
  "calendarTitle": "Kalendář rezervací",
  "today": "Dnes",
  "noReservationsDay": "Žádné rezervace"
}
```

---

## Pořadí implementace

1. **A1** — Schema (prisma db push) — PRVNÍ, všechno závisí na novém sloupci
2. **A2** — Zod schema — nezávislé na UI
3. **A3** — reservations.ts — business logika
4. **A4** — NewSaleWizard — UI (odstraníme !reserveMode wrapper)
5. **A5** — Reservation complete → Sale s discountem
6. **A6** — ReservationDetailClient — zobrazení slevy
7. **B1** — API calendar endpoint
8. **B2** — ReservationsCalendar komponenta (NOVÝ soubor)
9. **B3** — ReservationsClient toggle
10. **C** — Překlady

## Odhad rozsahu

- **Schema:** 4 nové sloupce v ProductReservation
- **Změněné soubory:** 6 (schema, validation, reservations.ts, NewSaleWizard, reservations/[id]/route, ReservationDetail, ReservationsClient, reservations/route)
- **Nový soubor:** 1 (ReservationsCalendar.tsx)
- **Překlady:** ~6 nových klíčů × 3 jazyky

## Matice kombinací (po implementaci)

| Kombinace | Stav | Jak funguje |
|-----------|------|-------------|
| Salon + rezervace | OK | B2B auto-discount + volitelná manuální sleva |
| Retail + rezervace | OK | Retail cena + volitelná manuální sleva |
| BY_PIECE + rezervace | OK | pricePerPiece × pieces |
| BY_GRAM + rezervace | OK | pricePerGram × grams |
| Salon + rezervace + sleva | **NOVÉ** | B2B cena, pak manuální sleva na lineTotal |
| Retail + rezervace + sleva | **NOVÉ** | Retail cena, pak manuální sleva na lineTotal |
| Completion → Sale s discountem | **NOVÉ** | discount se přenese do completeSale() |
