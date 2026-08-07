import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAllStockNumbers } from "@/lib/stock";
import { generateSku } from "@/lib/sku";

export const dynamic = "force-dynamic";

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

  const items: string[] = [];

  for (const product of products) {
    const photos = JSON.parse(product.photos || "[]") as string[];
    const imageUrl = photos[0] ?? "https://www.hairland.cz/og/og-offer.jpg";

    for (const variant of product.variants) {
      const stock = stockMap.get(variant.id);
      const isByPiece = variant.sellingMode === "BY_PIECE";
      const inStock = isByPiece
        ? (stock?.availablePieces ?? 0) > 0
        : (stock?.availableGrams ?? 0) > 0;

      // BY_GRAM: price per 100g (retailPricePerGram is in halere per gram → *100 grams / 100 halere = Kč)
      // BY_PIECE: price per piece (retailPricePerPiece in halere / 100 = Kč)
      const price = isByPiece
        ? (variant.retailPricePerPiece ?? 0) / 100
        : (variant.retailPricePerGram * 100) / 100;

      if (price <= 0) continue;

      const sku = generateSku(product.category, product.texture, variant.color, variant.lengthCm);
      const productUrl = `https://www.hairland.cz/vlasy-k-prodlouzeni/${product.slug ?? product.id}`;
      const title = `${product.name} ${variant.lengthCm} cm`;
      const availability = inStock ? "in_stock" : "out_of_stock";
      const desc = product.description?.slice(0, 5000) ?? title;

      items.push(`    <item>
      <g:id>${escapeXml(sku)}</g:id>
      <title><![CDATA[${title}]]></title>
      <description><![CDATA[${desc}]]></description>
      <link>${productUrl}</link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${price.toFixed(2)} CZK</g:price>
      <g:brand>Hairland</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>2441</g:google_product_category>
      <g:product_type><![CDATA[Vlasy k prodloužení > ${product.category}]]></g:product_type>
      <g:identifier_exists>false</g:identifier_exists>
      <g:shipping>
        <g:country>CZ</g:country>
        <g:price>89.00 CZK</g:price>
      </g:shipping>
    </item>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Hairland</title>
    <link>https://www.hairland.cz</link>
    <description>Prémiové vlasy k prodloužení</description>
${items.join("\n")}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
