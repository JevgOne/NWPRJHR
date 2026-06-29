import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { articles } from "./(public)/poradna/articles";

const BASE_URL = "https://www.hairland.cz";
const STATIC_DATE = "2026-06-01";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: STATIC_DATE,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/offer`,
      lastModified: STATIC_DATE,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/poradna`,
      lastModified: STATIC_DATE,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/pro`,
      lastModified: STATIC_DATE,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: STATIC_DATE,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: STATIC_DATE,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/vykup`,
      lastModified: STATIC_DATE,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/kadernice`,
      lastModified: STATIC_DATE,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/registrace`,
      lastModified: STATIC_DATE,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/obchodni-podminky`,
      lastModified: STATIC_DATE,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: STATIC_DATE,
      changeFrequency: "yearly",
      priority: 0.6,
    },
  ];

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/poradna/${article.slug}`,
    lastModified: STATIC_DATE,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const products = await prisma.product.findMany({
    where: { archived: false },
    select: { id: true, slug: true, updatedAt: true },
  });

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/offer/${product.slug ?? product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...articlePages, ...productPages];
}
