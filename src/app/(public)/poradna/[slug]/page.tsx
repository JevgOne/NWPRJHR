import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { articles } from "../articles";
import { ArticleLikeButton } from "@/components/public/ArticleLikeButton";
import { CommentSection } from "@/components/public/CommentSection";

interface Props {
  params: Promise<{ slug: string }>;
}

const categoryColors: Record<string, string> = {
  types: "bg-nude-100 text-espresso",
  care: "bg-green-100 text-green-700",
  guide: "bg-amber-100 text-amber-700",
  quality: "bg-purple-100 text-purple-700",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return {};
  const t = await getTranslations("advice");
  return {
    title: t(article.titleKey as "typesTitle"),
    description: t(article.descKey as "typesDesc"),
    alternates: { canonical: `/poradna/${slug}` },
  };
}

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const t = await getTranslations("advice");
  const locale = await getLocale();
  const contentKey = `${slug.replace(/-/g, "_")}_content` as "typesTitle";

  const currentIdx = articles.findIndex((a) => a.slug === slug);
  const prev = currentIdx > 0 ? articles[currentIdx - 1] : null;
  const next = currentIdx < articles.length - 1 ? articles[currentIdx + 1] : null;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t(article.titleKey as "typesTitle"),
    description: t(article.descKey as "typesDesc"),
    author: { "@type": "Organization", name: "Hairland" },
    publisher: { "@type": "Organization", name: "Hairland", url: "https://www.hairland.cz" },
    datePublished: "2025-01-01",
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://www.hairland.cz/poradna/${slug}` },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ink transition-colors">
          {locale === "uk" ? "Головна" : locale === "ru" ? "Главная" : "Domů"}
        </Link>
        <span>/</span>
        <Link href="/poradna" className="hover:text-ink transition-colors">
          {t("heroTitle")}
        </Link>
        <span>/</span>
        <span className="text-ink truncate">{t(article.titleKey as "typesTitle")}</span>
      </nav>

      <article>
        {/* Category badge + reading time */}
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${categoryColors[article.category]}`}>
            {t(`cat.${article.category}` as "cat.types")}
          </span>
          <span className="text-xs text-muted flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {article.readMin} min
          </span>
        </div>

        <h1 className="text-2xl lg:text-3xl font-bold text-ink mb-3 leading-tight">
          {t(article.titleKey as "typesTitle")}
        </h1>
        <p className="text-muted mb-6 leading-relaxed">
          {t(article.descKey as "typesDesc")}
        </p>

        {/* Like button */}
        <div className="mb-8">
          <ArticleLikeButton articleSlug={slug} />
        </div>

        <div className="prose prose-sm max-w-none text-muted [&_h2]:text-ink [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-ink [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_strong]:text-ink">
          <div dangerouslySetInnerHTML={{ __html: t.markup(contentKey, {
            h2: (chunks) => `<h2>${chunks}</h2>`,
            p: (chunks) => `<p>${chunks}</p>`,
            ul: (chunks) => `<ul>${chunks}</ul>`,
            li: (chunks) => `<li>${chunks}</li>`,
            strong: (chunks) => `<strong>${chunks}</strong>`,
          }) }} />
        </div>
      </article>

      {/* Like again at bottom */}
      <div className="mt-8 flex items-center gap-3">
        <ArticleLikeButton articleSlug={slug} />
        <span className="text-sm text-muted">
          {locale === "uk" ? "Корисна стаття?" : locale === "ru" ? "Полезная статья?" : "Užitečný článek?"}
        </span>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-line">
        {prev ? (
          <Link href={`/poradna/${prev.slug}`} className="group flex items-center gap-2 text-sm text-muted hover:text-rose transition-colors max-w-[45%]">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="truncate">{t(prev.titleKey as "typesTitle")}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/poradna/${next.slug}`} className="group flex items-center gap-2 text-sm text-muted hover:text-rose transition-colors text-right max-w-[45%]">
            <span className="truncate">{t(next.titleKey as "typesTitle")}</span>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : <span />}
      </div>

      {/* Comments */}
      <CommentSection articleSlug={slug} locale={locale} />

      {/* CTA */}
      {(() => {
        const ctaMap: Record<string, { text: string; button: string; href: string }> = {
          types: { text: t("articleCtaTypes"), button: t("articleCtaTypesButton"), href: "/offer" },
          care: { text: t("articleCtaCare"), button: t("articleCtaCareButton"), href: "/offer" },
          quality: { text: t("articleCtaQuality"), button: t("articleCtaQualityButton"), href: "/offer?category=VIRGIN" },
          guide: { text: t("articleCtaGuide"), button: t("articleCtaGuideButton"), href: "/offer" },
        };
        const cta = slug === "clip-in-vs-tape-in"
          ? { text: t("articleCtaClip"), button: t("articleCtaClipButton"), href: "/offer?search=clip" }
          : ctaMap[article.category] ?? { text: t("articleCta"), button: t("articleCtaButton"), href: "/offer" };

        return (
          <div className="mt-10 bg-gradient-to-br from-nude-50 to-blush-50 rounded-2xl p-6 text-center border border-blush-100">
            <p className="font-semibold text-ink mb-2">{cta.text}</p>
            <Link
              href={cta.href}
              className="inline-block px-5 py-2.5 bg-rose hover:bg-rose-deep text-white text-sm font-medium rounded-lg transition-colors"
            >
              {cta.button}
            </Link>
          </div>
        );
      })()}
    </div>
  );
}
