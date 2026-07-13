export interface SendEmailInput {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  html?: string;
  unsubscribeUrl?: string;
}

/**
 * Send notification email via Resend.
 * Silently skips if no API key is configured (dev mode).
 */
export async function sendNotificationEmail(
  input: SendEmailInput
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // No email provider configured; skip silently in dev
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const recipients = input.to.split(",").map((e) => e.trim()).filter(Boolean);

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "info@hairland.cz",
    replyTo: "info@hairland.cz",
    to: recipients,
    subject: input.subject,
    text: input.body,
    html: input.html,
    ...(input.unsubscribeUrl
      ? {
          headers: {
            "List-Unsubscribe": `<${input.unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }
      : {}),
  });
}
