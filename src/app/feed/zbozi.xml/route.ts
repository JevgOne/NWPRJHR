import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAllStockNumbers } from "@/lib/stock";
import { generateSku } from "@/lib/sku";

export const revalidate = 3600;

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  const [products, stockMap] = await Promise.all([
    prisma.product.findMany({
      where: { archived: false, variants: { some: { active: true } } },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        description: true,
        origin: true,
        texture: true,
        photos: true,
        variants: {
          where: { active: true },
          select: {
            id: true,
            lengthCm: true,
            color: true,
            retailPricePerGram: true,
            sellingMode: true,
            retailPricePerPiece: true,
          },
        },
      },
    }),
    getAllStockNumbers(),
  ]);

  const shopItems: string[] = [];

  for (const product of products) {
    const photos = JSON.parse(product.photos || "[]") as string[];
    const imageUrl = photos[0] ?? "https://www.hairland.cz/og/og-offer.jpg";

    for (const variant of product.variants) {
      const stock = stockMap.get(variant.id);
      const isByPiece = variant.sellingMode === "BY_PIECE";
      const inStock = isByPiece
        ? (stock?.availablePieces ?? 0) > 0
        : (stock?.availableGrams ?? 0) > 0;

      const priceVat = isByPiece
        ? (variant.retailPricePerPiece ?? 0) / 100
        : (variant.retailPricePerGram * 100) / 100;

      if (priceVat <= 0) continue;

      const sku = generateSku(product.category, product.texture, variant.color, variant.lengthCm);
      const productUrl = `https://www.hairland.cz/vlasy-k-prodlouzeni/${product.slug ?? product.id}`;
      const title = `${product.name} ${variant.lengthCm} cm`;
      const desc = product.description?.slice(0, 5000) ?? title;

      shopItems.push(`  <SHOPITEM>
    <PRODUCTNO>${escapeXml(sku)}</PRODUCTNO>
    <PRODUCT><![CDATA[${title}]]></PRODUCT>
    <DESCRIPTION><![CDATA[${desc}]]></DESCRIPTION>
    <URL>${productUrl}</URL>
    <IMGURL>${imageUrl}</IMGURL>
    <PRICE_VAT>${priceVat.toFixed(2)}</PRICE_VAT>
    <CATEGORYTEXT>Kosmetika a zdraví | Vlasová kosmetika | Vlasy k prodloužení</CATEGORYTEXT>
    <MANUFACTURER>Hairland</MANUFACTURER>
    <DELIVERY>
      <DELIVERY_ID>ZASILKOVNA</DELIVERY_ID>
      <DELIVERY_PRICE>89</DELIVERY_PRICE>
    </DELIVERY>
    <DELIVERY>
      <DELIVERY_ID>OSOBNI_ODBER</DELIVERY_ID>
      <DELIVERY_PRICE>0</DELIVERY_PRICE>
    </DELIVERY>
  </SHOPITEM>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<SHOP>
${shopItems.join("\n")}
</SHOP>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
