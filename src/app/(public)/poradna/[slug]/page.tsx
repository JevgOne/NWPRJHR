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

const categoryConfig: Record<string, { color: string; bg: string; gradient: string; icon: string }> = {
  types: {
    color: "text-amber-700", bg: "bg-amber-100",
    gradient: "from-amber-50 via-orange-50/40 to-white",
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  },
  care: {
    color: "text-green-700", bg: "bg-green-100",
    gradient: "from-green-50 via-emerald-50/40 to-white",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  },
  guide: {
    color: "text-blue-700", bg: "bg-blue-100",
    gradient: "from-blue-50 via-indigo-50/40 to-white",
    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  },
  quality: {
    color: "text-purple-700", bg: "bg-purple-100",
    gradient: "from-purple-50 via-violet-50/40 to-white",
    icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  },
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

  const config = categoryConfig[article.category] ?? categoryConfig.types;
  const homeLabel = locale === "uk" ? "Головна" : locale === "ru" ? "Главная" : "Domů";
  const prevLabel = locale === "uk" ? "Попередня" : locale === "ru" ? "Предыдущая" : "Předchozí";
  const nextLabel = locale === "uk" ? "Наступна" : locale === "ru" ? "Следующая" : "Další";

  const tipTitle = locale === "uk" ? "Tip od Hairland" : locale === "ru" ? "Совет от Hairland" : "Tip od Hairland";
  const tipTexts: Record<string, Record<string, string>> = {
    types: {
      cs: "Nevíte, který typ prodloužení je pro vás? Napište nám — poradíme vám zdarma a pomůžeme vybrat ideální řešení pro vaše vlasy.",
      uk: "Не знаєте, який тип нарощування обрати? Напишіть нам — порадимо безкоштовно.",
      ru: "Не знаете, какой тип наращивания выбрать? Напишите нам — подскажем бесплатно.",
    },
    care: {
      cs: "Správná péče prodlouží životnost vašich vlasů až dvojnásobně. Rádi vám doporučíme produkty přesně pro váš typ.",
      uk: "Правильний догляд подвоїть термін служби вашого волосся. Допоможемо обрати засоби.",
      ru: "Правильный уход удвоит срок службы ваших волос. Поможем подобрать средства.",
    },
    guide: {
      cs: "Stále si nejste jistá? Objednejte si bezplatnou konzultaci — projdeme vše společně a najdeme to pravé pro vás.",
      uk: "Ще не впевнені? Замовте безкоштовну консультацію — все обговоримо разом.",
      ru: "Ещё не уверены? Закажите бесплатную консультацию — обсудим всё вместе.",
    },
    quality: {
      cs: "V Hairland pracujeme výhradně s panenskými a Remy vlasy nejvyšší kvality. Každá várka prochází osobní kontrolou.",
      uk: "У Hairland ми працюємо виключно з virgin та Remy волоссям найвищої якості.",
      ru: "В Hairland мы работаем исключительно с virgin и Remy волосами высшего качества.",
    },
  };
  const tipText = tipTexts[article.category]?.[locale] ?? tipTexts[article.category]?.cs ?? "";
  const tipCta = locale === "uk" ? "Написати нам" : locale === "ru" ? "Написать нам" : "Napište nám";

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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* ===== HERO ===== */}
      <div className={`relative bg-gradient-to-b ${config.gradient} overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-rose/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-blush-100/40 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted mb-8">
            <Link href="/" className="hover:text-ink transition-colors">{homeLabel}</Link>
            <svg className="w-3 h-3 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <Link href="/poradna" className="hover:text-ink transition-colors">{t("heroTitle")}</Link>
            <svg className="w-3 h-3 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <span className="text-ink truncate">{t(article.titleKey as "typesTitle")}</span>
          </nav>

          <div className="flex items-start gap-5">
            {/* Category icon */}
            <div className={`hidden sm:flex flex-shrink-0 w-16 h-16 rounded-2xl ${config.bg} items-center justify-center shadow-sm ring-4 ring-white/60`}>
              <svg className={`w-8 h-8 ${config.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color}`}>
                  {t(`cat.${article.category}` as "cat.types")}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted bg-white/60 px-2.5 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {article.readMin} min
                </span>
              </div>

              <h1 className="text-3xl lg:text-[2.5rem] font-extrabold text-ink leading-[1.12] tracking-tight mb-4">
                {t(article.titleKey as "typesTitle")}
              </h1>

              <p className="text-base sm:text-lg text-muted/80 leading-relaxed max-w-2xl">
                {t(article.descKey as "typesDesc")}
              </p>

              <div className="mt-6 flex items-center gap-4">
                <ArticleLikeButton articleSlug={slug} />
                <span className="hidden sm:inline text-xs text-muted/50">|</span>
                <span className="hidden sm:inline text-xs text-muted/60">{currentIdx + 1} / {articles.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg className="absolute bottom-0 w-full h-6 text-white" viewBox="0 0 1440 24" preserveAspectRatio="none">
          <path d="M0,24 L0,8 C240,20 480,0 720,8 C960,16 1200,4 1440,12 L1440,24 Z" fill="currentColor" />
        </svg>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <article className={`
          max-w-none text-[15px] text-muted/90 leading-[1.85]
          [&_h2]:relative [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink
          [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:pl-4
          [&_h2]:before:absolute [&_h2]:before:left-0 [&_h2]:before:top-0 [&_h2]:before:bottom-0 [&_h2]:before:w-1 [&_h2]:before:rounded-full
          [&_h2]:before:bg-gradient-to-b
          ${article.category === "care" ? "[&_h2]:before:from-green-400 [&_h2]:before:to-green-200" : ""}
          ${article.category === "types" ? "[&_h2]:before:from-amber-400 [&_h2]:before:to-amber-200" : ""}
          ${article.category === "guide" ? "[&_h2]:before:from-blue-400 [&_h2]:before:to-blue-200" : ""}
          ${article.category === "quality" ? "[&_h2]:before:from-purple-400 [&_h2]:before:to-purple-200" : ""}
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-ink [&_h3]:mt-8 [&_h3]:mb-3
          [&_p]:mb-5
          [&_ul]:mb-6 [&_ul]:list-none [&_ul]:pl-0 [&_ul]:space-y-3
          [&_li]:relative [&_li]:pl-6
          [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.55em]
          [&_li]:before:w-2 [&_li]:before:h-2 [&_li]:before:rounded-full
          ${article.category === "care" ? "[&_li]:before:bg-green-300" : ""}
          ${article.category === "types" ? "[&_li]:before:bg-amber-300" : ""}
          ${article.category === "guide" ? "[&_li]:before:bg-blue-300" : ""}
          ${article.category === "quality" ? "[&_li]:before:bg-purple-300" : ""}
          [&_strong]:text-ink [&_strong]:font-semibold
        `}>
          <div dangerouslySetInnerHTML={{ __html: t.markup(contentKey, {
            h2: (chunks) => `<h2>${chunks}</h2>`,
            p: (chunks) => `<p>${chunks}</p>`,
            ul: (chunks) => `<ul>${chunks}</ul>`,
            li: (chunks) => `<li>${chunks}</li>`,
            strong: (chunks) => `<strong>${chunks}</strong>`,
          }) }} />
        </article>

        {/* ===== TIP BOX ===== */}
        <div className="mt-10 relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose/5 via-blush-50 to-nude-50 border border-blush-100 p-6">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose/10 rounded-full blur-xl" />
          <div className="relative flex gap-4">
            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-rose/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-rose mb-1">{tipTitle}</p>
              <p className="text-sm text-muted leading-relaxed mb-3">{tipText}</p>
              <Link href="/contact" className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose hover:text-rose-deep transition-colors">
                {tipCta}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </div>

        {/* ===== FEEDBACK ===== */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-nude-50/80 border border-nude-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose/20 to-blush-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <span className="text-sm font-medium text-ink">
              {locale === "uk" ? "Стаття була корисною?" : locale === "ru" ? "Статья была полезной?" : "Byl pro vás článek užitečný?"}
            </span>
          </div>
          <ArticleLikeButton articleSlug={slug} />
        </div>

        {/* ===== PREV / NEXT ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
          {prev ? (
            <Link href={`/poradna/${prev.slug}`} className="group relative p-5 rounded-2xl border border-line hover:border-rose/30 bg-white hover:bg-rose/[0.02] transition-all overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose/40 to-blush-200 rounded-r opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-2 block">{prevLabel}</span>
              <span className="text-sm font-semibold text-ink group-hover:text-rose transition-colors line-clamp-2">
                {t(prev.titleKey as "typesTitle")}
              </span>
            </Link>
          ) : <div />}
          {next ? (
            <Link href={`/poradna/${next.slug}`} className="group relative p-5 rounded-2xl border border-line hover:border-rose/30 bg-white hover:bg-rose/[0.02] transition-all text-right overflow-hidden">
              <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-rose/40 to-blush-200 rounded-l opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-2 block">{nextLabel}</span>
              <span className="text-sm font-semibold text-ink group-hover:text-rose transition-colors line-clamp-2">
                {t(next.titleKey as "typesTitle")}
              </span>
            </Link>
          ) : <div />}
        </div>

        {/* ===== COMMENTS ===== */}
        <CommentSection articleSlug={slug} locale={locale} />

        {/* ===== CTA ===== */}
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

          const ctaSub = locale === "uk"
            ? "Безкоштовна консультація та доставка по Празі"
            : locale === "ru"
              ? "Бесплатная консультация и доставка по Праге"
              : "Bezplatná konzultace a rozvoz po Praze zdarma";

          return (
            <div className="mt-10 mb-8 relative overflow-hidden rounded-2xl border border-blush-100">
              <div className="absolute inset-0 bg-gradient-to-br from-nude-50 via-blush-50 to-rose/10" />
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-rose/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blush-100/60 rounded-full blur-2xl" />
              <div className="relative p-8 sm:p-10 text-center">
                <p className="font-extrabold text-ink text-xl mb-1">{cta.text}</p>
                <p className="text-sm text-muted mb-6">{ctaSub}</p>
                <Link
                  href={cta.href}
                  className="inline-block px-8 py-3.5 bg-rose hover:bg-rose-deep text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {cta.button}
                </Link>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
