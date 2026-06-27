import { prisma } from "./db";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Send a message with a single "Beru" claim button.
 * callback_data format: "claim:<type>:<recordId>"
 */
async function sendWithClaimButton(text: string, type: string, recordId: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return;

  const keyboard = {
    inline_keyboard: [[{ text: "👉  BERU / БЕРУ  👈", callback_data: `claim:${type}:${recordId}` }]],
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
 * Handle Telegram callback query — update message + save to DB who claimed it.
 */
export async function handleTelegramCallback(callbackQuery: {
  id: string;
  from?: { first_name?: string; last_name?: string };
  message?: { message_id: number; chat: { id: number }; text?: string };
  data?: string;
}): Promise<void> {
  if (!BOT_TOKEN || !callbackQuery.data || !callbackQuery.message) return;

  const parts = callbackQuery.data.split(":");
  const type = parts[1];
  const recordId = parts[2];

  const firstName = callbackQuery.from?.first_name ?? "Někdo";
  const lastName = callbackQuery.from?.last_name ?? "";
  const name = lastName ? `${firstName} ${lastName}` : firstName;

  // Save assignment to DB
  if (recordId) {
    try {
      if (type === "inquiry") {
        await prisma.inquiry.update({
          where: { id: recordId },
          data: { assignedTo: name, assignedAt: new Date() },
        });
      } else if (type === "contact") {
        await prisma.contactMessage.update({
          where: { id: recordId },
          data: { assignedTo: name, assignedAt: new Date() },
        });
      }
    } catch {
      // Record might not exist — continue with message update
    }
  }

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
      text: `${originalText}\n\n✅ Vyřizuje/Обрабатывает: ${esc(name)}`,
      parse_mode: "HTML",
    }),
  });

  // Answer callback to remove loading state
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQuery.id,
      text: `Přijato/Принято — ${name}`,
    }),
  });
}

/**
 * Send a simple message without buttons (for stock alerts etc.)
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
    // silent
  }
}

/**
 * Notify about new inquiry.
 */
export async function notifyInquiry(inquiryId: string, data: {
  name: string;
  email: string;
  phone?: string;
  salonName?: string;
  message?: string;
  items: { productName: string; lengthCm: number; color: string; quantity: number; unit: string }[];
}): Promise<void> {
  const itemLines = data.items
    .map((i) => `   ${originFlag(esc(i.productName))}\n   ${i.lengthCm} cm · ${formatColor(i.color)} · ${i.quantity}${i.unit}`)
    .join("\n\n");

  const lines = [
    `📦 <b>NOVÁ POPTÁVKA / НОВЫЙ ЗАПРОС</b>`,
    `Zákazník má zájem o vlasy`,
    `Клиент интересуется волосами`,
    ``,
    `${esc(data.name)}`,
    `${esc(data.email)}`,
    data.phone ? `${esc(data.phone)}` : null,
    data.salonName ? `Salon/Салон: ${esc(data.salonName)}` : null,
    ``,
    `Položky/Позиции (${data.items.length}):`,
    itemLines,
    data.message ? `\nPoznámka/Примечание: ${esc(data.message)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await sendWithClaimButton(lines, "inquiry", inquiryId);
}

/**
 * Notify about contact form submission.
 */
export async function notifyContact(contactId: string, data: {
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
    `✉️ <b>KONTAKTNÍ FORMULÁŘ / КОНТАКТНАЯ ФОРМА</b>`,
    `Zpráva z webu / Сообщение с сайта`,
    ``,
    `${esc(data.name)}`,
    `${esc(data.email)}`,
    data.phone ? `${esc(data.phone)}` : null,
    data.salonName ? `Salon/Салон: ${esc(data.salonName)}` : null,
    lang ? `Jazyk/Язык: ${lang}` : null,
    ``,
    `${esc(data.message)}`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendWithClaimButton(lines, "contact", contactId);
}

/**
 * Notify about salon registration.
 */
export async function notifySalonRegistration(data: {
  type?: string;
  salonName: string;
  contactName: string;
  email: string;
  phone?: string;
  city?: string;
}): Promise<void> {
  const typeLabel = data.type ?? "Salon";
  const lines = [
    `💇 <b>NOVÁ REGISTRACE / НОВАЯ РЕГИСТРАЦИЯ</b>`,
    `${esc(typeLabel)} žádá o B2B přístup`,
    ``,
    `Typ: ${esc(typeLabel)}`,
    `Název: ${esc(data.salonName)}`,
    `Kontakt: ${esc(data.contactName)}`,
    `E-mail: ${esc(data.email)}`,
    data.phone ? `Telefon: ${esc(data.phone)}` : null,
    data.city ? `Město: ${esc(data.city)}` : null,
    ``,
    `⚠️ Čeká na schválení v admin panelu.`,
    `🔗 https://www.hairland.cz/salons`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendRegistrationNotification(lines);
}

async function sendRegistrationNotification(text: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return;

  const keyboard = {
    inline_keyboard: [[
      { text: "✅ Otevřít admin panel", url: "https://www.hairland.cz/salons" },
    ]],
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
    // silent
  }
}

/**
 * Notify about stock restock.
 */
export async function notifyRestock(productName: string, variant: string, addedQty: number, newTotal: number): Promise<void> {
  const lines = [
    `📥 <b>NASKLADNĚNÍ / ПОСТУПЛЕНИЕ</b>`,
    ``,
    `${esc(productName)}`,
    `${esc(variant)}`,
    `+${addedQty}g → celkem/всего ${newTotal}g`,
  ].join("\n");

  await sendTelegramMessage(lines);
}

/**
 * Notify about low stock.
 */
export async function notifyLowStock(items: { productName: string; variant: string; remainingGrams: number }[]): Promise<void> {
  const itemLines = items
    .map((i) => `   ${esc(i.productName)} · ${esc(i.variant)} — zbývá/осталось ${i.remainingGrams}g`)
    .join("\n");

  const lines = [
    `⚠️ <b>NÍZKÝ STAV SKLADU / МАЛО НА СКЛАДЕ</b>`,
    ``,
    itemLines,
  ].join("\n");

  await sendTelegramMessage(lines);
}

/**
 * Alert about negative review (rating <= 3).
 */
export async function notifyNegativeReview(data: {
  authorName: string;
  rating: number;
  source: string;
  text: string;
  sourceUrl?: string | null;
}): Promise<void> {
  const sourceLabel: Record<string, string> = { GOOGLE: "Google", INSTAGRAM: "Instagram", MANUAL: "Web" };
  const stars = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);
  const preview = data.text.length > 200 ? data.text.slice(0, 200) + "…" : data.text;

  const lines = [
    `🚨 <b>NEGATIVNÍ RECENZE / НЕГАТИВНЫЙ ОТЗЫВ</b>`,
    `Vyžaduje okamžitou reakci! / Требуется немедленная реакция!`,
    ``,
    `${esc(data.authorName)} — ${sourceLabel[data.source] ?? data.source}`,
    `${stars} (${data.rating}/5)`,
    ``,
    `${esc(preview)}`,
    data.sourceUrl ? `\n🔗 ${data.sourceUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await sendTelegramMessage(lines);
}

/** Map color code to emoji + name (CZ/RU) */
function formatColor(color: string): string {
  const map: Record<string, [string, string, string]> = {
    "1": ["⚪", "Platinová", "Платина"], "2": ["🟡", "Světlá blond", "Светлый блонд"], "3": ["🟡", "Zlatá blond", "Золотой блонд"],
    "4": ["🟠", "Medová", "Медовый"], "5": ["🟠", "Karamelová", "Карамель"], "6": ["🟤", "Světle hnědá", "Светло-коричн."],
    "7": ["🟤", "Středně hnědá", "Средне-коричн."], "8": ["🟤", "Tmavě hnědá", "Тёмно-коричн."],
    "9": ["⚫", "Tmavá", "Тёмный"], "10": ["⚫", "Černá", "Чёрный"],
  };
  const entry = map[color];
  return entry ? `${entry[0]} ${entry[1]}/${entry[2]} (${color})` : `🔘 Odstín/Оттенок ${color}`;
}

/** Map origin to flag emoji */
function originFlag(origin: string): string {
  const lower = origin.toLowerCase();
  const flags: Record<string, string> = {
    "ukrajina": "🇺🇦", "rusko": "🇷🇺", "kazachstán": "🇰🇿", "kazachstan": "🇰🇿",
    "indie": "🇮🇳", "vietnam": "🇻🇳", "turecko": "🇹🇷", "írán": "🇮🇷", "iran": "🇮🇷",
    "bělorusko": "🇧🇾", "belorusko": "🇧🇾", "moldavsko": "🇲🇩",
    "uzbekistán": "🇺🇿", "uzbekistan": "🇺🇿", "čína": "🇨🇳", "cina": "🇨🇳",
    "mongolsko": "🇲🇳", "gruzie": "🇬🇪",
  };
  for (const [key, flag] of Object.entries(flags)) {
    if (lower.includes(key)) return `${flag} ${origin}`;
  }
  return origin;
}

/** Escape HTML special chars for Telegram */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
