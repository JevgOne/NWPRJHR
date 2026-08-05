import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateProductSchema } from "@/lib/validations/product";
import { serializeProductForRole } from "@/lib/api/product-serializer";
import { logAudit, getClientIp } from "@/lib/audit";

const CATEGORY_NAMES: Record<string, { cs: string; uk: string; ru: string }> = {
  VIRGIN: { cs: "Panenské Vlasy", uk: "Натуральне Волосся", ru: "Натуральные Волосы" },
  LUXE: { cs: "Luxe Vlasy", uk: "Люкс Волосся", ru: "Люкс Волосы" },
  STANDARD: { cs: "Standard Vlasy", uk: "Стандарт Волосся", ru: "Стандарт Волосы" },
  SALE: { cs: "Výprodej", uk: "Розпродаж", ru: "Распродажа" },
};

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: [{ lengthCm: "asc" }, { color: "asc" }] } },
  });

  if (!product)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(serializeProductForRole(product, session.user.role));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // When category changes, update name/slug/variant prices
  if (parsed.data.category) {
    const current = await prisma.product.findUnique({
      where: { id },
      select: {
        category: true,
        texture: true,
        origin: true,
        variants: {
          where: { active: true },
          select: {
            id: true,
            color: true,
            lengthCm: true,
            costPricePerGram: true,
            retailManualOverride: true,
            sellingMode: true,
            pricePerPiece: true,
          },
        },
      },
    });

    if (current && current.category !== parsed.data.category) {
      const newCat = parsed.data.category;
      const catNames = CATEGORY_NAMES[newCat] ?? CATEGORY_NAMES.STANDARD;
      const texture = parsed.data.texture ?? current.texture ?? "";

      // Regenerate names
      parsed.data.name = `${catNames.cs} — ${texture}`;
      parsed.data.nameUk = `${catNames.uk} — ${texture}`;
      parsed.data.nameRu = `${catNames.ru} — ${texture}`;

      // Regenerate slug
      const firstVariant = current.variants[0];
      if (firstVariant) {
        parsed.data.slug = slugify(
          `${newCat}-${current.origin ?? ""}-${texture}-${firstVariant.color}-${firstVariant.lengthCm}cm`
        );
      } else {
        parsed.data.slug = slugify(`${newCat}-${current.origin ?? ""}-${texture}`);
      }

      // Recalculate variant prices (skip manual overrides)
      const priceSetting = await prisma.priceSettings.findUnique({
        where: { category: newCat },
      });
      const markupPercent = priceSetting?.markupPercent ?? 100;

      const variantsToUpdate = current.variants.filter(v => !v.retailManualOverride);
      if (variantsToUpdate.length > 0) {
        await Promise.all(
          variantsToUpdate.map(v => {
            const newRetailPerGram = Math.round(
              v.costPricePerGram * (10000 + markupPercent * 100) / 10000
            );
            const data: Record<string, unknown> = { retailPricePerGram: newRetailPerGram, wholesalePricePerGram: newRetailPerGram };
            if (v.sellingMode === "BY_PIECE" && v.pricePerPiece) {
              data.retailPricePerPiece = Math.round(
                v.pricePerPiece * (10000 + markupPercent * 100) / 10000
              );
            }
            return prisma.variant.update({ where: { id: v.id }, data });
          })
        );
      }
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: parsed.data,
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "Product",
    entityId: id,
    detail: { changes: parsed.data },
    ipAddress: getClientIp(request),
  });

  revalidateTag("products", "max");
  return NextResponse.json(product);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const hard = request.nextUrl.searchParams.get("hard") === "true";

  if (!hard) {
    // Soft delete (archive)
    const product = await prisma.product.update({
      where: { id },
      data: { archived: true },
    });

    logAudit({
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      action: "ARCHIVE",
      entity: "Product",
      entityId: id,
      ipAddress: getClientIp(request),
    });

    revalidateTag("products", "max");
    return NextResponse.json(product);
  }

  // Hard delete — permanently remove product + all related data
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!product)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const variantIds = (
    await prisma.variant.findMany({
      where: { productId: id },
      select: { id: true },
    })
  ).map((v) => v.id);

  // Pre-check: block if sales or orders reference these variants
  if (variantIds.length > 0) {
    const [saleItemCount, orderItemCount] = await Promise.all([
      prisma.saleItem.count({ where: { variantId: { in: variantIds } } }),
      prisma.orderItem.count({ where: { variantId: { in: variantIds } } }),
    ]);

    if (saleItemCount > 0 || orderItemCount > 0) {
      return NextResponse.json(
        {
          error: "Produkt má historii prodejů nebo objednávek. Použijte archivaci.",
          salesCount: saleItemCount,
          ordersCount: orderItemCount,
        },
        { status: 409 }
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    if (variantIds.length > 0) {
      // Delete stock movements
      await tx.stockMovement.deleteMany({ where: { variantId: { in: variantIds } } });

      // Delete returns + complaints (tied to deliveries)
      const deliveryIds = (
        await tx.delivery.findMany({ where: { variantId: { in: variantIds } }, select: { id: true } })
      ).map((d) => d.id);
      if (deliveryIds.length > 0) {
        await tx.return.deleteMany({ where: { deliveryId: { in: deliveryIds } } });
        await tx.complaint.deleteMany({ where: { deliveryId: { in: deliveryIds } } });
      }

      // Delete deliveries
      await tx.delivery.deleteMany({ where: { variantId: { in: variantIds } } });

      // Delete reservations
      await tx.reservation.deleteMany({ where: { variantId: { in: variantIds } } });

      // Delete stock subscriptions (has cascade, but explicit for safety)
      await tx.stockSubscription.deleteMany({ where: { variantId: { in: variantIds } } });

      // Delete product reservations
      await tx.productReservation.deleteMany({ where: { variantId: { in: variantIds } } });
    }

    // Delete sample requests
    await tx.sampleRequest.deleteMany({ where: { productId: id } });

    // Nullify reviews (productId is nullable)
    await tx.review.updateMany({ where: { productId: id }, data: { productId: null } });

    // Delete variants + product
    await tx.variant.deleteMany({ where: { productId: id } });
    await tx.product.delete({ where: { id } });
  }, { timeout: 30000 });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "HARD_DELETE",
    entity: "Product",
    entityId: id,
    detail: { productName: product.name, variantCount: variantIds.length },
    ipAddress: getClientIp(request),
  });

  revalidatePath("/inventory");
  revalidatePath("/inventory/movements");
  revalidateTag("dashboard", "max");
  revalidateTag("products", "max");

  return NextResponse.json({ deleted: true, productName: product.name });
}
