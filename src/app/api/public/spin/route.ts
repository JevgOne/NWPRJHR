import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email";
import { z } from "zod";

const MAX_ATTEMPTS = 3;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

const SEGMENTS = [
  { id: 0, discount: 5,  weight: 18, label: "5%" },
  { id: 1, discount: 0,  weight: 15, label: "miss" },
  { id: 2, discount: 10, weight: 12, label: "10%" },
  { id: 3, discount: 0,  weight: 15, label: "miss" },
  { id: 4, discount: 0,  weight: 13, label: "miss" },
  { id: 5, discount: 15, weight: 5,  label: "15%" },
  { id: 6, discount: 0,  weight: 12, label: "miss" },
  { id: 7, discount: 20, weight: 3,  label: "20%" },
  { id: 8, discount: 0,  weight: 6,  label: "miss" },
  { id: 9, discount: 25, weight: 1,  label: "25%" },
];

function pickSegment(): (typeof SEGMENTS)[number] {
  const total = SEGMENTS.reduce((s, seg) => s + seg.weight, 0);
  let rand = Math.random() * total;
  for (const seg of SEGMENTS) {
    rand -= seg.weight;
    if (rand <= 0) return seg;
  }
  return SEGMENTS[0];
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SPIN-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const spinSchema = z.object({
  email: z.string().email().max(200),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = spinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  // Check existing entry for this email
  const existing = await prisma.spinEntry.findUnique({
    where: { email },
  });

  if (existing) {
    // Already won — no more attempts
    if (existing.won) {
      return NextResponse.json(
        { error: "already_won", attemptsUsed: existing.attemptCount, maxAttempts: MAX_ATTEMPTS },
        { status: 409 }
      );
    }

    // All attempts used
    if (existing.attemptCount >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "max_attempts", attemptsUsed: existing.attemptCount, maxAttempts: MAX_ATTEMPTS },
        { status: 409 }
      );
    }

    // Cooldown not elapsed (24h since last attempt)
    const elapsed = Date.now() - new Date(existing.lastAttemptAt).getTime();
    if (elapsed < COOLDOWN_MS) {
      const retryAfterMs = COOLDOWN_MS - elapsed;
      return NextResponse.json(
        {
          error: "cooldown",
          retryAfterMs,
          attemptsUsed: existing.attemptCount,
          maxAttempts: MAX_ATTEMPTS,
        },
        { status: 429 }
      );
    }
  }

  // Pick segment (server-side RNG)
  const segment = pickSegment();
  const won = segment.discount > 0;

  let promoCodeId: string | null = null;
  let code: string | null = null;

  if (won) {
    // Generate unique promo code
    let attempts = 0;
    while (attempts < 10) {
      const candidate = generateCode();
      const exists = await prisma.promoCode.findUnique({
        where: { code: candidate },
      });
      if (!exists) {
        code = candidate;
        break;
      }
      attempts++;
    }

    if (code) {
      const promo = await prisma.promoCode.create({
        data: {
          code,
          description: `Spin wheel — ${segment.discount}% discount`,
          discountType: "PERCENT",
          discountValue: segment.discount * 100, // basis points
          maxUses: 1,
          validFrom: new Date(),
          validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
          active: true,
        },
      });
      promoCodeId = promo.id;
    }
  }

  const now = new Date();
  const attemptCount = existing ? existing.attemptCount + 1 : 1;

  if (existing) {
    // Update existing entry with new attempt
    await prisma.spinEntry.update({
      where: { email },
      data: {
        segment: segment.id,
        won,
        discountPercent: won ? segment.discount : null,
        promoCodeId: promoCodeId ?? existing.promoCodeId,
        ipAddress: ip,
        attemptCount,
        lastAttemptAt: now,
      },
    });
  } else {
    // Create new spin entry
    await prisma.spinEntry.create({
      data: {
        email,
        segment: segment.id,
        won,
        discountPercent: won ? segment.discount : null,
        promoCodeId,
        ipAddress: ip,
        attemptCount: 1,
        lastAttemptAt: now,
      },
    });
  }

  // Send email with code if won
  if (won && code) {
    const validTo = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toLocaleDateString("cs-CZ");

    sendNotificationEmail({
      to: email,
      subject: `Vase vyhra z Kolecka stesti — ${segment.discount}% sleva!`,
      body: [
        "Gratulujeme!",
        "",
        `Vyhrali jste ${segment.discount}% slevu na nakup vlasu.`,
        "",
        `Vas slevovy kod: ${code}`,
        `Platny do: ${validTo}`,
        "",
        "Pouzijte kod pri objednavce nebo poptavce na hairland.cz.",
        "",
        "Hairland.cz",
      ].join("\n"),
      html: [
        "<div style=\"font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;\">",
        "<h2 style=\"color: #1a1a1a; margin-bottom: 16px;\">Gratulujeme!</h2>",
        `<p style="color: #333; font-size: 16px;">Vyhr&aacute;li jste <strong>${segment.discount}%</strong> slevu na n&aacute;kup vlas&#367;.</p>`,
        `<div style="background: #fdf2f4; border: 2px dashed #e11d48; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">`,
        `<p style="color: #666; font-size: 12px; margin: 0 0 8px;">V&aacute;&#353; slevov&yacute; k&oacute;d</p>`,
        `<p style="color: #e11d48; font-size: 28px; font-weight: bold; letter-spacing: 3px; margin: 0;">${code}</p>`,
        "</div>",
        `<p style="color: #666; font-size: 14px;">Platn&yacute; do: <strong>${validTo}</strong></p>`,
        `<p style="color: #666; font-size: 14px;">Pou&#382;ijte k&oacute;d p&#345;i objedn&aacute;vce nebo popt&aacute;vce na <a href="https://hairland.cz" style="color: #e11d48;">hairland.cz</a>.</p>`,
        "<hr style=\"border: none; border-top: 1px solid #eee; margin: 24px 0;\">",
        "<p style=\"color: #999; font-size: 12px;\">Hairland.cz</p>",
        "</div>",
      ].join("\n"),
    }).catch(() => {});
  }

  const remainingAttempts = MAX_ATTEMPTS - attemptCount;

  return NextResponse.json({
    segment: segment.id,
    won,
    discountPercent: won ? segment.discount : undefined,
    attemptsUsed: attemptCount,
    maxAttempts: MAX_ATTEMPTS,
    remainingAttempts,
  });
}
