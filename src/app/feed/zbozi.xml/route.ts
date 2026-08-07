import { NextResponse } from "next/server";
import { getCachedAllProducts } from "@/lib/cached-products";
import { generateSku } from "@/lib/sku";

export const dynamic = "force-dynamic";

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  const products = await getCachedAllProducts();

  const shopItems: string[] = [];

  for (const product of products) {
    const imageUrl = product.photos[0] ?? "https://www.hairland.cz/og/og-offer.jpg";

    for (const v of product.variants) {
      const isByPiece = v.sellingMode === "BY_PIECE";
      const inStock = isByPiece ? v.availablePieces > 0 : v.availableGrams > 0;

      const priceVat = isByPiece
        ? (v.retailPricePerPiece ?? 0) / 100
        : (v.retailPricePerGram * 100) / 100;

      if (priceVat <= 0) continue;

      const sku = generateSku(product.category, product.texture, v.color, v.lengthCm);
      const url = `https://www.hairland.cz/vlasy-k-prodlouzeni/${product.slug ?? product.id}`;
      const title = `${product.name} ${v.lengthCm} cm`;
      const desc = product.description?.slice(0, 5000) ?? title;

      shopItems.push(`  <SHOPITEM>
    <PRODUCTNO>${escapeXml(sku)}</PRODUCTNO>
    <PRODUCT><![CDATA[${title}]]></PRODUCT>
    <DESCRIPTION><![CDATA[${desc}]]></DESCRIPTION>
    <URL>${url}</URL>
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
