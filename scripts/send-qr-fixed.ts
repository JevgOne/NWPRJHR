import "dotenv/config";
import { Resend } from "resend";
import { generateQRCodeBuffer } from "../src/lib/qr-code";
import { put } from "@vercel/blob";

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Correct IBAN for 7141812004/5500
  const spayd = "SPD*1.0*ACC:CZ6155000000007141812004*AM:15125.00*CC:CZK*X-VS:20260042*MSG:Objednavka 20260042";
  const qrBuffer = await generateQRCodeBuffer(spayd);
  const blob = await put(`email-qr/qr-fixed-${Date.now()}.png`, qrBuffer, {
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
            <p style="color:#3a2c2a;font-size:20px;font-weight:700;margin:0 0 10px;">15 125 Kč</p>
            <table style="border-collapse:collapse;">
              <tr><td style="padding:2px 8px 2px 0;color:#9c8682;font-size:12px;">Účet</td><td style="padding:2px 0;color:#3a2c2a;font-size:13px;font-family:'Courier New',monospace;font-weight:600;">7141812004/5500</td></tr>
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
        <tr style="border-bottom:1px solid #ead9cf;">
          <td style="padding:5px 0;color:#9c8682;font-size:12px;">Celkem bez DPH</td>
          <td style="padding:5px 0;color:#3a2c2a;font-size:12px;text-align:right;">12 500 Kč</td>
        </tr>
        <tr style="border-bottom:1px solid #ead9cf;">
          <td style="padding:5px 0;color:#9c8682;font-size:12px;">DPH 21%</td>
          <td style="padding:5px 0;color:#3a2c2a;font-size:12px;text-align:right;">2 625 Kč</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#3a2c2a;font-size:13px;font-weight:700;">Celkem s DPH</td>
          <td style="padding:6px 0;color:#3a2c2a;font-size:13px;font-weight:700;text-align:right;">15 125 Kč</td>
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
    subject: "Platba za objednávku OBJ-0042 | Hairland",
    text: "Vaše objednávka byla potvrzena. Částka: 15 125 Kč s DPH. VS: 20260042. Účet: 7141812004/5500.",
    html,
  });
  console.log("✓ Sent:", r.data?.id);
}

main();
