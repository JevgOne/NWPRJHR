const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const TEAM = ["Jevgen", "Inga", "Martin"];

/**
 * Send a message with inline "claim" buttons to the configured Telegram chat.
 * Silently fails if credentials are missing.
 */
async function sendWithClaimButtons(text: string, type: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return;

  const keyboard = {
    inline_keyboard: [
      TEAM.map((name) => ({
        text: `Beru — ${name}`,
        callback_data: `claim:${type}:${name}`,
      })),
    ],
  };

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
        reply_markup: keyboard,
      }),
    });
  } catch {
    // Telegram failure should never block the main flow
  }
}

/**
 * Handle Telegram callback query — update message to show who claimed it.
 */
export async function handleTelegramCallback(callbackQuery: {
  id: string;
  message?: { message_id: number; chat: { id: number }; text?: string };
  data?: string;
}): Promise<void> {
  if (!BOT_TOKEN || !callbackQuery.data || !callbackQuery.message) return;

  const name = callbackQuery.data.split(":")[2];
  if (!name) return;

  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const originalText = callbackQuery.message.text ?? "";

  // Update message — append who claimed it, remove buttons
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: `${originalText}\n\n✅ <b>Vyřizuje: ${esc(name)}</b>`,
      parse_mode: "HTML",
    }),
  });

  // Answer callback to remove loading state
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQuery.id,
      text: `Přijato — ${name}`,
    }),
  });
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
    .map((i) => `   ${esc(i.productName)}\n   ${i.lengthCm} cm · ${esc(i.color)} · ${i.quantity}${i.unit}`)
    .join("\n\n");

  const lines = [
    `📦 <b>NOVÁ POPTÁVKA</b>`,
    `Zákazník má zájem o konkrétní vlasy`,
    ``,
    `${esc(data.name)}`,
    `${esc(data.email)}`,
    data.phone ? `${esc(data.phone)}` : null,
    data.salonName ? `Salon: ${esc(data.salonName)}` : null,
    ``,
    `Položky (${data.items.length}):`,
    itemLines,
    data.message ? `\nPoznámka: ${esc(data.message)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await sendWithClaimButtons(lines, "inquiry");
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
  const langMap: Record<string, string> = { cs: "🇨🇿 Čeština", uk: "🇺🇦 Ukrajinština", ru: "🇷🇺 Ruština" };
  const lang = data.locale ? langMap[data.locale] ?? data.locale : null;

  const lines = [
    `✉️ <b>KONTAKTNÍ FORMULÁŘ</b>`,
    `Zpráva z webu`,
    ``,
    `${esc(data.name)}`,
    `${esc(data.email)}`,
    data.phone ? `${esc(data.phone)}` : null,
    data.salonName ? `Salon: ${esc(data.salonName)}` : null,
    lang ? `Jazyk: ${lang}` : null,
    ``,
    `${esc(data.message)}`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendWithClaimButtons(lines, "contact");
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
    `💇 <b>NOVÁ REGISTRACE SALONU</b>`,
    `Salon žádá o B2B přístup`,
    ``,
    `${esc(data.salonName)}`,
    `${esc(data.contactName)}`,
    `${esc(data.email)}`,
    data.phone ? `${esc(data.phone)}` : null,
    data.city ? `${esc(data.city)}` : null,
    ``,
    `Čeká na schválení v administraci.`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendWithClaimButtons(lines, "salon");
}

/** Escape HTML special chars for Telegram */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
