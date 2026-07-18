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

  // Generate PDF
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
    skipQr: opts?.skipQr ?? true,
    company: {
      name: invoice.company.name,
      ico: invoice.company.ico,
      dic: invoice.company.dic,
      address: invoice.company.address,
      bankAccount: invoice.company.bankAccount,
      bankIban: invoice.company.bankIban,
      bankName: invoice.company.bankName,
      contactEmail: invoice.company.contactEmail,
      contactPhone: invoice.company.contactPhone,
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

  const emailContent = getInvoiceEmailContent(lang, {
    invoiceNumber: invoice.number,
    totalHalere: invoice.total,
    dueDate: invoice.dueDate,
    buyerName,
    bankAccount: invoice.company.bankAccount,
    variableSymbol: invoice.variableSymbol,
  });

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
      },
    ],
  });

  return { sent: true, to: recipientEmail };
}

/**
 * Send payment details email for TRANSFER sales (QR code + bank info).
 * No invoice attached — invoice comes after payment is confirmed.
 */
export async function sendPaymentDetailsEmail(opts: {
  recipientEmail: string;
  recipientName: string;
  lang: string;
  amount: number; // halere
  bankAccount: string;
  iban: string;
  variableSymbol: string;
  saleNumber: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { sent: false, reason: "no_api_key" };
  }
  if (!opts.recipientEmail) {
    return { sent: false, reason: "no_recipient_email" };
  }

  const { generateSpayd } = await import("./spayd");
  const { generateQRCodeDataUrl } = await import("./qr-code");

  const spayd = generateSpayd({
    iban: opts.iban,
    amount: opts.amount / 100,
    variableSymbol: opts.variableSymbol,
    message: `Prodej ${opts.saleNumber}`.trim(),
  });
  const qrDataUrl = await generateQRCodeDataUrl(spayd);
  // Extract base64 PNG for inline attachment (Gmail blocks data: URLs)
  const qrBase64 = qrDataUrl.split(",")[1];

  const t = paymentEmailT[resolveLang(opts.lang)];
  const amount = formatCZK(opts.amount);

  const subject = t.subject();
  const text = [
    t.greeting(opts.recipientName),
    "",
    t.body(amount),
    "",
    `${t.bankAccountLabel}: ${opts.bankAccount}`,
    `${t.vsLabel}: ${opts.variableSymbol}`,
    `${t.amountLabel}: ${amount}`,
    "",
    t.footer,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="${opts.lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fdfaf7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(58,44,42,0.08);">
    <div style="background:#fdfaf7;padding:24px 24px 16px;text-align:center;">
      <a href="https://hairland.cz" style="text-decoration:none;">
        <span style="font-size:28px;font-weight:700;color:#3a2c2a;letter-spacing:1px;">Hairland</span>
      </a>
    </div>
    <div style="padding:32px 24px;">
      <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">${t.greeting(opts.recipientName)}</p>
      <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">${t.body(amount)}</p>

      <div style="text-align:center;margin:24px 0;">
        <img src="cid:qr-payment" width="180" height="180" alt="QR platba" style="border:1px solid #ead9cf;border-radius:8px;" />
      </div>

      <div style="background:#f7efe8;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:3px solid #c2a36b;">
        <p style="color:#3a2c2a;font-size:14px;font-weight:600;margin:0 0 8px;">${t.detailsLabel}</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#9c8682;font-size:13px;">${t.bankAccountLabel}:</td><td style="padding:4px 0;color:#3a2c2a;font-size:13px;text-align:right;font-weight:600;">${opts.bankAccount}</td></tr>
          <tr><td style="padding:4px 0;color:#9c8682;font-size:13px;">${t.vsLabel}:</td><td style="padding:4px 0;color:#3a2c2a;font-size:13px;text-align:right;font-weight:600;">${opts.variableSymbol}</td></tr>
          <tr><td style="padding:4px 0;color:#9c8682;font-size:13px;">${t.amountLabel}:</td><td style="padding:4px 0;color:#3a2c2a;font-size:13px;text-align:right;font-weight:600;">${amount}</td></tr>
        </table>
      </div>

      <p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">${t.footer}</p>
    </div>
    <div style="background:#f7efe8;padding:20px 24px;text-align:center;border-top:1px solid #ead9cf;">
      <p style="margin:0;color:#9c8682;font-size:12px;">&copy; ${new Date().getFullYear()} Hairland.cz</p>
    </div>
  </div>
</body>
</html>`;

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "info@hairland.cz",
    replyTo: "info@hairland.cz",
    to: opts.recipientEmail,
    subject,
    text,
    html,
    attachments: [
      {
        filename: "qr-platba.png",
        content: Buffer.from(qrBase64, "base64"),
        contentType: "image/png",
        contentId: "qr-payment",
      },
    ],
    headers: {
      "X-Entity-Ref-ID": `payment-${opts.variableSymbol}`,
    },
  });

  return { sent: true };
}

const paymentEmailT: Record<Lang, {
  subject: () => string;
  greeting: (name: string) => string;
  body: (amount: string) => string;
  detailsLabel: string;
  bankAccountLabel: string;
  vsLabel: string;
  amountLabel: string;
  footer: string;
}> = {
  cs: {
    subject: () => "Platební údaje | Hairland",
    greeting: (name) => `Dobrý den, ${name},`,
    body: (amount) => `děkujeme za Vaši objednávku. Prosíme o úhradu částky <strong>${amount}</strong> na následující účet:`,
    detailsLabel: "Platební údaje:",
    bankAccountLabel: "Bankovní účet",
    vsLabel: "Variabilní symbol",
    amountLabel: "Částka",
    footer: "Po přijetí platby Vám zašleme fakturu emailem. Děkujeme!",
  },
  uk: {
    subject: () => "Платіжні реквізити | Hairland",
    greeting: (name) => `Вітаємо, ${name},`,
    body: (amount) => `дякуємо за Ваше замовлення. Просимо оплатити суму <strong>${amount}</strong> на наступний рахунок:`,
    detailsLabel: "Платіжні реквізити:",
    bankAccountLabel: "Банківський рахунок",
    vsLabel: "Варіабельний символ",
    amountLabel: "Сума",
    footer: "Після отримання оплати ми надішлемо Вам рахунок-фактуру електронною поштою. Дякуємо!",
  },
  ru: {
    subject: () => "Платёжные реквизиты | Hairland",
    greeting: (name) => `Здравствуйте, ${name},`,
    body: (amount) => `благодарим за Ваш заказ. Просим оплатить сумму <strong>${amount}</strong> на следующий счёт:`,
    detailsLabel: "Платёжные реквизиты:",
    bankAccountLabel: "Банковский счёт",
    vsLabel: "Вариабельный символ",
    amountLabel: "Сумма",
    footer: "После получения оплаты мы отправим Вам счёт-фактуру по электронной почте. Спасибо!",
  },
};

// --- Email template ---

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
    subject: (n) => `Faktura ${n} | Hairland`,
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
    subject: (n) => `Рахунок ${n} | Hairland`,
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
    subject: (n) => `Счёт ${n} | Hairland`,
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

  const text = [
    t.greeting(data.buyerName),
    "",
    t.body(amount).replace(/<[^>]*>/g, ""),
    t.attachmentNote,
    "",
    t.summaryLabel,
    `${t.invoiceLabel}: ${data.invoiceNumber}`,
    `${t.amountLabel}: ${amount}`,
    `${t.dateLabel}: ${today}`,
    "",
    t.footer,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fdfaf7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(58,44,42,0.08);">
    <div style="background:#fdfaf7;padding:24px 24px 16px;text-align:center;">
      <a href="https://hairland.cz" style="text-decoration:none;">
        <span style="font-size:28px;font-weight:700;color:#3a2c2a;letter-spacing:1px;">Hairland</span>
      </a>
    </div>
    <div style="padding:32px 24px;">
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

      <p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">${t.footer}</p>
    </div>
    <div style="background:#f7efe8;padding:20px 24px;text-align:center;border-top:1px solid #ead9cf;">
      <p style="margin:0;color:#9c8682;font-size:12px;">&copy; ${new Date().getFullYear()} Hairland.cz</p>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
