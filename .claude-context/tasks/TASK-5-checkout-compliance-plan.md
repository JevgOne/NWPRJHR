# TASK-5: Checkout — souhlas s podmínkami, GDPR, fakturační údaje, newsletter opt-out

## Požadavek
Při dokončení objednávky (checkout) musí být:
1. Checkbox "Chci zadat jiné fakturační údaje" (+ formulář pro IČO, DIČ, firma, adresa)
2. Text souhlasu s obchodními podmínkami (s odkazem na /obchodni-podminky)
3. Text o zpracování osobních údajů (s odkazem na /privacy)
4. Checkbox "Nesouhlasím se zasláním dotazníku spokojenosti"
5. Checkbox "Nesouhlasím se zasíláním newsletterů"

## Analýza

### Aktuální stav checkout flow

Existují DVĚ cesty objednávky:

| Flow | Soubor | Popis |
|------|--------|-------|
| **Checkout (nový)** | `src/app/[locale]/(public)/checkout/CheckoutClient.tsx` | 4-krokový wizard (kontakt → doručení → platba → shrnutí), podpora Comgate plateb |
| **Inquiry cart (starý)** | `src/app/[locale]/(public)/inquiry-cart/InquiryCartClient.tsx` | Jednoduchý poptávkový formulář (nezávazný), redirect na checkout pokud položky mají cenu |

**Primární target = CheckoutClient.tsx** — to je skutečný nákupní flow s platbou.

### Aktuální stav souhlasů v CheckoutClient.tsx

Krok 3 (payment) — řádky 673-688:
- Existuje `termsAccepted` checkbox (řádek 55 form state: `termsAccepted: false`)
- Text: "Souhlasím s obchodními podmínkami" s odkazem na `/obchodni-podminky`
- Validace: `canProceed()` pro step "payment" kontroluje `form.termsAccepted` (řádek 152)
- **CHYBÍ:** GDPR text, fakturační údaje, newsletter/survey opt-out

### API (src/app/api/public/orders/route.ts)

Schema `publicOrderSchema` (řádky 16-73):
- **NEMÁ** billing/fakturační pole
- **NEMÁ** noNewsletter / noSurvey pole
- Order se ukládá do DB bez těchto informací

### DB model (prisma/schema.prisma řádky 878-949)

Model `Order`:
- **NEMÁ** billingName, billingIco, billingDic, billingAddress apod.
- **NEMÁ** noNewsletter, noSurvey flagy

### Existující stránky

- `/obchodni-podminky` — obchodní podmínky (existuje)
- `/privacy` — zásady zpracování osobních údajů (existuje)

## Plán implementace

### Krok 1: Prisma schema — přidat pole na Order model

V `prisma/schema.prisma`, model Order (řádek ~926, před `createdAt`):

```prisma
  // Billing (optional — only when different from shipping)
  wantsBilling     Boolean  @default(false)
  billingName      String?
  billingIco       String?
  billingDic       String?
  billingStreet    String?
  billingCity      String?
  billingZip       String?

  // Consent opt-outs (negative consent — true = opted OUT)
  noSurvey         Boolean  @default(false)
  noNewsletter     Boolean  @default(false)
```

Poté: `npx prisma db push` (nebo migration)

### Krok 2: API schema — rozšířit publicOrderSchema

V `src/app/api/public/orders/route.ts`, do schema (za `salonId`):

```typescript
// Billing
wantsBilling: z.boolean().optional().default(false),
billingName: z.string().max(200).optional(),
billingIco: z.string().max(20).optional(),
billingDic: z.string().max(20).optional(),
billingStreet: z.string().max(200).optional(),
billingCity: z.string().max(100).optional(),
billingZip: z.string().max(20).optional(),

// Consent opt-outs
noSurvey: z.boolean().optional().default(false),
noNewsletter: z.boolean().optional().default(false),
```

V `tx.order.create()` data bloku (řádek ~293), přidat:

```typescript
wantsBilling: data.wantsBilling,
billingName: data.billingName ?? null,
billingIco: data.billingIco ?? null,
billingDic: data.billingDic ?? null,
billingStreet: data.billingStreet ?? null,
billingCity: data.billingCity ?? null,
billingZip: data.billingZip ?? null,
noSurvey: data.noSurvey ?? false,
noNewsletter: data.noNewsletter ?? false,
```

### Krok 3: CheckoutClient.tsx — rozšířit form state

Do `form` state (řádek 43-56) přidat:

```typescript
wantsBilling: false,
billingName: "",
billingIco: "",
billingDic: "",
billingStreet: "",
billingCity: "",
billingZip: "",
noSurvey: false,
noNewsletter: false,
```

### Krok 4: CheckoutClient.tsx — UI pro krok 3 (payment)

V sekci Step 3 (řádky 576-688), ZA terms checkbox, přidat:

#### 4a. GDPR text (informační, bez checkboxu)
```tsx
<p className="text-xs text-muted">
  {t("gdprText")}{" "}
  <Link href="/privacy" className="text-rose underline" target="_blank">
    {t("gdprLink")}
  </Link>
</p>
```

#### 4b. Newsletter opt-out checkbox
```tsx
<label className="flex items-start gap-2 cursor-pointer">
  <input
    type="checkbox"
    checked={form.noNewsletter}
    onChange={(e) => setField("noNewsletter", e.target.checked)}
    className="mt-0.5 accent-rose"
  />
  <span className="text-xs text-muted">{t("noNewsletter")}</span>
</label>
```

#### 4c. Survey opt-out checkbox
```tsx
<label className="flex items-start gap-2 cursor-pointer">
  <input
    type="checkbox"
    checked={form.noSurvey}
    onChange={(e) => setField("noSurvey", e.target.checked)}
    className="mt-0.5 accent-rose"
  />
  <span className="text-xs text-muted">{t("noSurvey")}</span>
</label>
```

#### 4d. Fakturační údaje toggle + formulář

Umístění: ideálně v Step 1 (contact) nebo jako samostatná sekce ve Step 3 (payment).
Doporučení: **Step 1 (contact)** — logicky patří ke kontaktním údajům.

Za stávající kontaktní pole v Step 1 (řádek 477):

```tsx
{/* Billing toggle */}
<label className="flex items-start gap-2 cursor-pointer pt-2">
  <input
    type="checkbox"
    checked={form.wantsBilling}
    onChange={(e) => setField("wantsBilling", e.target.checked)}
    className="mt-0.5 accent-rose"
  />
  <span className="text-xs text-muted">{t("wantsBilling")}</span>
</label>

{form.wantsBilling && (
  <div className="space-y-3 pt-2 border-t border-line mt-2">
    <div>
      <label className="block text-xs font-medium text-muted mb-1">{t("billingName")}</label>
      <input type="text" value={form.billingName}
        onChange={(e) => setField("billingName", e.target.value)}
        className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose"
        placeholder={t("billingNamePlaceholder")} />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-muted mb-1">{t("billingIco")}</label>
        <input type="text" value={form.billingIco}
          onChange={(e) => setField("billingIco", e.target.value)}
          className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose" />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted mb-1">{t("billingDic")}</label>
        <input type="text" value={form.billingDic}
          onChange={(e) => setField("billingDic", e.target.value)}
          className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose" />
      </div>
    </div>
    <div>
      <label className="block text-xs font-medium text-muted mb-1">{t("billingStreet")}</label>
      <input type="text" value={form.billingStreet}
        onChange={(e) => setField("billingStreet", e.target.value)}
        className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-muted mb-1">{t("billingCity")}</label>
        <input type="text" value={form.billingCity}
          onChange={(e) => setField("billingCity", e.target.value)}
          className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose" />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted mb-1">{t("billingZip")}</label>
        <input type="text" value={form.billingZip}
          onChange={(e) => setField("billingZip", e.target.value)}
          className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose" />
      </div>
    </div>
  </div>
)}
```

### Krok 5: Rozšířit submit data

V `checkStockAndSubmit()` (řádek 218), do `JSON.stringify` body přidat:

```typescript
wantsBilling: form.wantsBilling,
billingName: form.billingName || undefined,
billingIco: form.billingIco || undefined,
billingDic: form.billingDic || undefined,
billingStreet: form.billingStreet || undefined,
billingCity: form.billingCity || undefined,
billingZip: form.billingZip || undefined,
noSurvey: form.noSurvey,
noNewsletter: form.noNewsletter,
```

### Krok 6: Přidat překlady do messages/cs.json

Do sekce `"checkout"` (řádek 1046):

```json
"gdprText": "Odesláním objednávky souhlasíte se zpracováním osobních údajů v souladu s",
"gdprLink": "zásadami ochrany osobních údajů",
"noNewsletter": "Nesouhlasím se zasíláním newsletterů a marketingových sdělení",
"noSurvey": "Nesouhlasím se zasláním dotazníku spokojenosti",
"wantsBilling": "Chci zadat jiné fakturační údaje",
"billingName": "Název firmy / Jméno",
"billingNamePlaceholder": "Např. Salon Krásné Vlasy s.r.o.",
"billingIco": "IČO",
"billingDic": "DIČ",
"billingStreet": "Fakturační adresa",
"billingCity": "Město",
"billingZip": "PSČ"
```

### Krok 7: Přidat překlady do messages/uk.json a messages/ru.json

Stejné klíče v ukrajinštině a ruštině.

### Krok 8: Summary step — zobrazit fakturační údaje

V Step 4 (summary), za kontaktní údaje (řádek 729-753), přidat zobrazení fakturačních údajů pokud `form.wantsBilling`:

```tsx
{form.wantsBilling && form.billingName && (
  <div className="flex justify-between">
    <span className="text-muted">{t("wantsBilling")}</span>
    <span className="text-ink text-right">
      {form.billingName}
      {form.billingIco && <span className="block text-xs text-muted">IČO: {form.billingIco}</span>}
      {form.billingDic && <span className="block text-xs text-muted">DIČ: {form.billingDic}</span>}
      {form.billingStreet && (
        <span className="block text-xs text-muted">{form.billingStreet}, {form.billingCity} {form.billingZip}</span>
      )}
    </span>
  </div>
)}
```

## Soubory k editaci

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `prisma/schema.prisma` | Přidat billing + opt-out pole na Order model |
| 2 | `src/app/api/public/orders/route.ts` | Rozšířit schema + uložení do DB |
| 3 | `src/app/[locale]/(public)/checkout/CheckoutClient.tsx` | Form state + UI (fakturační, GDPR, newsletter, survey) |
| 4 | `messages/cs.json` | Přidat checkout překlady |
| 5 | `messages/uk.json` | Přidat checkout překlady (UK) |
| 6 | `messages/ru.json` | Přidat checkout překlady (RU) |

## Pořadí implementace
1. Schema + migration (musí být první — jinak API padne)
2. API route (přijímá nová data)
3. Frontend (posílá nová data)
4. Překlady

## Důležité poznámky

- **Newsletter a survey opt-out jsou NEGATIVNÍ souhlasy** ("Nesouhlasím") — proto `noNewsletter` a `noSurvey` (true = opted out). Toto odpovídá GDPR — default je souhlas, zákazník se musí aktivně odhlásit.
- **Fakturační údaje jsou volitelné** — většina zákazníků nebude potřebovat. Proto toggle checkbox.
- **GDPR text je informační** — není checkbox, jen odkaz na privacy policy. Souhlas se zpracováním je implicitní odesláním objednávky (oprávněný zájem + plnění smlouvy dle GDPR).
- **Existující `termsAccepted` checkbox zůstává** — už funguje správně.
- **B2B checkout**: pro B2B objednávky (salon) se billing údaje předvyplní z profilu salonu (IČO, DIČ z `b2bInfo`). Pre-fill v form init: `billingIco: b2bInfo?.ico ?? ""`, `billingDic: b2bInfo?.dic ?? ""`.

## Priorita
Střední — compliance požadavek, ne technický bug.
