import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { articles } from "./articles";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("advice");
  const title = t("pageTitle");
  const desc = t("pageDescription");
  return {
    title,
    description: desc,
    alternates: { canonical: "/poradna" },
    openGraph: {
      type: "website",
      title: `${title} | Hairland`,
      description: desc,
      url: "https://www.hairland.cz/poradna",
      siteName: "Hairland",
      locale: "cs_CZ",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Hairland`,
      description: desc,
    },
  };
}

const categoryColors: Record<string, string> = {
  types: "bg-nude-100 text-espresso",
  care: "bg-green-100 text-green-700",
  guide: "bg-amber-100 text-amber-700",
  quality: "bg-purple-100 text-purple-700",
};

const categoryIcons: Record<string, string> = {
  types: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  care: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  guide: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  quality: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
};

export default async function AdvicePage() {
  const t = await getTranslations("advice");
  const locale = await getLocale();

  // Get like counts and comment counts for all articles
  const slugs = articles.map((a) => a.slug);
  const [likeCounts, commentCounts] = await Promise.all([
    prisma.articleLike.groupBy({ by: ["articleSlug"], where: { articleSlug: { in: slugs } }, _count: true }),
    prisma.comment.groupBy({ by: ["articleSlug"], where: { articleSlug: { in: slugs } }, _count: true }),
  ]);
  const likeMap = Object.fromEntries(likeCounts.map((l) => [l.articleSlug, l._count]));
  const commentMap = Object.fromEntries(commentCounts.map((c) => [c.articleSlug, c._count]));

  const blogLabel = locale === "uk" ? "Шукаєте новини та тренди?" : locale === "ru" ? "Ищете новости и тренды?" : "Hledáte novinky a trendy?";
  const blogCta = locale === "uk" ? "Читати блог" : locale === "ru" ? "Читать блог" : "Číst blog";

  const poradnaJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("pageTitle"),
    description: t("pageDescription"),
    url: "https://www.hairland.cz/poradna",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://www.hairland.cz/poradna/${a.slug}`,
        name: t(a.titleKey as "typesTitle"),
      })),
    },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(poradnaJsonLd) }}
      />
      {/* Header — distinct from blog */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-ink">{t("heroTitle")}</h1>
          </div>
        </div>
        <p className="text-muted max-w-xl">{t("heroSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {articles.map((a, i) => (
          <Link
            key={a.slug}
            href={`/poradna/${a.slug}`}
            className="group flex gap-4 bg-white rounded-xl border border-line hover:border-amber-200 hover:shadow-md transition-all p-5"
          >
            {/* Numbered icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
              categoryColors[a.category].split(" ")[0]
            }`}>
              <svg className={`w-5 h-5 ${categoryColors[a.category].split(" ")[1]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={categoryIcons[a.category]} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${categoryColors[a.category]}`}>
                  {t(`cat.${a.category}` as "cat.types")}
                </span>
                <span className="text-[10px] text-muted flex items-center gap-0.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {a.readMin} min
                </span>
              </div>
              <h2 className="font-semibold text-ink group-hover:text-amber-700 transition-colors mb-1 line-clamp-2">
                {t(a.titleKey as "typesTitle")}
              </h2>
              <p className="text-sm text-muted line-clamp-2 mb-2">
                {t(a.descKey as "typesDesc")}
              </p>
              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-muted">
                {(likeMap[a.slug] ?? 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-rose" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {likeMap[a.slug]}
                  </span>
                )}
                {(commentMap[a.slug] ?? 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {commentMap[a.slug]}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Link to blog */}
      <div className="mt-12 text-center">
        <p className="text-muted mb-3">{blogLabel}</p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose/10 text-rose rounded-lg font-medium hover:bg-rose/20 transition-colors"
        >
          {blogCta}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
