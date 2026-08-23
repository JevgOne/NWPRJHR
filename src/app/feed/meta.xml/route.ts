import { NextResponse } from "next/server";
import { getCachedAllProducts } from "@/lib/cached-products";
import { generateSku } from "@/lib/sku";

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const COLOR_NAMES: Record<string, string> = {
  "1": "Platinová blond", "2": "Světlá blond", "3": "Zlatá blond",
  "4": "Medová blond", "5": "Karamelová", "6": "Světle hnědá",
  "7": "Středně hnědá", "8": "Tmavě hnědá", "9": "Kaštanová",
  "10": "Černá", "ombre": "Ombre",
};

const TEXTURE_NAMES: Record<string, string> = {
  "STRAIGHT": "Rovné", "WAVY": "Vlnité", "CURLY": "Kudrnaté",
  "SLIGHTLY_WAVY": "Mírně vlnité",
};

const CATEGORY_LABELS: Record<string, string> = {
  "PREMIUM": "Premium", "ECONOMY": "Economy", "SALE": "Výprodej",
  "EXCLUSIVE": "Exclusive",
};

export async function GET() {
  const products = await getCachedAllProducts();

  const items: string[] = [];

  const FALLBACK_IMG = "https://www.hairland.cz/og/og-offer.jpg";

  for (const product of products) {
    const validPhotos = product.photos.filter((p: string) =>
      p && p.startsWith("https://") && !/\.(heic|heif)$/i.test(p)
    );
    const imageUrl = validPhotos[0] ?? FALLBACK_IMG;
    const additionalImages = validPhotos.slice(1, 11);

    for (const v of product.variants) {
      const isByPiece = v.sellingMode === "BY_PIECE";
      const inStock = isByPiece ? v.availablePieces > 0 : v.availableGrams > 0;

      const price = isByPiece
        ? (v.retailPricePerPiece ?? 0) / 100
        : (v.retailPricePerGram * 100) / 100;

      if (price <= 0) continue;

      const sku = v.sku ?? generateSku(product.category, product.texture, v.color, v.lengthCm, {
        orderOnly: product.orderOnly, origin: product.origin,
      });
      const url = `https://www.hairland.cz/vlasy-k-prodlouzeni/${product.slug ?? product.id}`;
      const title = `${product.name} ${v.lengthCm} cm`;
      const singleDonor = product.category !== "SALE" ? " Vlasy z jedné hlavy — žádné fabrikové vlasy." : "";
      const desc = (product.description?.slice(0, 4900) ?? title) + singleDonor;

      const colorName = product.colorTone || COLOR_NAMES[v.color] || v.color;
      const textureName = (product.texture ? TEXTURE_NAMES[product.texture] : null) || product.texture || "Rovné";
      const categoryLabel = CATEGORY_LABELS[product.category] || product.category;
      const additionalImgXml = additionalImages.map((img: string) =>
        `\n      <g:additional_image_link>${img}</g:additional_image_link>`
      ).join("");

      items.push(`    <item>
      <g:id>${esc(sku)}</g:id>
      <title><![CDATA[${title}]]></title>
      <description><![CDATA[${desc}]]></description>
      <link>${url}</link>
      <g:image_link>${imageUrl}</g:image_link>${additionalImgXml}
      <g:availability>${inStock ? "in stock" : "out of stock"}</g:availability>
      <g:price>${price.toFixed(2)} CZK</g:price>
      <g:brand>Hairland</g:brand>
      <g:condition>new</g:condition>
      <g:color><![CDATA[${colorName}]]></g:color>
      <g:size>${v.lengthCm} cm</g:size>
      <g:material>100% pravé lidské vlasy</g:material>
      <g:google_product_category>Health &amp; Beauty &gt; Personal Care &gt; Hair Care &gt; Hair Extensions</g:google_product_category>
      <g:product_type><![CDATA[Vlasy k prodloužení > ${product.category} > ${textureName}]]></g:product_type>
      <g:custom_label_0>${esc(categoryLabel)}</g:custom_label_0>
      <g:custom_label_1>${esc(textureName)}</g:custom_label_1>
      <g:identifier_exists>false</g:identifier_exists>
    </item>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Hairland</title>
    <link>https://www.hairland.cz</link>
    <description>Prémiové vlasy k prodloužení — 100% pravé lidské vlasy</description>
${items.join("\n")}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
