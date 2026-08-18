import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({ where: { id }, select: { id: true, orderOnly: true } });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.product.update({
      where: { id },
      data: { archived: true },
    });
  } catch (err) {
    console.error("[order-products] Delete failed:", err);
    return NextResponse.json({ error: "Chyba při mazání" }, { status: 500 });
  }

  revalidateTag("products", { expire: 0 });

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, orderOnly: true, variants: { where: { active: true }, select: { id: true } } },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!product.orderOnly) return NextResponse.json({ error: "Not an order-only product" }, { status: 400 });

  try {
    const productUpdate: Record<string, unknown> = {};
    if (body.supplierCode !== undefined) productUpdate.supplierCode = body.supplierCode || null;
    if (body.photoCode !== undefined) productUpdate.photoCode = body.photoCode || null;
    if (body.photos !== undefined) productUpdate.photos = JSON.stringify(body.photos);

    if (Object.keys(productUpdate).length > 0) {
      await prisma.product.update({ where: { id }, data: productUpdate });
    }

    const variantId = product.variants[0]?.id;
    if (variantId) {
      const variantUpdate: Record<string, unknown> = {};
      if (body.retailPricePerGram !== undefined) variantUpdate.retailPricePerGram = body.retailPricePerGram;
      if (body.retailPricePerPiece !== undefined) variantUpdate.retailPricePerPiece = body.retailPricePerPiece;
      if (body.orderLeadDays !== undefined) variantUpdate.orderLeadDays = body.orderLeadDays;

      if (Object.keys(variantUpdate).length > 0) {
        await prisma.variant.update({ where: { id: variantId }, data: variantUpdate });
      }
    }

    revalidateTag("products", { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[order-products] PATCH failed:", err);
    return NextResponse.json({ error: "Chyba při ukládání" }, { status: 500 });
  }
}
