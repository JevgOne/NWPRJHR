# Bug: Rezervace se slevou — "Něco se pokazilo"

**Task:** #98
**Datum:** 2026-07-21
**Priorita:** URGENTNÍ

---

## Flow uživatele

1. Nový prodej → NewSaleWizard (`src/app/(app)/sales/new/NewSaleWizard.tsx`)
2. Přidat položku
3. Zaškrtnout "Rezervovat místo prodeje" → `reserveMode = true`
4. Nastavit datum splatnosti
5. Zaškrtnout slevu v DiscountForm, zadat procento
6. Kliknout "Vytvořit rezervaci"
7. **→ Error: "Něco se pokazilo"**

---

## Analýza kódu — celý řetězec

### Frontend (NewSaleWizard.tsx, ř. 381-425)

```
handleSubmit() → reserveMode=true
  → body = { customerType, variantId, grams, pieces, paymentDueDate, note, discount }
  → fetch POST /api/reservations
  → if !res.ok → setError(data.error?.message || JSON.stringify(data.error))
  → if ok → router.push(/reservations/${id})
  → catch → setError(tCommon("error"))  // "Chyba"
```

### API (src/app/api/reservations/route.ts, ř. 107-156)

```
POST handler:
  → auth() check
  → createReservationSchema.safeParse(body)
  → if validation fails → 400 { error: "Validation failed", details }
  → createProductReservation(parsed.data, userId)
  → if throws → 500 { error: e.message }
  → success → 201 reservation object
```

### Zod validace (src/lib/validations/reservation.ts, ř. 2-20)

```ts
discount: z.object({
  percent: z.number().int().min(100).max(10000),  // ← min 100 = 1%
  type: z.enum(["STANDARD", "MARKETING", "PERSONAL"]),
  counterPerformanceNote: z.string().max(500).optional(),
  bearerPartnerIds: z.array(z.string()).optional(),
}).optional()
```

### Business logika (src/lib/reservations.ts, ř. 50-141)

```
createProductReservation():
  → findVariant
  → calculate B2B discount (auto)
  → calculate pricePerUnit
  → lineTotalBeforeDiscount = pricePerUnit * quantity
  → manualDiscountAmount = (lineTotal * percent) / 10000
  → lineTotal = lineTotalBeforeDiscount - manualDiscountAmount
  → prisma.productReservation.create({ discountPercent, discountAmount, discountType, discountNote })
```

---

## NALEZENÉ CHYBY (3 problémy)

### BUG #1 (HLAVNÍ): Zod min(100) odmítne percent=0 při zapnuté slevě bez hodnoty

**Soubor:** `src/lib/validations/reservation.ts:15`
**Soubor:** `src/components/sales/DiscountForm.tsx:61,82`

**Problém:**
1. Uživatel zaškrtne "Sleva" checkbox v DiscountForm
2. DiscountForm zavolá `onChange({ percent: 0, type: "STANDARD", ... })` (ř. 82)
3. `discount` state se nastaví na objekt s `percent: 0`
4. Uživatel zadá procento, ale pokud:
   - Zadá a pak smaže (backspace) → `percent` se vrátí na 0
   - Zadá hodnotu < 1% (např. 0.5) → `Math.round(0.5 * 100) = 50` → 50 < 100
5. Frontend pošle `discount: { percent: 0, ... }` nebo `{ percent: 50, ... }`
6. Zod validace: `z.number().int().min(100)` → **ODMÍTNUTO**
7. API vrátí 400 `{ error: "Validation failed" }`

**Ale:** Toto zobrazí "Validation failed" v červeném banneru, NE "Něco se pokazilo". Takže toto samo o sobě NEVYSVĚTLUJE chybovou hlášku. Je to bug, ale ne hlavní příčina error boundary.

**Fix:**
```ts
// validations/reservation.ts — změnit min(100) na min(0):
percent: z.number().int().min(0).max(10000),
```
A v `createProductReservation` (ř. 103) je už ošetřeno: `if (input.discount && input.discount.percent > 0)` — nulová sleva se prostě neaplikuje.

**Nebo lepší fix — frontend by neměl posílat discount s percent=0:**
```ts
// NewSaleWizard.tsx ř. 392-402:
discount: discount && discount.percent > 0
  ? { ... }
  : undefined,
```

---

### BUG #2 (PRAVDĚPODOBNÝ ROOT CAUSE): Error boundary při Zod validation failure + chybný error handling

**Soubor:** `src/app/(app)/sales/new/NewSaleWizard.tsx:412-414`

**Problém:**
```ts
if (!res.ok) {
  const data = await res.json();
  setError(data.error?.message || JSON.stringify(data.error) || tCommon("error"));
```

Pokud API vrátí Zod error s `details` objektem, `data.error` je string `"Validation failed"`. `JSON.stringify("Validation failed")` vrátí `'"Validation failed"'` (s uvozovkami). To se zobrazí v banneru.

**ALE** — pokud API vrátí **neočekávaný formát** (např. Prisma chyba s jiným tvarem), `data.error` může být objekt nebo undefined, a `data.error?.message` může být undefined. Pak:
- `undefined || JSON.stringify(undefined) || tCommon("error")` → `JSON.stringify(undefined)` vrátí `undefined` (ne string!) → falls to `tCommon("error")` → "Chyba"

Toto stále nevysvětluje "Něco se pokazilo". Error boundary se spustí jen při unhandled exception v renderovacím cyklu.

**Ale pozor:** Co když error je z `router.push()` navigace? Pokud API vrátí 201 (success), ale redirect na `/reservations/${reservation.id}` způsobí server-side crash? To by spustilo error boundary na NOVÉ stránce!

---

### BUG #3 (NEJVÍCE PRAVDĚPODOBNÝ ROOT CAUSE): Prisma schema vs Turso DB — chybějící discount sloupce v produkci

**Soubor:** `scripts/migrate-product-reservations.ts:39-65`
**Soubor:** `scripts/migrate-reservation-discount.ts`

**Problém:**
Původní migrace (`migrate-product-reservations.ts`) vytvořila tabulku **BEZ discount sloupců**. Druhá migrace (`migrate-reservation-discount.ts`) přidává:
- `discountPercent INTEGER`
- `discountAmount INTEGER`
- `discountType TEXT`
- `discountNote TEXT`

**Team-lead říká, že migrace proběhla.** Ale pokud se skript `migrate-reservation-discount.ts` ve skutečnosti NESPUSTIL na produkčním Turso, pak:

1. Prisma klient má discount sloupce ve svém generovaném kódu (z `prisma generate`)
2. DB tabulka tyto sloupce NEMÁ
3. `prisma.productReservation.create()` se pokusí vložit `discountPercent`, `discountAmount` atd.
4. **Turso/SQLite vrátí chybu: "table product_reservations has no column named discountPercent"**
5. Tato chyba je zachycena API catch blokem (ř. 150-154) → vrátí 500
6. Frontend zobrazí error message → ČERVENÝ BANNER s chybovou hláškou

**ALE** — pokud chyba nastane na jiném místě (např. při čtení reservation detail po úspěšném vytvoření bez discount sloupců), mohla by se spustit error boundary.

**Jak ověřit:**
```bash
# Na produkci ověřit existenci sloupců:
npx tsx -e "
const { createClient } = require('@libsql/client');
const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
client.execute('PRAGMA table_info(product_reservations)').then(r => console.log(r.rows));
"
```

---

## Diagnóza — co přesně způsobuje "Něco se pokazilo"

Text "Něco se pokazilo" pochází z `src/app/error.tsx` — Next.js error boundary. To se spouští POUZE při neošetřené výjimce v React komponentě (během renderu, ne v event handleru).

**Scénář:** 
1. Uživatel klikne "Vytvořit rezervaci"
2. API vytvoří rezervaci ÚSPĚŠNĚ (vrátí 201)
3. Frontend provede `router.push(/reservations/${reservation.id})`
4. Next.js naviguje na `/reservations/[id]/page.tsx` (server component)
5. Server component zavolá `prisma.productReservation.findUnique({ include: { createdByUser: ... } })` (ř. 24-40 v `[id]/route.ts`)
6. To funguje (GET endpoint, ne page.tsx)
7. Ale `ReservationDetailClient` fetchuje `/api/reservations/${id}` (ř. 80)
8. Response ZAHRNUJE discount data (z DB include)

**Alternativní scénář:**
1. Uživatel nemá vyplněného zákazníka/salon v slevovém flow
2. Něco v DiscountForm/handleSubmit crashne — ale toto by bylo v event handleru, ne v renderu

**Nejpravděpodobnější scénář pro error boundary:**
Pokud Turso DB **NEMÁ** discount sloupce → `prisma.productReservation.create()` FAILNE → API vrátí 500 → frontend zobrazí chybu v červeném banneru ("Unknown column...") → TOHLE ale NENÍ error boundary.

**POZOR:** Uživatel mohl popisovat červený banner s textem chyby, ne error boundary. V tom případě je root cause Zod validace (percent < 100) nebo Prisma DB error.

---

## Fix plán

### Fix 1: Frontend — neposílat discount s percent=0 (OKAMŽITÝ)

**Soubor:** `src/app/(app)/sales/new/NewSaleWizard.tsx` (ř. 392)

```ts
// BYLO (ř. 392):
discount: discount
  ? {

// NOVÉ:
discount: discount && discount.percent > 0
  ? {
```

**Důvod:** Pokud uživatel zapne slevu ale nezadá procento (nebo smaže), percent je 0. Frontend by neměl posílat nulovou slevu — prostě ji vynechá.

### Fix 2: Zod validace — povolit percent=0 (POJISTKA)

**Soubor:** `src/lib/validations/reservation.ts` (ř. 15)

```ts
// BYLO:
percent: z.number().int().min(100).max(10000),

// NOVÉ:
percent: z.number().int().min(0).max(10000),
```

**Důvod:** `createProductReservation` už ošetřuje `percent > 0` (ř. 103). Zod nemusí odmítat 0.

### Fix 3: Lepší error handling ve frontendu (DOPLNĚNÍ)

**Soubor:** `src/app/(app)/sales/new/NewSaleWizard.tsx` (ř. 414)

```ts
// BYLO:
setError(data.error?.message || JSON.stringify(data.error) || tCommon("error"));

// NOVÉ:
const errMsg = typeof data.error === "string"
  ? data.error
  : data.error?.message ?? JSON.stringify(data.details ?? data.error) ?? tCommon("error");
setError(errMsg);
```

**Důvod:** Zobrazí srozumitelnou chybu místo JSON stringified mess.

### Fix 4: Ověřit produkční DB sloupce (KRITICKÉ)

Spustit na produkci:
```bash
npx tsx scripts/migrate-reservation-discount.ts
```

Pokud sloupce neexistují, toto je ROOT CAUSE. Pokud existují, root cause je Zod validace (Fix 1+2).

---

## Soubory ke změně

| Soubor | Fix |
|--------|-----|
| `src/app/(app)/sales/new/NewSaleWizard.tsx` | Fix 1 (ř. 392) + Fix 3 (ř. 414) |
| `src/lib/validations/reservation.ts` | Fix 2 (ř. 15) |

## Status (aktualizováno 2026-07-20)

- **Fix 1** — HOTOVO (NewSaleWizard.tsx ř. 392: `discount && discount.percent > 0`)
- **Fix 2** — HOTOVO (reservation.ts ř. 16: `min(0)` místo `min(100)`)
- **Fix 3** — ZBÝVÁ (NewSaleWizard.tsx ř. 414 stále má `JSON.stringify(data.error)`)
- **Fix 4** — ověřit na produkci (mimo kód)

## Pořadí implementace

1. ~~**Fix 1** — OKAMŽITÝ, 1 řádek, eliminuje hlavní trigger~~ HOTOVO
2. ~~**Fix 2** — pojistka, 1 řádek~~ HOTOVO
3. **Fix 3** — lepší UX pro budoucí chyby — ZBÝVÁ
4. **Fix 4** — ověřit na produkci (mimo kód)
