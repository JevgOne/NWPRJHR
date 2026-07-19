import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
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
    ipAddress: getClientIp(_request),
  });

  revalidateTag("products", "max");
  return NextResponse.json(product);
}
