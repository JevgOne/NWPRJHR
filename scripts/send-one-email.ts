import "dotenv/config";
import { Resend } from "resend";
import { generateSpayd } from "../src/lib/spayd";
import { generateQRCodeBuffer } from "../src/lib/qr-code";
import { put } from "@vercel/blob";

async function main() {
  const which = process.argv[2]; // "qr" or "paid"
  if (!which || !["qr", "paid"].includes(which)) {
    console.error("Usage: npx tsx scripts/send-one-email.ts <qr|paid>");
    process.exit(1);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  if (which === "qr") {
    // Generate and upload QR
    const spayd = generateSpayd({
      iban: "CZ5555000000006424423004",
      amount: 15125,
      variableSymbol: "20260042",
      message: "Faktura 20260042",
    });
    const qrBuffer = await generateQRCodeBuffer(spayd);
    const blob = await put(`email-qr/qr-${Date.now()}.png`, qrBuffer, {
      access: "public",
      contentType: "image/png",
    });
    console.log(`QR uploaded: ${blob.url}`);

    const html = `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fdfaf7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(58,44,42,0.08);">
    <div style="background:#fdfaf7;padding:16px 24px 8px;text-align:center;">
      <a href="https://hairland.cz" style="text-decoration:none;">
        <img src="https://hairland.cz/og-image.jpg" alt="Hairland" width="280" style="width:100%;max-width:280px;height:auto;display:inline-block;" />
      </a>
    </div>
    <div style="padding:20px 24px;">
      <p style="color:#3a2c2a;font-size:14px;line-height:1.5;margin:0 0 12px;">Vaše objednávka byla potvrzena. Naskenujte QR kód nebo zadejte údaje ručně.</p>

      <div style="background:#f7efe8;border-radius:10px;padding:16px;margin:0 0 12px;text-align:center;border:1px solid #ead9cf;">
        <table style="width:100%;border-collapse:collapse;"><tr>
          <td style="width:160px;vertical-align:top;text-align:center;padding:0 12px 0 0;">
            <img src="${blob.url}" alt="QR platba" width="140" height="140" style="display:block;margin:0 auto;" />
          </td>
          <td style="vertical-align:middle;text-align:left;">
            <p style="color:#3a2c2a;font-size:20px;font-weight:700;margin:0 0 10px;">15 125,00 Kč</p>
            <table style="border-collapse:collapse;">
              <tr><td style="padding:2px 8px 2px 0;color:#9c8682;font-size:12px;">Účet</td><td style="padding:2px 0;color:#3a2c2a;font-size:13px;font-family:'Courier New',monospace;font-weight:600;">6424423004/5500</td></tr>
              <tr><td style="padding:2px 8px 2px 0;color:#9c8682;font-size:12px;">VS</td><td style="padding:2px 0;color:#3a2c2a;font-size:13px;font-family:'Courier New',monospace;font-weight:600;">20260042</td></tr>
              <tr><td style="padding:2px 8px 2px 0;color:#9c8682;font-size:12px;">Banka</td><td style="padding:2px 0;color:#3a2c2a;font-size:13px;">Raiffeisenbank</td></tr>
            </table>
          </td>
        </tr></table>
      </div>

      <div style="background:#fff3f3;border-radius:6px;padding:8px 12px;margin:0 0 12px;border-left:3px solid #c98b88;">
        <p style="color:#a96d6c;font-size:12px;font-weight:600;margin:0;">⏰ Platba musí být připsána do 6 hodin, jinak bude objednávka stornována.</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin:0 0 8px;">
        <tr style="border-bottom:1px solid #ead9cf;">
          <td style="padding:5px 0;color:#3a2c2a;font-size:12px;">Panenské slovanské vlasy 50cm #4</td>
          <td style="padding:5px 0;color:#9c8682;font-size:12px;text-align:right;">200g — 7 500 Kč</td>
        </tr>
        <tr style="border-bottom:1px solid #ead9cf;">
          <td style="padding:5px 0;color:#3a2c2a;font-size:12px;">Prémiové evropské vlasy 60cm #6</td>
          <td style="padding:5px 0;color:#9c8682;font-size:12px;text-align:right;">150g — 5 000 Kč</td>
        </tr>
      </table>
    </div>
    <div style="background:#f7efe8;padding:12px 24px;text-align:center;border-top:1px solid #ead9cf;">
      <p style="margin:0;color:#9c8682;font-size:11px;">© 2026 <a href="https://hairland.cz" style="color:#a96d6c;text-decoration:none;">Hairland.cz</a> — Prémiové vlasy</p>
    </div>
  </div>
</body>
</html>`;

    const r = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "info@hairland.cz",
      replyTo: "info@hairland.cz",
      to: "lunamanazer@gmail.com",
      subject: "Výzva k platbě za objednávku | Hairland",
      text: "Vaše objednávka byla potvrzena. Částka: 15 125 Kč. VS: 20260042. Účet: 6424423004/5500.",
      html,
    });
    console.log("✓ QR payment email sent:", r.data?.id);

  } else {
    // paid — invoice PDF attached, no QR
    const { generateInvoicePdf } = await import("../src/lib/invoice-pdf");
    const pdfBytes = await generateInvoicePdf({
      type: "INVOICE",
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
      skipQr: true,
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
        { description: "Panenské slovanské vlasy 50cm Přírodní hnědá #4", quantity: 200, unit: "g", pricePerUnit: 37500, lineTotal: 750000 },
        { description: "Prémiové evropské vlasy 60cm Tmavá blond #6", quantity: 150, unit: "g", pricePerUnit: 33334, lineTotal: 500000 },
      ],
    });
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

    const html = `<!DOCTYPE html>
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
      <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 8px;">Potvrzujeme příjem Vaší platby ve výši <strong>15 125,00 Kč</strong>.</p>
      <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 20px;">Faktura č. <strong>2026-0042</strong> je přiložena k tomuto emailu.</p>

      <div style="background:#f7efe8;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:3px solid #c2a36b;">
        <p style="color:#3a2c2a;font-size:14px;font-weight:600;margin:0 0 8px;">Shrnutí:</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#9c8682;font-size:13px;">Faktura:</td><td style="padding:4px 0;color:#3a2c2a;font-size:13px;text-align:right;font-weight:600;">2026-0042</td></tr>
          <tr><td style="padding:4px 0;color:#9c8682;font-size:13px;">Částka:</td><td style="padding:4px 0;color:#3a2c2a;font-size:13px;text-align:right;font-weight:600;">15 125,00 Kč</td></tr>
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

    const r = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "info@hairland.cz",
      replyTo: "info@hairland.cz",
      to: "lunamanazer@gmail.com",
      subject: "Potvrzení platby a faktura 2026-0042 | Hairland",
      text: "Potvrzujeme příjem Vaší platby 15 125 Kč. Faktura 2026-0042 je v příloze.",
      html,
      attachments: [
        { filename: "faktura-2026-0042.pdf", content: pdfBase64, contentType: "application/pdf" },
      ],
    });
    console.log("✓ Payment received email sent:", r.data?.id);
  }
}

main();
