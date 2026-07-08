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
  if (!BOT_TOKEN || !callbackQuery.data || !callbackQuery.message) {
    console.error("[Telegram] Callback skipped — missing:", {
      hasBotToken: !!BOT_TOKEN,
      hasData: !!callbackQuery.data,
      hasMessage: !!callbackQuery.message,
    });
    return;
  }

  const parts = callbackQuery.data.split(":");
  const type = parts[1];
  const recordId = parts[2];
  console.log(`[Telegram] Assigning ${type}:${recordId}`);

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
      } else if (type === "complaint") {
        await prisma.complaintTicket.update({
          where: { id: recordId },
          data: { assignedTo: name, status: "IN_PROGRESS" },
        });
      }
    } catch (err) {
      console.error(`[Telegram] Failed to assign ${type}:${recordId}:`, err);
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
    `📦 <b>NOVÁ POPTÁVKA</b>`,
    `Nový zákazník odeslal poptávku přes web`,
    ``,
    `👤 <b>${esc(data.name)}</b>`,
    `📧 ${esc(data.email)}`,
    data.phone ? `📱 ${esc(data.phone)}` : null,
    data.salonName ? `💇 Salon: ${esc(data.salonName)}` : null,
    ``,
    `🛒 <b>Položky (${data.items.length}):</b>`,
    itemLines,
    data.message ? `\n💬 Poznámka: ${esc(data.message)}` : null,
    ``,
    `⏳ Čeká na zpracování — klikni BERU pro přiřazení`,
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
    `✉️ <b>NOVÁ ZPRÁVA Z WEBU</b>`,
    `Zákazník napsal přes kontaktní formulář`,
    ``,
    `👤 <b>${esc(data.name)}</b>`,
    `📧 ${esc(data.email)}`,
    data.phone ? `📱 ${esc(data.phone)}` : null,
    data.salonName ? `💇 Salon: ${esc(data.salonName)}` : null,
    lang ? `🌐 Jazyk: ${lang}` : null,
    ``,
    `💬 <b>Zpráva:</b>`,
    `${esc(data.message)}`,
    ``,
    `⏳ Čeká na odpověď — klikni BERU pro přiřazení`,
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
    `💇 <b>NOVÁ REGISTRACE B2B</b>`,
    `Nový ${esc(typeLabel.toLowerCase())} se zaregistroval a čeká na schválení`,
    ``,
    `🏢 <b>${esc(data.salonName)}</b>`,
    `👤 ${esc(data.contactName)}`,
    `📧 ${esc(data.email)}`,
    data.phone ? `📱 ${esc(data.phone)}` : null,
    data.city ? `📍 ${esc(data.city)}` : null,
    `🏷 Typ: ${esc(typeLabel)}`,
    ``,
    `⚠️ Čeká na schválení — otevři admin panel a zkontroluj údaje`,
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
    `📥 <b>NASKLADNĚNÍ</b>`,
    `Na sklad přibylo nové zboží`,
    ``,
    `📦 <b>${esc(productName)}</b>`,
    `${esc(variant)}`,
    `➕ ${addedQty}g přidáno → celkem na skladě: <b>${newTotal}g</b>`,
  ].join("\n");

  await sendTelegramMessage(lines);
}

/**
 * Notify about low stock.
 */
export async function notifyLowStock(items: { productName: string; variant: string; remainingGrams: number }[]): Promise<void> {
  const itemLines = items
    .map((i) => `   ⚠️ ${esc(i.productName)} · ${esc(i.variant)} — zbývá <b>${i.remainingGrams}g</b>`)
    .join("\n");

  const lines = [
    `🔴 <b>NÍZKÝ STAV SKLADU</b>`,
    `Následující položky brzy dojdou — zvažte doobjednání`,
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
    `🚨 <b>NEGATIVNÍ RECENZE — VYŽADUJE REAKCI!</b>`,
    `Zákazník zanechal hodnocení ${data.rating}/5 — je třeba reagovat co nejdříve`,
    ``,
    `👤 <b>${esc(data.authorName)}</b>`,
    `📍 Zdroj: ${sourceLabel[data.source] ?? data.source}`,
    `${stars} (${data.rating}/5)`,
    ``,
    `💬 "${esc(preview)}"`,
    data.sourceUrl ? `\n🔗 ${data.sourceUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await sendTelegramMessage(lines);
}

/**
 * Notify about new complaint ticket.
 */
export async function notifyComplaintTicket(ticketId: string, data: {
  ticketNumber: string;
  customerType: string;
  name: string;
  email: string;
  phone?: string;
  salonName?: string;
  complaintType: string;
  orderNumber?: string;
  description: string;
  photoCount: number;
}): Promise<void> {
  const typeLabels: Record<string, string> = {
    RETAIL: "Koncový zákazník / Конечный покупатель",
    SALON: "Salon / Салон",
    HAIRDRESSER: "Kadeřnice / Парикмахер",
  };
  const complaintLabels: Record<string, string> = {
    DEFECT: "Reklamace vady / Рекламация дефекта",
    RETURN: "Vrácení zboží / Возврат товара",
    WITHDRAWAL: "Odstoupení od smlouvy / Отказ от договора",
  };

  const lines = [
    `🚨 <b>NOVÁ REKLAMACE</b>`,
    `Zákazník podal reklamaci — ticket #${esc(data.ticketNumber)}`,
    ``,
    `👤 <b>${esc(data.name)}</b>`,
    `📧 ${esc(data.email)}`,
    data.phone ? `📱 ${esc(data.phone)}` : null,
    `🏷 Typ zákazníka: ${typeLabels[data.customerType] ?? data.customerType}`,
    data.salonName ? `💇 Salon: ${esc(data.salonName)}` : null,
    ``,
    `📋 <b>${complaintLabels[data.complaintType] ?? data.complaintType}</b>`,
    data.orderNumber ? `🧾 Objednávka: ${esc(data.orderNumber)}` : null,
    ``,
    `💬 ${esc(data.description.length > 300 ? data.description.slice(0, 300) + "…" : data.description)}`,
    data.photoCount > 0 ? `\n📷 Přiloženo ${data.photoCount} foto` : null,
    ``,
    `⏳ Čeká na zpracování — klikni BERU pro přiřazení`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendWithClaimButton(lines, "complaint", ticketId);
}

/**
 * Notify about order cancellation.
 */
export async function notifyOrderCancelled(data: {
  orderNumber: string | null;
  orderId: string;
  salonName: string;
  cancelledBy: "salon" | "admin";
  itemCount: number;
}): Promise<void> {
  const orderLabel = data.orderNumber ?? data.orderId.slice(0, 8);

  const lines = data.cancelledBy === "salon"
    ? [
        `❌ <b>OBJEDNÁVKA ZRUŠENA SALONEM</b>`,
        `Salon sám zrušil svou objednávku`,
        ``,
        `🧾 Objednávka: <b>${esc(orderLabel)}</b>`,
        `💇 Salon: ${esc(data.salonName)}`,
        `📦 Položek: ${data.itemCount}`,
      ]
    : [
        `❌ <b>OBJEDNÁVKA ZRUŠENA ADMINEM</b>`,
        `Admin zrušil objednávku salonu`,
        ``,
        `🧾 Objednávka: <b>${esc(orderLabel)}</b>`,
        `💇 Salon: ${esc(data.salonName)}`,
        `📦 Položek: ${data.itemCount}`,
      ];

  await sendTelegramMessage(lines.join("\n"));
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
