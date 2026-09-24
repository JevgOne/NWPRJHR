import { prisma } from "@/lib/db";
import { articles } from "../../[locale]/(public)/poradna/articles";

export const revalidate = 3600;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const blogPosts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      category: true,
      coverImage: true,
      publishedAt: true,
      updatedAt: true,
    },
    take: 50,
  });

  const BASE = "https://www.hairland.cz";

  const items: string[] = [];

  // Blog posts
  for (const post of blogPosts) {
    const pubDate = post.publishedAt
      ? new Date(post.publishedAt).toUTCString()
      : new Date(post.updatedAt).toUTCString();
    const link = `${BASE}/blog/${esc(post.slug)}`;
    const desc = post.excerpt ?? post.title;

    items.push(`    <item>
      <title>${esc(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${esc(desc)}</description>
      <pubDate>${pubDate}</pubDate>
      <category>Blog</category>
    </item>`);
  }

  // Poradna articles (static, use fixed date)
  for (const article of articles) {
    const link = `${BASE}/poradna/${esc(article.slug)}`;
    const title = article.slug
      .replace(/-/g, " ")
      .replace(/^\w/, (c: string) => c.toUpperCase());

    items.push(`    <item>
      <title>${esc(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>Poradna — ${esc(title)}</description>
      <pubDate>${new Date("2025-06-01").toUTCString()}</pubDate>
      <category>Poradna</category>
    </item>`);
  }

  const lastBuildDate =
    blogPosts.length > 0 && blogPosts[0].publishedAt
      ? new Date(blogPosts[0].publishedAt).toUTCString()
      : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Hairland — Blog a Poradna</title>
    <link>${BASE}</link>
    <description>Tipy, navody a novinky ze sveta prodlouzeni vlasu</description>
    <language>cs</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${BASE}/feed/rss.xml" rel="self" type="application/rss+xml"/>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
