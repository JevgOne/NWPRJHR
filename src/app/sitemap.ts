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

function withAlternates(
  path: string,
  opts: { lastModified: string | Date; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number },
): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE_URL}${path}`,
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: {
      languages: {
        cs: `${BASE_URL}${path}`,
        uk: `${BASE_URL}/ua${path}`,
        ru: `${BASE_URL}/rus${path}`,
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    withAlternates("", { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 1.0 }),
    withAlternates("/offer", { lastModified: STATIC_DATE, changeFrequency: "daily", priority: 0.9 }),
    withAlternates("/poradna", { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 }),
    withAlternates("/pro", { lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 }),
    withAlternates("/contact", { lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 }),
    withAlternates("/about", { lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.5 }),
    withAlternates("/vykup", { lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 }),
    withAlternates("/kadernice", { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.6 }),
    withAlternates("/registrace", { lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 }),
    withAlternates("/obchodni-podminky", { lastModified: STATIC_DATE, changeFrequency: "yearly", priority: 0.6 }),
    withAlternates("/privacy", { lastModified: STATIC_DATE, changeFrequency: "yearly", priority: 0.6 }),
    withAlternates("/doprava", { lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 }),
    withAlternates("/reklamacni-rad", { lastModified: STATIC_DATE, changeFrequency: "yearly", priority: 0.5 }),
    withAlternates("/pruvodce-gramazi", { lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 }),
    withAlternates("/recenze", { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.6 }),
  ];

  const categoryPages: MetadataRoute.Sitemap = [
    "clip-in", "tape-in", "keratin", "micro-ring", "weft",
  ].map((slug) =>
    withAlternates(`/offer/${slug}`, { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.8 }),
  );

  const articlePages: MetadataRoute.Sitemap = articles.map((article) =>
    withAlternates(`/poradna/${article.slug}`, { lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 }),
  );

  const blogPosts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  });

  const blogPages: MetadataRoute.Sitemap = [
    withAlternates("/blog", { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 }),
    ...blogPosts.map((post) =>
      withAlternates(`/blog/${post.slug}`, { lastModified: post.updatedAt, changeFrequency: "monthly", priority: 0.6 }),
    ),
  ];

  const [products, stylists] = await Promise.all([
    prisma.product.findMany({
      where: { archived: false },
      select: { id: true, slug: true, updatedAt: true },
    }),
    prisma.stylist.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const productPages: MetadataRoute.Sitemap = products.map((product) =>
    withAlternates(`/offer/${product.slug ?? product.id}`, { lastModified: product.updatedAt, changeFrequency: "weekly", priority: 0.8 }),
  );

  const stylistPages: MetadataRoute.Sitemap = stylists.map((s) =>
    withAlternates(`/kadernice/${s.slug}`, { lastModified: s.updatedAt, changeFrequency: "monthly", priority: 0.5 }),
  );

  // Attribute landing pages
  const attributePages: MetadataRoute.Sitemap = [];

  // Color tones
  for (const slug of Object.keys(COLOR_TONE_SLUG_MAP)) {
    attributePages.push(
      withAlternates(`/offer/barva/${slug}`, { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 }),
    );
  }

  // Textures
  for (const slug of Object.keys(TEXTURE_SLUG_MAP)) {
    attributePages.push(
      withAlternates(`/offer/textura/${slug}`, { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 }),
    );
  }

  // Categories (SEO)
  for (const slug of Object.keys(CATEGORY_SLUG_MAP_SEO)) {
    attributePages.push(
      withAlternates(`/offer/kategorie/${slug}`, { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 }),
    );
  }

  // Origins
  for (const slug of Object.keys(ORIGIN_SLUG_MAP)) {
    attributePages.push(
      withAlternates(`/offer/zeme/${slug}`, { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 }),
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
      withAlternates(`/offer/delka/${lengthCm}cm`, { lastModified: STATIC_DATE, changeFrequency: "weekly", priority: 0.7 }),
    );
  }

  return [...staticPages, ...categoryPages, ...attributePages, ...articlePages, ...blogPages, ...productPages, ...stylistPages];
}
