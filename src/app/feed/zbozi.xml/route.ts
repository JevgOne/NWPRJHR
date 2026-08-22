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

  const FALLBACK_IMG = "https://www.hairland.cz/og/og-offer.jpg";

  for (const product of products) {
    const validPhoto = product.photos.find((p: string) =>
      p && p.startsWith("https://") && !/\.(heic|heif)$/i.test(p)
    );
    const imageUrl = validPhoto ?? FALLBACK_IMG;

    for (const v of product.variants) {
      const isByPiece = v.sellingMode === "BY_PIECE";
      const inStock = isByPiece ? v.availablePieces > 0 : v.availableGrams > 0;
      if (!inStock) continue;

      const priceVat = isByPiece
        ? (v.retailPricePerPiece ?? 0) / 100
        : (v.retailPricePerGram * 100) / 100;

      if (priceVat <= 0) continue;

      const sku = v.sku ?? generateSku(product.category, product.texture, v.color, v.lengthCm, {
        orderOnly: product.orderOnly, origin: product.origin,
      });
      const url = `https://www.hairland.cz/vlasy-k-prodlouzeni/${product.slug ?? product.id}`;
      const title = `${product.name} ${v.lengthCm} cm`;
      const singleDonor = product.category !== "SALE" ? " Vlasy z jedné hlavy — žádné fabrikové vlasy." : "";
      const desc = (product.description?.slice(0, 4900) ?? title) + singleDonor;

      shopItems.push(`  <SHOPITEM>
    <PRODUCTNO>${escapeXml(sku)}</PRODUCTNO>
    <PRODUCTNAME><![CDATA[${title}]]></PRODUCTNAME>
    <DESCRIPTION><![CDATA[${desc}]]></DESCRIPTION>
    <URL>${url}</URL>
    <IMGURL>${imageUrl}</IMGURL>
    <PRICE_VAT>${priceVat.toFixed(2)}</PRICE_VAT>
    <CATEGORYTEXT>Kosmetika a zdraví | Vlasová kosmetika | Vlasy k prodloužení</CATEGORYTEXT>
    <DELIVERY_DATE>0</DELIVERY_DATE>
    <MANUFACTURER>Hairland</MANUFACTURER>
    <DELIVERY>
      <DELIVERY_ID>ZASILKOVNA</DELIVERY_ID>
      <DELIVERY_PRICE>89</DELIVERY_PRICE>
    </DELIVERY>
    <DELIVERY>
      <DELIVERY_ID>CESKA_POSTA_BALIKOVNA</DELIVERY_ID>
      <DELIVERY_PRICE>69</DELIVERY_PRICE>
    </DELIVERY>
    <DELIVERY>
      <DELIVERY_ID>DPD</DELIVERY_ID>
      <DELIVERY_PRICE>99</DELIVERY_PRICE>
    </DELIVERY>
    <DELIVERY>
      <DELIVERY_ID>OSOBNI_ODBER</DELIVERY_ID>
      <DELIVERY_PRICE>0</DELIVERY_PRICE>
    </DELIVERY>
  </SHOPITEM>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<SHOP xmlns="http://www.zbozi.cz/ns/offer/1.0">
${shopItems.join("\n")}
</SHOP>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
