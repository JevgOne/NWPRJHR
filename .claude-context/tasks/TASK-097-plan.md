# Kalendář a rezervace — 6 vylepšení

**Task:** #97
**Datum:** 2026-07-20
**Hlavní soubor:** `src/app/(app)/reservations/ReservationsCalendar.tsx` (export `ActivityCalendar`)

---

## Současný stav kalendáře

ActivityCalendar (531 řádků) je kompletní měsíční pohled s:
- 4 typy záznamů: rezervace, prodeje, objednávky, naskladnění
- Barevné tečky podle statusu/typu platby
- Klik na den → detail panel s list entries
- Legenda barev
- Navigace měsíců (< >)
- Fetch ze 4 API: `/api/reservations`, `/api/sales`, `/api/orders`, `/api/deliveries`

**Detail panel (ř. 395-528):** Rezervace a objednávky UŽ mají `<Link>` na detail. Prodeje UŽ mají `<Link>`. Naskladnění je `<div>` bez linku.

---

## Implementace bod po bodu

### 1. Platební brána — příprava infrastruktury

**Kontext:** Systém UŽ má Comgate integraci pro e-shop objednávky:
- `src/lib/comgate.ts` — createPayment, getPaymentStatus, refundPayment, cancelPayment
- `src/app/api/comgate/callback/route.ts` — webhook pro Order (PAID → createSaleFromOrder)
- `src/app/api/public/orders/route.ts` — CARD → createPayment → redirect

**Pro rezervace zatím platba neexistuje.** Rezervace mají stav PENDING → ruční mark_paid.

**Příprava pro generický payment gateway:**

**Krok 1.1: Abstrakce payment provideru**

**Soubor:** `src/lib/payment-gateway.ts` (NOVÝ)

```ts
export interface PaymentProvider {
  createPayment(params: {
    amount: number;       // halere
    label: string;
    refId: string;        // variable symbol
    email: string;
    name?: string;
    lang?: string;
  }): Promise<{ success: boolean; transId?: string; redirect?: string; error?: string }>;
  
  getStatus(transId: string): Promise<{ success: boolean; status?: "PENDING" | "PAID" | "CANCELLED" }>;
  
  parseCallback(request: Request): Promise<{ transId: string; status: string } | null>;
}

// Factory — vrátí provider podle konfigurace
export function getPaymentProvider(): PaymentProvider {
  // Zatím vrací Comgate wrapper
  return comgateProvider;
}
```

**Krok 1.2: Comgate wrapper**

V tom samém souboru — wrap existujících Comgate funkcí do PaymentProvider interface:

```ts
import { createPayment, getPaymentStatus } from "./comgate";

const comgateProvider: PaymentProvider = {
  async createPayment(params) {
    return createPayment({
      price: params.amount,
      label: params.label,
      refId: params.refId,
      email: params.email,
      fullName: params.name,
      lang: params.lang,
    });
  },
  async getStatus(transId) {
    const result = await getPaymentStatus(transId);
    return { success: result.success, status: result.status as any };
  },
  async parseCallback(request) {
    const formData = await request.formData();
    const transId = formData.get("transId") as string;
    const status = formData.get("status") as string;
    if (!transId || !status) return null;
    return { transId, status };
  },
};
```

**Krok 1.3: Webhook endpoint pro rezervace**

**Soubor:** `src/app/api/payment/callback/route.ts` (NOVÝ)

Generický callback endpoint — zpracuje platbu a aktualizuje:
- Order (existující flow — zatím nechat v comgate/callback)
- ProductReservation (NOVÉ — pokud refId začíná "RES-")

```ts
export async function POST(request: NextRequest) {
  const provider = getPaymentProvider();
  const callback = await provider.parseCallback(request.clone());
  if (!callback) return new NextResponse("Missing params", { status: 400 });
  
  const verified = await provider.getStatus(callback.transId);
  if (!verified.success) return new NextResponse("Verify failed", { status: 500 });
  
  // Dispatch based on entity type
  // ... lookup by transId in orders, reservations
}
```

**POZNÁMKA:** Toto je jen příprava. Konkrétní provider (Stripe, GoPay, etc.) se přidá zítra. Existující Comgate callback pro objednávky NEMIGROVAT — nechat fungovat.

**Krok 1.4: Schema příprava**

Přidat do ProductReservation (pokud ještě není):
```prisma
  comgateTransId    String?           @unique
```

---

### 2. Klik na den → detail navigace

**Soubor:** `src/app/(app)/reservations/ReservationsCalendar.tsx`

**Stav:** Rezervace, prodeje, objednávky UŽ mají `<Link>` na detail stránky. Pouze naskladnění (delivery) je `<div>` bez navigace.

**Změna ř. 469-494:** Změnit `<div>` na `<Link>` s `href={/inventory/deliveries/${dl.id}}`:

```tsx
// BYLO (ř. 471):
<div
  key={`d-${dl.id}`}
  className="flex items-start gap-2 py-1.5 px-2 -mx-2"
>

// NOVÉ:
<Link
  key={`d-${dl.id}`}
  href={`/inventory/deliveries/${dl.id}`}
  className="flex items-start gap-2 py-1.5 hover:bg-nude-50 rounded-lg px-2 -mx-2 transition-colors"
>
```

A uzavírací tag `</div>` → `</Link>`.

**Ověřit:** Existuje stránka `/inventory/deliveries/[id]`? Pokud ne, linkovat na `/inventory` s query param.

**Stav deliveries stránky:**
- `src/app/(app)/inventory/deliveries/[id]/page.tsx` — EXISTUJE

Takže link na `/inventory/deliveries/${dl.id}` je správný.

---

### 3. Filtr v kalendáři — checkboxy nad mřížkou

**Soubor:** `src/app/(app)/reservations/ReservationsCalendar.tsx`

**Krok 3.1: State pro filtry:**

```ts
const [filters, setFilters] = useState({
  reservations: true,
  sales: true,
  orders: true,
  deliveries: true,
});

// Persist do localStorage
useEffect(() => {
  const saved = localStorage.getItem("calendar-filters");
  if (saved) {
    try { setFilters(JSON.parse(saved)); } catch {}
  }
}, []);
useEffect(() => {
  localStorage.setItem("calendar-filters", JSON.stringify(filters));
}, [filters]);
```

**Krok 3.2: UI — checkbox řada nad měsíční navigací:**

```tsx
<div className="flex flex-wrap gap-3 mb-3">
  {([
    { key: "reservations", label: tCal("reservation"), color: "bg-amber-50 text-amber-700 border-amber-200" },
    { key: "sales", label: tCal("sales"), color: "bg-blue-50 text-blue-700 border-blue-200" },
    { key: "orders", label: tCal("orders"), color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    { key: "deliveries", label: tCal("deliveries"), color: "bg-teal-50 text-teal-700 border-teal-200" },
  ] as const).map(({ key, label, color }) => (
    <label
      key={key}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
        filters[key] ? color : "bg-nude-50 text-muted border-line opacity-50"
      }`}
    >
      <input
        type="checkbox"
        checked={filters[key]}
        onChange={(e) => setFilters(f => ({ ...f, [key]: e.target.checked }))}
        className="w-3.5 h-3.5 rounded"
      />
      {label}
    </label>
  ))}
</div>
```

**Krok 3.3: Filtrovat byDay:**

V `useMemo` pro `byDay` (ř. 195-228), přidat podmínky:

```ts
if (filters.reservations) {
  for (const r of reservations) { ... }
}
if (filters.sales) {
  for (const s of sales) { ... }
}
if (filters.orders) {
  for (const o of orders) { ... }
}
if (filters.deliveries) {
  for (const dl of deliveries) { ... }
}
```

A přidat `filters` do dependency array.

**Krok 3.4: Skrýt legendu filtrovaných typů:**

V legend sekci (ř. 349-392), wrappovat každý blok podmínkou `{filters.reservations && ( ... )}`.

---

### 4. Vizuálně blízké šedé barvy

**Problém:** Tyto barvy jsou vizuálně téměř totožné:
- `bg-stone-400` (reservation CANCELLED)
- `bg-zinc-400` (sale WRITEOFF)
- `bg-gray-300` (order CANCELLED)

**Řešení — odlišit tvarem + barvou:**

**4.1 Změnit barvy:**

```ts
// BYLO:
RESERVATION_DOT.CANCELLED = "bg-stone-400"
SALE_DOT.WRITEOFF = "bg-zinc-400"
ORDER_DOT.CANCELLED = "bg-gray-300"

// NOVÉ:
RESERVATION_DOT.CANCELLED = "bg-stone-400"      // zachovat — canceled reservation
SALE_DOT.WRITEOFF = "bg-amber-300"               // změnit na teplou barvu — odpis je jiný než cancel
ORDER_DOT.CANCELLED = "bg-red-300"               // změnit na světle červenou — zrušená objednávka
```

**4.2 Přidat vizuální odlišení v detail panelu:**

Pro CANCELLED/EXPIRED/WRITEOFF záznamy přidat přeškrtnutý text:

```tsx
// V detail rendering, přidat className pro cancelled:
const isCancelled = entry.kind === "reservation" && entry.data.status === "CANCELLED"
  || entry.kind === "order" && entry.data.status === "CANCELLED"
  || entry.kind === "sale" && entry.data.paymentType === "WRITEOFF";

// Na wrapper Link/div přidat: className={`... ${isCancelled ? "opacity-50" : ""}`}
```

**4.3 Aktualizovat text barvy:**

```ts
SALE_TEXT.WRITEOFF = "text-amber-600"    // místo text-zinc-500
ORDER_TEXT.CANCELLED = "text-red-400"    // místo text-gray-400
```

---

### 5. Týdenní pohled

**Soubor:** `src/app/(app)/reservations/ReservationsCalendar.tsx`

**Krok 5.1: State pro view mode:**

```ts
const [viewMode, setViewMode] = useState<"month" | "week">("month");
const [currentWeekStart, setCurrentWeekStart] = useState(() => {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dow + 6) % 7)); // Monday
  monday.setHours(0, 0, 0, 0);
  return monday;
});
```

**Krok 5.2: Toggle UI:**

Přidat vedle měsíční navigace:

```tsx
<div className="flex gap-1 bg-nude-50 rounded-lg p-0.5">
  <button
    onClick={() => setViewMode("month")}
    className={`px-3 py-1 rounded-md text-xs font-medium ${
      viewMode === "month" ? "bg-white shadow-sm text-ink" : "text-muted"
    }`}
  >
    {tCal("month")}
  </button>
  <button
    onClick={() => setViewMode("week")}
    className={`px-3 py-1 rounded-md text-xs font-medium ${
      viewMode === "week" ? "bg-white shadow-sm text-ink" : "text-muted"
    }`}
  >
    {tCal("week")}
  </button>
</div>
```

**Krok 5.3: Týdenní data fetch:**

Upravit `from`/`to` computation — závisí na viewMode:

```ts
const { from, to } = useMemo(() => {
  if (viewMode === "week") {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59);
    return { from: currentWeekStart.toISOString(), to: end.toISOString() };
  }
  return {
    from: currentMonth.toISOString(),
    to: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59).toISOString(),
  };
}, [viewMode, currentMonth, currentWeekStart]);
```

**Krok 5.4: Týdenní navigace:**

```ts
const prevWeek = () => {
  const d = new Date(currentWeekStart);
  d.setDate(d.getDate() - 7);
  setCurrentWeekStart(d);
};
const nextWeek = () => {
  const d = new Date(currentWeekStart);
  d.setDate(d.getDate() + 7);
  setCurrentWeekStart(d);
};
```

**Krok 5.5: Týdenní grid rendering:**

7 sloupců (Po-Ne), ale vyšší buňky (min-h-[8rem]) — zobrazí přímo záznamy (ne jen tečky):

```tsx
{viewMode === "week" ? (
  <div className="border border-line rounded-xl overflow-hidden">
    <div className="grid grid-cols-7 bg-nude-50 border-b border-line">
      {weekDays.map((wd) => (
        <div key={wd.toISOString()} className="text-center py-2">
          <div className="text-xs font-medium text-muted">{DAY_NAMES[wd.getDay() === 0 ? 6 : wd.getDay() - 1]}</div>
          <div className={`text-sm font-bold ${isToday(wd) ? "text-rose" : "text-ink"}`}>
            {wd.getDate()}.{wd.getMonth() + 1}.
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-7">
      {weekDays.map((wd) => {
        const dayNum = wd.getDate();
        const dayEntries = byDay.get(dayNum) ?? [];
        return (
          <div key={wd.toISOString()} className="min-h-[8rem] p-1.5 border-r border-line/50 space-y-1">
            {dayEntries.map((entry) => (
              <WeekDayEntry key={getEntryKey(entry)} entry={entry} />
            ))}
          </div>
        );
      })}
    </div>
  </div>
) : (
  // existující měsíční grid
)}
```

**WeekDayEntry:** Kompaktní řádek s barvou, číslem, a částkou:

```tsx
function WeekDayEntry({ entry }: { entry: CalendarEntry }) {
  // Compact inline: [●] RES-001 — 5 000 CZK
  const dot = getDotColor(entry);
  const label = entry.kind === "reservation" ? entry.data.reservationNumber
    : entry.kind === "sale" ? entry.data.saleNumber
    : entry.kind === "order" ? entry.data.orderNumber
    : "Naskladnění";
  const amount = entry.kind === "reservation" ? entry.data.lineTotal
    : entry.kind === "sale" ? entry.data.totalAmount
    : entry.kind === "order" ? (entry.data.totalAmount ?? entry.data.estimatedTotal)
    : null;
  const href = entry.kind === "reservation" ? `/reservations/${entry.data.id}`
    : entry.kind === "sale" ? `/sales/${entry.data.id}`
    : entry.kind === "order" ? `/orders/${entry.data.id}`
    : `/inventory/deliveries/${entry.data.id}`;
  
  return (
    <Link href={href} className="flex items-center gap-1 text-[11px] hover:bg-nude-50 rounded px-1 py-0.5">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      <span className="truncate text-muted">{label ?? "—"}</span>
      {amount && <span className="ml-auto text-ink font-medium whitespace-nowrap">{formatCZK(amount)}</span>}
    </Link>
  );
}
```

---

### 6. Sloupec slevy v tabulce rezervací

**Soubor:** `src/app/(app)/reservations/ReservationsClient.tsx`

**Krok 6.1: Rozšířit ReservationRow interface (ř. 10-30):**

```ts
interface ReservationRow {
  // ... existující
  discountPercent?: number | null;
  discountAmount?: number | null;
}
```

**Krok 6.2: Přidat sloupec do thead (ř. 132-140):**

Za `<th>...{tCommon("total")}</th>` přidat:

```tsx
<th className="py-2 pr-3 text-right">{t("discount")}</th>
```

**Krok 6.3: Přidat buňku do tbody (ř. 143-197):**

Za `<td>...lineTotal...</td>` přidat:

```tsx
<td className="py-2 pr-3 text-right text-muted">
  {r.discountAmount && r.discountAmount > 0 ? (
    <span className="text-red-600">
      -{formatCZK(r.discountAmount)} ({(r.discountPercent ?? 0) / 100}%)
    </span>
  ) : (
    "—"
  )}
</td>
```

**POZNÁMKA:** Toto závisí na schema změně z task #36 (přidání discountPercent, discountAmount do ProductReservation). Pokud schema ještě není hotová, sloupec se zobrazí s "—" pro všechny.

---

## Překlady

**Nové klíče v `calendar`:**

```json
{
  "month": "Měsíc",
  "week": "Týden",
  "reservation": "Rezervace",
  "sales": "Prodeje",
  "orders": "Objednávky",
  "deliveries": "Naskladnění",
  "noEntries": "Žádné záznamy v tomto měsíci",
  "showLegend": "Zobrazit legendu statusů",
  "hideLegend": "Skrýt legendu",
  "createdBy": "Vytvořil/a",
  "orderedBy": "Objednal/a",
  "stockedBy": "Naskladnil/a"
}
```

**Nový klíč v `reservation`:**

```json
{
  "discount": "Sleva"
}
```

---

### 7. Zobrazení tvůrce u událostí v kalendáři

**Požadavek:** V detail panelu dne u každého záznamu zobrazit jméno uživatele, který ho vytvořil.

**Analýza dat — co existuje v DB:**

| Model | Pole tvůrce | Typ | Relace na User? |
|---|---|---|---|
| Sale | `userId` | String (FK) | ANO — `user User @relation` → `user.name` |
| ProductReservation | `createdByUserId` | String (FK) | ANO — `createdByUser User @relation("ReservationsCreated")` → `createdByUser.name` |
| Order | `contactName` (kdo objednal) | String? | NE — zákazník, ne interní user |
| Order | `confirmedBy` | String? | NE — jen string, ne FK na User |
| Delivery | **žádné pole** | — | NE — Delivery nemá userId/createdBy |
| StockMovement | `userId` | String (FK) | ANO — ale je na StockMovement, ne na Delivery |

**Závěr:** Pro Delivery tvůrce neexistuje přímo. Ale StockMovement typu RECEIPT (vytvořený při stockIn) má `userId`. Alternativa: přidat `createdByUserId` na Delivery model (čistší řešení).

#### Krok 7.1: Schema — přidat createdByUserId na Delivery

**Soubor:** `prisma/schema.prisma` (model Delivery, ř. 300-340)

```prisma
  createdByUserId         String?
  createdByUser           User?     @relation("DeliveriesCreated", fields: [createdByUserId], references: [id])
```

**Soubor:** `prisma/schema.prisma` (model User, ř. 16-41) — přidat relaci:

```prisma
  deliveriesCreated      Delivery[]          @relation("DeliveriesCreated")
```

**Migrace dat:** Při migraci vyplnit z existujících StockMovement (RECEIPT):

```sql
UPDATE Delivery SET createdByUserId = (
  SELECT sm.userId FROM StockMovement sm
  WHERE sm.deliveryId = Delivery.id AND sm.type = 'RECEIPT'
  LIMIT 1
);
```

#### Krok 7.2: stockIn() — nastavit createdByUserId při vytváření

**Soubor:** `src/lib/stock-in.ts` (ř. 31-34)

Funkce `stockIn(data, userId)` již přijímá `userId`. Přidat do `prisma.delivery.create()`:

```ts
// V data pro create přidat:
createdByUserId: userId,
```

#### Krok 7.3: API — rozšířit odpovědi o tvůrce

**Soubor:** `src/app/api/reservations/route.ts` (ř. 50-73, calendar view select)

Přidat do select:
```ts
createdByUser: { select: { name: true } },
```

**Soubor:** `src/app/api/sales/route.ts` (ř. 186-201, GET list)

Serializer UŽ vrací `userName` pro OWNER roli (ř. 89 v sale-serializer.ts). Pro kalendář potřebujeme `userName` pro všechny role.

**Soubor:** `src/lib/api/sale-serializer.ts` (ř. 41-110)

Přidat `userName: sale.user.name` do `base` objektu (ř. 45-68), ne jen do OWNER bloku:

```ts
// Přesunout z OWNER bloku (ř. 89) do base (ř. 45):
const base = {
  // ... existující
  userName: sale.user.name,  // NOVÉ — přidat sem
};
```

A odebrat z OWNER bloku (ř. 89):
```ts
// ODEBRAT z OWNER:
// userName: sale.user.name,  ← smazat, je už v base
```

**Soubor:** `src/app/api/orders/route.ts` (ř. 43-66, GET list include)

Přidat `contactName: true` do select (Order model UŽ má `contactName` pole, jen se nevrací):
```ts
include: {
  salon: { select: { name: true } },
  customer: { select: { name: true, email: true } },
  // ... existující
},
// Order.contactName je přímo na modelu, bude v odpovědi automaticky
```

Ověřit: `contactName` je přímé pole na Order (ř. 879), ne relace. Prisma ho vrací automaticky pokud se nepoužívá `select` (ale tady se používá `include`, takže přímá pole JSOU v odpovědi). **ŽÁDNÁ změna v orders API nepotřeba** — `contactName` se už vrací, jen se v kalendáři nezobrazuje.

**Soubor:** `src/app/api/deliveries/route.ts` (ř. 38-45)

Přidat do include:
```ts
include: {
  supplier: true,
  variant: { select: { color: true, lengthCm: true, product: { select: { name: true } } } },
  createdByUser: { select: { name: true } },  // NOVÉ
},
```

**Soubor:** `src/lib/api/delivery-serializer.ts`

Rozšířit typ a serializaci:
```ts
type DeliveryWithRelations = Delivery & {
  supplier: Supplier;
  variant?: { color: string; lengthCm: number; product: { name: string } } | null;
  createdByUser?: { name: string | null } | null;  // NOVÉ
};

// V base objektu přidat:
createdByName: delivery.createdByUser?.name ?? null,
```

#### Krok 7.4: Frontend — rozšířit typy a zobrazení

**Soubor:** `src/app/(app)/reservations/ReservationsCalendar.tsx`

**7.4.1 Rozšířit interface typy:**

```ts
interface CalendarReservation {
  // ... existující
  createdByUser?: { name: string | null } | null;  // NOVÉ
}

interface CalendarSale {
  // ... existující
  userName?: string | null;  // NOVÉ (již existuje v serializeru)
}

interface CalendarOrder {
  // ... existující
  contactName?: string | null;  // NOVÉ (kdo objednal — zákazník)
}

interface CalendarDelivery {
  // ... existující
  createdByName?: string | null;  // NOVÉ (kdo naskladnil)
}
```

**7.4.2 Zobrazit tvůrce v detail panelu:**

Pro KAŽDÝ typ záznamu přidat pod existující info řádek se jménem tvůrce:

**Rezervace (ř. 428-431):** Za řádek se sellingMode/grams přidat:
```tsx
{r.createdByUser?.name && (
  <div className="text-xs text-muted/70">
    {tCal("createdBy")}: {r.createdByUser.name}
  </div>
)}
```

**Prodeje (ř. 458-463):** Za řádek s totalAmount přidat:
```tsx
{s.userName && (
  <div className="text-xs text-muted/70">
    {tCal("createdBy")}: {s.userName}
  </div>
)}
```

**Objednávky (ř. 516-520):** Za řádek s totalAmount přidat:
```tsx
{o.contactName && (
  <div className="text-xs text-muted/70">
    {tCal("orderedBy")}: {o.contactName}
  </div>
)}
```

**Naskladnění (ř. 488-490):** Za řádek s grams přidat:
```tsx
{dl.createdByName && (
  <div className="text-xs text-muted/70">
    {tCal("stockedBy")}: {dl.createdByName}
  </div>
)}
```

#### Krok 7.5: Překlady

```json
{
  "createdBy": "Vytvořil/a",
  "orderedBy": "Objednal/a",
  "stockedBy": "Naskladnil/a"
}
```

---

### 8. Kalendář UX/design overhaul (PRIORITNÍ)

**Problém (ze screenshotu):**
- Malé 2px tečky jsou špatně rozlišitelné
- Den 15 má "+32" přetečení — tečky nestačí reprezentovat množství
- Legenda zabírá hodně místa plain textem
- Žádný hover/tooltip — uživatel musí kliknout pro detail
- Prázdné dny mají hodně nevyužitého prostoru
- Na mobilu (sidebar skrytý) mřížka funguje špatně

**Soubor:** `src/app/(app)/reservations/ReservationsCalendar.tsx` (celá komponenta)

---

#### Krok 8.1: Mini-chipy místo teček

**Současný stav (ř. 326-337):**
```tsx
<div className="flex flex-wrap gap-0.5">
  {dayEntries.slice(0, 6).map((entry) => (
    <span className={`w-2 h-2 rounded-full ${getDotColor(entry)}`} />
  ))}
  {dayEntries.length > 6 && (
    <span className="text-[9px] text-muted">+{dayEntries.length - 6}</span>
  )}
</div>
```

**Nový přístup — seskupit podle typu a zobrazit jako mini-chipy s počtem:**

```tsx
function DaySummary({ entries }: { entries: CalendarEntry[] }) {
  // Seskupit podle typu
  const counts = { reservation: 0, sale: 0, order: 0, delivery: 0 };
  for (const e of entries) counts[e.kind]++;

  const chips: { key: string; count: number; bg: string; text: string; label: string }[] = [];
  if (counts.reservation > 0) chips.push({ key: "r", count: counts.reservation, bg: "bg-amber-100", text: "text-amber-700", label: "R" });
  if (counts.sale > 0) chips.push({ key: "s", count: counts.sale, bg: "bg-blue-100", text: "text-blue-700", label: "P" });
  if (counts.order > 0) chips.push({ key: "o", count: counts.order, bg: "bg-indigo-100", text: "text-indigo-700", label: "O" });
  if (counts.delivery > 0) chips.push({ key: "d", count: counts.delivery, bg: "bg-teal-100", text: "text-teal-700", label: "N" });

  return (
    <div className="flex flex-col gap-0.5 mt-0.5">
      {chips.slice(0, 3).map(({ key, count, bg, text, label }) => (
        <div key={key} className={`flex items-center gap-0.5 rounded px-1 py-px text-[10px] font-medium leading-tight ${bg} ${text}`}>
          <span>{count}</span>
          <span className="hidden sm:inline">{label}</span>
        </div>
      ))}
      {chips.length > 3 && (
        <span className="text-[9px] text-muted">+{chips.length - 3}</span>
      )}
    </div>
  );
}
```

**Výhody:**
- Jasně viditelný TYP + POČET (ne jen tečka)
- Max 3 chipy na den (R, P, O, N) — nikdy "+32"
- Barevné rozlišení podle typu, ne podle statusu (pro overview stačí)
- Na mobilu skrytý label (jen číslo), na desktopu "3 R"

---

#### Krok 8.2: Hover tooltip na den

**Přístup:** Pure CSS/Tailwind tooltip (žádná knihovna). Použít `group` + `group-hover:` pattern, který je v projektu běžný.

```tsx
<button
  key={idx}
  type="button"
  disabled={!day}
  onClick={() => day && setSelectedDay(isSelected ? null : String(day))}
  className={`group relative min-h-[4rem] p-1.5 border-b border-r border-line/50 text-left transition-colors ${
    !day ? "bg-nude-50/50"
    : isSelected ? "bg-rose/10 ring-1 ring-rose/30 ring-inset"
    : dayEntries.length > 0 ? "hover:bg-nude-50 cursor-pointer" : ""
  }`}
>
  {/* Day content */}
  {day && dayEntries.length > 0 && (
    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-30
                    hidden group-hover:block
                    bg-ink text-white text-[11px] rounded-lg shadow-lg px-3 py-2 min-w-[10rem] max-w-[14rem]">
      <div className="font-semibold mb-1">
        {day}. {currentMonth.toLocaleDateString("cs-CZ", { month: "short" })}
      </div>
      {counts.reservation > 0 && <div>Rezervací: {counts.reservation}</div>}
      {counts.sale > 0 && <div>Prodejů: {counts.sale}</div>}
      {counts.order > 0 && <div>Objednávek: {counts.order}</div>}
      {counts.delivery > 0 && <div>Naskladnění: {counts.delivery}</div>}
      <div className="mt-1 font-medium border-t border-white/20 pt-1">
        Celkem: {formatCZK(totalAmount)} CZK
      </div>
      {/* Arrow */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0
                      border-l-4 border-r-4 border-t-4
                      border-l-transparent border-r-transparent border-t-ink" />
    </div>
  )}
</button>
```

**Implementace:** Extrahovat do helper komponenty `DayTooltip`:

```tsx
function DayTooltip({ entries, day, monthLabel }: {
  entries: CalendarEntry[];
  day: number;
  monthLabel: string;
}) {
  if (entries.length === 0) return null;

  const counts = { reservation: 0, sale: 0, order: 0, delivery: 0 };
  let totalAmount = 0;
  for (const e of entries) {
    counts[e.kind]++;
    if (e.kind === "reservation") totalAmount += e.data.lineTotal;
    else if (e.kind === "sale") totalAmount += e.data.totalAmount;
    else if (e.kind === "order") totalAmount += e.data.totalAmount ?? e.data.estimatedTotal;
  }

  return (
    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 z-30
                    hidden group-hover:block
                    bg-ink text-white text-[11px] rounded-lg shadow-lg px-3 py-2 whitespace-nowrap">
      <div className="font-semibold mb-1">{day}. {monthLabel}</div>
      {counts.reservation > 0 && <div className="flex justify-between gap-3"><span>Rezervace</span><span>{counts.reservation}</span></div>}
      {counts.sale > 0 && <div className="flex justify-between gap-3"><span>Prodeje</span><span>{counts.sale}</span></div>}
      {counts.order > 0 && <div className="flex justify-between gap-3"><span>Objednávky</span><span>{counts.order}</span></div>}
      {counts.delivery > 0 && <div className="flex justify-between gap-3"><span>Naskladnění</span><span>{counts.delivery}</span></div>}
      {totalAmount > 0 && (
        <div className="mt-1 pt-1 border-t border-white/20 font-medium text-right">
          {formatCZK(totalAmount)} CZK
        </div>
      )}
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0
                      border-l-[5px] border-r-[5px] border-t-[5px]
                      border-l-transparent border-r-transparent border-t-ink" />
    </div>
  );
}
```

---

#### Krok 8.3: Vizuální hierarchie — heat-map pozadí

Dny s více událostmi by měly mít výraznější pozadí:

```tsx
// V buňce dne — dynamické pozadí podle počtu entries
function getDayBgIntensity(count: number): string {
  if (count === 0) return "";
  if (count <= 2) return "bg-rose/[0.03]";
  if (count <= 5) return "bg-rose/[0.06]";
  if (count <= 10) return "bg-rose/[0.10]";
  return "bg-rose/[0.15]";  // 10+ entries
}

// Použití v className buňky:
className={`group relative min-h-[4rem] p-1.5 border-b border-r border-line/50 text-left transition-colors ${
  !day ? "bg-nude-50/50"
  : isSelected ? "bg-rose/10 ring-1 ring-rose/30 ring-inset"
  : `${getDayBgIntensity(dayEntries.length)} hover:bg-nude-50 cursor-pointer`
}`}
```

---

#### Krok 8.4: Výraznější zvýraznění dnešku

**Současný stav (ř. 319-324):**
```tsx
<div className={`text-xs font-medium mb-0.5 ${
  isToday ? "text-white bg-rose w-5 h-5 rounded-full flex items-center justify-center" : "text-ink"
}`}>
```

**Nový stav:** Celá buňka má zvýraznění, ne jen číslo:

```tsx
// V className buňky přidat podmínku pro isToday:
className={`group relative min-h-[4rem] p-1.5 border-b border-r transition-colors ${
  !day ? "bg-nude-50/50 border-line/50"
  : isToday ? `ring-2 ring-rose/40 ring-inset ${isSelected ? "bg-rose/10" : getDayBgIntensity(dayEntries.length)} border-rose/20`
  : isSelected ? "bg-rose/10 ring-1 ring-rose/30 ring-inset border-line/50"
  : `${getDayBgIntensity(dayEntries.length)} hover:bg-nude-50 cursor-pointer border-line/50`
}`}

// Číslo dne:
<div className={`text-xs font-bold mb-0.5 ${
  isToday
    ? "text-white bg-rose w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
    : dayEntries.length > 0 ? "text-ink" : "text-muted"
}`}>
  {day}
</div>
```

---

#### Krok 8.5: Kompaktní legenda — integrace s filtry (bod 3)

**Současný stav:** Oddělená legenda (ř. 348-392) s 4 bloky, každý zobrazuje všechny statusy.

**Nový přístup:** Sloučit legendu s filtry z bodu 3. Filtry JSOU legenda. Kliknutí toggluje typ:

```tsx
<div className="flex flex-wrap gap-2">
  {[
    { key: "reservations" as const, label: tCal("reservation"), icon: "R", active: "bg-amber-50 text-amber-700 border-amber-200", count: reservations.length },
    { key: "sales" as const, label: tCal("sales"), icon: "P", active: "bg-blue-50 text-blue-700 border-blue-200", count: sales.length },
    { key: "orders" as const, label: tCal("orders"), icon: "O", active: "bg-indigo-50 text-indigo-700 border-indigo-200", count: orders.length },
    { key: "deliveries" as const, label: tCal("deliveries"), icon: "N", active: "bg-teal-50 text-teal-700 border-teal-200", count: deliveries.length },
  ].map(({ key, label, icon, active, count }) => (
    <button
      key={key}
      onClick={() => setFilters(f => ({ ...f, [key]: !f[key] }))}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
        filters[key] ? active : "bg-nude-50/50 text-muted/50 border-line/50 line-through"
      }`}
    >
      <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
        filters[key] ? active.split(" ")[0] : "bg-nude-100"
      }`}>
        {icon}
      </span>
      {label}
      <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
        filters[key] ? "bg-white/60" : "bg-nude-100/50"
      }`}>
        {count}
      </span>
    </button>
  ))}
</div>
```

**Tím ODPADÁ:**
- Samostatná legenda (smazat ř. 348-392)
- Samostatné checkboxy z bodu 3 (nahrazeno tímto)

**Detailní legenda statusů** se přesune do tooltipu nebo do collapsible panelu:

```tsx
{showStatusLegend && (
  <div className="bg-nude-50 rounded-xl p-3 text-xs text-muted grid grid-cols-2 sm:grid-cols-4 gap-3">
    {/* ... existující detailní legenda ... */}
  </div>
)}
```

S toggle tlačítkem:
```tsx
<button
  onClick={() => setShowStatusLegend(v => !v)}
  className="text-[11px] text-muted hover:text-ink transition-colors"
>
  {showStatusLegend ? tCal("hideLegend") : tCal("showLegend")}
</button>
```

---

#### Krok 8.6: Responsive — list view na mobilu

Na malých obrazovkách (< sm) zobrazit list místo grid:

```tsx
// Detekce mobilu - CSS-only přístup
// Grid se schová na mobilu, list se zobrazí:

{/* Desktop: calendar grid */}
<div className="hidden sm:block">
  {/* ... existující mřížka ... */}
</div>

{/* Mobile: list view */}
<div className="block sm:hidden space-y-1">
  {Array.from(byDay.entries())
    .sort(([a], [b]) => a - b)
    .map(([day, entries]) => (
      <button
        key={day}
        onClick={() => setSelectedDay(selectedDay === String(day) ? null : String(day))}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors ${
          selectedDay === String(day)
            ? "bg-rose/10 border-rose/20"
            : "bg-white border-line hover:bg-nude-50"
        }`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          isCurrentMonth && day === today.getDate()
            ? "bg-rose text-white"
            : "bg-nude-50 text-ink"
        }`}>
          {day}
        </div>
        <div className="flex gap-1.5 flex-1 min-w-0">
          <DaySummaryInline entries={entries} />
        </div>
        <span className="text-xs text-muted flex-shrink-0">
          {formatCZK(entries.reduce((sum, e) => {
            if (e.kind === "reservation") return sum + e.data.lineTotal;
            if (e.kind === "sale") return sum + e.data.totalAmount;
            if (e.kind === "order") return sum + (e.data.totalAmount ?? e.data.estimatedTotal);
            return sum;
          }, 0))} CZK
        </span>
      </button>
    ))
  }
  {byDay.size === 0 && (
    <p className="text-sm text-muted text-center py-6">{tCal("noEntries")}</p>
  )}
</div>
```

**DaySummaryInline** — horizontální mini-chipy pro mobilní list:

```tsx
function DaySummaryInline({ entries }: { entries: CalendarEntry[] }) {
  const counts = { reservation: 0, sale: 0, order: 0, delivery: 0 };
  for (const e of entries) counts[e.kind]++;

  return (
    <div className="flex gap-1 flex-wrap">
      {counts.reservation > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium">
          {counts.reservation} rez
        </span>
      )}
      {counts.sale > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-medium">
          {counts.sale} prod
        </span>
      )}
      {counts.order > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-medium">
          {counts.order} obj
        </span>
      )}
      {counts.delivery > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 text-[10px] font-medium">
          {counts.delivery} nask
        </span>
      )}
    </div>
  );
}
```

---

#### Krok 8.7: Zvětšit buňky mřížky

Současné `min-h-[3.5rem]` je příliš malé. Zvětšit:

```tsx
// Desktop:
className="min-h-[4.5rem] p-1.5 ..."  // bylo 3.5rem, p-1

// Přidat padding a zaoblení:
// border-line/50 → border-line/30 (jemnější)
```

---

---

### 9. Emoji a vizuální popisky (VÝSLOVNÝ požadavek uživatele)

**Požadavek:** "ty popisky tam dej líp, dej tam klidně emoji, prostě líp to udělej vizuálně"

#### Krok 9.1: Emoji konstanty pro typy událostí

**Soubor:** `src/app/(app)/reservations/ReservationsCalendar.tsx`

Přidat na začátek souboru (pod importy):

```ts
const TYPE_EMOJI = {
  reservation: "📋",
  sale: "💰",
  order: "📦",
  delivery: "📥",
} as const;

const STATUS_EMOJI: Record<string, string> = {
  // Rezervace
  PENDING: "⏳",
  PAID: "✅",
  COMPLETED: "🔄",
  EXPIRED: "⌛",
  CANCELLED: "❌",
  // Prodeje (paymentType)
  TRANSFER: "🏦",
  CASH: "💵",
  CARD: "💳",
  PROMO: "🎁",
  WRITEOFF: "📝",
  // Objednávky
  NEW: "🆕",
  AWAITING_PAYMENT: "⏳",
  // PAID: "✅" — už definováno výše
  CONFIRMED: "✔️",
  PROCESSING: "⚙️",
  READY: "📦",
  SHIPPED: "🚚",
  DELIVERED: "📬",
  // COMPLETED: "🔄" — už definováno výše
  REJECTED: "🚫",
  // CANCELLED: "❌" — už definováno výše
};
```

#### Krok 9.2: Emoji v DaySummary (mini-chipy v buňce dne)

Aktualizovat `DaySummary` z bodu 8.1 — přidat emoji místo písmen:

```tsx
function DaySummary({ entries }: { entries: CalendarEntry[] }) {
  const counts = { reservation: 0, sale: 0, order: 0, delivery: 0 };
  for (const e of entries) counts[e.kind]++;

  const chips: { key: string; count: number; bg: string; text: string; emoji: string }[] = [];
  if (counts.reservation > 0) chips.push({ key: "r", count: counts.reservation, bg: "bg-amber-100", text: "text-amber-700", emoji: "📋" });
  if (counts.sale > 0) chips.push({ key: "s", count: counts.sale, bg: "bg-blue-100", text: "text-blue-700", emoji: "💰" });
  if (counts.order > 0) chips.push({ key: "o", count: counts.order, bg: "bg-indigo-100", text: "text-indigo-700", emoji: "📦" });
  if (counts.delivery > 0) chips.push({ key: "d", count: counts.delivery, bg: "bg-teal-100", text: "text-teal-700", emoji: "📥" });

  return (
    <div className="flex flex-col gap-0.5 mt-0.5">
      {chips.slice(0, 3).map(({ key, count, bg, text, emoji }) => (
        <div key={key} className={`flex items-center gap-0.5 rounded px-1 py-px text-[10px] font-medium leading-tight ${bg} ${text}`}>
          <span className="text-[9px]">{emoji}</span>
          <span>{count}</span>
        </div>
      ))}
      {chips.length > 3 && (
        <span className="text-[9px] text-muted">+{chips.length - 3}</span>
      )}
    </div>
  );
}
```

#### Krok 9.3: Emoji v DayTooltip (hover popup)

Aktualizovat `DayTooltip` z bodu 8.2:

```tsx
function DayTooltip({ entries, day, monthLabel }: { ... }) {
  // ...
  return (
    <div className="...tooltip classes...">
      <div className="font-semibold mb-1">{day}. {monthLabel}</div>
      {counts.reservation > 0 && <div className="flex justify-between gap-3"><span>📋 Rezervace</span><span>{counts.reservation}</span></div>}
      {counts.sale > 0 && <div className="flex justify-between gap-3"><span>💰 Prodeje</span><span>{counts.sale}</span></div>}
      {counts.order > 0 && <div className="flex justify-between gap-3"><span>📦 Objednávky</span><span>{counts.order}</span></div>}
      {counts.delivery > 0 && <div className="flex justify-between gap-3"><span>📥 Naskladnění</span><span>{counts.delivery}</span></div>}
      {totalAmount > 0 && (
        <div className="mt-1 pt-1 border-t border-white/20 font-medium text-right">
          💲 {formatCZK(totalAmount)} CZK
        </div>
      )}
    </div>
  );
}
```

#### Krok 9.4: Emoji v detail panelu dne (selected day entries)

Aktualizovat badge/label v detail entries — přidat emoji PŘED text label typu:

**Rezervace (ř. 415-417):**
```tsx
// BYLO:
<span className="text-xs font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
  {tCal("reservation")}
</span>

// NOVÉ:
<span className="text-xs font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
  📋 {tCal("reservation")}
</span>
```

**Status — přidat emoji PŘED status text (ř. 421-423):**
```tsx
// BYLO:
<span className={`text-xs font-medium ${RESERVATION_TEXT[r.status]}`}>
  {t(r.status.toLowerCase())}
</span>

// NOVÉ:
<span className={`text-xs font-medium ${RESERVATION_TEXT[r.status]}`}>
  {STATUS_EMOJI[r.status] ?? ""} {t(r.status.toLowerCase())}
</span>
```

**Prodeje (ř. 448-450):**
```tsx
<span className="text-xs font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
  💰 {tCal("sale")}
</span>
// + status emoji:
<span className={`text-xs font-medium ${SALE_TEXT[s.paymentType]}`}>
  {STATUS_EMOJI[s.paymentType] ?? ""} {tCal(s.paymentType.toLowerCase())}
</span>
```

**Objednávky (ř. 506-508):**
```tsx
<span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
  📦 {tCal("order")}
</span>
// + status emoji:
<span className={`text-xs font-medium ${ORDER_TEXT[o.status]}`}>
  {STATUS_EMOJI[o.status] ?? ""} {tCal(`order_${o.status.toLowerCase()}`)}
</span>
```

**Naskladnění (ř. 479-480):**
```tsx
<span className="text-xs font-medium bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded">
  📥 {tCal("delivery")}
</span>
```

#### Krok 9.5: Emoji ve sloučené filter/legend (bod 8.5)

Aktualizovat filter chipy — emoji místo písmen "R", "P", "O", "N":

```tsx
{[
  { key: "reservations" as const, label: tCal("reservation"), emoji: "📋", active: "bg-amber-50 text-amber-700 border-amber-200", count: reservations.length },
  { key: "sales" as const, label: tCal("sales"), emoji: "💰", active: "bg-blue-50 text-blue-700 border-blue-200", count: sales.length },
  { key: "orders" as const, label: tCal("orders"), emoji: "📦", active: "bg-indigo-50 text-indigo-700 border-indigo-200", count: orders.length },
  { key: "deliveries" as const, label: tCal("deliveries"), emoji: "📥", active: "bg-teal-50 text-teal-700 border-teal-200", count: deliveries.length },
].map(({ key, label, emoji, active, count }) => (
  <button ...>
    <span className="text-sm">{emoji}</span>
    {label}
    <span className="...">{count}</span>
  </button>
))}
```

#### Krok 9.6: Emoji v collapsible detailní legendě statusů

V collapsible legendě zobrazit emoji u každého statusu:

```tsx
{/* Reservation statuses */}
{Object.entries(RESERVATION_DOT).map(([key, color]) => (
  <span key={key} className="flex items-center gap-1">
    <span className={`w-2 h-2 rounded-full ${color}`} />
    <span>{STATUS_EMOJI[key] ?? ""}</span>
    {t(key.toLowerCase())}
  </span>
))}
```

#### Krok 9.7: Emoji v mobilním list view (bod 8.6)

Aktualizovat `DaySummaryInline`:

```tsx
function DaySummaryInline({ entries }: { entries: CalendarEntry[] }) {
  const counts = { reservation: 0, sale: 0, order: 0, delivery: 0 };
  for (const e of entries) counts[e.kind]++;

  return (
    <div className="flex gap-1 flex-wrap">
      {counts.reservation > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium">
          📋 {counts.reservation}
        </span>
      )}
      {counts.sale > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-medium">
          💰 {counts.sale}
        </span>
      )}
      {counts.order > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-medium">
          📦 {counts.order}
        </span>
      )}
      {counts.delivery > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 text-[10px] font-medium">
          📥 {counts.delivery}
        </span>
      )}
    </div>
  );
}
```

#### Krok 9.8: Emoji v týdenním pohledu (bod 5)

Aktualizovat `WeekDayEntry`:

```tsx
function WeekDayEntry({ entry }: { entry: CalendarEntry }) {
  const emoji = TYPE_EMOJI[entry.kind];
  const label = entry.kind === "reservation" ? entry.data.reservationNumber
    : entry.kind === "sale" ? entry.data.saleNumber
    : entry.kind === "order" ? entry.data.orderNumber
    : null;
  // ...
  return (
    <Link href={href} className="flex items-center gap-1 text-[11px] hover:bg-nude-50 rounded px-1 py-0.5">
      <span className="text-[10px]">{emoji}</span>
      <span className="truncate text-muted">{label ?? "—"}</span>
      {amount != null && <span className="ml-auto text-ink font-medium whitespace-nowrap">{formatCZK(amount)}</span>}
    </Link>
  );
}
```

---

**POZNÁMKA k emoji sizing:** Emoji v mini-chipech (buňky dne) použít `text-[9px]`, v detail panelu a filtrech `text-sm`, v tooltipech jako prefix před text. Emoji se vykreslí jako nativní systémové emoji (macOS/iOS/Android), takže budou vždy barevné a čitelné.

---

#### Shrnutí bodu 9 — co se mění

Všechny změny jsou v **`src/app/(app)/reservations/ReservationsCalendar.tsx`** (stejný soubor jako bod 8):

1. Nové konstanty: `TYPE_EMOJI`, `STATUS_EMOJI`
2. DaySummary: emoji místo písmen v chipech
3. DayTooltip: emoji před názvy typů
4. Detail panel: emoji v type badge + status badge
5. Filter/legenda: emoji místo icon písmen
6. Collapsible legenda: emoji u statusů
7. Mobilní list: emoji v inline chipech
8. Týdenní view: emoji v WeekDayEntry

---

#### Shrnutí bodu 8 — co se mění v jednom souboru

**`src/app/(app)/reservations/ReservationsCalendar.tsx`:**

1. **Nové helper komponenty** (uvnitř souboru):
   - `DaySummary` — mini-chipy s počtem pro desktop grid
   - `DaySummaryInline` — horizontální chipy pro mobilní list
   - `DayTooltip` — hover popup s přehledem
   - `getDayBgIntensity` — heat-map funkce

2. **Změny v buňce dne (ř. 298-343):**
   - `min-h-[3.5rem]` → `min-h-[4.5rem]`
   - Přidat `group relative` na button
   - Nahradit tečky za `<DaySummary>`
   - Přidat `<DayTooltip>` (CSS-only hover)
   - Přidat `getDayBgIntensity` do className
   - Výraznější today: `ring-2 ring-rose/40`

3. **Legenda (ř. 348-392):**
   - SMAZAT celou existující legendu
   - Nahradit sloučenou filter/legenda komponentou (krok 8.5)
   - Přidat collapsible detailní status legenda

4. **Responsive (ř. 287-346):**
   - Wrap grid do `hidden sm:block`
   - Přidat mobilní list view `block sm:hidden`

---

## Pořadí implementace

| # | Bod | Závislosti | Složitost |
|---|-----|-----------|-----------|
| 1 | Klik na den → detail (bod 2) | Žádné | NÍZKÁ — 1 soubor, <div> → <Link> |
| 2 | Šedé barvy (bod 4) | Žádné | NÍZKÁ — konstanty + opacity |
| 3 | Sloupec slevy (bod 6) | Schema z task #36 | NÍZKÁ — 1 soubor, +sloupec |
| 4 | Tvůrce v kalendáři (bod 7) | Schema migration (Delivery) | STŘEDNÍ — schema + 4 API + frontend |
| 5 | UX overhaul + emoji (bod 8+9) | Žádné | VYSOKÁ — kompletní redesign buněk, tooltip, mobile, legenda, emoji |
| 6 | Filtr + legenda (bod 3+8.5) | Bod 8 (sloučeno) | STŘEDNÍ — integrováno do UX overhaul |
| 7 | Týdenní pohled (bod 5) | Bod 8 (nový grid) | STŘEDNÍ — nový view mode + grid |
| 8 | Platební brána příprava (bod 1) | Žádné | STŘEDNÍ — nové soubory, abstrakce |

**POZNÁMKA:** Body 3 (filtr), 8 (UX overhaul), 9 (emoji) jsou SLOUČENY pro implementaci — vše v jednom souboru `ReservationsCalendar.tsx`. Filtry fungují jako legenda. Emoji jsou integrální součást redesignu, ne separátní krok.

## Soubory ke změně / vytvoření

| Soubor | Akce |
|--------|------|
| `src/app/(app)/reservations/ReservationsCalendar.tsx` | ZMĚNA (body 2,3,4,5,7,8,9) — hlavní redesign + emoji |
| `src/app/(app)/reservations/ReservationsClient.tsx` | ZMĚNA (bod 6) |
| `src/lib/payment-gateway.ts` | NOVÝ (bod 1) |
| `src/app/api/payment/callback/route.ts` | NOVÝ (bod 1) |
| `prisma/schema.prisma` | ZMĚNA — comgateTransId (bod 1) + createdByUserId na Delivery (bod 7) |
| `src/lib/stock-in.ts` | ZMĚNA — nastavit createdByUserId při stockIn (bod 7) |
| `src/app/api/reservations/route.ts` | ZMĚNA — přidat createdByUser do calendar select (bod 7) |
| `src/app/api/deliveries/route.ts` | ZMĚNA — přidat createdByUser do include (bod 7) |
| `src/lib/api/sale-serializer.ts` | ZMĚNA — přesunout userName do base (bod 7) |
| `src/lib/api/delivery-serializer.ts` | ZMĚNA — přidat createdByName (bod 7) |
| `messages/cs.json` | ZMĚNA — překlady (body 3,5,7,8) |
| `messages/uk.json` | ZMĚNA — překlady |
| `messages/ru.json` | ZMĚNA — překlady |
