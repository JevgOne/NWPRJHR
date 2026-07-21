# TASK: Sjednotit platby v QR prodeji — jeden email s převodem i kartou

## Požadavek

Při prodeji přes QR scan (admin panel) je teď TRANSFER a CARD jako dva samostatné flow. Má být **jeden tok**: po prodeji se pošle JEDEN email zákazníkovi, který obsahuje:
1. Info pro bankovní převod (číslo účtu, VS, QR SPAYD kód)
2. Link na platební bránu Comgate pro platbu kartou

Zákazník si sám vybere jak zaplatí.

## Analýza

### Aktuální stav — Admin prodej (`/sales/new`)

**UI:** `src/app/(app)/sales/new/NewSaleWizard.tsx`
- 5 payment typů: TRANSFER, CASH, CARD, PROMO, WRITEOFF (řádky 731-736)
- Uživatel vybírá payment type PŘED dokončením prodeje

**API:** `src/app/api/sales/route.ts` POST (řádky 14-150)
- **CASH** (řádek 45-53): Sale → createInvoiceFromSale → sendInvoiceEmail (s PDF)
- **TRANSFER** (řádky 54-109): Sale → generateSpayd QR → sendPaymentDetailsEmail (bank info + QR)
- **CARD** (řádky 39): Žádná speciální logika! paymentType se uloží ale ŽÁDNÝ email, ŽÁDNÝ Comgate link
- **PROMO/WRITEOFF** (řádky 110-113): createInternalDocument

**Confirm payment:** `src/app/api/sales/[id]/confirm-payment/route.ts`
- Jen pro TRANSFER — admin potvrdí příjem platby → createInvoiceFromSale → sendInvoiceEmail

**Comgate v admin:** `src/app/api/admin/comgate/create/route.ts`
- Pracuje na úrovni **Invoice**, ne Sale
- Admin musí nejdřív vytvořit fakturu, pak může vytvořit Comgate platbu

### Klíčový problém

CARD flow v admin prodeji je **nefunkční** — žádný Comgate link se nevygeneruje, žádný email se nepošle. Hint `cardHint` tvrdí "zákazník obdrží platební odkaz", ale to se neděje.

### Existující email šablona

`src/lib/invoice-email.ts` — `sendPaymentDetailsEmail()` (řádky 138-244):
- Posílá HTML email s bank info + inline QR SPAYD kód
- **NEMÁ** Comgate link
- Překlady v cs/uk/ru

### Bankovní účet

Z DB: `Company.bankAccount` (default company)
- Fallback v kódu: `company?.bankAccount || "6424423004/5500"` (řádek 58 sales/route.ts)
- **POZOR**: Dřívější plán identifikoval špatný fallback — měl by být `7141812004/5500`. Toto je v jiném tasku (TASK-COMGATE-UNIFIED-EMAIL), ale implementátor by měl ověřit.

### Comgate integrace

`src/lib/comgate.ts` — `createPayment()`:
- Vstup: price (haléře), label (max 16 znaků), refId (VS), email, fullName
- Výstup: `{ success, transId, redirect }` — redirect je URL platební brány
- Callback: `src/app/api/comgate/callback/route.ts` — zpracovává PAID/CANCELLED

## Plán implementace

### Strategie

**Sloučit TRANSFER a CARD do jednoho flow:**
1. Admin vybere "Faktura" (místo TRANSFER/CARD) → paymentType zůstane TRANSFER v DB
2. API vytvoří Comgate payment + vygeneruje QR SPAYD
3. Jeden email zákazníkovi: bank info + QR + Comgate link
4. Zákazník platí jak chce — kartou nebo převodem

### Krok 1: API — vygenerovat Comgate link pro TRANSFER prodej

**Soubor:** `src/app/api/sales/route.ts`

**Řádky 54-109 (TRANSFER blok) — rozšířit o Comgate:**

```typescript
} else if (pt === "TRANSFER") {
  // TRANSFER: generate QR payment data + Comgate card link + send unified email
  const company = await prisma.company.findFirst({ where: { isDefault: true } });
  const vs = sale.saleNumber ?? String(Date.now()).slice(-10);
  const bankAccount = company?.bankAccount || "7141812004/5500";
  const iban = company?.bankIban || "CZ6755000000007141812004";

  // Generate QR code for bank transfer
  const spayd = generateSpayd({
    iban,
    amount: sale.totalAmount / 100,
    variableSymbol: vs,
    message: `Prodej ${sale.saleNumber ?? ""}`.trim(),
  });
  qrDataUrl = await generateQRCodeDataUrl(spayd);

  // Create Comgate payment for card option
  let comgateUrl: string | undefined;
  const saleForEmail = await prisma.sale.findUnique({
    where: { id: sale.id },
    select: {
      salon: { select: { email: true, name: true, language: true } },
      customer: { select: { email: true, name: true } },
      customerType: true,
    },
  });
  const recipientEmail = saleForEmail?.customerType === "SALON"
    ? saleForEmail.salon?.email
    : saleForEmail?.customer?.email;
  const recipientName = saleForEmail?.customerType === "SALON"
    ? saleForEmail.salon?.name ?? ""
    : saleForEmail?.customer?.name ?? "";
  const lang = saleForEmail?.customerType === "SALON"
    ? saleForEmail.salon?.language ?? "cs"
    : "cs";

  if (recipientEmail) {
    try {
      const comgateResult = await createPayment({
        price: sale.totalAmount,
        label: `Sale ${vs}`.slice(0, 16),
        refId: vs,
        email: recipientEmail,
        fullName: recipientName,
      });
      if (comgateResult.success && comgateResult.redirect) {
        comgateUrl = comgateResult.redirect;
        // NOTE: Pro admin sales nemáme comgateTransId sloupec na Sale.
        // Comgate callback hledá Payment.comgateTransId — musíme vytvořit 
        // záznam aby callback mohl párovat.
        // Alternativa: vytvořit proforma invoice + payment záznam.
        // Viz Krok 3 níže.
      }
    } catch (e) {
      console.error("[Sales API] Comgate payment creation failed:", e);
      // Non-fatal — customer can still pay by transfer
    }
  }

  // Send unified email with both payment options
  if (recipientEmail) {
    after(async () => {
      await sendPaymentDetailsEmail({
        recipientEmail,
        recipientName,
        lang,
        amount: sale.totalAmount,
        bankAccount,
        iban,
        variableSymbol: vs,
        saleNumber: sale.saleNumber ?? "",
        comgateUrl, // NEW — Comgate card payment link
      }).catch((e) => console.error("[Sales API] Payment details email failed:", e));
    });
  }

  paymentInfo = {
    bankAccount,
    variableSymbol: vs,
    amount: sale.totalAmount,
    iban,
  };
}
```

**Nový import na začátek souboru:**
```typescript
import { createPayment } from "@/lib/comgate";
```

### Krok 2: Rozšířit email šablonu o Comgate button

**Soubor:** `src/lib/invoice-email.ts`

**2a) Rozšířit interface `sendPaymentDetailsEmail`** (řádek 138):
```typescript
export async function sendPaymentDetailsEmail(opts: {
  recipientEmail: string;
  recipientName: string;
  lang: string;
  amount: number;
  bankAccount: string;
  iban: string;
  variableSymbol: string;
  saleNumber: string;
  comgateUrl?: string; // NEW — optional card payment link
}): Promise<{ sent: boolean; reason?: string }> {
```

**2b) Přidat Comgate button do HTML** (za QR kód, řádek ~199):

Po `</div>` za QR obrázkem (řádek ~199), přidat:

```typescript
const comgateHtml = opts.comgateUrl
  ? `<div style="text-align:center;margin:20px 0;">
      <p style="color:#9c8682;font-size:13px;margin:0 0 12px;">— ${t.orLabel} —</p>
      <a href="${opts.comgateUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#c98b88,#a96d6c);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
        ${t.payByCardLabel}
      </a>
    </div>`
  : "";
```

Vložit `${comgateHtml}` do HTML šablony za QR kód a před bank detail box.

**2c) Přidat nové překlady do `paymentEmailT`** (řádky 246-286):

```typescript
// Přidat do každého jazyka:
cs: {
  // ... existující klíče ...
  orLabel: "nebo",
  payByCardLabel: "Zaplatit kartou online",
},
uk: {
  // ... existující klíče ...
  orLabel: "або",
  payByCardLabel: "Оплатити карткою онлайн",
},
ru: {
  // ... existující klíče ...
  orLabel: "или",
  payByCardLabel: "Оплатить картой онлайн",
},
```

**2d) Aktualizovat text šablonu** (řádek 172-182):

Přidat do plain text verze:
```typescript
const text = [
  t.greeting(opts.recipientName),
  "",
  t.body(amount),
  "",
  `${t.bankAccountLabel}: ${opts.bankAccount}`,
  `${t.vsLabel}: ${opts.variableSymbol}`,
  `${t.amountLabel}: ${amount}`,
  "",
  // NEW: card payment option
  ...(opts.comgateUrl ? [`${t.orLabel}`, "", `${t.payByCardLabel}: ${opts.comgateUrl}`, ""] : []),
  t.footer,
].join("\n");
```

### Krok 3: Comgate callback — párování s admin sale

**Problém:** Comgate callback (`src/app/api/comgate/callback/route.ts`) hledá:
1. `Payment.comgateTransId` — pro admin invoice payments
2. `Order.comgateTransId` — pro e-shop orders

Pro admin sale TRANSFER s Comgate linkem potřebujeme, aby callback mohl párovat platbu.

**Řešení:** Vytvořit proforma invoice + payment záznam ihned po Comgate createPayment:

V sales/route.ts, po úspěšném `createPayment()`:
```typescript
if (comgateResult.success && comgateResult.redirect && comgateResult.transId) {
  comgateUrl = comgateResult.redirect;
  
  // Create proforma invoice to enable Comgate callback matching
  const invoice = await createInvoiceFromSale(sale.id);
  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: sale.totalAmount,
      date: new Date(),
      matchedVS: vs,
      source: "COMGATE",
      comgateTransId: comgateResult.transId,
      note: "Comgate platba - čeká na potvrzení",
    },
  });
}
```

**ALE POZOR:** `createInvoiceFromSale` vytvoří finální invoice se statusem ISSUED. To je problém — invoice by měla být vytvořena až po zaplacení (pro TRANSFER flow).

**Alternativní řešení (bezpečnější):** Přidat `comgateTransId` přímo na Sale model:

```prisma
model Sale {
  // ... existující pole ...
  comgateTransId String?  // NEW
}
```

A v callback přidat fallback pro Sale:
```typescript
// In comgate/callback/route.ts, after payment and order checks:
const sale = await prisma.sale.findFirst({
  where: { comgateTransId: transId },
});
if (sale && verified.status === "PAID") {
  // Trigger confirm-payment flow
  const invoice = await createInvoiceFromSale(sale.id);
  await prisma.payment.create({ ... });
  await prisma.invoice.update({ where: { id: invoice.id }, data: { status: "PAID" } });
}
```

**DOPORUČENÍ:** Alternativní řešení s `comgateTransId` na Sale je čistší. Schema change je jednoduchá a neblokuje.

### Krok 4: UI — sloučit TRANSFER + CARD do jednoho tlačítka

**Soubor:** `src/app/(app)/sales/new/NewSaleWizard.tsx`

**Řádky 731-736 — odstranit CARD, přejmenovat TRANSFER:**

```typescript
{([
  { key: "TRANSFER", label: t("paymentInvoice") },  // Bylo: paymentTransfer
  { key: "CASH", label: t("paymentCash") },
  { key: "PROMO", label: t("paymentPromo") },
  { key: "WRITEOFF", label: t("paymentWriteoff") },
] as const).map((pt) => (
```

**Řádky 764-769 — sloučit hinty:**
```typescript
{paymentType === "TRANSFER" && (
  <p className="text-xs text-muted mt-2">{t("invoiceHint")}</p>
)}
```

**Success screen (řádky 512-560) — přidat Comgate button:**

Po QR obrázku a bank info, přidat:
```tsx
{transferResult.comgateUrl && (
  <div className="mt-4 space-y-2">
    <p className="text-sm text-muted text-center">{t("orPayByCard")}</p>
    <Button
      variant="secondary"
      size="lg"
      className="w-full"
      onClick={() => window.open(transferResult.comgateUrl, '_blank')}
    >
      {t("payByCard")}
    </Button>
  </div>
)}
```

**Rozšířit transferResult state** (řádek ~83):
```typescript
const [transferResult, setTransferResult] = useState<{
  saleId: string;
  qrPayment?: string;
  paymentInfo?: { bankAccount: string; variableSymbol: string; amount: number; iban?: string };
  comgateUrl?: string; // NEW
} | null>(null);
```

**A nastavit po úspěšném prodeji** (řádek ~482-490):
```typescript
if (paymentType === "TRANSFER" && (sale.qrPayment || sale.paymentInfo)) {
  setTransferResult({
    saleId: sale.id,
    qrPayment: sale.qrPayment,
    paymentInfo: sale.paymentInfo,
    comgateUrl: sale.comgateUrl, // NEW — from API response
  });
}
```

### Krok 5: API response — přidat comgateUrl

**Soubor:** `src/app/api/sales/route.ts`

V TRANSFER bloku, uložit comgateUrl a vrátit v response:

```typescript
// Přidat proměnnou na začátek POST handleru:
let comgateUrl: string | null = null;

// V TRANSFER bloku po createPayment:
comgateUrl = comgateResult.redirect ?? null;

// V response (řádky 141-149):
return NextResponse.json(
  {
    ...serializeSaleForRole(full, session.user.role),
    invoice: invoice ?? undefined,
    qrPayment: qrDataUrl ?? undefined,
    paymentInfo: paymentInfo ?? undefined,
    comgateUrl: comgateUrl ?? undefined, // NEW
  },
  { status: 201 }
);
```

### Krok 6: Schema migration (pokud varianta s Sale.comgateTransId)

**Soubor:** `prisma/schema.prisma`

```prisma
model Sale {
  // ... za existující pole ...
  comgateTransId String?
}
```

**Migration:**
```bash
npx prisma db push
```

### Krok 7: Comgate callback — handle Sale payments

**Soubor:** `src/app/api/comgate/callback/route.ts`

Přidat nový fallback po kontrole Payment a Order (za řádek ~108):

```typescript
// Fallback 2: check if this transId belongs to an admin Sale (QR sale with Comgate)
const sale = await prisma.sale.findFirst({
  where: { comgateTransId: transId },
  include: { invoice: true },
});

if (sale) {
  if (verified.status === "PAID") {
    // Create invoice if doesn't exist yet
    if (!sale.invoice) {
      const { createInvoiceFromSale } = await import("@/lib/invoicing");
      const invoice = await createInvoiceFromSale(sale.id);
      
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: sale.totalAmount,
          date: new Date(),
          matchedVS: sale.saleNumber,
          source: "COMGATE",
          comgateTransId: transId,
          note: `Zaplaceno kartou online (Comgate ${transId})`,
        },
      });
      
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "PAID" },
      });
      
      // Send invoice email
      const { sendInvoiceEmail } = await import("@/lib/invoice-email");
      sendInvoiceEmail(invoice.id, { skipQr: true }).catch((e) =>
        console.error("[comgate/callback] Sale invoice email failed:", e)
      );
      
      // Add salon revenue for loyalty
      if (sale.salonId) {
        const { addSalonRevenueInTx } = await import("@/lib/loyalty");
        await prisma.$transaction(async (tx) => {
          await addSalonRevenueInTx(sale.salonId!, invoice.subtotal, tx);
        });
      }
    }
    
    // Notify owners
    const owners = await prisma.user.findMany({ where: { role: "OWNER" }, select: { id: true } });
    if (owners.length > 0) {
      await prisma.notification.createMany({
        data: owners.map((o) => ({
          recipientId: o.id,
          type: "INVOICE_PAID" as const,
          title: `Platba kartou za prodej ${sale.saleNumber}`,
          message: `Prodej ${sale.saleNumber} zaplacen kartou online (${(sale.totalAmount / 100).toFixed(0)} CZK).`,
          data: JSON.stringify({ saleId: sale.id, transId }),
        })),
      });
    }
  } else if (verified.status === "CANCELLED") {
    console.log(`Comgate payment ${transId} for sale ${sale.saleNumber} cancelled`);
  }
  return new NextResponse("OK", { status: 200 });
}
```

### Krok 8: Překlady

**`messages/cs.json`** — sekce `"sale"`:
```json
"paymentInvoice": "Faktura",
"invoiceHint": "Zákazník obdrží email s platebními údaji a možností platby kartou online.",
"orPayByCard": "Nebo zaplaťte kartou online:",
"payByCard": "Zaplatit kartou"
```

**`messages/uk.json`** — sekce `"sale"`:
```json
"paymentInvoice": "Рахунок",
"invoiceHint": "Клієнт отримає email з платіжними реквізитами та можливістю оплати карткою онлайн.",
"orPayByCard": "Або оплатіть карткою онлайн:",
"payByCard": "Оплатити карткою"
```

**`messages/ru.json`** — sekce `"sale"`:
```json
"paymentInvoice": "Счёт",
"invoiceHint": "Клиент получит email с платёжными реквизитами и возможностью оплаты картой онлайн.",
"orPayByCard": "Или оплатите картой онлайн:",
"payByCard": "Оплатить картой"
```

## Soubory k editaci

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `src/app/api/sales/route.ts` | TRANSFER blok: přidat Comgate createPayment, předat comgateUrl do emailu a response |
| 2 | `src/lib/invoice-email.ts` | sendPaymentDetailsEmail: přidat comgateUrl param, Comgate button v HTML, překlady |
| 3 | `src/app/(app)/sales/new/NewSaleWizard.tsx` | Odstranit CARD tlačítko, přejmenovat TRANSFER na Faktura, přidat Comgate button na success screen |
| 4 | `src/app/api/comgate/callback/route.ts` | Přidat fallback pro Sale.comgateTransId |
| 5 | `prisma/schema.prisma` | Přidat `comgateTransId String?` na Sale model |
| 6 | `messages/cs.json` | 4 nové klíče v sale sekci + 2 v invoice-email |
| 7 | `messages/uk.json` | Ekvivalent |
| 8 | `messages/ru.json` | Ekvivalent |

## Edge cases

1. **Comgate selhání:** Pokud `createPayment()` selže, email se pošle BEZ tlačítka "Zaplatit kartou" — jen s bankovními údaji. Non-fatal, graceful degradation.
2. **Zákazník bez emailu:** Pokud zákazník nemá email, Comgate payment se nevytvoří (potřebuje email). Jen QR se zobrazí na obrazovce admin panelu.
3. **Dvojí platba:** Zákazník zaplatí kartou I převodem. Po kartě: Comgate callback vytvoří invoice automaticky. Pokud pak přijde i převod: admin musí řešit ručně (vrátit). Stávající riziko.
4. **Comgate link expirace:** Comgate link má omezenou platnost (~24h). Po expiraci zákazník zaplatí převodem (údaje má v emailu).
5. **Admin confirm-payment:** Pokud admin potvrdí TRANSFER platbu ručně (přes `/sales/[id]/confirm-payment`), a Comgate callback přijde později — callback zjistí, že invoice už existuje a nic neduplikuje.
6. **CARD v DB:** Existující Sale záznamy s paymentType=CARD zůstávají. Jen se odebírá CARD z UI jako volba. E-shop orders stále používají CARD.

## Pořadí implementace

1. Schema change (prisma) — `comgateTransId` na Sale
2. API changes (sales/route.ts) — Comgate v TRANSFER flow
3. Email template (invoice-email.ts) — Comgate button
4. Comgate callback — Sale fallback
5. UI changes (NewSaleWizard.tsx) — sloučit tlačítka
6. Překlady

## Poznámky pro implementátora

- Bank account: ověřit jestli je v Company DB správný. Fallback: `7141812004/5500`
- IBAN: `CZ6755000000007141812004`
- Comgate `createPayment()` vrací `{ success, transId, redirect }`
- `sendPaymentDetailsEmail` je async — volat v `after()` callbacku
- Email HTML: Comgate button musí být výrazný ale sekundární (bankovní převod je primární metoda)
- Testovat: admin prodej TRANSFER → email obsahuje bank info + QR + Comgate link
- Testovat: Comgate selhání → email obsahuje jen bank info + QR
- Testovat: zákazník platí kartou → Comgate callback → invoice se vytvoří automaticky
- Testovat: zákazník platí převodem → admin confirm-payment → invoice se vytvoří
