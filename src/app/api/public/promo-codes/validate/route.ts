import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Rate limit: 10 per minute per IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10;

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
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const promo = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!promo || !promo.active) {
    return NextResponse.json({ valid: false, reason: "invalid" });
  }

  const now = new Date();
  if (promo.validFrom && now < promo.validFrom) {
    return NextResponse.json({ valid: false, reason: "not_yet_valid" });
  }
  if (promo.validTo && now > promo.validTo) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }
  if (promo.maxUses && promo.usedCount >= promo.maxUses) {
    return NextResponse.json({ valid: false, reason: "max_uses" });
  }

  return NextResponse.json({
    valid: true,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    description: promo.description,
  });
}
