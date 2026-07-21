import "dotenv/config";
import { Resend } from "resend";
import { generateInvoicePdf } from "../src/lib/invoice-pdf";
import { generateSpayd } from "../src/lib/spayd";
import { generateQRCodeBuffer } from "../src/lib/qr-code";
import { put } from "@vercel/blob";

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const invoiceData = {
    type: "INVOICE" as const,
    number: "2026-0042",
    issueDate: new Date("2026-07-02"),
    dueDate: new Date("2026-07-16"),
    taxDate: new Date("2026-07-02"),
    variableSymbol: "20260042",
    buyerName: "Salon Luna Test",
    buyerIco: "12345678",
    buyerAddress: "Vinohradská 123, 120 00 Praha 2",
    buyerLanguage: "cs",
    subtotal: 1250000,
    vatRate: 21,
    vatAmount: 262500,
    total: 1512500,
    roundingAmount: 0,
    note: "Děkujeme za Váš nákup!",
    skipQr: false, // QR on invoice for payment request
    company: {
      name: "Altro servis group s.r.o.",
      ico: "23673389",
      dic: "CZ23673389",
      address: "Školská 660/3, Nové Město, 110 00 Praha",
      bankAccount: "6424423004/5500",
      bankIban: "CZ5555000000006424423004",
      bankName: "Raiffeisenbank",
    },
    items: [
      {
        description: "Panenské slovanské vlasy 50cm Přírodní hnědá #4",
        quantity: 200,
        unit: "g",
        pricePerUnit: 37500,
        lineTotal: 750000,
      },
      {
        description: "Prémiové evropské vlasy 60cm Tmavá blond #6",
        quantity: 150,
        unit: "g",
        pricePerUnit: 33334,
        lineTotal: 500000,
      },
    ],
  };

  // Generate paid invoice (no QR)
  const paidInvoiceData = { ...invoiceData, skipQr: true };
  console.log("Generating invoices...");
  const pdfWithQr = await generateInvoicePdf(invoiceData);
  const pdfPaid = await generateInvoicePdf(paidInvoiceData);
  const pdfPaidBase64 = Buffer.from(pdfPaid).toString("base64");
  console.log(`Invoice PDFs generated`);

  // Generate and upload QR code to Vercel Blob
  const spayd = generateSpayd({
    iban: "CZ5555000000006424423004",
    amount: 15125,
    variableSymbol: "20260042",
    message: "Faktura 20260042",
  });
  const qrBuffer = await generateQRCodeBuffer(spayd);
  console.log("Uploading QR to Vercel Blob...");
  const blob = await put("email-qr/test-qr-20260042.png", qrBuffer, {
    access: "public",
    contentType: "image/png",
  });
  const qrUrl = blob.url;
  console.log(`QR uploaded: ${qrUrl}`);

  // --- Email 1: Order confirmed — QR payment (no invoice attached) ---
  const qrEmailHtml = `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fdfaf7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(58,44,42,0.08);">
    <div style="background:#fdfaf7;padding:24px 24px 16px;text-align:center;">
      <a href="https://hairland.cz" style="text-decoration:none;">
        <img src="https://hairland.cz/og-image.jpg" alt="Hairland" width="400" style="width:100%;max-width:400px;height:auto;display:inline-block;" />
      </a>
    </div>
    <div style="padding:32px 24px;">
      <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">Dobrý den,</p>
      <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 8px;">Vaše objednávka byla potvrzena. Níže naleznete údaje pro platbu.</p>
      <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">Stačí naskenovat QR kód v mobilním bankovnictví.</p>

      <div style="background:#f7efe8;border-radius:12px;padding:24px 20px;margin:20px 0;text-align:center;border:1px solid #ead9cf;">
        <p style="color:#9c8682;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">QR platba</p>
        <img src="${qrUrl}" alt="QR platba" width="180" height="180" style="display:block;margin:0 auto 16px;" />
        <p style="color:#3a2c2a;font-size:22px;font-weight:700;margin:0 0 8px;">15 125,00 CZK</p>
        <p style="color:#9c8682;font-size:13px;margin:0 0 4px;">Účet: 6424423004/5500 (Raiffeisenbank)</p>
        <p style="color:#9c8682;font-size:13px;margin:0 0 4px;">VS: 20260042</p>
        <p style="color:#9c8682;font-size:13px;margin:0;">Splatnost: 16. 7. 2026</p>
      </div>

      <div style="background:#f7efe8;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:3px solid #c2a36b;">
        <p style="color:#3a2c2a;font-size:14px;font-weight:600;margin:0 0 8px;">Položky objednávky:</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr style="border-bottom:1px solid #ead9cf;">
            <td style="padding:6px 0;color:#3a2c2a;font-size:13px;">Panenské slovanské vlasy 50cm #4</td>
            <td style="padding:6px 0;color:#9c8682;font-size:13px;text-align:right;">200g — 7 500 Kč</td>
          </tr>
          <tr style="border-bottom:1px solid #ead9cf;">
            <td style="padding:6px 0;color:#3a2c2a;font-size:13px;">Prémiové evropské vlasy 60cm #6</td>
            <td style="padding:6px 0;color:#9c8682;font-size:13px;text-align:right;">150g — 5 000 Kč</td>
          </tr>
        </table>
      </div>

      <p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">Po přijetí platby Vám zašleme fakturu a potvrzení.</p>
    </div>
    <div style="background:#f7efe8;padding:20px 24px;text-align:center;border-top:1px solid #ead9cf;">
      <p style="margin:0;color:#9c8682;font-size:12px;">© 2026 Hairland.cz — Prémiové vlasy</p>
      <p style="margin:4px 0 0;color:#9c8682;font-size:11px;">
        <a href="https://hairland.cz" style="color:#a96d6c;text-decoration:none;">hairland.cz</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  console.log("Sending email 1: QR payment...");
  const r1 = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "info@hairland.cz",
    replyTo: "info@hairland.cz",
    to: "lunamanazer@gmail.com",
    subject: "Výzva k platbě za objednávku OBJ-2026-0042 | Hairland",
    text: "Vaše objednávka byla potvrzena. Částka: 15 125 CZK. VS: 20260042. Účet: 6424423004/5500.",
    html: qrEmailHtml,
  });
  console.log("✓ Email 1 sent:", r1.data?.id);

  // --- Email 2: Payment received — invoice PDF attached (no QR) ---
  const invoiceEmailHtml = `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fdfaf7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(58,44,42,0.08);">
    <div style="background:#fdfaf7;padding:24px 24px 16px;text-align:center;">
      <a href="https://hairland.cz" style="text-decoration:none;">
        <img src="https://hairland.cz/og-image.jpg" alt="Hairland" width="400" style="width:100%;max-width:400px;height:auto;display:inline-block;" />
      </a>
    </div>
    <div style="padding:32px 24px;">
      <p style="color:#3a2c2a;font-size:22px;font-weight:600;text-align:center;margin:0 0 16px;">Platba přijata ✓</p>
      <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">Dobrý den,</p>
      <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 8px;">Potvrzujeme příjem Vaší platby ve výši <strong>15 125,00 CZK</strong>.</p>
      <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">Faktura č. <strong>2026-0042</strong> je přiložena k tomuto emailu.</p>

      <div style="background:#f7efe8;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:3px solid #c2a36b;">
        <p style="color:#3a2c2a;font-size:14px;font-weight:600;margin:0 0 8px;">Shrnutí:</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#9c8682;font-size:13px;">Faktura:</td><td style="padding:4px 0;color:#3a2c2a;font-size:13px;text-align:right;font-weight:600;">2026-0042</td></tr>
          <tr><td style="padding:4px 0;color:#9c8682;font-size:13px;">Částka:</td><td style="padding:4px 0;color:#3a2c2a;font-size:13px;text-align:right;font-weight:600;">15 125,00 CZK</td></tr>
          <tr><td style="padding:4px 0;color:#9c8682;font-size:13px;">Datum platby:</td><td style="padding:4px 0;color:#3a2c2a;font-size:13px;text-align:right;">2. 7. 2026</td></tr>
        </table>
      </div>

      <div style="text-align:center;margin:28px 0;">
        <a href="https://hairland.cz/salon/invoices"
           style="display:inline-block;background:linear-gradient(135deg,#c98b88,#a96d6c);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:500;letter-spacing:0.5px;">
          Zobrazit faktury
        </a>
      </div>

      <p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">Děkujeme za Váš nákup! Pokud máte jakékoliv dotazy, kontaktujte nás na info@hairland.cz.</p>
    </div>
    <div style="background:#f7efe8;padding:20px 24px;text-align:center;border-top:1px solid #ead9cf;">
      <p style="margin:0;color:#9c8682;font-size:12px;">© 2026 Hairland.cz — Prémiové vlasy</p>
      <p style="margin:4px 0 0;color:#9c8682;font-size:11px;">
        <a href="https://hairland.cz" style="color:#a96d6c;text-decoration:none;">hairland.cz</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  console.log("Sending email 2: Payment received + invoice PDF...");
  const r2 = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "info@hairland.cz",
    replyTo: "info@hairland.cz",
    to: "lunamanazer@gmail.com",
    subject: "Potvrzení platby a faktura 2026-0042 | Hairland",
    text: "Potvrzujeme příjem Vaší platby 15 125 CZK. Faktura 2026-0042 je v příloze.",
    html: invoiceEmailHtml,
    attachments: [
      {
        filename: "faktura-2026-0042.pdf",
        content: pdfPaidBase64,
        contentType: "application/pdf",
      },
    ],
  });
  console.log("✓ Email 2 sent:", r2.data?.id);

  console.log("\nDone! 2 emails sent to lunamanazer@gmail.com");
}

main();
