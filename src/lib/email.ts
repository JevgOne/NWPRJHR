export interface SendEmailInput {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  html?: string;
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

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "info@hairora.cz",
    to: input.to,
    subject: input.subject,
    text: input.body,
    html: input.html,
  });
}
