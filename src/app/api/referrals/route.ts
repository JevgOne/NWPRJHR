import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `HAIR-${code}`;
}

// POST — create referral code for current user
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSalon = session.user.role === "SALON" || session.user.role === "HAIRDRESSER";
  const isOwner = session.user.role === "OWNER";

  if (!isSalon && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if user already has a referral
  if (isSalon && session.user.salonId) {
    const existing = await prisma.referral.findFirst({
      where: { referrerSalonId: session.user.salonId },
    });
    if (existing) {
      return NextResponse.json({
        code: existing.code,
        shareUrl: `https://hairland.cz?ref=${existing.code}`,
        id: existing.id,
      });
    }
  }

  // Generate unique code
  let code: string;
  let attempts = 0;
  do {
    code = generateReferralCode();
    const exists = await prisma.referral.findUnique({ where: { code } });
    if (!exists) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    return NextResponse.json({ error: "Failed to generate unique code" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));

  const referral = await prisma.referral.create({
    data: {
      referrerType: isSalon ? "SALON" : "CUSTOMER",
      referrerSalonId: isSalon ? session.user.salonId : null,
      code,
      referrerRewardType: "PERCENT",
      referrerRewardValue: body.referrerRewardValue ?? 1000,
      refereeDiscountType: "PERCENT",
      refereeDiscountValue: body.refereeDiscountValue ?? 500,
    },
  });

  return NextResponse.json({
    code: referral.code,
    shareUrl: `https://hairland.cz?ref=${referral.code}`,
    id: referral.id,
  });
}

// GET — admin list all referrals
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["OWNER", "EMPLOYEE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const referrals = await prisma.referral.findMany({
    include: {
      referrerSalon: { select: { id: true, name: true } },
      referrerCustomer: { select: { id: true, name: true } },
      _count: { select: { conversions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(referrals);
}
