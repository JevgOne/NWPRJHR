# E-shop B2B Checkout — Implementation Plan

**Task:** #27
**Cil:** Salony/kadeřnice nakupují přes e-shop checkout s B2B cenami (15-30% sleva z marže)
**Schema změny:** ŽÁDNÉ — Order model už má `salonId` (nullable), `customerId` (nullable), všechna kontaktní pole

---

## Současný stav

### Co funguje:
- **Offer pages** (`offer/page.tsx`, `offer/[...slug]/page.tsx`) UŽ detekují B2B session přes `auth()` a zobrazují B2B ceny s `discountPct`
- **PublicNavbar** UŽ zobrazuje jméno přihlášeného uživatele a rozlišuje SALON/HAIRDRESSER
- **InquiryCart** (`inquiry-cart.tsx`) ukládá `pricePerUnit` — ale vždy RETAIL cenu (ne B2B)
- **AddToInquiryForm** (`AddToInquiryForm.tsx`) nastavuje `pricePerUnit` z `retailPricePerGram` / `retailPricePerPiece` — ignoruje B2B discount
- **Public orders API** (`/api/public/orders`) počítá RETAIL ceny, nemá žádné B2B povědomí
- **Checkout page** (`checkout/page.tsx`) je server component, ale NEvolá `auth()` — nepředává session do CheckoutClient
- **CheckoutClient** je čistě guest — nemá session, nezná salonId

### Existující B2B flow (salon portal):
- Salon se přihlásí → `/salon/catalog` → vybere produkty → POST `/api/orders` → `createOrder()` z `order-workflow.ts`
- `order-workflow.ts` počítá B2B cenu: `retailPrice - (retailPrice * discountPct) / 20000` (discount z marže)
- Stav: NEW (čeká na potvrzení ownera) — žádná platba v portálu

---

## Architektura řešení

### Princip: MINIMÁLNÍ změny, DRY
B2B checkout NEbude duplikovat `order-workflow.ts` pricing logiku. Místo toho rozšíříme public orders API o B2B detekci a reuse existující formuli.

### Flow B2B checkout:
1. Salon user se přihlásí (existující login) → prohlíží nabídku s B2B cenami (UŽ funguje)
2. Přidá do košíku — košík ukládá B2B cenu (NOVÉ)
3. Klikne "Pokračovat k objednávce" → checkout
4. Checkout detekuje session → pre-fills kontakt ze Salon modelu, skrývá nepotřebná pole
5. Submit → public orders API detekuje session → přepočítá na B2B ceny server-side → přiřadí salonId
6. Stav: AWAITING_PAYMENT (B2B platí převodem/kartou jako retail)

---

## Implementace krok po kroku

### Krok 1: AddToInquiryForm — B2B ceny do košíku

**Soubor:** `src/app/[locale]/(public)/offer/[...slug]/AddToInquiryForm.tsx`

**Problém:** `handleAdd()` (ř. 114-131) vždy používá `retailPricePerGram` / `retailPricePerPiece`. Nezná B2B discount.

**Řešení:** Přidat prop `discountPct?: number` (default 0). V `handleAdd()`:

```ts
// Stávající:
const pricePerUnit = isByPiece
  ? (selectedVariant.retailPricePerPiece ?? selectedVariant.pricePerPiece ?? 0)
  : selectedVariant.retailPricePerGram;

// Nové:
const retailPrice = isByPiece
  ? (selectedVariant.retailPricePerPiece ?? selectedVariant.pricePerPiece ?? 0)
  : selectedVariant.retailPricePerGram;
const pricePerUnit = discountPct > 0
  ? roundHalereUp(retailPrice - (retailPrice * discountPct) / 20000)
  : retailPrice;
```

**Caller update:** `offer/[...slug]/page.tsx` (ř. ~490) už předává `discountPct` do jiných komponent — přidat i do `AddToInquiryForm`:
```tsx
<AddToInquiryForm
  productId={product.id}
  productName={product.name}
  // ... existující props
  discountPct={discountPct}  // NOVÉ
/>
```

**Import:** Přidat `import { roundHalereUp } from "@/lib/rounding"` do AddToInquiryForm.

**POZNÁMKA:** `roundHalereUp` musí být importovatelný z client component. Ověřit, že `src/lib/rounding.ts` nemá server-only importy.

---

### Krok 2: Checkout page — předat session info

**Soubor:** `src/app/[locale]/(public)/checkout/page.tsx`

**Změna:** Zavolat `auth()` + `getCachedB2BSettings()` a předat B2B info do CheckoutClient:

```tsx
import { auth } from "@/lib/auth";
import { getCachedB2BSettings } from "@/lib/b2b-pricing";
import { prisma } from "@/lib/db";

export default async function CheckoutPage() {
  const session = await auth();
  
  let b2bInfo: {
    salonId: string;
    salonName: string;
    salonType: "SALON" | "HAIRDRESSER";
    discountPct: number;
    contactEmail?: string;
    contactPhone?: string;
    contactPerson?: string;
    ico?: string;
    dic?: string;
    address?: string;
    city?: string;
  } | null = null;

  if (session?.user?.salonId && (session.user.role === "SALON" || session.user.role === "HAIRDRESSER")) {
    const [salon, b2bSettings] = await Promise.all([
      prisma.salon.findUnique({
        where: { id: session.user.salonId },
        select: {
          id: true, name: true, type: true,
          email: true, phone: true, contactPerson: true,
          ico: true, dic: true, address: true, city: true,
        },
      }),
      getCachedB2BSettings(),
    ]);
    if (salon && !salon.archived) {
      b2bInfo = {
        salonId: salon.id,
        salonName: salon.name,
        salonType: salon.type as "SALON" | "HAIRDRESSER",
        discountPct: salon.type === "SALON"
          ? b2bSettings.salonDiscountPct
          : b2bSettings.hairdresserDiscountPct,
        contactEmail: salon.email ?? undefined,
        contactPhone: salon.phone ?? undefined,
        contactPerson: salon.contactPerson ?? undefined,
        ico: salon.ico ?? undefined,
        dic: salon.dic ?? undefined,
        address: salon.address ?? undefined,
        city: salon.city ?? undefined,
      };
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CheckoutClient b2bInfo={b2bInfo} />
    </div>
  );
}
```

---

### Krok 3: CheckoutClient — B2B povědomí

**Soubor:** `src/app/[locale]/(public)/checkout/CheckoutClient.tsx`

**3.1 Props interface:**

```ts
interface B2BInfo {
  salonId: string;
  salonName: string;
  salonType: "SALON" | "HAIRDRESSER";
  discountPct: number;
  contactEmail?: string;
  contactPhone?: string;
  contactPerson?: string;
  ico?: string;
  dic?: string;
  address?: string;
  city?: string;
}

export function CheckoutClient({ b2bInfo }: { b2bInfo?: B2BInfo | null }) {
```

**3.2 B2B banner (nad stepperem):**

Pokud `b2bInfo`, zobrazit banner:
```
🏪 Objednávka pro: {salonName} — sleva {discountPct/100}%
```

Styl: `bg-rose/5 text-rose rounded-xl px-4 py-2.5 text-sm font-medium` (konzistentní se salon catalog bannerem).

**3.3 Contact step pre-fill:**

Pokud `b2bInfo`, pre-fill formulář při inicializaci:
```ts
const [form, setForm] = useState({
  firstName: b2bInfo?.contactPerson?.split(" ")[0] ?? "",
  lastName: b2bInfo?.contactPerson?.split(" ").slice(1).join(" ") ?? "",
  email: b2bInfo?.contactEmail ?? "",
  phone: b2bInfo?.contactPhone ?? "",
  // ... rest
});
```

**3.4 Cena přepočet:**

`itemsTotal` kalkulace (ř. 80-83) používá `item.pricePerUnit` z košíku. Pokud AddToInquiryForm správně ukládá B2B cenu (Krok 1), checkout automaticky zobrazí B2B ceny. **Žádná změna v kalkulaci.**

Ale: musíme ošetřit edge case kdy uživatel přidal položky jako nepřihlášený (retail cena v košíku) a pak se přihlásil. V tom případě košík má retail ceny ale session je B2B.

**Řešení:** V checkoutu přidat upozornění pokud `b2bInfo && items.some(i => !i.isB2B)`:
- NE — tohle je zbytečná komplexnost. Cart items nemají `isB2B` flag.
- **JEDNODUŠŠÍ:** Server-side API VŽDY přepočítá ceny na B2B pokud session = B2B. Frontend cena v košíku je jen orientační preview. Objednaná cena je ta, kterou vrátí API.
- V checkout summary (step 4) zobrazit poznámku: "Konečná cena bude potvrzena při odeslání objednávky" pokud je B2B.

**3.5 Submit — předat B2B flag:**

V `checkStockAndSubmit()` přidat do POST `/api/public/orders`:
```ts
body: JSON.stringify({
  // ... existující pole
  salonId: b2bInfo?.salonId,  // NOVÉ — API rozhodne o B2B pricing
}),
```

---

### Krok 4: Public orders API — B2B podpora

**Soubor:** `src/app/api/public/orders/route.ts`

**4.1 Schema rozšíření:**

```ts
const publicOrderSchema = z.object({
  // ... existující pole
  salonId: z.string().optional(),  // NOVÉ — pokud přítomno, B2B objednávka
});
```

**4.2 B2B validace (za parsování, před stock check):**

```ts
let salonId: string | null = null;
let b2bDiscountPct = 0;

if (data.salonId) {
  // Ověřit že session odpovídá salonId (BEZPEČNOST!)
  const session = await auth();
  if (!session?.user?.salonId || session.user.salonId !== data.salonId) {
    return NextResponse.json({ error: "Unauthorized B2B request" }, { status: 403 });
  }
  if (session.user.role !== "SALON" && session.user.role !== "HAIRDRESSER") {
    return NextResponse.json({ error: "Not a B2B account" }, { status: 403 });
  }

  const [salon, b2bSettings] = await Promise.all([
    prisma.salon.findUnique({ where: { id: data.salonId }, select: { type: true, archived: true } }),
    getCachedB2BSettings(),
  ]);
  if (!salon || salon.archived) {
    return NextResponse.json({ error: "Salon not found or archived" }, { status: 400 });
  }
  
  salonId = data.salonId;
  b2bDiscountPct = salon.type === "SALON"
    ? b2bSettings.salonDiscountPct
    : b2bSettings.hairdresserDiscountPct;
}
```

**4.3 Pricing — B2B discount:**

V sekci "3. Calculate pricing" (ř. 162-204), změnit výpočet:

```ts
// Stávající:
if (isByPiece) {
  pricePerUnit = variant.retailPricePerPiece ?? variant.pricePerPiece ?? 0;
  lineTotal = pricePerUnit * item.pieces;
} else {
  pricePerUnit = variant.retailPricePerGram;
  lineTotal = pricePerUnit * item.grams;
}

// Nové:
if (isByPiece) {
  const retailPrice = variant.retailPricePerPiece ?? variant.pricePerPiece ?? 0;
  pricePerUnit = b2bDiscountPct > 0
    ? roundHalereUp(retailPrice - (retailPrice * b2bDiscountPct) / 20000)
    : retailPrice;
  lineTotal = roundHalereUp(pricePerUnit * item.pieces);
} else {
  const retailPrice = variant.retailPricePerGram;
  pricePerUnit = b2bDiscountPct > 0
    ? roundHalereUp(retailPrice - (retailPrice * b2bDiscountPct) / 20000)
    : retailPrice;
  lineTotal = roundHalereUp(pricePerUnit * item.grams);
}
```

**Import:** Přidat `import { roundHalereUp } from "@/lib/rounding"` a `import { auth } from "@/lib/auth"` a `import { getCachedB2BSettings } from "@/lib/b2b-pricing"`.

**4.4 Order create — salonId místo customerId:**

V transakci (ř. 257-292), podmíněně:

```ts
// Stávající:
customerId,

// Nové:
...(salonId
  ? { salonId }  // B2B — přiřadit salonu
  : { customerId }  // Retail — přiřadit zákazníkovi
),
```

**DŮLEŽITÉ:** B2B objednávky NEMAJÍ customerId. Retail objednávky NEMAJÍ salonId. Toto je konzistentní s existujícím Order modelem.

**4.5 Stav objednávky:**

Obě varianty (B2B i retail) začínají jako `AWAITING_PAYMENT`. B2B objednávky přes e-shop checkout procházejí platbou (převod/karta), na rozdíl od B2B objednávek přes salon portal (kde stav = NEW, platba se řeší mimo systém).

**4.6 Email:**

Stávající email `getRetailOrderConfirmationEmail()` funguje i pro B2B — posílá potvrzení na `contactEmail`. Žádná změna potřeba. Pokud bude potřeba odlišit B2B email (s IČO, DIC), to je budoucí rozšíření.

---

### Krok 5: Překlady

**Soubory:** `messages/cs.json`, `messages/uk.json`, `messages/ru.json`

**Nové klíče v `public.checkout`:**

```json
{
  "b2bBanner": "Objednávka pro: {salonName} — sleva {discount}%",
  "b2bPriceNote": "Ceny jsou po Vaší B2B slevě",
  "b2bFinalPriceNote": "Konečná cena bude potvrzena při odeslání objednávky"
}
```

---

## Bezpečnostní aspekty

1. **salonId validace:** API MUSÍ ověřit session — nelze odeslat cizí salonId
2. **Server-side pricing:** B2B cena se VŽDY počítá server-side z DB (ne z frontendu). Frontend cena je jen preview
3. **Rate limiting:** Existující rate limit (20/h/IP) platí i pro B2B
4. **Archived salon check:** API odmítne objednávku pro archivovaný salon

## Co se NEMĚNÍ

- Schema (žádné migrace)
- Salon portal ordering flow (zůstává nezávislý)
- Comgate callback (funguje stejně pro B2B i retail)
- Stock check API
- Admin order management (už rozlišuje B2B/retail via `type` filter)
- B2B pricing formule (reuse existující)

## Pořadí implementace

1. **Krok 4** (public orders API) — nezávislý, testovatelný přes API
2. **Krok 1** (AddToInquiryForm discountPct) — nezávislý na ostatních
3. **Krok 2** (checkout page.tsx) — předpoklad pro Krok 3
4. **Krok 3** (CheckoutClient B2B) — závisí na Kroku 2
5. **Krok 5** (překlady) — současně s Krokem 3

## Odhad rozsahu

- 5 souborů ke změně (žádné nové soubory)
- ~80 řádků nového kódu, ~20 řádků změněného
- 0 schema changes / 0 migrací
