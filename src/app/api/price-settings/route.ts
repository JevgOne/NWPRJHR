import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updatePriceSettingsSchema } from "@/lib/validations/product";
import { calculateRetailPrice } from "@/lib/pricing";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await prisma.priceSettings.findMany({
    orderBy: { category: "asc" },
  });

  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = updatePriceSettingsSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { category, markupPercent } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const setting = await tx.priceSettings.upsert({
      where: { category },
      update: { markupPercent },
      create: { category, markupPercent },
    });

    const variants = await tx.variant.findMany({
      where: {
        product: { category },
        retailManualOverride: false,
      },
    });

    for (const variant of variants) {
      await tx.variant.update({
        where: { id: variant.id },
        data: {
          retailPricePerGram: calculateRetailPrice(
            variant.wholesalePricePerGram,
            markupPercent
          ),
        },
      });
    }

    return { setting, recalculated: variants.length };
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "PriceSettings",
    detail: { category, markupPercent, recalculated: result.recalculated },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(result);
}
