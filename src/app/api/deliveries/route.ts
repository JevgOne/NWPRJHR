import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stockInSchema, newStockInSchema } from "@/lib/validations/delivery";
import { serializeDeliveryForRole } from "@/lib/api/delivery-serializer";
import { stockIn } from "@/lib/stock-in";
import { generateBarcode } from "@/lib/barcode";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const variantId = searchParams.get("variantId");
  const supplierId = searchParams.get("supplierId");
  const hasStock = searchParams.get("hasStock");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (variantId) where.variantId = variantId;
  if (supplierId) where.supplierId = supplierId;
  if (hasStock === "true") where.remainingGrams = { gt: 0 };
  if (from || to) {
    where.stockedAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const deliveries = await prisma.delivery.findMany({
    where,
    include: { supplier: true },
    orderBy: { stockedAt: "desc" },
  });

  const serialized = deliveries
    .map((d) => serializeDeliveryForRole(d, session.user.role))
    .filter(Boolean);

  return NextResponse.json(serialized);
}

// Color code → colorTone mapping
function autoColorTone(colorCode: string): string {
  const map: Record<string, string> = {
    "1": "Blond", "2": "Blond", "3": "Blond", "4": "Blond",
    "5": "Hnědá", "6": "Hnědá", "7": "Hnědá",
    "8": "Tmavě hnědá", "9": "Tmavě hnědá", "10": "Tmavě hnědá",
  };
  return map[colorCode] ?? "Hnědá";
}

const CATEGORY_NAMES: Record<string, { cs: string; uk: string; ru: string }> = {
  VIRGIN: { cs: "Panenské Vlasy", uk: "Натуральне Волосся", ru: "Натуральные Волосы" },
  PREMIUM: { cs: "Premium Vlasy", uk: "Преміум Волосся", ru: "Премиум Волосы" },
  STANDARD: { cs: "Standard Vlasy", uk: "Стандарт Волосся", ru: "Стандарт Волосы" },
  SALE: { cs: "Výprodej", uk: "Розпродаж", ru: "Распродажа" },
};

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  // New wizard flow: find-or-create product + variant
  if (body.category && body.origin && body.texture && body.color && body.lengthCm) {
    const parsed = newStockInSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const data = parsed.data;

    // 1. Find or create Product (unique per category+origin+texture+color+length)
    let product = await prisma.product.findFirst({
      where: {
        category: data.category,
        origin: data.origin,
        texture: data.texture,
        archived: false,
        variants: { some: { color: data.color, lengthCm: data.lengthCm } },
      },
    });

    if (!product) {
      const catNames = CATEGORY_NAMES[data.category] ?? CATEGORY_NAMES.STANDARD;
      product = await prisma.product.create({
        data: {
          name: `${catNames.cs} ${data.origin} ${data.texture}`,
          nameUk: `${catNames.uk} ${data.origin} ${data.texture}`,
          nameRu: `${catNames.ru} ${data.origin} ${data.texture}`,
          category: data.category,
          processingType: "OTHER",
          origin: data.origin,
          texture: data.texture,
          colorTone: autoColorTone(data.color),
          slug: slugify(`${data.category}-${data.origin}-${data.texture}-${data.color}-${data.lengthCm}cm`),
          photos: "[]",
        },
      });
    }

    // 2. Find or create Variant
    let variant = await prisma.variant.findUnique({
      where: { productId_lengthCm_color: { productId: product.id, lengthCm: data.lengthCm, color: data.color } },
    });

    if (!variant) {
      // Get markup from PriceSettings for retail price calculation
      const priceSetting = await prisma.priceSettings.findUnique({ where: { category: data.category } });
      const markupPercent = priceSetting?.markupPercent ?? 200;
      const retailPrice = Math.round(data.purchasePricePerGramRaw * (10000 + markupPercent * 100) / 10000);

      variant = await prisma.variant.create({
        data: {
          productId: product.id,
          lengthCm: data.lengthCm,
          color: data.color,
          costPricePerGram: data.purchasePricePerGramRaw,
          wholesalePricePerGram: data.purchasePricePerGramRaw,
          retailPricePerGram: retailPrice,
          active: true,
        },
      });
    }

    // 3. Stock in
    const delivery = await stockIn(
      {
        variantId: variant.id,
        supplierId: data.supplierId,
        purchasePricePerGramRaw: data.purchasePricePerGramRaw,
        currency: data.currency,
        exchangeRate: data.exchangeRate,
        totalGrams: data.totalGrams,
        totalPieces: data.totalPieces,
        barcode: generateBarcode(),
        stockedAt: data.stockedAt ? new Date(data.stockedAt) : undefined,
        note: data.note,
      },
      session.user.id
    );

    return NextResponse.json(
      { ...delivery, productId: product.id, productName: product.name, productSlug: product.slug },
      { status: 201 }
    );
  }

  // Legacy flow: direct variantId
  const parsed = stockInSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  const delivery = await stockIn(
    {
      variantId: data.variantId,
      supplierId: data.supplierId,
      purchasePricePerGramRaw: data.purchasePricePerGramRaw,
      currency: data.currency,
      exchangeRate: data.exchangeRate,
      totalGrams: data.totalGrams,
      totalPieces: data.totalPieces,
      pieceWeightGrams: data.pieceWeightGrams,
      barcode: data.barcode || generateBarcode(),
      batchCode: data.batchCode,
      stockedAt: data.stockedAt ? new Date(data.stockedAt) : undefined,
      note: data.note,
    },
    session.user.id
  );

  const variant = await prisma.variant.findUnique({
    where: { id: delivery.variantId },
    select: { productId: true, product: { select: { name: true, slug: true } } },
  });

  return NextResponse.json(
    { ...delivery, productId: variant?.productId, productName: variant?.product.name, productSlug: variant?.product.slug },
    { status: 201 }
  );
}
