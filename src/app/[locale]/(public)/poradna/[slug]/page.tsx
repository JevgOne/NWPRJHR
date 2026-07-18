import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { articles } from "../articles";
import { ArticleLikeButton } from "@/components/public/ArticleLikeButton";
import { CommentSection } from "@/components/public/CommentSection";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

const categoryLabels: Record<string, Record<string, string>> = {
  cs: { types: "Typy prodloužení", care: "Péče o vlasy", guide: "Průvodce", quality: "Kvalita vlasů" },
  uk: { types: "Типи нарощування", care: "Догляд", guide: "Гід", quality: "Якість" },
  ru: { types: "Типы наращивания", care: "Уход", guide: "Гид", quality: "Качество" },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return {};
  const [t, locale] = await Promise.all([getTranslations("advice"), getLocale()]);
  const title = t(article.titleKey as "typesTitle");
  const desc = t(article.descKey as "typesDesc");
  return {
    title,
    description: desc,
    alternates: getAlternates(`/poradna/${slug}`),
    openGraph: {
      type: "article",
      title,
      description: desc,
      url: `https://www.hairland.cz/poradna/${slug}`,
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "https://www.hairland.cz/og/og-poradna.jpg",
          width: 1200,
          height: 630,
          alt: "Hairland — prémiové vlasy k prodloužení",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: ["https://www.hairland.cz/og/og-poradna.jpg"],
    },
  };
}

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const [t, tNav, locale] = await Promise.all([
    getTranslations("advice"),
    getTranslations("public.nav"),
    getLocale(),
  ]);
  const contentKey = `${slug.replace(/-/g, "_")}_content` as "typesTitle";

  const currentIdx = articles.findIndex((a) => a.slug === slug);
  const prev = currentIdx > 0 ? articles[currentIdx - 1] : null;
  const next = currentIdx < articles.length - 1 ? articles[currentIdx + 1] : null;

  const homeLabel = tNav("home");
  const prevLabel = locale === "uk" ? "Попередня" : locale === "ru" ? "Предыдущая" : "Předchozí";
  const nextLabel = locale === "uk" ? "Наступна" : locale === "ru" ? "Следующая" : "Další";
  const catLabel = categoryLabels[locale]?.[article.category] ?? categoryLabels.cs[article.category] ?? "";

  const tipTitle = locale === "uk" ? "Rada od nás" : locale === "ru" ? "Совет от нас" : "Rada od nás";
  const tipTexts: Record<string, Record<string, string>> = {
    types: {
      cs: "Nevíte, který typ je pro vás ten pravý? Ozvěte se nám — poradíme vám a společně vybereme to nejlepší řešení pro vaše vlasy.",
      uk: "Не знаєте, який тип обрати? Напишіть нам — допоможемо підібрати ідеальне рішення для вашого волосся.",
      ru: "Не знаете, какой тип выбрать? Напишите нам — поможем подобрать идеальное решение для ваших волос.",
    },
    care: {
      cs: "Správná péče dokáže prodloužit krásu vašich vlasů na dvojnásobek. Rádi vám doporučíme přesně to, co vaše vlasy potřebují.",
      uk: "Правильний догляд подвоїть красу вашого волосся. Залюбки порадимо саме те, що потрібно.",
      ru: "Правильный уход удвоит красоту ваших волос. С радостью подберём именно то, что нужно.",
    },
    guide: {
      cs: "Pořád si nejste jistá? Napište nám — projdeme vše společně a najdeme řešení šité na míru právě vám.",
      uk: "Ще не впевнені? Напишіть нам — все обговоримо і знайдемо рішення саме для вас.",
      ru: "Ещё не уверены? Напишите нам — всё обсудим и найдём решение именно для вас.",
    },
    quality: {
      cs: "Pracujeme výhradně s panenskými a Remy vlasy nejvyšší kvality. Každá várka prochází naší osobní kontrolou.",
      uk: "Ми працюємо виключно з virgin та Remy волоссям найвищої якості. Кожна партія проходить особистий контроль.",
      ru: "Мы работаем исключительно с virgin и Remy волосами высшего качества. Каждая партия проходит личный контроль.",
    },
  };
  const tipText = tipTexts[article.category]?.[locale] ?? tipTexts[article.category]?.cs ?? "";
  const tipCta = locale === "uk" ? "Написати нам" : locale === "ru" ? "Написать нам" : "Napište nám";

  const ctaSub = locale === "uk"
    ? "Безкоштовна консультація та доставка по Празі"
    : locale === "ru"
      ? "Бесплатная консультация и доставка по Праге"
      : "Bezplatná konzultace a rozvoz po Praze zdarma";

  const shareLabel = locale === "uk" ? "Поділіться з подругою" : locale === "ru" ? "Поделитесь с подругой" : "Sdílejte s kamarádkou";

  const articleJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: t(article.titleKey as "typesTitle"),
      description: t(article.descKey as "typesDesc"),
      author: { "@type": "Organization", name: "Hairland", url: "https://www.hairland.cz" },
      publisher: {
        "@type": "Organization",
        name: "Hairland",
        url: "https://www.hairland.cz",
        logo: { "@type": "ImageObject", url: "https://www.hairland.cz/og-image.jpg" },
      },
      datePublished: "2025-06-01",
      dateModified: "2026-06-01",
      mainEntityOfPage: { "@type": "WebPage", "@id": `https://www.hairland.cz/poradna/${slug}` },
      url: `https://www.hairland.cz/poradna/${slug}`,
      inLanguage: locale === "uk" ? "uk" : locale === "ru" ? "ru" : "cs",
      articleSection: catLabel,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeLabel, item: "https://www.hairland.cz" },
        { "@type": "ListItem", position: 2, name: t("heroTitle"), item: "https://www.hairland.cz/poradna" },
        { "@type": "ListItem", position: 3, name: t(article.titleKey as "typesTitle"), item: `https://www.hairland.cz/poradna/${slug}` },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* ===== HERO ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#fdf2f0] via-[#fef6f3] to-[#fdf8f5]">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blush-100/60 to-transparent rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose/[0.03] rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted/70 mb-10">
            <Link href="/" className="hover:text-rose transition-colors">{homeLabel}</Link>
            <span className="text-rose/30">/</span>
            <Link href="/poradna" className="hover:text-rose transition-colors">{t("heroTitle")}</Link>
            <span className="text-rose/30">/</span>
            <span className="text-ink/60 truncate">{t(article.titleKey as "typesTitle")}</span>
          </nav>

          {/* Category + meta */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white/80 text-rose border border-rose/10 shadow-sm backdrop-blur-sm">
              {catLabel}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted/60">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {article.readMin} min
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-ink leading-[1.1] tracking-tight mb-5" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            {t(article.titleKey as "typesTitle")}
          </h1>

          <p className="text-base sm:text-[17px] text-muted/70 leading-relaxed max-w-2xl">
            {t(article.descKey as "typesDesc")}
          </p>

          <div className="mt-7 flex items-center gap-5">
            <ArticleLikeButton articleSlug={slug} />
            <span className="text-[11px] text-muted/40 tracking-wide uppercase">{currentIdx + 1} / {articles.length}</span>
          </div>
        </div>

        {/* Soft curve divider */}
        <svg className="absolute bottom-0 w-full h-8 text-white" viewBox="0 0 1440 32" preserveAspectRatio="none">
          <path d="M0,32 L0,16 Q360,0 720,16 Q1080,32 1440,12 L1440,32 Z" fill="currentColor" />
        </svg>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <article className="
          max-w-none text-[15.5px] text-[#6b5e5a] leading-[1.9]
          [&_h2]:text-[1.35rem] [&_h2]:font-bold [&_h2]:text-ink
          [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:pl-5
          [&_h2]:relative [&_h2]:before:absolute [&_h2]:before:left-0 [&_h2]:before:top-0 [&_h2]:before:bottom-0
          [&_h2]:before:w-[3px] [&_h2]:before:rounded-full [&_h2]:before:bg-gradient-to-b [&_h2]:before:from-rose [&_h2]:before:to-blush-200
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-ink [&_h3]:mt-8 [&_h3]:mb-3
          [&_p]:mb-5
          [&_ul]:mb-6 [&_ul]:list-none [&_ul]:pl-0 [&_ul]:space-y-2.5
          [&_li]:relative [&_li]:pl-5 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.65em]
          [&_li]:before:w-1.5 [&_li]:before:h-1.5 [&_li]:before:rounded-full [&_li]:before:bg-rose/40
          [&_strong]:text-ink [&_strong]:font-semibold
        ">
          <div dangerouslySetInnerHTML={{ __html: t.markup(contentKey, {
            h2: (chunks) => `<h2>${chunks}</h2>`,
            p: (chunks) => `<p>${chunks}</p>`,
            ul: (chunks) => `<ul>${chunks}</ul>`,
            li: (chunks) => `<li>${chunks}</li>`,
            strong: (chunks) => `<strong>${chunks}</strong>`,
          }) }} />
        </article>

        {/* ===== TIP BOX ===== */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-[#fdf2f0] to-[#fef8f6] border border-rose/10 p-6 sm:p-7">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose/10 flex items-center justify-center mt-0.5">
              <svg className="w-5 h-5 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-bold text-rose mb-1.5 uppercase tracking-wide">{tipTitle}</p>
              <p className="text-[14.5px] text-[#7a6b66] leading-relaxed mb-3">{tipText}</p>
              <Link href="/contact" className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose hover:text-rose-deep transition-colors group">
                {tipCta}
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </div>

        {/* ===== SHARE + LIKE ===== */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#fdf8f6] border border-rose/8">
          <div className="flex items-center gap-3">
            <ArticleLikeButton articleSlug={slug} />
            <span className="text-sm text-muted/60">{shareLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`https://wa.me/?text=${encodeURIComponent(t(article.titleKey as "typesTitle") + " — https://www.hairland.cz/poradna/" + slug)}`}
              target="_blank"
              className="w-9 h-9 rounded-full bg-white border border-rose/10 flex items-center justify-center text-muted/50 hover:text-green-600 hover:border-green-200 transition-all"
              title="WhatsApp"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </Link>
            <Link
              href={`https://t.me/share/url?url=${encodeURIComponent("https://www.hairland.cz/poradna/" + slug)}&text=${encodeURIComponent(t(article.titleKey as "typesTitle"))}`}
              target="_blank"
              className="w-9 h-9 rounded-full bg-white border border-rose/10 flex items-center justify-center text-muted/50 hover:text-[#229ED9] hover:border-[#229ED9]/30 transition-all"
              title="Telegram"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </Link>
            <button
              onClick={undefined}
              className="w-9 h-9 rounded-full bg-white border border-rose/10 flex items-center justify-center text-muted/50 hover:text-rose hover:border-rose/30 transition-all"
              title="Copy link"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
          </div>
        </div>

        {/* ===== PREV / NEXT ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
          {prev ? (
            <Link href={`/poradna/${prev.slug}`} className="group flex items-center gap-3 p-5 rounded-2xl bg-gradient-to-r from-[#fdf2f0] to-white border border-rose/10 hover:border-rose/25 hover:shadow-lg transition-all">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose/10 flex items-center justify-center group-hover:bg-rose/20 transition-colors">
                <svg className="w-5 h-5 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-rose/50 font-semibold block">{prevLabel}</span>
                <span className="text-sm font-semibold text-ink group-hover:text-rose transition-colors line-clamp-1" style={{ fontFamily: "Georgia, serif" }}>
                  {t(prev.titleKey as "typesTitle")}
                </span>
              </div>
            </Link>
          ) : <div />}
          {next ? (
            <Link href={`/poradna/${next.slug}`} className="group flex items-center justify-end gap-3 p-5 rounded-2xl bg-gradient-to-l from-[#fdf2f0] to-white border border-rose/10 hover:border-rose/25 hover:shadow-lg transition-all text-right">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-rose/50 font-semibold block">{nextLabel}</span>
                <span className="text-sm font-semibold text-ink group-hover:text-rose transition-colors line-clamp-1" style={{ fontFamily: "Georgia, serif" }}>
                  {t(next.titleKey as "typesTitle")}
                </span>
              </div>
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose/10 flex items-center justify-center group-hover:bg-rose/20 transition-colors">
                <svg className="w-5 h-5 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
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

          return (
            <div className="mt-12 mb-8 relative overflow-hidden rounded-2xl border border-rose/10">
              <div className="absolute inset-0 bg-gradient-to-br from-[#fdf2f0] via-[#fef6f3] to-rose/5" />
              <div className="absolute -top-20 -right-20 w-56 h-56 bg-rose/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-blush-100/50 rounded-full blur-3xl" />
              <div className="relative px-6 py-10 sm:py-12 text-center">
                <p className="font-extrabold text-ink text-xl sm:text-2xl mb-2" style={{ fontFamily: "Georgia, serif" }}>{cta.text}</p>
                <p className="text-sm text-muted/60 mb-7">{ctaSub}</p>
                <Link
                  href={cta.href}
                  className="inline-block px-8 py-3.5 bg-rose hover:bg-rose-deep text-white font-semibold rounded-full transition-all shadow-lg shadow-rose/20 hover:shadow-xl hover:shadow-rose/30 hover:-translate-y-0.5"
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
