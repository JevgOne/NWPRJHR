import { NextResponse } from "next/server";
import { getCachedAllProducts } from "@/lib/cached-products";
import { generateSku } from "@/lib/sku";

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  const products = await getCachedAllProducts();

  const items: string[] = [];

  for (const product of products) {
    const imageUrl = product.photos[0] ?? "https://www.hairland.cz/og/og-offer.jpg";

    for (const v of product.variants) {
      const isByPiece = v.sellingMode === "BY_PIECE";
      const inStock = isByPiece ? v.availablePieces > 0 : v.availableGrams > 0;

      // BY_GRAM: price per 100g in Kč (retailPricePerGram is halere/gram)
      // BY_PIECE: price per piece in Kč
      const price = isByPiece
        ? (v.retailPricePerPiece ?? 0) / 100
        : (v.retailPricePerGram * 100) / 100;

      if (price <= 0) continue;

      const sku = generateSku(product.category, product.texture, v.color, v.lengthCm);
      const url = `https://www.hairland.cz/vlasy-k-prodlouzeni/${product.slug ?? product.id}`;
      const title = `${product.name} ${v.lengthCm} cm`;
      const desc = product.description?.slice(0, 5000) ?? title;

      items.push(`    <item>
      <g:id>${esc(sku)}</g:id>
      <title><![CDATA[${title}]]></title>
      <description><![CDATA[${desc}]]></description>
      <link>${url}</link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:availability>${inStock ? "in_stock" : "out_of_stock"}</g:availability>
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
