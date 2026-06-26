const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Send a message to the configured Telegram channel.
 * Silently fails if credentials are missing — won't block the request.
 */
export async function sendTelegramMessage(text: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return;

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });
  } catch {
    // Telegram failure should never block the main flow
  }
}

/**
 * Format and send an inquiry notification to Telegram.
 */
export async function notifyInquiry(data: {
  name: string;
  email: string;
  phone?: string;
  salonName?: string;
  message?: string;
  items: { productName: string; lengthCm: number; color: string; quantity: number; unit: string }[];
}): Promise<void> {
  const itemLines = data.items
    .map((i) => `  • ${i.productName} — ${i.lengthCm} cm, ${i.color}, ${i.quantity}${i.unit}`)
    .join("\n");

  const lines = [
    `<b>📦 Nová poptávka</b>`,
    ``,
    `<b>Jméno:</b> ${esc(data.name)}`,
    `<b>Email:</b> ${esc(data.email)}`,
    data.phone ? `<b>Telefon:</b> ${esc(data.phone)}` : null,
    data.salonName ? `<b>Salon:</b> ${esc(data.salonName)}` : null,
    ``,
    `<b>Položky (${data.items.length}):</b>`,
    esc(itemLines),
    data.message ? `\n<b>Poznámka:</b> ${esc(data.message)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await sendTelegramMessage(lines);
}

/**
 * Format and send a contact form notification to Telegram.
 */
export async function notifyContact(data: {
  name: string;
  email: string;
  phone?: string;
  salonName?: string;
  message: string;
  locale?: string;
}): Promise<void> {
  const lines = [
    `<b>✉️ Nová zpráva z kontaktního formuláře</b>`,
    ``,
    `<b>Jméno:</b> ${esc(data.name)}`,
    `<b>Email:</b> ${esc(data.email)}`,
    data.phone ? `<b>Telefon:</b> ${esc(data.phone)}` : null,
    data.salonName ? `<b>Salon:</b> ${esc(data.salonName)}` : null,
    data.locale ? `<b>Jazyk:</b> ${esc(data.locale)}` : null,
    ``,
    esc(data.message),
  ]
    .filter(Boolean)
    .join("\n");

  await sendTelegramMessage(lines);
}

/**
 * Format and send a salon registration notification to Telegram.
 */
export async function notifySalonRegistration(data: {
  salonName: string;
  contactName: string;
  email: string;
  phone?: string;
  city?: string;
}): Promise<void> {
  const lines = [
    `<b>💇 Nová registrace salonu</b>`,
    ``,
    `<b>Salon:</b> ${esc(data.salonName)}`,
    `<b>Kontakt:</b> ${esc(data.contactName)}`,
    `<b>Email:</b> ${esc(data.email)}`,
    data.phone ? `<b>Telefon:</b> ${esc(data.phone)}` : null,
    data.city ? `<b>Město:</b> ${esc(data.city)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await sendTelegramMessage(lines);
}

/** Escape HTML special chars for Telegram */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
