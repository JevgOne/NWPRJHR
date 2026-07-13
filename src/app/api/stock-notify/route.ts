import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SUBSCRIPTIONS_PER_EMAIL = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, variantId, locale } = body as {
      email?: string;
      variantId?: string;
      locale?: string;
    };

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    if (!variantId) {
      return NextResponse.json({ error: "missing_variant" }, { status: 400 });
    }

    // Verify variant exists
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      select: { id: true },
    });
    if (!variant) {
      return NextResponse.json({ error: "variant_not_found" }, { status: 404 });
    }

    // Rate limit: max subscriptions per email
    const count = await prisma.stockSubscription.count({
      where: { email, notified: false },
    });
    if (count >= MAX_SUBSCRIPTIONS_PER_EMAIL) {
      return NextResponse.json({ error: "too_many_subscriptions" }, { status: 429 });
    }

    // Upsert (unique constraint handles duplicates)
    await prisma.stockSubscription.upsert({
      where: { email_variantId: { email, variantId } },
      create: {
        email,
        variantId,
        locale: locale ?? "cs",
      },
      update: {
        notified: false,
        notifiedAt: null,
        locale: locale ?? "cs",
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
