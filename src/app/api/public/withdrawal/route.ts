import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendNotificationEmail } from "@/lib/email";

const withdrawalSchema = z.object({
  product: z.string().min(1).max(500),
  orderNumber: z.string().min(1).max(100),
  orderDate: z.string().min(1),
  receiveDate: z.string().min(1),
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  email: z.string().email(),
  phone: z.string().max(20).optional().default(""),
  bankAccount: z.string().min(1).max(50),
  note: z.string().max(1000).optional().default(""),
});

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 300_000; // 5 minutes
const RATE_LIMIT_MAX = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);
  rateLimitMap.set(ip, recent);

  if (recent.length >= RATE_LIMIT_MAX) return true;

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = withdrawalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    product,
    orderNumber,
    orderDate,
    receiveDate,
    name,
    address,
    email,
    phone,
    bankAccount,
    note,
  } = parsed.data;

  const now = new Date().toLocaleDateString("cs-CZ");
  const contactTo = process.env.EMAIL_CONTACT_TO ?? "info@hairland.cz";

  // Email to admin
  sendNotificationEmail({
    to: contactTo,
    subject: `[Hairland] Odstoupení od smlouvy: ${name} (${orderNumber})`,
    body: [
      "OZNÁMENÍ O ODSTOUPENÍ OD SMLOUVY",
      "",
      `Zboží: ${product}`,
      `Číslo objednávky: ${orderNumber}`,
      `Datum objednání: ${orderDate}`,
      `Datum převzetí: ${receiveDate}`,
      "",
      `Spotřebitel: ${name}`,
      `Adresa: ${address}`,
      `E-mail: ${email}`,
      phone ? `Telefon: ${phone}` : null,
      `Číslo účtu: ${bankAccount}`,
      note ? `\nPoznámka: ${note}` : null,
      "",
      `Datum odeslání: ${now}`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
  }).catch(() => {});

  // Confirmation email to customer
  sendNotificationEmail({
    to: email,
    toName: name,
    subject: "Potvrzení odstoupení od smlouvy — Hairland",
    body: [
      `Dobrý den, ${name},`,
      "",
      "potvrzujeme přijetí vašeho oznámení o odstoupení od smlouvy.",
      "",
      `Zboží: ${product}`,
      `Číslo objednávky: ${orderNumber}`,
      "",
      "Zboží prosím zašlete zpět do 14 dnů od odeslání tohoto oznámení na adresu:",
      "Altro servis group s.r.o., Školská 660/3, 110 00 Praha 1",
      "",
      "Vrátit lze pouze vlasy nepoužité, neaplikované a neupravené,",
      "s neporušenou hygienickou pečetí.",
      "",
      `Kupní cenu vám vrátíme na účet ${bankAccount} do 14 dnů od vrácení zboží.`,
      "",
      "Hairland",
      "info@hairland.cz | +420 608 553 103",
    ].join("\n"),
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
