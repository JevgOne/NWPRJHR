import { prisma } from "@/lib/db";
import { getCachedAllProducts } from "@/lib/cached-products";
import { articles } from "../[locale]/(public)/poradna/articles";

export const revalidate = 3600;

const CATEGORY_NAMES: Record<string, string> = {
  KERATIN: "Keratinove vlasy",
  MICRO_RING: "Micro-ring vlasy",
  TAPE_IN: "Tape-in vlasy",
  CLIP_IN: "Clip-in vlasy",
  WEFT: "Tresove vlasy",
  PONYTAIL: "Culik",
  BANGS: "Ofiny",
  ACCESSORIES: "Prislusenstvi",
  COSMETICS: "Vlasova kosmetika",
};

const TEXTURE_NAMES: Record<string, string> = {
  STRAIGHT: "Rovne",
  WAVY: "Vlnite",
  CURLY: "Kudrnate",
  SLIGHTLY_WAVY: "Mirne vlnite",
};

const ORIGIN_NAMES: Record<string, string> = {
  SLAVIC: "Slovanske",
  UKRAINIAN: "Ukrajinske",
  VIRGIN: "Panenske (virgin)",
  SOUTH_RUSSIAN: "Jihoruske",
  ASIAN: "Asijske",
  VIETNAMESE: "Vietnamske",
};

const COLOR_NAMES: Record<string, string> = {
  "1": "Platinova blond",
  "2": "Svetla blond",
  "3": "Zlata blond",
  "4": "Medova blond",
  "5": "Karamelova",
  "6": "Svetle hneda",
  "7": "Stredne hneda",
  "8": "Tmave hneda",
  "9": "Kastanova",
  "10": "Cerna",
};

export async function GET() {
  const [products, blogPosts] = await Promise.all([
    getCachedAllProducts(),
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        category: true,
        publishedAt: true,
      },
    }),
  ]);

  let content = `# Hairland.cz — Kompletni obsah

> Premiove 100% prave lidske vlasy k prodlouzeni. E-shop s RAW vlasy — slovanske, ukrajinske, panenske. Praha.

---

## Produkty k prodlouzeni vlasu

`;

  // Group products by category
  const byCategory = new Map<string, typeof products>();
  for (const product of products) {
    const cat = product.category ?? "OTHER";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(product);
  }

  for (const [category, catProducts] of byCategory) {
    content += `### ${CATEGORY_NAMES[category] ?? category}\n\n`;

    for (const product of catProducts) {
      content += `#### ${product.name}\n`;
      if (product.description) {
        content += `${product.description.replace(/<[^>]*>/g, "").substring(0, 500)}\n`;
      }
      content += `- Kategorie: ${CATEGORY_NAMES[product.category ?? ""] ?? product.category}\n`;
      if (product.texture) content += `- Textura: ${TEXTURE_NAMES[product.texture] ?? product.texture}\n`;
      if (product.origin) content += `- Puvod: ${ORIGIN_NAMES[product.origin] ?? product.origin}\n`;

      const lengths = [...new Set(product.variants.map((v) => v.lengthCm))].filter(Boolean).sort((a, b) => a - b);
      if (lengths.length > 0) content += `- Delky: ${lengths.map((l) => `${l} cm`).join(", ")}\n`;

      const colors = [...new Set(product.variants.map((v) => v.color))].filter(Boolean);
      if (colors.length > 0) content += `- Barvy: ${colors.map((c) => COLOR_NAMES[c] ?? `#${c}`).join(", ")}\n`;

      const prices = product.variants
        .map((v) => v.retailPricePerGram ?? v.retailPricePerPiece)
        .filter((p): p is number => p !== null && p > 0);
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const mode = product.variants[0]?.sellingMode;
        const unit = mode === "BY_PIECE" ? "ks" : "g";
        content += `- Cena: od ${(minPrice / 100).toFixed(0)} Kc/${unit}`;
        if (minPrice !== maxPrice) content += ` do ${(maxPrice / 100).toFixed(0)} Kc/${unit}`;
        content += "\n";
      }

      content += `- URL: https://www.hairland.cz/vlasy-k-prodlouzeni/${product.slug ?? product.id}\n\n`;
    }
  }

  // Blog posts
  if (blogPosts.length > 0) {
    content += `---\n\n## Blog\n\n`;

    for (const post of blogPosts) {
      content += `### ${post.title}\n`;
      if (post.excerpt) content += `${post.excerpt}\n`;
      if (post.content) {
        const plainText = post.content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
        content += `\n${plainText.substring(0, 2000)}\n`;
        if (plainText.length > 2000) content += "...\n";
      }
      content += `- Kategorie: ${post.category}\n`;
      if (post.publishedAt) content += `- Publikovano: ${new Date(post.publishedAt).toISOString().split("T")[0]}\n`;
      content += `- URL: https://www.hairland.cz/blog/${post.slug}\n\n`;
    }
  }

  // Poradna articles
  content += `---\n\n## Poradna (navody a tipy)\n\n`;

  for (const article of articles) {
    content += `### ${article.slug.replace(/-/g, " ").replace(/^\w/, (c: string) => c.toUpperCase())}\n`;
    content += `- Kategorie: ${article.category}\n`;
    content += `- Doba cteni: ${article.readMin} min\n`;
    content += `- URL: https://www.hairland.cz/poradna/${article.slug}\n\n`;
  }

  // Business info
  content += `---\n\n## O firme\n\n`;
  content += `- Nazev: Hairland (provozovatel Alvento Solutions s.r.o.)\n`;
  content += `- ICO: 24111953\n`;
  content += `- Sidlo: Skolska 660/3, 110 00 Praha 1\n`;
  content += `- E-mail: info@hairland.cz\n`;
  content += `- Telefon: +420 608 553 103\n`;
  content += `- Web: https://www.hairland.cz\n\n`;

  content += `## Sluzby\n\n`;
  content += `- Prodej premiovych 100% lidskych vlasu k prodlouzeni\n`;
  content += `- Osobni ukazka a konzultace v Praze zdarma\n`;
  content += `- Expresni zpracovani na miru do 7 dni\n`;
  content += `- Doprava zdarma po Praze\n`;
  content += `- B2B program pro kadernice a salony (slevy 15-30%)\n`;
  content += `- Zasilkovna, Ceska posta, osobni odber\n\n`;

  content += `## Dostupne jazyky\n\n`;
  content += `- Cestina: https://www.hairland.cz\n`;
  content += `- Ukrajinstina: https://www.hairland.cz/ua/\n`;
  content += `- Rustina: https://www.hairland.cz/rus/\n`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
