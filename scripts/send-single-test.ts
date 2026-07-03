import "dotenv/config";
import { Resend } from "resend";
import { getInquiryConfirmationEmail } from "../src/lib/email-templates";

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const email = getInquiryConfirmationEmail("cs", {
    name: "Luna Manažer",
    items: [
      { productName: "Virgin Slavic Hair", lengthCm: 50, color: "Natural Brown #4", quantity: 200, unit: "g" },
      { productName: "Premium European Hair", lengthCm: 60, color: "Dark Blonde #6", quantity: 150, unit: "g" },
    ],
    promoCode: "TESTCODE20",
    inquiryId: "INQ-TEST-001",
  });

  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "info@hairland.cz",
    replyTo: "info@hairland.cz",
    to: "lunamanazer@gmail.com",
    subject: "Vaše poptávka byla přijata — Hairland (finální test)",
    text: email.text,
    html: email.html,
  });
  console.log("Sent:", JSON.stringify(result));
}

main();
