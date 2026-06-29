/**
 * Blog topic plan: 26 articles for 6 months (1/week)
 * Starting July 2026
 * Run: npx tsx scripts/seed-blog-topics.ts
 */
import "dotenv/config";
import { createClient } from "@libsql/client";
import crypto from "crypto";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

interface BlogTopic {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  weekOffset: number; // weeks from start
}

const topics: BlogTopic[] = [
  // WEEK 1-4: July 2026 — Foundation / intro articles
  {
    title: "5 důvodů proč investovat do kvalitních vlasů na prodloužení",
    slug: "5-duvodu-proc-investovat-do-kvalitnich-vlasu",
    excerpt: "Proč se vyplatí sáhnout po prémiových vlasech a jak se liší od levných alternativ.",
    category: "guide",
    weekOffset: 0,
  },
  {
    title: "Clip-in vs tape-in vs keratinové — které prodloužení je pro vás?",
    slug: "clip-in-vs-tape-in-vs-keratinove-prodlouzeni",
    excerpt: "Kompletní srovnání tří nejpopulárnějších metod prodloužení vlasů.",
    category: "guide",
    weekOffset: 1,
  },
  {
    title: "Jak správně pečovat o prodloužené vlasy v létě",
    slug: "pece-o-prodlouzene-vlasy-v-lete",
    excerpt: "Sluníčko, moře a bazén — jak ochránit prodloužené vlasy během letních měsíců.",
    category: "care",
    weekOffset: 2,
  },
  {
    title: "Nejčastější chyby při výběru barvy vlasů na prodloužení",
    slug: "nejcastejsi-chyby-pri-vyberu-barvy-vlasu",
    excerpt: "Jak se vyhnout nesouladu odstínů a vybrat barvu, která dokonale splyne s vašimi vlasy.",
    category: "tips",
    weekOffset: 3,
  },

  // WEEK 5-8: August 2026 — Care & maintenance
  {
    title: "Kompletní průvodce mytím prodloužených vlasů",
    slug: "pruvodce-mytim-prodlouzenych-vlasu",
    excerpt: "Správná technika mytí, ideální teplota vody a doporučené přípravky.",
    category: "care",
    weekOffset: 4,
  },
  {
    title: "Které hřebeny a kartáče jsou ideální pro prodloužené vlasy",
    slug: "idealni-hrebeny-a-kartace-pro-prodlouzene-vlasy",
    excerpt: "Přehled nejlepších kartáčů od Tangle Teezer po kartáče z přírodních štětin.",
    category: "care",
    weekOffset: 5,
  },
  {
    title: "Jak prodloužit životnost keratinových spojů",
    slug: "jak-prodlouzit-zivotnost-keratinovych-spoju",
    excerpt: "Tipy a triky, díky kterým vám keratinové prodloužení vydrží až 6 měsíců.",
    category: "tips",
    weekOffset: 6,
  },
  {
    title: "Virgin vs Remy vlasy — jaký je skutečný rozdíl?",
    slug: "virgin-vs-remy-vlasy-rozdil",
    excerpt: "Vysvětlení pojmů, které každá kadeřnice a zákaznice potřebuje znát.",
    category: "guide",
    weekOffset: 7,
  },

  // WEEK 9-12: September 2026 — Trends & inspiration
  {
    title: "Podzimní trendy 2026: barvy a délky, které budou kralovat",
    slug: "podzimni-trendy-2026-barvy-a-delky",
    excerpt: "Jaké odstíny a délky budou letos na podzim nejžádanější.",
    category: "trends",
    weekOffset: 8,
  },
  {
    title: "Jak si vybrat správnou délku prodloužení — od 30 do 70 cm",
    slug: "jak-vybrat-spravnou-delku-prodlouzeni",
    excerpt: "Průvodce délkami: co vypadá nejpřirozeněji a co vaši klienti oceňují.",
    category: "guide",
    weekOffset: 9,
  },
  {
    title: "Prodloužení vlasů pro kadeřnice: jak začít nabízet tuto službu",
    slug: "prodlouzeni-vlasu-pro-kadernice-jak-zacit",
    excerpt: "Praktický návod pro kadeřnice, které chtějí rozšířit své služby o prodloužení vlasů.",
    category: "tips",
    weekOffset: 10,
  },
  {
    title: "Noční rutina pro prodloužené vlasy — 5 kroků k dokonalé péči",
    slug: "nocni-rutina-pro-prodlouzene-vlasy",
    excerpt: "Co dělat před spaním, aby vaše prodloužení vypadalo jako nové.",
    category: "care",
    weekOffset: 11,
  },

  // WEEK 13-17: October 2026 — B2B & professional
  {
    title: "Jak vybírat dodavatele vlasů: na co se ptát a čemu se vyhnout",
    slug: "jak-vybirat-dodavatele-vlasu",
    excerpt: "Kontrolní seznam pro kadeřnice a salony při výběru spolehlivého dodavatele.",
    category: "tips",
    weekOffset: 12,
  },
  {
    title: "Proč jsou ukrajinské vlasy považovány za nejkvalitnější v Evropě",
    slug: "proc-ukrajinske-vlasy-nejkvalitnejsi-v-evrope",
    excerpt: "Historie, struktura a zpracování vlasů z Ukrajiny — co je dělá výjimečnými.",
    category: "guide",
    weekOffset: 13,
  },
  {
    title: "Tape-in prodloužení: kompletní průvodce aplikací a přeaplikací",
    slug: "tape-in-prodlouzeni-pruvodce-aplikaci",
    excerpt: "Krok za krokem: jak správně aplikovat tape-in pásky a kdy je čas na přeaplikaci.",
    category: "guide",
    weekOffset: 14,
  },
  {
    title: "Jak poznat kvalitní vlasy od nekvalitních — 7 testů",
    slug: "jak-poznat-kvalitni-vlasy-7-testu",
    excerpt: "Jednoduché testy, které můžete udělat i doma: od testu ohněm po test pod mikroskopem.",
    category: "tips",
    weekOffset: 15,
  },
  {
    title: "B2B spolupráce s Hairland: výhody pro salony a kadeřnice",
    slug: "b2b-spoluprace-vyhody-pro-salony",
    excerpt: "Velkoobchodní ceny, osobní konzultace a rychlé dodání — proč spolupracovat s námi.",
    category: "news",
    weekOffset: 16,
  },

  // WEEK 18-21: November 2026 — Winter prep & advanced
  {
    title: "Zimní péče o prodloužené vlasy: ochrana před suchem a statickou elektřinou",
    slug: "zimni-pece-o-prodlouzene-vlasy",
    excerpt: "Jak zvládnout období topení, čepic a suchého vzduchu s prodlouženými vlasy.",
    category: "care",
    weekOffset: 17,
  },
  {
    title: "Barvení prodloužených vlasů: co je bezpečné a co rozhodně nedělat",
    slug: "barveni-prodlouzenych-vlasu-bezpecnost",
    excerpt: "Přehled technik barvení, které můžete použít na prodloužené vlasy bez rizika poškození.",
    category: "tips",
    weekOffset: 18,
  },
  {
    title: "Micro ring metoda — nejšetrnější prodloužení vlasů",
    slug: "micro-ring-metoda-nejsetrnejsi-prodlouzeni",
    excerpt: "Vše o micro ring: jak funguje, komu se hodí a jaké jsou její výhody oproti ostatním metodám.",
    category: "guide",
    weekOffset: 19,
  },
  {
    title: "Přehled příslušenství pro prodloužené vlasy: co opravdu potřebujete",
    slug: "prehled-prislusenstvi-pro-prodlouzene-vlasy",
    excerpt: "Od speciálních kartáčů po oleje a spreje — co vám usnadní péči o prodloužení.",
    category: "care",
    weekOffset: 20,
  },

  // WEEK 22-26: December 2026 — Holiday season & wrap-up
  {
    title: "Vánoční styling s prodlouženými vlasy: 5 slavnostních účesů",
    slug: "vanocni-styling-prodlouzene-vlasy-ucesy",
    excerpt: "Inspirace pro vánoční večírky, plesy a svátky — účesy, které ohromí.",
    category: "trends",
    weekOffset: 21,
  },
  {
    title: "Dárek pod stromeček: proč je prodloužení vlasů perfektní dárek",
    slug: "prodlouzeni-vlasu-jako-vanocni-darek",
    excerpt: "Dárkové poukazy na prodloužení vlasů — originální dárek pro ženy, které chtějí změnu.",
    category: "news",
    weekOffset: 22,
  },
  {
    title: "Rok 2026 v prodloužení vlasů: shrnutí trendů a co nás čeká v 2027",
    slug: "rok-2026-trendy-prodlouzeni-vlasu-shrnuti",
    excerpt: "Ohlédnutí za rokem 2026: nejpopulárnější metody, barvy a délky.",
    category: "trends",
    weekOffset: 23,
  },
  {
    title: "Jak si udržet prodloužené vlasy krásné i po 6 měsících",
    slug: "jak-udrzet-prodlouzene-vlasy-krasne-po-6-mesicich",
    excerpt: "Komplexní průvodce dlouhodobou péčí o prodloužení — od prvního dne po půl roce.",
    category: "care",
    weekOffset: 24,
  },
  {
    title: "Nový rok, nové vlasy: proč je leden ideální čas na prodloužení",
    slug: "novy-rok-nove-vlasy-leden-prodlouzeni",
    excerpt: "Leden je měsíc nových začátků — proč právě teď investovat do krásných vlasů.",
    category: "tips",
    weekOffset: 25,
  },
];

async function seed() {
  const startDate = new Date("2026-07-07"); // First Monday of July 2026

  for (const topic of topics) {
    const publishDate = new Date(startDate);
    publishDate.setDate(publishDate.getDate() + topic.weekOffset * 7);

    const id = crypto.randomBytes(12).toString("base64url");
    const now = new Date().toISOString();

    await client.execute({
      sql: `INSERT OR IGNORE INTO blog_posts (id, slug, title, excerpt, content, coverImage, category, published, publishedAt, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, '', NULL, ?, 0, ?, ?, ?)`,
      args: [
        id,
        topic.slug,
        topic.title,
        topic.excerpt,
        topic.category,
        publishDate.toISOString(),
        now,
        now,
      ],
    });

    console.log(`✅ ${publishDate.toLocaleDateString("cs")} — ${topic.title}`);
  }

  console.log(`\nHotovo! Naseedováno ${topics.length} článků.`);
}

seed().catch(console.error);
