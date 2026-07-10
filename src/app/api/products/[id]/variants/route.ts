import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createVariantsSchema } from "@/lib/validations/product";
import { serializeVariantForRole } from "@/lib/api/product-serializer";
import { calculateRetailPrice } from "@/lib/pricing";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const variants = await prisma.variant.findMany({
    where: { productId: id },
    orderBy: [{ lengthCm: "asc" }, { color: "asc" }],
  });

  const serialized = variants.map((v) =>
    serializeVariantForRole(v, session.user.role)
  );

  return NextResponse.json(serialized);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product)
    return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const body = await request.json();
  const parsed = createVariantsSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Filter out variants that already exist (SQLite doesn't support skipDuplicates)
  const existing = await prisma.variant.findMany({
    where: { productId },
    select: { lengthCm: true, color: true },
  });
  const existingSet = new Set(existing.map((e) => `${e.lengthCm}-${e.color}`));

  const newVariants = parsed.data.variants
    .filter((v) => !existingSet.has(`${v.lengthCm}-${v.color}`))
    .map((v) => ({
      productId,
      lengthCm: v.lengthCm,
      color: v.color,
      costPricePerGram: v.costPricePerGram ?? 0,
      wholesalePricePerGram: v.wholesalePricePerGram,
      retailPricePerGram: v.retailPricePerGram ?? v.wholesalePricePerGram,
      sellingMode: v.sellingMode ?? "BY_GRAM",
      pricePerPiece: v.pricePerPiece,
      retailPricePerPiece: v.retailPricePerPiece,
    }));

  const created = newVariants.length > 0
    ? await prisma.variant.createMany({ data: newVariants })
    : { count: 0 };

  if (created.count > 0) {
    logAudit({
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      action: "CREATE",
      entity: "Variant",
      entityId: productId,
      detail: { count: created.count, variants: newVariants.map(v => ({ lengthCm: v.lengthCm, color: v.color })) },
      ipAddress: getClientIp(request),
    });
  }

  revalidateTag("products", "max");
  return NextResponse.json({ created: created.count }, { status: 201 });
}
