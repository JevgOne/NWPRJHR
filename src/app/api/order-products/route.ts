import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildProductSlug, uniqueSlug } from "@/lib/slugify";
import { calculateRetailPrice } from "@/lib/pricing";
import { generateProductBio } from "@/lib/product-bio";
import { autoColorTone, CATEGORY_NAMES } from "@/lib/product-helpers";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { category, origin, texture, color, lengthCm, supplierCode, photoCode, photos, purchasePricePer100g, currency, exchangeRate, leadDays } = body;

  if (!category || !origin || !texture || !color || !lengthCm) {
    return NextResponse.json({ error: "Chybí povinné atributy" }, { status: 400 });
  }

  // Pricing: purchasePricePer100g (in original currency) → per gram CZK → retail via markup
  const pricePer100gCents = Math.round(purchasePricePer100g * 100);
  const pricePerGramRaw = Math.round(pricePer100gCents / 100);
  const costPerGramCzk = currency === "CZK"
    ? pricePerGramRaw
    : Math.round((pricePerGramRaw * exchangeRate) / 10000);

  const priceSetting = await prisma.priceSettings.findUnique({ where: { category } });
  const markupPercent = priceSetting?.markupPercent ?? 110;
  const retailPrice = calculateRetailPrice(costPerGramCzk, markupPercent);

  // Product name + slug
  const catNames = CATEGORY_NAMES[category] ?? CATEGORY_NAMES.STANDARD;
  const productName = `${catNames.cs} — ${texture}`;
  const colorTone = autoColorTone(color);
  const slugBase = buildProductSlug({ category, origin, texture, colorCode: color, lengthCm });
  const slug = await uniqueSlug(slugBase, prisma);

  // Bio descriptions
  const bioData = { name: productName, category, processingType: "OTHER", origin, texture, colorTone, lengths: [lengthCm] };

  const product = await prisma.product.create({
    data: {
      name: productName,
      nameUk: `${catNames.uk} — ${texture}`,
      nameRu: `${catNames.ru} — ${texture}`,
      description: generateProductBio(bioData, "cs"),
      descriptionUk: generateProductBio(bioData, "uk"),
      descriptionRu: generateProductBio(bioData, "ru"),
      category,
      processingType: "OTHER",
      origin,
      texture,
      colorTone,
      orderOnly: true,
      supplierCode: supplierCode || null,
      photoCode: photoCode || null,
      photos: JSON.stringify(photos ?? []),
      slug,
      variants: {
        create: {
          lengthCm,
          color,
          costPricePerGram: costPerGramCzk,
          wholesalePricePerGram: costPerGramCzk,
          retailPricePerGram: retailPrice,
          sellingMode: "BY_PIECE",
          availableToOrder: true,
          orderLeadDays: leadDays || 14,
        },
      },
    },
  });

  revalidateTag("products", { expire: 0 });
  return NextResponse.json({ id: product.id }, { status: 201 });
}
