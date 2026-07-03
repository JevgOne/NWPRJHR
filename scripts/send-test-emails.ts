/**
 * Send all 4 branded email templates as test to a given address.
 * Usage: npx tsx scripts/send-test-emails.ts lunamanazer@gmail.com
 */
import "dotenv/config";
import { Resend } from "resend";
import {
  getRegistrationConfirmationEmail,
  getApprovalConfirmationEmail,
  getInquiryConfirmationEmail,
  getSpinWinEmail,
} from "../src/lib/email-templates";

const to = process.argv[2];
if (!to) {
  console.error("Usage: npx tsx scripts/send-test-emails.ts <email>");
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("RESEND_API_KEY not set");
  process.exit(1);
}

const resend = new Resend(apiKey);
const from = process.env.EMAIL_FROM ?? "info@hairland.cz";

async function send(name: string, email: { subject: string; text: string; html: string }) {
  try {
    const result = await resend.emails.send({
      from,
      to,
      subject: `[TEST] ${email.subject}`,
      text: email.text,
      html: email.html,
    });
    console.log(`✓ ${name} — sent (${JSON.stringify(result)})`);
  } catch (err) {
    console.error(`✗ ${name} — FAILED:`, err);
  }
}

async function main() {
  console.log(`Sending 4 test emails to ${to}...\n`);

  // 1. Registration confirmation
  const reg = getRegistrationConfirmationEmail("cs", {
    contactPerson: "Luna Manažer",
    salonName: "Salon Luna Test",
    email: to,
    type: "Salon",
  });
  await send("Registration Confirmation", reg);

  // 2. Approval confirmation
  const approval = getApprovalConfirmationEmail("cs", {
    name: "Luna Manažer",
    salonName: "Salon Luna Test",
  });
  await send("Approval Confirmation", approval);

  // 3. Inquiry confirmation
  const inquiry = getInquiryConfirmationEmail("cs", {
    name: "Luna Manažer",
    items: [
      { productName: "Virgin Slavic Hair", lengthCm: 50, color: "Natural Brown #4", quantity: 200, unit: "g" },
      { productName: "Premium European Hair", lengthCm: 60, color: "Dark Blonde #6", quantity: 150, unit: "g" },
    ],
    promoCode: "TESTCODE20",
    inquiryId: "INQ-TEST-001",
  });
  await send("Inquiry Confirmation", inquiry);

  // 4. Spin wheel win
  const spin = getSpinWinEmail("cs", {
    discount: 15,
    code: "LUNA15TEST",
    validTo: "15. 7. 2026",
  });
  await send("Spin Wheel Win", spin);

  console.log("\nDone!");
}

main();
