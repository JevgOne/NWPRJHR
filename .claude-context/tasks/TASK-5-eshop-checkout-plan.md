# TASK-5: Kompletní E-shop Checkout Flow — plán

## Přehled požadavků

### A) Během checkoutu
1. Checkbox "Chci zadat jiné fakturační údaje" + formulář (IČO, DIČ, firma, adresa)
2. Souhlas s obchodními podmínkami (odkaz /obchodni-podminky)
3. Souhlas se zpracováním osobních údajů (odkaz na GDPR stránku)
4. Opt-out: "Nesouhlasím se zasláním dotazníku spokojenosti"
5. Opt-out: "Nesouhlasím se zasíláním newsletterů"

### B) Po objednání
1. Potvrzovací stránka — číslo objednávky, stav, "Děkujeme!"
2. Akce na objednávce — změnit platbu, zrušit, znovu email
3. Přehled položek — názvy, počty, ceny
4. Dodací údaje — kontakt, platba, doprava
5. Potvrzovací email — kompletní shrnutí

---

## Analýza současného stavu

### Checkout flow — DVĚ cesty

| Flow | Soubor | Popis | Platba |
|------|--------|-------|--------|
| **Checkout** | `src/app/[locale]/(public)/checkout/CheckoutClient.tsx` | 4-krokový wizard: kontakt → doručení → platba → shrnutí | Comgate (karta) / převodem |
| **Inquiry cart** | `src/app/[locale]/(public)/inquiry-cart/InquiryCartClient.tsx` | Poptávkový formulář, redirect na checkout pro placené položky | Žádná |

**Primární target = CheckoutClient.tsx** — skutečný nákupní flow.

### Co už funguje

| Prvek | Stav | Kde |
|-------|------|-----|
| Terms checkbox | EXISTUJE | CheckoutClient.tsx:673-688 (`termsAccepted`) |
| Terms odkaz | EXISTUJE | `/obchodni-podminky` (stránka existuje) |
| Privacy stránka | EXISTUJE | `/privacy` (ale ne `/zasady-zpracovani-udaju`) |
| Potvrzovací email | EXISTUJE | `getRetailOrderConfirmationEmail()` — položky, ceny, platební info |
| Email po zaplacení | EXISTUJE | `getRetailPaymentReceivedEmail()` |
| Email po odeslání | EXISTUJE | `getRetailOrderShippedEmail()` — tracking link |
| Inline success page | EXISTUJE | CheckoutClient.tsx:308-372 — transfer QR/info nebo redirect |
| Payment result page | EXISTUJE | `/platba/vysledek` — paid/pending/cancelled |

### Co CHYBÍ

| Prvek | Priorita |
|-------|----------|
| GDPR text s odkazem na /privacy | VYSOKÁ |
| Fakturační údaje (billing) | VYSOKÁ |
| Newsletter opt-out | VYSOKÁ |
| Survey opt-out | VYSOKÁ |
| Stránka `/zasady-zpracovani-udaju` | NENUTNÁ — `/privacy` existuje, stačí redirect nebo použít existující |
| Post-order tracking stránka | NOVÁ — neexistuje public order detail |
| Akce na objednávce (zrušit, změnit platbu) | NOVÁ — API existuje (admin), potřeba public verze |
| Znovu poslat potvrzovací email | NOVÁ |

### Existující API akce (admin only — `src/app/api/orders/[id]/route.ts`)

| Akce | Auth | Stav |
|------|------|------|
| `confirm` | OWNER | Existuje |
| `reject` | OWNER | Existuje |
| `status` | OWNER/EMPLOYEE | Existuje |
| `mark-paid` | OWNER | Existuje |
| `ship-packeta` | OWNER/EMPLOYEE | Existuje |
| `ship-manual` | OWNER/EMPLOYEE | Existuje |
| `complete` | OWNER/EMPLOYEE | Existuje |
| `cancel` | OWNER/EMPLOYEE + SALON own | Existuje |
| **`resend-email`** | — | **NEEXISTUJE** |
| **`change-payment`** | — | **NEEXISTUJE** |

### DB model Order (prisma/schema.prisma:878-949)

**CHYBÍ:**
- `wantsBilling`, `billingName`, `billingIco`, `billingDic`, `billingStreet`, `billingCity`, `billingZip`
- `noSurvey`, `noNewsletter`
- `accessToken` (pro public order detail stránku bez loginu)

### OrderStatus enum

```
NEW → AWAITING_PAYMENT → PAID → CONFIRMED → PROCESSING → READY → SHIPPED → DELIVERED → COMPLETED
                                                                                    ↘ REJECTED
                                                                                    ↘ CANCELLED
```

---

## Plán implementace — rozdělení do kroků

### FÁZE 1: Checkout compliance (KRITICKÁ)

#### Krok 1.1: Prisma schema — rozšířit Order model

Soubor: `prisma/schema.prisma`, model Order (řádek ~926, před `createdAt`)

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

  // Public order access token (allows viewing order without login)
  accessToken      String?  @unique
```

Poté: `npx prisma db push`

#### Krok 1.2: API schema — rozšířit publicOrderSchema

Soubor: `src/app/api/public/orders/route.ts`

Do `publicOrderSchema` (řádek ~51, za `salonId`):
```typescript
wantsBilling: z.boolean().optional().default(false),
billingName: z.string().max(200).optional(),
billingIco: z.string().max(20).optional(),
billingDic: z.string().max(20).optional(),
billingStreet: z.string().max(200).optional(),
billingCity: z.string().max(100).optional(),
billingZip: z.string().max(20).optional(),
noSurvey: z.boolean().optional().default(false),
noNewsletter: z.boolean().optional().default(false),
```

V `tx.order.create()` data bloku (řádek ~293) přidat:
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
accessToken: crypto.randomUUID(),
```

#### Krok 1.3: CheckoutClient.tsx — rozšířit form state

Soubor: `src/app/[locale]/(public)/checkout/CheckoutClient.tsx`

Do `form` state (řádek 43-56) přidat:
```typescript
wantsBilling: false,
billingName: b2bInfo?.contactPerson ?? "",
billingIco: b2bInfo?.ico ?? "",
billingDic: b2bInfo?.dic ?? "",
billingStreet: b2bInfo?.address ?? "",
billingCity: b2bInfo?.city ?? "",
billingZip: "",
noSurvey: false,
noNewsletter: false,
```

#### Krok 1.4: CheckoutClient.tsx — fakturační údaje v Step 1 (contact)

Za stávající kontaktní pole (po řádku 477, konec Step 1), přidat toggle + formulář:

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
        className="w-full px-3 py-2 border border-line rounded-lg text-sm ..." 
        placeholder={t("billingNamePlaceholder")} />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="...">{t("billingIco")}</label>
        <input type="text" value={form.billingIco} onChange={...} className="..." />
      </div>
      <div>
        <label className="...">{t("billingDic")}</label>
        <input type="text" value={form.billingDic} onChange={...} className="..." />
      </div>
    </div>
    <div>
      <label className="...">{t("billingStreet")}</label>
      <input type="text" value={form.billingStreet} onChange={...} className="..." />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="...">{t("billingCity")}</label>
        <input type="text" value={form.billingCity} onChange={...} className="..." />
      </div>
      <div>
        <label className="...">{t("billingZip")}</label>
        <input type="text" value={form.billingZip} onChange={...} className="..." />
      </div>
    </div>
  </div>
)}
```

#### Krok 1.5: CheckoutClient.tsx — GDPR + opt-out v Step 3 (payment)

Za stávající terms checkbox (řádek 688):

```tsx
{/* GDPR info text */}
<p className="text-xs text-muted">
  {t("gdprText")}{" "}
  <Link href="/privacy" className="text-rose underline" target="_blank">
    {t("gdprLink")}
  </Link>
</p>

{/* Newsletter opt-out */}
<label className="flex items-start gap-2 cursor-pointer">
  <input
    type="checkbox"
    checked={form.noNewsletter}
    onChange={(e) => setField("noNewsletter", e.target.checked)}
    className="mt-0.5 accent-rose"
  />
  <span className="text-xs text-muted">{t("noNewsletter")}</span>
</label>

{/* Survey opt-out */}
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

#### Krok 1.6: CheckoutClient.tsx — rozšířit submit data

V `checkStockAndSubmit()` (řádek 218), do JSON body přidat:
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

#### Krok 1.7: CheckoutClient.tsx — fakturační údaje v Step 4 (summary)

V summary sekci (řádek ~729-753), za kontaktní údaje:
```tsx
{form.wantsBilling && form.billingName && (
  <div className="flex justify-between">
    <span className="text-muted">{t("wantsBilling")}</span>
    <span className="text-ink text-right">
      {form.billingName}
      {form.billingIco && <span className="block text-xs text-muted">IČO: {form.billingIco}</span>}
      {form.billingDic && <span className="block text-xs text-muted">DIČ: {form.billingDic}</span>}
      {form.billingStreet && (
        <span className="block text-xs text-muted">
          {form.billingStreet}, {form.billingCity} {form.billingZip}
        </span>
      )}
    </span>
  </div>
)}
```

#### Krok 1.8: Překlady

**messages/cs.json** — do sekce `"checkout"` (řádek 1046):
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
"billingStreet": "Fakturační adresa — ulice",
"billingCity": "Město",
"billingZip": "PSČ"
```

**messages/uk.json** — ekvivalent v ukrajinštině.
**messages/ru.json** — ekvivalent v ruštině.

---

### FÁZE 2: Post-order stránka (DŮLEŽITÁ)

Nová public stránka kde zákazník vidí svou objednávku bez nutnosti loginu.

#### Krok 2.1: Nová route `/objednavka/[token]`

Vytvořit: `src/app/[locale]/(public)/objednavka/[token]/page.tsx`

Server component — načte objednávku podle `accessToken`:

```typescript
const order = await prisma.order.findUnique({
  where: { accessToken: token },
  include: {
    items: {
      include: {
        variant: { select: { lengthCm: true, color: true, product: { select: { name: true } } } },
      },
    },
  },
});
```

Zobrazí:
- **Stav objednávky** — stepper (vytvořena → zaplacena → odeslána → doručena)
- **Položky** — tabulka: název, délka, barva, gramáž/ks, cena
- **Dodací údaje** — adresa, způsob dopravy, kontakt
- **Platební údaje** — způsob platby, stav platby
- **Fakturační údaje** — pokud wantsBilling
- **Akce** (tlačítka):
  - "Zrušit objednávku" — jen pro stav AWAITING_PAYMENT/NEW
  - "Změnit platební metodu" — jen pro AWAITING_PAYMENT
  - "Znovu zaslat potvrzovací email"

#### Krok 2.2: Public API endpoints

Vytvořit: `src/app/api/public/orders/[token]/route.ts`

- **GET** — načte objednávku podle accessToken (veřejný, bez auth)
- **POST** — akce:
  - `action: "cancel"` — zruší objednávku (jen AWAITING_PAYMENT/NEW), uvolní rezervace
  - `action: "change-payment"` — změní platební metodu (jen AWAITING_PAYMENT):
    - TRANSFER → CARD: vytvoří Comgate platbu, redirect
    - CARD → TRANSFER: zruší Comgate, vrátí bank info
  - `action: "resend-email"` — znovu pošle potvrzovací email (rate limit: 1/5min)

#### Krok 2.3: Redirect z checkout success na order stránku

V `checkStockAndSubmit()` — API odpověď rozšířit o `accessToken`.

V API `src/app/api/public/orders/route.ts` — přidat `accessToken` do response:
```typescript
return NextResponse.json({
  success: true,
  orderId: order.id,
  orderNumber: order.orderNumber,
  accessToken: order.accessToken,  // NOVÉ
  paymentInfo: { ... },
}, { status: 201 });
```

CheckoutClient success state — místo inline zobrazení redirect na `/objednavka/{accessToken}`:
```typescript
if (orderData.redirect) {
  window.location.href = orderData.redirect; // Comgate
} else {
  router.push(`/objednavka/${orderData.accessToken}`);
}
```

#### Krok 2.4: Potvrzovací email — přidat odkaz na order stránku

V `getRetailOrderConfirmationEmail()` — přidat do parametrů `accessToken` a vygenerovat odkaz:
```
Sledujte stav objednávky: https://www.hairland.cz/cs/objednavka/{accessToken}
```

#### Krok 2.5: Client component pro order detail

Vytvořit: `src/app/[locale]/(public)/objednavka/[token]/OrderDetailClient.tsx`

Obsahuje:
- Status stepper (vizuální progress bar)
- Tabulka položek
- Dodací/kontaktní info
- Platební info (QR kód pro převodem)
- Akční tlačítka (cancel, change payment, resend email)
- Auto-refresh (polling každých 30s pro čekání na platbu)

---

### FÁZE 3: GDPR stránka redirect (NÍZKÁ)

#### Krok 3.1: Redirect z /zasady-zpracovani-udaju na /privacy

Stránka `/privacy` už existuje. Pokud uživatel chce URL `/zasady-zpracovani-udaju`:
- Vytvořit `src/app/[locale]/(public)/zasady-zpracovani-udaju/page.tsx` jako redirect na `/privacy`
- NEBO: v GDPR textu prostě odkázat na `/privacy` (jednodušší)

**Doporučení:** Odkázat na `/privacy` — stránka existuje, zbytečně nevytvářet redirect.

---

## Soubory k editaci/vytvořit

### FÁZE 1 (checkout compliance)
| # | Soubor | Akce | Změna |
|---|--------|------|-------|
| 1 | `prisma/schema.prisma` | EDIT | Přidat billing + opt-out + accessToken pole na Order |
| 2 | `src/app/api/public/orders/route.ts` | EDIT | Rozšířit Zod schema + uložení + accessToken generace + response |
| 3 | `src/app/[locale]/(public)/checkout/CheckoutClient.tsx` | EDIT | Form state + billing UI + GDPR + opt-out + submit data |
| 4 | `messages/cs.json` | EDIT | Checkout překlady (12 klíčů) |
| 5 | `messages/uk.json` | EDIT | Checkout překlady (UK) |
| 6 | `messages/ru.json` | EDIT | Checkout překlady (RU) |

### FÁZE 2 (post-order stránka)
| # | Soubor | Akce | Změna |
|---|--------|------|-------|
| 7 | `src/app/[locale]/(public)/objednavka/[token]/page.tsx` | NOVÝ | Server page — load order by token |
| 8 | `src/app/[locale]/(public)/objednavka/[token]/OrderDetailClient.tsx` | NOVÝ | Client component — order detail + akce |
| 9 | `src/app/api/public/orders/[token]/route.ts` | NOVÝ | GET order + POST akce (cancel/change-payment/resend) |
| 10 | `src/lib/email-templates.ts` | EDIT | Přidat accessToken link do confirmation emailu |

---

## Pořadí implementace

1. **Schema migrace** (Krok 1.1) — musí být první
2. **API rozšíření** (Krok 1.2) — přijímá nová data
3. **Checkout UI** (Kroky 1.3-1.7) — posílá nová data
4. **Překlady** (Krok 1.8) — podporuje UI
5. **Public order API** (Krok 2.2) — backend pro order stránku
6. **Order detail stránka** (Kroky 2.1, 2.5) — frontend
7. **Email rozšíření** (Krok 2.4) — odkaz na order detail
8. **Checkout redirect** (Krok 2.3) — místo inline success → order stránka

---

## Důležité poznámky

### Opt-out design
- Newsletter/survey opt-out jsou **NEGATIVNÍ souhlasy** — default je souhlas (checkbox nezaškrtnutý), zákazník se aktivně odhlásí zaškrtnutím
- Toto je standardní GDPR pattern pro české e-shopy
- Follow-up emaily (`cron/follow-up-emails`) by měly respektovat `noSurvey` flag
- Newsletter systém (pokud bude) musí respektovat `noNewsletter` flag

### accessToken security
- UUID v4 — dostatečně náhodný pro public přístup
- Nenahrazuje auth — zobrazuje jen read-only data + omezené akce
- Cancel možný jen pro AWAITING_PAYMENT/NEW stavy
- Rate limit na resend-email (1 per 5 min per order)

### B2B checkout
- B2B objednávky (salon login) předvyplní billing z profilu salonu
- `b2bInfo.ico`, `b2bInfo.dic` se použijí jako defaults

### Existující success pages
- CheckoutClient má inline success (řádky 308-372) pro TRANSFER (QR + bank info)
- A redirect pro CARD (Comgate → `/platba/vysledek`)
- Ve Fázi 2 oba tyto flow skončí na `/objednavka/[token]` místo inline

### Follow-up email respektování
- `src/app/api/cron/follow-up-emails/route.ts` — musí přidat check `WHERE noSurvey = false`
- Toto je mimo scope tohoto plánu ale důležité zmínit

---

## Priorita

| Fáze | Priorita | Důvod |
|------|----------|-------|
| Fáze 1 | **KRITICKÁ** | Compliance — GDPR, obchodní podmínky, fakturační údaje |
| Fáze 2 | **VYSOKÁ** | UX — zákazník musí vidět stav objednávky |
| Fáze 3 | **NÍZKÁ** | Jen URL alias — `/privacy` stačí |
