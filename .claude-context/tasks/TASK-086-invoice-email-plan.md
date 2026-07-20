# TASK-086: Automatické odesílání faktur emailem (v2)

## Kontext

**Faktura = DOKLAD O ZAPLACENÍ. Nic bez peněz.**

Aktuální stav: Po prodeji se vždy vytvoří faktura v DB (pro TRANSFER), ale email se NEPOSÍLÁ. Toto je špatně — faktura se nesmí vystavit dříve než jsou peníze přijaty.

---

## Pravidla dle typu platby

| Typ platby | Odečte sklad | Vytvoří fakturu | Kdy se pošle email | QR platba |
|---|---|---|---|---|
| **CASH** | Ihned | Ihned (peníze přijaty) | IHNED po prodeji | Ne (zaplaceno) |
| **TRANSFER** | Ihned | AŽ PO potvrzení platby | AŽ PO potvrzení platby | Ano (zobrazit na stránce) |
| **PROMO** | Ihned | NIKDY | NIKDY | Ne |
| **WRITEOFF** | Ihned | NIKDY | NIKDY | Ne |

---

## Část 1: Změna POST /api/sales — přestat vytvářet fakturu pro TRANSFER

### Soubor: `src/app/api/sales/route.ts` (řádky 34-46)

**Aktuální stav:**
```ts
const pt = parsed.data.paymentType ?? "TRANSFER";
try {
  if (pt === "TRANSFER") {
    await createInvoiceFromSale(sale.id);       // ← ŠPATNĚ: faktura bez peněz
  } else if (pt === "PROMO" || pt === "WRITEOFF") {
    await createInternalDocument(sale.id, pt);
  }
  // CASH — no auto-document
} catch (docErr) { ... }
```

**Nový stav:**
```ts
import { sendInvoiceEmail } from "@/lib/invoice-email";
import { generateSpayd } from "@/lib/spayd";
import { generateQRCodeDataUrl } from "@/lib/qr-code";

// ...

const pt = parsed.data.paymentType ?? "TRANSFER";
let invoice: { id: string; number: string } | null = null;
let qrDataUrl: string | null = null;

try {
  if (pt === "CASH") {
    // CASH: peníze přijaty → faktura + email IHNED
    const inv = await createInvoiceFromSale(sale.id);
    invoice = { id: inv.id, number: inv.number };
    sendInvoiceEmail(inv.id, { skipQr: true }).catch((e) =>
      console.error("[Sales API] Invoice email failed:", e)
    );
  } else if (pt === "TRANSFER") {
    // TRANSFER: jen platební údaje, faktura se vytvoří AŽ po zaplacení
    // Generovat QR kód pro platbu
    const company = await prisma.company.findFirstOrThrow({ where: { isDefault: true } });
    if (company.bankIban) {
      const spayd = generateSpayd({
        iban: company.bankIban,
        amount: sale.totalAmount / 100, // halere → CZK
        variableSymbol: sale.saleNumber ?? sale.id.slice(0, 8),
        message: `Prodej ${sale.saleNumber ?? ""}`.trim(),
      });
      qrDataUrl = await generateQRCodeDataUrl(spayd);
    }
    // NO invoice created here — will be created when admin confirms payment
  }
  // PROMO/WRITEOFF: nic — žádná faktura, žádný interní doklad
  // (Odstraněno volání createInternalDocument — uživatel řekl "žádná faktura")
} catch (docErr) {
  console.error("[Sales API] Post-sale processing failed:", docErr);
}

// ... (existing full sale load) ...

return NextResponse.json(
  {
    ...serializeSaleForRole(full, session.user.role),
    invoice: invoice ?? undefined,
    qrPayment: qrDataUrl ?? undefined,
    paymentInfo: pt === "TRANSFER" ? {
      bankAccount: company?.bankAccount,
      variableSymbol: sale.saleNumber ?? sale.id.slice(0, 8),
      amount: sale.totalAmount,
      iban: company?.bankIban,
    } : undefined,
  },
  { status: 201 }
);
```

### Klíčové změny:
1. **CASH**: Nově vytvoří `createInvoiceFromSale` + pošle email (`sendInvoiceEmail`)
2. **TRANSFER**: NEVYTVÁŘÍ fakturu. Místo toho generuje QR data a vrací platební údaje v response
3. **PROMO/WRITEOFF**: Odstraněno `createInternalDocument` — žádná faktura

### Pozor na PROMO/WRITEOFF:
Aktuální kód volá `createInternalDocument(sale.id, pt)` — to vytvoří CREDIT_NOTE s 0 Kč pro účetní evidenci. Uživatel řekl "žádná faktura". **Otázka pro team-lead: má se `createInternalDocument` odstranit úplně, nebo ponechat pro účetnictví?** V plánu ho odstraňuji, ale může být potřeba zpět.

---

## Část 2: Nová funkce `sendInvoiceEmail(invoiceId)`

### Nový soubor: `src/lib/invoice-email.ts`

Funkce:
1. Načte fakturu z DB (include company, items, sale → salon/customer)
2. Skipne CREDIT_NOTE (interní doklady)
3. Najde email příjemce (salon.email NEBO customer.email NEBO invoice.buyerEmail)
4. Vygeneruje PDF pomocí `generateInvoicePdf()` (existuje v `src/lib/invoice-pdf.ts`)
5. Pošle email přes Resend API přímo (ne přes `sendNotificationEmail` — ta nepodporuje attachments)

```ts
// src/lib/invoice-email.ts

import { prisma } from "./db";
import { generateInvoicePdf, type InvoicePdfData } from "./invoice-pdf";

interface InvoiceEmailResult {
  sent: boolean;
  to?: string;
  reason?: string;
}

/**
 * Send invoice email with PDF attachment via Resend.
 * Silently skips if no recipient email, no API key, or internal document.
 */
export async function sendInvoiceEmail(
  invoiceId: string,
  opts?: { skipQr?: boolean }
): Promise<InvoiceEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return { sent: false, reason: "no_api_key" };
  }

  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: {
      company: true,
      items: true,
      sale: {
        select: {
          salon: { select: { email: true, name: true, language: true } },
          customer: { select: { email: true, name: true } },
          customerType: true,
        },
      },
    },
  });

  // Don't send emails for internal documents
  if (invoice.type === "CREDIT_NOTE") {
    return { sent: false, reason: "internal_document" };
  }

  // Determine recipient email
  const recipientEmail =
    invoice.sale?.customerType === "SALON"
      ? invoice.sale?.salon?.email
      : invoice.sale?.customer?.email ?? invoice.buyerEmail;

  if (!recipientEmail) {
    return { sent: false, reason: "no_recipient_email" };
  }

  const lang = invoice.buyerLanguage ?? "cs";
  const buyerName =
    invoice.sale?.customerType === "SALON"
      ? invoice.sale?.salon?.name ?? invoice.buyerName
      : invoice.sale?.customer?.name ?? invoice.buyerName;

  // Generate PDF (skipQr = true → invoice already paid, no QR needed on PDF)
  const pdfData: InvoicePdfData = {
    type: invoice.type as "INVOICE" | "CREDIT_NOTE",
    number: invoice.number,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    taxDate: invoice.taxDate,
    variableSymbol: invoice.variableSymbol,
    buyerName: invoice.buyerName,
    buyerIco: invoice.buyerIco,
    buyerDic: invoice.buyerDic,
    buyerAddress: invoice.buyerAddress,
    buyerLanguage: invoice.buyerLanguage,
    subtotal: invoice.subtotal,
    vatRate: invoice.vatRate,
    vatAmount: invoice.vatAmount,
    total: invoice.total,
    roundingAmount: invoice.roundingAmount,
    note: invoice.note,
    skipQr: opts?.skipQr ?? true, // Default: skip QR (faktura = doklad o zaplacení → peníze už přijaty)
    company: {
      name: invoice.company.name,
      ico: invoice.company.ico,
      dic: invoice.company.dic,
      address: invoice.company.address,
      bankAccount: invoice.company.bankAccount,
      bankIban: invoice.company.bankIban,
      bankName: invoice.company.bankName,
    },
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unit: item.unit,
      pricePerUnit: item.pricePerUnit,
      lineTotal: item.lineTotal,
    })),
  };

  const pdfBytes = await generateInvoicePdf(pdfData);
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

  // Get email content
  const emailContent = getInvoiceEmailContent(lang, {
    invoiceNumber: invoice.number,
    totalHalere: invoice.total,
    dueDate: invoice.dueDate,
    buyerName,
    bankAccount: invoice.company.bankAccount,
    variableSymbol: invoice.variableSymbol,
  });

  // Send via Resend with PDF attachment
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "info@hairland.cz",
    replyTo: "info@hairland.cz",
    to: recipientEmail,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
    attachments: [
      {
        filename: `faktura-${invoice.number}.pdf`,
        content: pdfBase64,
        contentType: "application/pdf",
      },
    ],
  });

  return { sent: true, to: recipientEmail };
}
```

### Email template `getInvoiceEmailContent()` — ve stejném souboru

Faktura je vždy potvrzení zaplacení (peníze už přijaty), takže email je "potvrzení platby + faktura v příloze".

```ts
type Lang = "cs" | "uk" | "ru";

function resolveLang(lang: string): Lang {
  if (lang === "uk" || lang === "ru") return lang;
  return "cs";
}

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ", { minimumFractionDigits: 2 }) + " CZK";
}

function formatDate(date: Date, lang: string): string {
  const localeMap: Record<string, string> = { cs: "cs-CZ", uk: "uk-UA", ru: "ru-RU" };
  return date.toLocaleDateString(localeMap[lang] ?? "cs-CZ");
}

const invoiceEmailT: Record<Lang, {
  subject: (n: string) => string;
  greeting: (name: string) => string;
  body: (amount: string) => string;
  attachmentNote: string;
  summaryLabel: string;
  invoiceLabel: string;
  amountLabel: string;
  dateLabel: string;
  cta: string;
  footer: string;
}> = {
  cs: {
    subject: (n) => `Potvrzení platby a faktura ${n} | Hairland`,
    greeting: (name) => `Dobrý den, ${name},`,
    body: (amount) => `potvrzujeme přijetí Vaší platby ve výši <strong>${amount}</strong>.`,
    attachmentNote: "Faktura je přiložena k tomuto emailu ve formátu PDF.",
    summaryLabel: "Shrnutí:",
    invoiceLabel: "Faktura",
    amountLabel: "Částka",
    dateLabel: "Datum platby",
    cta: "Zobrazit faktury",
    footer: "Děkujeme za Váš nákup! Pokud máte dotazy, kontaktujte nás na info@hairland.cz.",
  },
  uk: {
    subject: (n) => `Підтвердження оплати та рахунок ${n} | Hairland`,
    greeting: (name) => `Вітаємо, ${name},`,
    body: (amount) => `підтверджуємо отримання Вашої оплати у розмірі <strong>${amount}</strong>.`,
    attachmentNote: "Рахунок-фактуру додано до цього листа у форматі PDF.",
    summaryLabel: "Підсумок:",
    invoiceLabel: "Рахунок",
    amountLabel: "Сума",
    dateLabel: "Дата оплати",
    cta: "Переглянути рахунки",
    footer: "Дякуємо за Вашу покупку! Якщо маєте запитання, зверніться до нас на info@hairland.cz.",
  },
  ru: {
    subject: (n) => `Подтверждение оплаты и счёт ${n} | Hairland`,
    greeting: (name) => `Здравствуйте, ${name},`,
    body: (amount) => `подтверждаем получение Вашей оплаты в размере <strong>${amount}</strong>.`,
    attachmentNote: "Счёт-фактура приложен к этому письму в формате PDF.",
    summaryLabel: "Итог:",
    invoiceLabel: "Счёт",
    amountLabel: "Сумма",
    dateLabel: "Дата оплаты",
    cta: "Просмотреть счета",
    footer: "Благодарим за покупку! Если есть вопросы, свяжитесь с нами по адресу info@hairland.cz.",
  },
};

export function getInvoiceEmailContent(
  lang: string,
  data: {
    invoiceNumber: string;
    totalHalere: number;
    dueDate: Date;
    buyerName: string;
    bankAccount: string;
    variableSymbol: string;
  }
): { subject: string; text: string; html: string } {
  const t = invoiceEmailT[resolveLang(lang)];
  const amount = formatCZK(data.totalHalere);
  const today = formatDate(new Date(), lang);

  const subject = t.subject(data.invoiceNumber);

  // Plain text
  const text = [
    t.greeting(data.buyerName),
    "",
    // Strip HTML from body for text version
    `${t.body(amount).replace(/<[^>]*>/g, "")}`,
    t.attachmentNote,
    "",
    `${t.summaryLabel}`,
    `${t.invoiceLabel}: ${data.invoiceNumber}`,
    `${t.amountLabel}: ${amount}`,
    `${t.dateLabel}: ${today}`,
    "",
    t.footer,
  ].join("\n");

  // HTML — uses Hairland branding (same wrapper pattern as email-templates.ts)
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fdfaf7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(58,44,42,0.08);">
    <div style="background:#fdfaf7;padding:24px 24px 16px;text-align:center;">
      <a href="https://hairland.cz" style="text-decoration:none;">
        <img src="https://hairland.cz/og-image.jpg" alt="Hairland" width="400" style="width:100%;max-width:400px;height:auto;display:inline-block;" />
      </a>
    </div>
    <div style="padding:32px 24px;">
      <p style="color:#3a2c2a;font-size:22px;font-weight:600;text-align:center;margin:0 0 16px;">Platba přijata &#10003;</p>
      <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">${t.greeting(data.buyerName)}</p>
      <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 8px;">${t.body(amount)}</p>
      <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${t.attachmentNote}</p>

      <div style="background:#f7efe8;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:3px solid #c2a36b;">
        <p style="color:#3a2c2a;font-size:14px;font-weight:600;margin:0 0 8px;">${t.summaryLabel}</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#9c8682;font-size:13px;">${t.invoiceLabel}:</td><td style="padding:4px 0;color:#3a2c2a;font-size:13px;text-align:right;font-weight:600;">${data.invoiceNumber}</td></tr>
          <tr><td style="padding:4px 0;color:#9c8682;font-size:13px;">${t.amountLabel}:</td><td style="padding:4px 0;color:#3a2c2a;font-size:13px;text-align:right;font-weight:600;">${amount}</td></tr>
          <tr><td style="padding:4px 0;color:#9c8682;font-size:13px;">${t.dateLabel}:</td><td style="padding:4px 0;color:#3a2c2a;font-size:13px;text-align:right;">${today}</td></tr>
        </table>
      </div>

      <div style="text-align:center;margin:28px 0;">
        <a href="https://hairland.cz/app/invoices"
           style="display:inline-block;background:linear-gradient(135deg,#c98b88,#a96d6c);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:500;letter-spacing:0.5px;">
          ${t.cta}
        </a>
      </div>

      <p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">${t.footer}</p>
    </div>
    <div style="background:#f7efe8;padding:20px 24px;text-align:center;border-top:1px solid #ead9cf;">
      <p style="margin:0;color:#9c8682;font-size:12px;">&copy; ${new Date().getFullYear()} Hairland.cz &mdash; Pr&eacute;miov&eacute; vlasy</p>
      <p style="margin:4px 0 0;color:#9c8682;font-size:11px;">
        <a href="https://hairland.cz" style="color:#a96d6c;text-decoration:none;">hairland.cz</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
```

---

## Část 3: Potvrzení platby pro TRANSFER → vytvoření faktury + email

### Problém

Aktuální systém plateb (`POST /api/payments`) vyžaduje `invoiceId` — zapisuje platbu k existující faktuře. Ale s novým flow pro TRANSFER žádná faktura v momentu prodeje NEEXISTUJE.

### Řešení: Nová akce "confirmPayment" na Sale

Přidat nový endpoint nebo akci, kterou admin zavolá když dostane platbu za TRANSFER prodej. Tato akce:
1. Vytvoří fakturu (`createInvoiceFromSale`)
2. Automaticky ji označí jako PAID
3. Pošle email s fakturou (`sendInvoiceEmail`)

### Nový endpoint: `POST /api/sales/[id]/confirm-payment`

**Nový soubor: `src/app/api/sales/[id]/confirm-payment/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createInvoiceFromSale } from "@/lib/invoicing";
import { sendInvoiceEmail } from "@/lib/invoice-email";
import { logAudit, getClientIp } from "@/lib/audit";
import { addSalonRevenueInTx } from "@/lib/loyalty";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  // Verify sale exists and is TRANSFER without invoice
  const sale = await prisma.sale.findUniqueOrThrow({
    where: { id },
    include: { invoice: true, salon: true },
  });

  if (sale.paymentType !== "TRANSFER") {
    return NextResponse.json(
      { error: "Only TRANSFER sales can have payment confirmed" },
      { status: 400 }
    );
  }

  if (sale.invoice) {
    return NextResponse.json(
      { error: "Invoice already exists for this sale" },
      { status: 400 }
    );
  }

  // 1. Create invoice
  const invoice = await createInvoiceFromSale(sale.id, body.companyId);

  // 2. Mark invoice as PAID immediately + record payment
  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.total,
        date: new Date(),
        matchedVS: invoice.variableSymbol,
        source: "MANUAL",
        note: "Platba potvrzena adminem",
      },
    });

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID" },
    });

    // Add salon revenue for loyalty
    if (sale.salonId && invoice.type === "INVOICE") {
      await addSalonRevenueInTx(sale.salonId, invoice.subtotal, tx);
    }
  });

  // 3. Send invoice email with PDF (async, non-blocking)
  sendInvoiceEmail(invoice.id, { skipQr: true }).catch((e) =>
    console.error("[ConfirmPayment] Invoice email failed:", e)
  );

  // 4. Audit log
  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "PAYMENT_CONFIRMED",
    entity: "Sale",
    entityId: id,
    detail: { invoiceId: invoice.id, invoiceNumber: invoice.number, amount: invoice.total },
    ipAddress: getClientIp(request),
  }).catch(() => {});

  return NextResponse.json({
    invoice: { id: invoice.id, number: invoice.number },
    status: "PAID",
  });
}
```

### Frontend: Tlačítko "Potvrdit platbu" na seznamu prodejů

Sale list page nebo sale detail page — pro TRANSFER prodeje bez faktury zobrazit tlačítko:

```tsx
{sale.paymentType === "TRANSFER" && !sale.invoice && (
  <Button
    size="sm"
    variant="primary"
    onClick={() => confirmPayment(sale.id)}
  >
    {t("confirmPayment")}
  </Button>
)}
```

Kde `confirmPayment`:
```ts
const confirmPayment = async (saleId: string) => {
  const res = await fetch(`/api/sales/${saleId}/confirm-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (res.ok) {
    // Reload — sale now has invoice
    router.refresh();
  }
};
```

---

## Část 4: Úprava Order Complete flow

### Soubor: `src/app/api/orders/[id]/route.ts` (řádky 274-293)

Objednávky (B2B) platí vždy převodem. S novým flow:
- Order complete → Sale se vytvoří (stock deducted)
- Faktura se NEVYTVÁŘÍ → čeká se na platbu
- Admin později potvrdí platbu přes `POST /api/sales/[saleId]/confirm-payment`

**Aktuální stav:**
```ts
let invoice;
try {
  invoice = await createInvoiceFromSale(sale.id, body.companyId);
} catch (e) {
  console.error("[Order Complete] createInvoiceFromSale failed:", ...);
  ...
}

createSalonNotification({
  salonId: result.salonId,
  type: "INVOICE_ISSUED",
  ...
}).catch(() => {});
```

**Nový stav:**
```ts
// NO invoice creation — invoice is created when payment is confirmed
// Send salon notification with payment info instead
createSalonNotification({
  salonId: result.salonId,
  type: "ORDER_CONFIRMED",  // or a new type like "PAYMENT_REQUESTED"
  data: {
    saleId: sale.id,
    saleNumber: sale.saleNumber,
    amount: sale.totalAmount,
  },
  sendEmail: true,  // Salon gets email: "Objednávka dokončena, čekáme na platbu"
}).catch(() => {});

logAudit({
  userId: session.user.id,
  userEmail: session.user.email ?? undefined,
  action: "COMPLETE",
  entity: "Order",
  entityId: id,
  detail: { saleId: sale.id, saleNumber: sale.saleNumber },
  ipAddress: getClientIp(request),
});

return NextResponse.json({
  order: result.order,
  sale: { id: sale.id, saleNumber: sale.saleNumber },
  // No invoice in response — will be created after payment
});
```

**Pozor:** Toto je BREAKING CHANGE — aktuální response vrací `invoice` objekt. Frontend (OrderDetailClient) může na to spoléhat. Zkontrolovat.

### Kontrola OrderDetailClient

Soubor: `src/app/(app)/orders/[id]/OrderDetailClient.tsx` — `doAction("complete")` na řádku ~87-97. Response handler může očekávat `invoice`. Potřeba upravit.

---

## Část 5: Úprava existujícího Payment flow

### Soubor: `src/app/api/payments/route.ts`

Stávající `POST /api/payments` zůstává beze změny — slouží pro zaznamenání platby k EXISTUJÍCÍ faktuře (např. CASH faktury co se platí dodatečně, nebo jiné scénáře).

Ale přidat: když `wasPaid === true`, odeslat email s fakturou (pro případ že faktura existovala ale email se ještě neposlal):

```ts
// After existing wasPaid notification code (line ~103):
if (result.wasPaid) {
  // ... existing notification code ...

  // Send invoice email (if not sent before)
  sendInvoiceEmail(parsed.data.invoiceId, { skipQr: true }).catch((e) =>
    console.error("[Payments API] Invoice email failed:", e)
  );
}
```

---

## Část 6: QR platba po TRANSFER prodeji

### 6a. Response z POST /api/sales

Pro TRANSFER prodej vrátit QR data a platební údaje v response (viz Část 1). Frontend je zobrazí.

### 6b. QR endpoint pro pozdější přístup

**Nový soubor: `src/app/api/sales/[id]/qr/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSpayd } from "@/lib/spayd";
import { generateQRCodeBuffer } from "@/lib/qr-code";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const sale = await prisma.sale.findUniqueOrThrow({
    where: { id },
    include: { invoice: true },
  });

  // Only for TRANSFER sales without invoice (not yet paid)
  if (sale.paymentType !== "TRANSFER" || sale.invoice) {
    return NextResponse.json({ error: "QR not available" }, { status: 400 });
  }

  const company = await prisma.company.findFirstOrThrow({
    where: { isDefault: true },
  });

  if (!company.bankIban) {
    return NextResponse.json({ error: "No IBAN configured" }, { status: 500 });
  }

  const spayd = generateSpayd({
    iban: company.bankIban,
    amount: sale.totalAmount / 100,
    variableSymbol: sale.saleNumber ?? sale.id.slice(0, 8),
    message: `Prodej ${sale.saleNumber ?? ""}`.trim(),
  });

  const qrBuffer = await generateQRCodeBuffer(spayd);
  return new Response(qrBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
```

### 6c. Frontend: Success screen v NewSaleWizard

V `src/app/(app)/sales/new/NewSaleWizard.tsx` — po úspěšném TRANSFER prodeji zobrazit platební údaje + QR místo přesměrování.

```tsx
// New state
const [saleSuccess, setSaleSuccess] = useState<{
  saleNumber?: string;
  qrPayment?: string;
  paymentInfo?: {
    bankAccount: string;
    variableSymbol: string;
    amount: number;
    iban?: string;
  };
} | null>(null);

// In handleSubmit, after successful response:
const saleData = await res.json();
if (saleData.qrPayment || saleData.paymentInfo) {
  setSaleSuccess({
    saleNumber: saleData.saleNumber,
    qrPayment: saleData.qrPayment,
    paymentInfo: saleData.paymentInfo,
  });
} else {
  router.push("/sales");
}

// Success screen JSX:
{saleSuccess && (
  <div className="max-w-md mx-auto space-y-4">
    <Card>
      <div className="text-center space-y-4">
        <div className="text-green-600 text-3xl">✓</div>
        <h2 className="text-lg font-semibold">{t("saleCompleted")}</h2>

        {saleSuccess.qrPayment && (
          <>
            <p className="text-sm text-muted">{t("scanQrToPay")}</p>
            <img
              src={saleSuccess.qrPayment}
              alt="QR platba"
              className="mx-auto w-48 h-48"
            />
          </>
        )}

        {saleSuccess.paymentInfo && (
          <div className="text-left space-y-1 text-sm bg-latte rounded-lg p-4">
            <div className="flex justify-between">
              <span className="text-muted">{t("bankAccount")}:</span>
              <span className="font-mono">{saleSuccess.paymentInfo.bankAccount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t("variableSymbol")}:</span>
              <span className="font-mono">{saleSuccess.paymentInfo.variableSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t("amount")}:</span>
              <span className="font-semibold">
                {(saleSuccess.paymentInfo.amount / 100).toLocaleString("cs-CZ")} CZK
              </span>
            </div>
          </div>
        )}

        <Button onClick={() => router.push("/sales")} className="w-full">
          {t("done")}
        </Button>
      </div>
    </Card>
  </div>
)}
```

---

## Část 7: Email s platebními údaji pro TRANSFER (volitelné)

Po prodeji s TRANSFER, pokud má zákazník/salon email, poslat email s QR kódem a platebními údaji (NE fakturu — tu pošle až po zaplacení).

### Funkce `sendPaymentRequestEmail(saleId)` v `src/lib/invoice-email.ts`

```ts
export async function sendPaymentRequestEmail(saleId: string): Promise<InvoiceEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return { sent: false, reason: "no_api_key" };
  }

  const sale = await prisma.sale.findUniqueOrThrow({
    where: { id: saleId },
    include: {
      salon: { select: { email: true, name: true, language: true } },
      customer: { select: { email: true, name: true } },
    },
  });

  const recipientEmail =
    sale.customerType === "SALON"
      ? sale.salon?.email
      : sale.customer?.email;

  if (!recipientEmail) return { sent: false, reason: "no_recipient_email" };

  const company = await prisma.company.findFirstOrThrow({ where: { isDefault: true } });
  const lang = sale.salon?.language ?? "cs";
  const buyerName = sale.salon?.name ?? sale.customer?.name ?? "";

  // Generate QR code
  let qrDataUrl: string | null = null;
  if (company.bankIban) {
    const { generateSpayd } = await import("./spayd");
    const { generateQRCodeDataUrl } = await import("./qr-code");
    const spayd = generateSpayd({
      iban: company.bankIban,
      amount: sale.totalAmount / 100,
      variableSymbol: sale.saleNumber ?? sale.id.slice(0, 8),
      message: `Prodej ${sale.saleNumber ?? ""}`.trim(),
    });
    qrDataUrl = await generateQRCodeDataUrl(spayd);
  }

  // Email content — "Výzva k platbě" (payment request, NOT invoice)
  const { subject, text, html } = getPaymentRequestEmailContent(lang, {
    buyerName,
    amount: sale.totalAmount,
    bankAccount: company.bankAccount,
    variableSymbol: sale.saleNumber ?? sale.id.slice(0, 8),
    iban: company.bankIban,
    qrDataUrl,
  });

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "info@hairland.cz",
    replyTo: "info@hairland.cz",
    to: recipientEmail,
    subject,
    text,
    html,
  });

  return { sent: true, to: recipientEmail };
}
```

`getPaymentRequestEmailContent` — HTML šablona s QR kódem (jako v `scripts/send-test-invoice.ts` email 1), platebními údaji, ale BEZ faktury v příloze. Text: "Výzva k platbě — naskenujte QR kód v mobilním bankovnictví."

**Volat v POST /api/sales po TRANSFER prodeji:**
```ts
if (pt === "TRANSFER") {
  // ... QR generation ...
  sendPaymentRequestEmail(sale.id).catch((e) =>
    console.error("[Sales API] Payment request email failed:", e)
  );
}
```

---

## Soubory — kompletní přehled

| Soubor | Akce | Popis |
|---|---|---|
| **`src/lib/invoice-email.ts`** | NOVÝ | `sendInvoiceEmail()`, `sendPaymentRequestEmail()`, email templates |
| `src/app/api/sales/route.ts` | UPRAVIT | CASH: invoice+email. TRANSFER: QR+paymentInfo. PROMO/WRITEOFF: nic. |
| **`src/app/api/sales/[id]/confirm-payment/route.ts`** | NOVÝ | Admin potvrdí platbu → create invoice + mark PAID + send email |
| **`src/app/api/sales/[id]/qr/route.ts`** | NOVÝ | QR PNG endpoint pro TRANSFER prodeje |
| `src/app/api/payments/route.ts` | UPRAVIT | Přidat `sendInvoiceEmail` po `wasPaid` |
| `src/app/api/orders/[id]/route.ts` | UPRAVIT | Odstranit `createInvoiceFromSale` z complete akce |
| `src/app/(app)/sales/new/NewSaleWizard.tsx` | UPRAVIT | Success screen s QR + platebními údaji pro TRANSFER |
| `messages/cs.json` | UPRAVIT | Přidat překlady (confirmPayment, scanQrToPay, etc.) |
| `messages/uk.json` | UPRAVIT | Přidat překlady |
| `messages/ru.json` | UPRAVIT | Přidat překlady |

---

## Pořadí implementace

1. **`src/lib/invoice-email.ts`** — jádro (sendInvoiceEmail + templates)
2. **`src/app/api/sales/route.ts`** — CASH flow (nejdůležitější fix) + TRANSFER bez faktury
3. **`src/app/api/sales/[id]/confirm-payment/route.ts`** — admin potvrdí platbu pro TRANSFER
4. **`src/app/api/orders/[id]/route.ts`** — odstranit auto-invoice z order complete
5. **`src/app/api/payments/route.ts`** — email po wasPaid
6. **Frontend** — QR success screen + tlačítko "Potvrdit platbu"
7. **Překlady**
8. **`src/app/api/sales/[id]/qr/route.ts`** — QR endpoint (nice-to-have)

---

## Edge cases

1. **Zákazník bez emailu**: `sendInvoiceEmail` vrátí `{ sent: false, reason: "no_recipient_email" }` — neselže
2. **Resend API key chybí (dev)**: Vrátí `{ sent: false, reason: "no_api_key" }`
3. **Admin zavolá confirm-payment dvakrát**: `createInvoiceFromSale` vyhodí "Invoice already exists for this sale"
4. **TRANSFER prodej z Order**: Admin potvrdí platbu přes `POST /api/sales/[saleId]/confirm-payment` — stejný flow
5. **Stávající faktury (migrace)**: Existující TRANSFER faktury (ISSUED status) zůstanou. Nový flow platí jen pro nové prodeje.
6. **Částečná platba**: `confirm-payment` endpoint je "all or nothing" — potvrdí celou částku. Pro částečné platby se dá rozšířit později.
7. **PDF logo**: `generateInvoicePdf` v `src/lib/invoice-pdf.ts` už existuje a generuje profesionální PDF. Ověřit zda obsahuje logo — pokud ne, přidat. (Logo URL: `https://hairland.cz/og-image.jpg` nebo lokální asset.)
8. **QR na PDF**: Pro CASH faktury se generuje PDF s `skipQr: true` (peníze přijaty, QR zbytečný). Pro faktury obecně `skipQr` defaultuje na `true` protože faktura = potvrzení platby.

---

## Otevřené otázky pro uživatele

1. **PROMO/WRITEOFF interní doklad**: Stávající kód volá `createInternalDocument()` — má se odstranit úplně, nebo ponechat pro účetní evidenci? V tomto plánu je odstraněno.
2. **Email s platebními údaji (Část 7)**: Má se po TRANSFER prodeji automaticky poslat email s QR kódem a platebními údaji, nebo stačí zobrazit na stránce?
3. **Logo na PDF**: `generateInvoicePdf` aktuálně generuje PDF — ověřit zda obsahuje logo Hairland. Pokud ne, je to separátní task.
