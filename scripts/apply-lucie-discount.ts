/**
 * One-time script: Apply 10% discount to Lucie Mysíková's reservation.
 * - Cancel existing Comgate payments
 * - Update invoice F2026-0033 total from 570000 → 456000 haléřů
 * - Create new Comgate payment for 456000
 * - Create Payment record in DB
 * - Send email with new payment link
 *
 * Usage: npx tsx scripts/apply-lucie-discount.ts
 */
import { config } from "dotenv";
config({ path: ".env.production.local" });
config({ path: ".env.local" });

import { Resend } from "resend";

const EXISTING_TRANS_IDS = ["5QVG-FPVC-JDJ2", "UQWH-LXI9-YFJM"];
const INVOICE_ID = "cmt1bsvoa000304jl5nqeloz2";
const INVOICE_NUMBER = "F2026-0033";
const CUSTOMER_EMAIL = "luciemysikova@seznam.cz";
const CUSTOMER_NAME = "Lucie Mysíková";
const OLD_AMOUNT = 570000; // 5 700 Kč
const NEW_AMOUNT = 456000; // 4 560 Kč (after 10% discount on 11 400 total = 1 140 Kč off)
const DISCOUNT_AMOUNT = OLD_AMOUNT - NEW_AMOUNT; // 114000 = 1 140 Kč
const REF_ID = "PAY-20260033";
const LABEL = "Doplatek F0033";
const BASE_URL = "https://www.hairland.cz";

const COMGATE_MERCHANT = (process.env.COMGATE_MERCHANT || "").trim();
const COMGATE_SECRET = (process.env.COMGATE_SECRET || "").trim();
const COMGATE_TEST = (process.env.COMGATE_TEST || "").trim() === "true";
const COMGATE_API = "https://payments.comgate.cz/v1.0";

const TURSO_DATABASE_URL = (process.env.TURSO_DATABASE_URL || "").trim();
const TURSO_AUTH_TOKEN = (process.env.TURSO_AUTH_TOKEN || "").trim();

function parseResponse(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(text).entries()) {
    result[key] = value;
  }
  return result;
}

async function comgateRequest(endpoint: string, params: Record<string, string>) {
  const body = new URLSearchParams({
    merchant: COMGATE_MERCHANT,
    secret: COMGATE_SECRET,
    ...params,
  });
  const response = await fetch(`${COMGATE_API}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  return parseResponse(await response.text());
}

function buildEmailHtml(redirectUrl: string) {
  const amountFormatted = (NEW_AMOUNT / 100).toLocaleString("cs-CZ");
  const discountFormatted = (DISCOUNT_AMOUNT / 100).toLocaleString("cs-CZ");
  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fdfaf7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(58,44,42,0.08);">
    <div style="background:#fdfaf7;padding:16px 24px 8px;text-align:center;">
      <a href="https://hairland.cz" style="text-decoration:none;">
        <img src="https://hairland.cz/og-image.jpg" alt="Hairland" width="280" style="width:100%;max-width:280px;height:auto;display:inline-block;" />
      </a>
    </div>
    <div style="padding:24px;">
      <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 12px;">Dobr&yacute; den, ${CUSTOMER_NAME},</p>
      <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">Na z&aacute;klad&ecaron; dohodnut&eacute; 10% slevy byl V&aacute;&scaron; doplatek sn&iacute;&zcaron;en z&nbsp;5&nbsp;700&nbsp;K&ccaron; na <strong>4&nbsp;560&nbsp;K&ccaron;</strong>.</p>
      <p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">N&iacute;&zcaron;e naleznete odkaz k &uacute;hrad&ecaron; aktualizovan&eacute; &ccaron;&aacute;stky.</p>
      <div style="background:#f7efe8;border-radius:10px;padding:16px 20px;margin:0 0 20px;border:1px solid #ead9cf;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#9c8682;font-size:13px;">Faktura:</td><td style="padding:4px 0;color:#3a2c2a;font-size:13px;text-align:right;font-weight:600;">${INVOICE_NUMBER}</td></tr>
          <tr><td style="padding:4px 0;color:#9c8682;font-size:13px;">Sleva:</td><td style="padding:4px 0;color:#2e7d32;font-size:13px;text-align:right;font-weight:600;">-${discountFormatted} K&ccaron;</td></tr>
          <tr><td style="padding:4px 0;color:#9c8682;font-size:13px;">&Ccaron;&aacute;stka k &uacute;hrad&ecaron;:</td><td style="padding:4px 0;color:#3a2c2a;font-size:17px;text-align:right;font-weight:700;">${amountFormatted} K&ccaron;</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${redirectUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#c98b88,#a96d6c);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:16px;font-weight:500;letter-spacing:0.5px;">
          Zaplatit ${amountFormatted} K&ccaron; kartou
        </a>
      </div>
      <p style="color:#9c8682;font-size:12px;line-height:1.5;margin:16px 0 0;text-align:center;">Po kliknut&iacute; budete p&rcaron;esm&ecaron;rov&aacute;ni na bezpe&ccaron;nou platebn&iacute; br&aacute;nu Comgate.</p>
      <p style="color:#9c8682;font-size:12px;line-height:1.5;margin:8px 0 0;text-align:center;">Pokud m&aacute;te jak&eacute;koliv dotazy, kontaktujte n&aacute;s na <a href="mailto:info@hairland.cz" style="color:#a96d6c;">info@hairland.cz</a>.</p>
    </div>
    <div style="background:#f7efe8;padding:12px 24px;text-align:center;border-top:1px solid #ead9cf;">
      <p style="margin:0;color:#9c8682;font-size:11px;">&copy; 2026 <a href="https://hairland.cz" style="color:#a96d6c;text-decoration:none;">Hairland.cz</a> &mdash; Pr&eacute;miov&eacute; vlasy</p>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  if (!COMGATE_MERCHANT || !COMGATE_SECRET) {
    console.error("COMGATE_MERCHANT or COMGATE_SECRET not set!");
    process.exit(1);
  }
  if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
    console.error("TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not set!");
    process.exit(1);
  }

  console.log(`Comgate merchant: ${COMGATE_MERCHANT}, test mode: ${COMGATE_TEST}`);
  console.log(`Discount: ${(DISCOUNT_AMOUNT / 100).toLocaleString("cs-CZ")} Kč (10% z 11 400 Kč)`);
  console.log(`Old amount: ${(OLD_AMOUNT / 100).toLocaleString("cs-CZ")} Kč → New amount: ${(NEW_AMOUNT / 100).toLocaleString("cs-CZ")} Kč`);

  // Step 1: Cancel existing Comgate payments
  console.log("\n=== Step 1: Cancelling existing Comgate payments ===\n");

  for (const transId of EXISTING_TRANS_IDS) {
    console.log(`Checking ${transId}...`);
    const status = await comgateRequest("status", { transId });
    console.log(`  status=${status.status}, price=${status.price}`);

    if (status.code === "0" && status.status === "PENDING") {
      console.log(`  Cancelling...`);
      const cancelResult = await comgateRequest("cancel", { transId });
      if (cancelResult.code === "0") {
        console.log(`  CANCELLED OK`);
      } else {
        console.log(`  Cancel failed: ${cancelResult.message} (code=${cancelResult.code})`);
        console.log(`  Continuing anyway...`);
      }
    } else {
      console.log(`  Already ${status.status || "non-PENDING"} — skipping cancel`);
    }
  }

  // Step 2: Update invoice in DB
  console.log("\n=== Step 2: Updating invoice in Turso DB ===\n");

  const { createClient } = await import("@libsql/client");
  const turso = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  // Verify invoice exists and has expected amount
  const invoiceResult = await turso.execute({
    sql: "SELECT id, number, total, subtotal, status FROM invoices WHERE id = ?",
    args: [INVOICE_ID],
  });

  if (invoiceResult.rows.length === 0) {
    console.error(`Invoice ${INVOICE_ID} not found!`);
    process.exit(1);
  }

  const invoice = invoiceResult.rows[0];
  console.log(`  Found: ${invoice.number}, total=${invoice.total}, status=${invoice.status}`);

  if (Number(invoice.total) !== OLD_AMOUNT) {
    console.error(`  Expected total ${OLD_AMOUNT} but got ${invoice.total}! Aborting.`);
    process.exit(1);
  }

  // Update total and subtotal
  await turso.execute({
    sql: "UPDATE invoices SET total = ?, subtotal = ?, note = ? WHERE id = ?",
    args: [NEW_AMOUNT, NEW_AMOUNT, "10% sleva aplikována (sleva 1 140 Kč)", INVOICE_ID],
  });
  console.log(`  Updated total: ${OLD_AMOUNT} → ${NEW_AMOUNT}`);

  // Step 3: Create new Comgate payment
  console.log("\n=== Step 3: Creating new Comgate payment ===\n");

  const callbackUrl = `${BASE_URL}/api/comgate/callback`;
  const createResult = await comgateRequest("create", {
    price: String(NEW_AMOUNT),
    curr: "CZK",
    label: LABEL.slice(0, 16),
    refId: REF_ID,
    email: CUSTOMER_EMAIL,
    fullName: CUSTOMER_NAME,
    method: "ALL",
    country: "CZ",
    lang: "cs",
    prepareOnly: "true",
    test: "false",
    url_paid: callbackUrl,
    url_cancelled: callbackUrl,
    url_pending: callbackUrl,
  });

  if (createResult.code !== "0" || !createResult.transId || !createResult.redirect) {
    console.error("Failed to create payment:", createResult.message || "Unknown error");
    process.exit(1);
  }

  const newTransId = createResult.transId;
  const redirectUrl = createResult.redirect;
  console.log(`  New transId: ${newTransId}`);
  console.log(`  Redirect: ${redirectUrl}`);

  // Step 4: Create Payment record in DB
  console.log("\n=== Step 4: Creating Payment record in DB ===\n");

  const paymentId = `pay_lucie_discount_${Date.now()}`;
  await turso.execute({
    sql: `INSERT INTO payments (id, invoiceId, amount, date, source, note, comgateTransId, createdAt)
          VALUES (?, ?, ?, datetime('now'), 'COMGATE', '10% discount - new payment link', ?, datetime('now'))`,
    args: [paymentId, INVOICE_ID, NEW_AMOUNT, newTransId],
  });
  console.log(`  Payment record created: ${paymentId}, comgateTransId: ${newTransId}`);

  // Step 5: Send email
  console.log("\n=== Step 5: Sending email ===\n");

  const resendKey = (process.env.RESEND_API_KEY || "").trim();
  const resend = new Resend(resendKey);
  const amountFormatted = (NEW_AMOUNT / 100).toLocaleString("cs-CZ");

  const emailResult = await resend.emails.send({
    from: "Hairland <info@hairland.cz>",
    replyTo: "info@hairland.cz",
    to: CUSTOMER_EMAIL,
    subject: `Odkaz k doplacení - aktualizovaná částka ${amountFormatted} Kč`,
    text: `Dobrý den, ${CUSTOMER_NAME},\n\nNa základě dohodnuté 10% slevy byl Váš doplatek snížen z 5 700 Kč na ${amountFormatted} Kč.\n\nFaktura: ${INVOICE_NUMBER}\nČástka k úhradě: ${amountFormatted} Kč\n\nZaplatit kartou: ${redirectUrl}\n\nDěkujeme,\nHairland.cz`,
    html: buildEmailHtml(redirectUrl),
  });

  if (emailResult.error) {
    console.error("Email send failed:", emailResult.error);
    process.exit(1);
  }

  console.log(`  Email sent! ID: ${emailResult.data?.id}`);

  console.log(`\n========================================`);
  console.log(`DONE!`);
  console.log(`  Old amount: ${(OLD_AMOUNT / 100).toLocaleString("cs-CZ")} Kč`);
  console.log(`  Discount:   ${(DISCOUNT_AMOUNT / 100).toLocaleString("cs-CZ")} Kč (10%)`);
  console.log(`  New amount: ${amountFormatted} Kč`);
  console.log(`  TransId:    ${newTransId}`);
  console.log(`  Payment URL: ${redirectUrl}`);
  console.log(`  Email sent to: ${CUSTOMER_EMAIL}`);
  console.log(`========================================`);

  turso.close();
}

main().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
