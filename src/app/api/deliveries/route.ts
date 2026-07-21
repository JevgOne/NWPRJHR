import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stockInSchema, newStockInSchema } from "@/lib/validations/delivery";
import { serializeDeliveryForRole } from "@/lib/api/delivery-serializer";
import { stockIn } from "@/lib/stock-in";
import { generateBarcode } from "@/lib/barcode";
import { calculateRetailPrice } from "@/lib/pricing";
import { logAudit, getClientIp } from "@/lib/audit";

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
    include: {
      supplier: true,
      variant: { select: { color: true, lengthCm: true, product: { select: { name: true } } } },
      createdByUser: { select: { name: true } },
    },
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
  LUXE: { cs: "Luxe Vlasy", uk: "Люкс Волосся", ru: "Люкс Волосы" },
  STANDARD: { cs: "Standard Vlasy", uk: "Стандарт Волосся", ru: "Стандарт Волосы" },
  SALE: { cs: "Výprodej", uk: "Розпродаж", ru: "Распродажа" },
  ACCESSORY: { cs: "Příslušenství", uk: "Аксесуари", ru: "Аксессуары" },
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
  const isAccessory = body.category === "ACCESSORY";
  if (body.category && (isAccessory || (body.origin && body.texture && body.color && body.lengthCm))) {
    const parsed = newStockInSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    try {

    const data = parsed.data;

    // 1. Find product + pre-fetch price settings in parallel (both use data.category)
    // BY_PIECE products never share with BY_GRAM — always create a new product
    const isByPiece = data.sellingMode === "BY_PIECE";
    const [existingProduct, priceSetting] = await Promise.all([
      isByPiece
        ? Promise.resolve(null)
        : prisma.product.findFirst({
            where: {
              category: data.category,
              ...(isAccessory
                ? { archived: false, variants: { some: { color: data.color, lengthCm: data.lengthCm } } }
                : { origin: data.origin, texture: data.texture, archived: false, variants: { some: { color: data.color, lengthCm: data.lengthCm } } }
              ),
            },
          }),
      prisma.priceSettings.findUnique({ where: { category: data.category } }),
    ]);

    let product = existingProduct;
    if (!product) {
      const catNames = CATEGORY_NAMES[data.category] ?? CATEGORY_NAMES.STANDARD;
      if (isAccessory) {
        product = await prisma.product.create({
          data: {
            name: catNames.cs,
            nameUk: catNames.uk,
            nameRu: catNames.ru,
            category: data.category,
            processingType: "OTHER",
            slug: slugify(`${data.category}-${data.color}-${Date.now()}`),
            photos: "[]",
          },
        });
      } else {
        product = await prisma.product.create({
          data: {
            name: `${catNames.cs} — ${data.texture}`,
            nameUk: `${catNames.uk} — ${data.texture}`,
            nameRu: `${catNames.ru} — ${data.texture}`,
            category: data.category,
            processingType: "OTHER",
            origin: data.origin,
            texture: data.texture,
            colorTone: autoColorTone(data.color),
            slug: slugify(`${data.category}-${data.origin}-${data.texture}-${data.color}-${data.lengthCm}cm${isByPiece ? `-${Date.now()}` : ""}`),
            photos: "[]",
          },
        });
      }
    }

    // 2. Find or create Variant
    let variant = await prisma.variant.findUnique({
      where: { productId_lengthCm_color: { productId: product.id, lengthCm: data.lengthCm, color: data.color } },
    });

    // For BY_PIECE: derive per-gram purchase price from per-piece purchase price
    const effectivePurchasePricePerGramRaw = isByPiece && data.purchasePricePerPiece && data.pieceWeightGrams
      ? Math.round(data.purchasePricePerPiece / data.pieceWeightGrams)
      : data.purchasePricePerGramRaw;

    // Convert raw purchase price to CZK (raw is in original currency halere/cents)
    const costPricePerGramCZK = data.currency === "CZK"
      ? effectivePurchasePricePerGramRaw
      : Math.round((effectivePurchasePricePerGramRaw * data.exchangeRate) / 10000);

    if (!variant) {
      const markupPercent = priceSetting?.markupPercent ?? 100;
      const retailPrice = calculateRetailPrice(costPricePerGramCZK, markupPercent);
      const retailPricePerPiece = isByPiece && data.pricePerPiece
        ? calculateRetailPrice(data.pricePerPiece, markupPercent)
        : undefined;

      variant = await prisma.variant.create({
        data: {
          productId: product.id,
          lengthCm: data.lengthCm,
          color: data.color,
          sellingMode: data.sellingMode ?? "BY_GRAM",
          pricePerPiece: isByPiece ? data.pricePerPiece : undefined,
          retailPricePerPiece: isByPiece ? (data.retailPricePerPiece ?? retailPricePerPiece) : undefined,
          costPricePerGram: costPricePerGramCZK,
          wholesalePricePerGram: costPricePerGramCZK,
          retailPricePerGram: retailPrice,
          active: true,
        },
      });
    }

    // For BY_PIECE: compute totalGrams from pieces * pieceWeight
    const effectiveTotalGrams = isByPiece && data.pieceWeightGrams
      ? data.totalPieces * data.pieceWeightGrams
      : data.totalGrams;

    // Resolve batchId: use provided, find open, or auto-create
    let batchId = body.batchId as string | undefined;
    if (!batchId) {
      const openBatch = await prisma.stockBatch.findFirst({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (openBatch) {
        batchId = openBatch.id;
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-indexed
        const monthNames = ["leden","únor","březen","duben","květen","červen","červenec","srpen","září","říjen","listopad","prosinec"];
        const existingCount = await prisma.stockBatch.count({
          where: {
            createdAt: {
              gte: new Date(year, month, 1),
              lt: new Date(year, month + 1, 1),
            },
          },
        });
        const seq = existingCount + 1;
        const newBatch = await prisma.stockBatch.create({
          data: {
            name: `Várka ${seq} — ${monthNames[month]} ${year}`,
            status: "OPEN",
          },
        });
        batchId = newBatch.id;
      }
    }

    const delivery = await stockIn(
      {
        variantId: variant.id,
        supplierId: data.supplierId,
        purchasePricePerGramRaw: effectivePurchasePricePerGramRaw,
        currency: data.currency,
        exchangeRate: data.exchangeRate,
        totalGrams: effectiveTotalGrams,
        totalPieces: data.totalPieces,
        pieceWeightGrams: isByPiece ? data.pieceWeightGrams : undefined,
        exclusive: isByPiece ? (data.exclusive ?? false) : false,
        barcode: generateBarcode(),
        batchId,
        stockedAt: data.stockedAt ? new Date(data.stockedAt) : undefined,
        note: data.note,
      },
      session.user.id
    );

    logAudit({
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      action: "STOCK_IN",
      entity: "Delivery",
      entityId: delivery.id,
      detail: { productName: product.name, variantId: variant.id, totalGrams: effectiveTotalGrams, totalPieces: data.totalPieces, sellingMode: data.sellingMode },
      ipAddress: getClientIp(request),
    });

    revalidatePath("/inventory");
    revalidatePath("/inventory/movements");
    revalidateTag("dashboard", "max");
    revalidateTag("products", "max");

    return NextResponse.json(
      { ...delivery, productId: product.id, productName: product.name, productSlug: product.slug },
      { status: 201 }
    );
    } catch (err) {
      console.error("[deliveries POST] Stock-in failed:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: `Naskladnění selhalo: ${message}` }, { status: 500 });
    }
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
      batchId: data.batchId,
      stockedAt: data.stockedAt ? new Date(data.stockedAt) : undefined,
      note: data.note,
    },
    session.user.id
  );

  const variant = await prisma.variant.findUnique({
    where: { id: delivery.variantId },
    select: { productId: true, product: { select: { name: true, slug: true } } },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "STOCK_IN",
    entity: "Delivery",
    entityId: delivery.id,
    detail: { variantId: data.variantId, totalGrams: data.totalGrams, productName: variant?.product.name },
    ipAddress: getClientIp(request),
  });

  revalidatePath("/inventory");
  revalidateTag("dashboard", "max");
  revalidateTag("products", "max");

  return NextResponse.json(
    { ...delivery, productId: variant?.productId, productName: variant?.product.name, productSlug: variant?.product.slug },
    { status: 201 }
  );
}
