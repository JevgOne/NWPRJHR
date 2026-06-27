import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { sendNotificationEmail } from "@/lib/email";
import { notifySalonRegistration } from "@/lib/telegram";
import { z } from "zod";

const registerSchema = z.object({
  type: z.enum(["SALON", "HAIRDRESSER"]).default("SALON"),
  salonName: z.string().min(1).max(200),
  contactPerson: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().min(1).max(30),
  ico: z.string().max(20).optional().default(""),
  city: z.string().min(1).max(100),
  address: z.string().min(1).max(300),
  website: z.string().max(500).optional().default(""),
  instagram: z.string().max(200).optional().default(""),
  password: z.string().min(6).max(100),
  language: z.enum(["cs", "uk", "ru"]).default("cs"),
});

// Rate limit: 3 per hour per IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 3600_000;
const RATE_LIMIT_MAX = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { type, salonName, contactPerson, email, phone, ico, city, address, website, instagram, password, language } = parsed.data;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 });
  }

  try {
    const hashedPassword = await hash(password, 12);

    // Create salon (NOT approved) + user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const salon = await tx.salon.create({
        data: {
          name: salonName,
          type: type,
          contactPerson: contactPerson || null,
          email,
          phone: phone || null,
          ico: ico || null,
          city: city || null,
          address: address || null,
          website: website || null,
          instagram: instagram || null,
          language,
          approved: false,
        },
      });

      const user = await tx.user.create({
        data: {
          name: contactPerson,
          email,
          hashedPassword,
          role: type === "HAIRDRESSER" ? "HAIRDRESSER" : "SALON",
          salonId: salon.id,
        },
      });

      return { salon, user };
    });

    // Notify owner
    const contactTo = process.env.EMAIL_CONTACT_TO ?? "info@hairland.cz";
    const typeLabel = type === "HAIRDRESSER" ? "Kadeřnice" : "Salon";
    await sendNotificationEmail({
      to: contactTo,
      subject: `[Hairland] Nová žádost o registraci (${typeLabel}): ${salonName}`,
      body: [
        `Nová ${typeLabel.toLowerCase()} žádá o B2B registraci:`,
        "",
        `Typ: ${typeLabel}`,
        `Název: ${salonName}`,
        `Kontakt: ${contactPerson}`,
        `Email: ${email}`,
        `Telefon: ${phone}`,
        ico ? `IČO: ${ico}` : null,
        city ? `Město: ${city}` : null,
        address ? `Adresa: ${address}` : null,
        website ? `Web: ${website}` : null,
        instagram ? `Instagram: ${instagram}` : null,
        "",
        `Salon ID: ${result.salon.id}`,
        `Jazyk: ${language}`,
        "",
        `⚠️ Salon čeká na schválení.`,
        `Pro schválení: přejděte do administrace → Salony → ${salonName} → Schválit`,
      ]
        .filter(Boolean)
        .join("\n"),
    }).catch(() => {});

    // Telegram notification
    notifySalonRegistration({
      salonName,
      contactName: contactPerson,
      email,
      phone: phone || undefined,
      city: city || undefined,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Registration failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
