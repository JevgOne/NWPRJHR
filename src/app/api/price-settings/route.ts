import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updatePriceSettingsSchema } from "@/lib/validations/product";
import { calculateRetailPrice } from "@/lib/pricing";
import { logAudit, getClientIp } from "@/lib/audit";

export const maxDuration = 30;

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

  try {
    const setting = await prisma.priceSettings.upsert({
      where: { category },
      update: { markupPercent },
      create: { category, markupPercent },
    });

    const variants = await prisma.variant.findMany({
      where: {
        product: { category },
        retailManualOverride: false,
      },
    });

    let recalculated = 0;
    for (const variant of variants) {
      const newRetail = calculateRetailPrice(
        variant.costPricePerGram,
        markupPercent
      );
      const data: Record<string, unknown> = {
        retailPricePerGram: newRetail,
        wholesalePricePerGram: variant.costPricePerGram,
      };
      if (variant.pricePerPiece) {
        data.retailPricePerPiece = calculateRetailPrice(
          variant.pricePerPiece,
          markupPercent
        );
      }
      await prisma.variant.update({
        where: { id: variant.id },
        data,
      });
      recalculated++;
    }

    const result = { setting, recalculated };

    logAudit({
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      action: "UPDATE",
      entity: "PriceSettings",
      detail: { category, markupPercent, recalculated: result.recalculated },
      ipAddress: getClientIp(request),
    });

    try { revalidateTag("products", { expire: 0 }); } catch { /* noop */ }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[price-settings PUT]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Uložení cenotvorby selhalo: ${message}` },
      { status: 500 }
    );
  }
}
