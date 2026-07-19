import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { articles } from "./[locale]/(public)/poradna/articles";
import {
  COLOR_TONE_SLUG_MAP,
  TEXTURE_SLUG_MAP,
  CATEGORY_SLUG_MAP_SEO,
  ORIGIN_SLUG_MAP,
} from "@/lib/attribute-slugs";

const BASE_URL = "https://www.hairland.cz";
const STATIC_DATE = "2026-06-01";

const LOCALE_PREFIXES: Record<string, string> = { cs: "", uk: "/ua", ru: "/rus" };

function withAlternates(
  path: string,
  opts: { lastModified: string | Date; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number },
): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const [locale, prefix] of Object.entries(LOCALE_PREFIXES)) {
    languages[locale] = `${BASE_URL}${prefix}${path}`;
  }
  languages["x-default"] = `${BASE_URL}${path}`;

  return Object.values(LOCALE_PREFIXES).map((prefix) => ({
    url: `${BASE_URL}${prefix}${path}`,
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    ...withAlternates("", { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 1.0 }),
    ...withAlternates("/offer", { lastModified: STATIC_DATE, changeFrequency: "daily", priority: 0.9 }),
    ...withAlternates("/poradna", { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 }),
    ...withAlternates("/pro", { lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 }),
    ...withAlternates("/contact", { lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 }),
    ...withAlternates("/about", { lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.5 }),
    ...withAlternates("/vykup", { lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 }),
    ...withAlternates("/kadernice", { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.6 }),
    ...withAlternates("/registrace", { lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 }),
    ...withAlternates("/obchodni-podminky", { lastModified: STATIC_DATE, changeFrequency: "yearly", priority: 0.6 }),
    ...withAlternates("/privacy", { lastModified: STATIC_DATE, changeFrequency: "yearly", priority: 0.6 }),
    ...withAlternates("/doprava", { lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 }),
    ...withAlternates("/reklamacni-rad", { lastModified: STATIC_DATE, changeFrequency: "yearly", priority: 0.5 }),
    ...withAlternates("/pruvodce-gramazi", { lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 }),
    ...withAlternates("/recenze", { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.6 }),
  ];

  const categoryPages: MetadataRoute.Sitemap = [
    { slug: "clip-in", path: "/clip-in" },
    { slug: "tape-in", path: "/tape-in" },
    { slug: "keratin", path: "/keratin" },
    { slug: "micro-ring", path: "/micro-ring" },
    { slug: "weft", path: "/tresove-vlasy" },
    { slug: "ofiny", path: "/ofiny" },
  ].flatMap(({ path }) =>
    withAlternates(path, { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.8 }),
  );

  const articlePages: MetadataRoute.Sitemap = articles.flatMap((article) =>
    withAlternates(`/poradna/${article.slug}`, { lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 }),
  );

  const blogPosts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  });

  const blogPages: MetadataRoute.Sitemap = [
    ...withAlternates("/blog", { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 }),
    ...blogPosts.flatMap((post) =>
      withAlternates(`/blog/${post.slug}`, { lastModified: post.updatedAt, changeFrequency: "monthly", priority: 0.6 }),
    ),
  ];

  const [products, stylists] = await Promise.all([
    prisma.product.findMany({
      where: { archived: false, slug: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.stylist.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const productPages: MetadataRoute.Sitemap = products.flatMap((product) =>
    withAlternates(`/offer/${product.slug}`, { lastModified: product.updatedAt, changeFrequency: "weekly", priority: 0.8 }),
  );

  const stylistPages: MetadataRoute.Sitemap = stylists.flatMap((s) =>
    withAlternates(`/kadernice/${s.slug}`, { lastModified: s.updatedAt, changeFrequency: "monthly", priority: 0.5 }),
  );

  // Attribute landing pages
  const attributePages: MetadataRoute.Sitemap = [];

  // Color tones
  for (const slug of Object.keys(COLOR_TONE_SLUG_MAP)) {
    attributePages.push(
      ...withAlternates(`/offer/barva/${slug}`, { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 }),
    );
  }

  // Textures
  for (const slug of Object.keys(TEXTURE_SLUG_MAP)) {
    attributePages.push(
      ...withAlternates(`/offer/textura/${slug}`, { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 }),
    );
  }

  // Categories (SEO)
  for (const slug of Object.keys(CATEGORY_SLUG_MAP_SEO)) {
    attributePages.push(
      ...withAlternates(`/offer/kategorie/${slug}`, { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 }),
    );
  }

  // Origins
  for (const slug of Object.keys(ORIGIN_SLUG_MAP)) {
    attributePages.push(
      ...withAlternates(`/offer/zeme/${slug}`, { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 }),
    );
  }

  // Lengths (dynamic from DB)
  const lengths = await prisma.variant.findMany({
    where: { active: true },
    select: { lengthCm: true },
    distinct: ["lengthCm"],
  });
  for (const { lengthCm } of lengths) {
    attributePages.push(
      ...withAlternates(`/offer/delka/${lengthCm}cm`, { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 }),
    );
  }

  return [...staticPages, ...categoryPages, ...attributePages, ...articlePages, ...blogPages, ...productPages, ...stylistPages];
}
