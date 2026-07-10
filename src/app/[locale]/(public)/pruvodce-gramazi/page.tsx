import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("weightGuide"), getLocale()]);
  const title = t("metaTitle");
  const desc = t("metaDesc");
  return {
    title,
    description: desc,
    alternates: getAlternates("/pruvodce-gramazi"),
    openGraph: {
      type: "website",
      title: `${title} | Hairland`,
      description: desc,
      url: "https://www.hairland.cz/pruvodce-gramazi",
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "https://www.hairland.cz/hero-vzornik.png",
          width: 735,
          height: 707,
          alt: "Hairland — prémiové vlasy k prodloužení",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Hairland`,
      description: desc,
      images: ["https://www.hairland.cz/hero-vzornik.png"],
    },
  };
}

export default async function PruvodceGramaziPage() {
  const t = await getTranslations("weightGuide");

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: t("title"),
    description: t("subtitle"),
    step: [
      {
        "@type": "HowToStep",
        name: t("hairTypeTitle"),
        text: t("hairTypeIntro"),
      },
      {
        "@type": "HowToStep",
        name: t("guideTitle"),
        text: t("guideIntro"),
      },
      {
        "@type": "HowToStep",
        name: t("processingTitle"),
        text: t("processingIntro"),
      },
      {
        "@type": "HowToStep",
        name: t("ctaOffer"),
        text: t("ctaText"),
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4, 5, 6].map((i) => ({
      "@type": "Question",
      name: t(`faq${i}q` as "faq1q"),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(`faq${i}a` as "faq1a"),
      },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("home"),
        item: "https://www.hairland.cz",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("breadcrumb"),
        item: "https://www.hairland.cz/pruvodce-gramazi",
      },
    ],
  };

  const gramGuide = [
    { key: "100", width: "w-1/4", barColor: "bg-blush-200", popular: false },
    { key: "150", width: "w-2/5", barColor: "bg-blush-300", popular: true },
    { key: "200", width: "w-3/5", barColor: "bg-rose", popular: false },
    { key: "250", width: "w-4/5", barColor: "bg-rose-deep", popular: false },
  ] as const;

  const hairTypes = [
    { key: "Fine", icon: "M12 3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2s2-.9 2-2V5c0-1.1-.9-2-2-2z" },
    { key: "Normal", icon: "M8 3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2s2-.9 2-2V5c0-1.1-.9-2-2-2zm8 0c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2s2-.9 2-2V5c0-1.1-.9-2-2-2z" },
    { key: "Thick", icon: "M6 3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2s2-.9 2-2V5c0-1.1-.9-2-2-2zm6 0c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2s2-.9 2-2V5c0-1.1-.9-2-2-2zm6 0c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2s2-.9 2-2V5c0-1.1-.9-2-2-2z" },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Breadcrumbs items={[
        { label: t("home"), href: "/" },
        { label: t("breadcrumb") },
      ]} />

      {/* Hero */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blush-100 to-blush-300 flex items-center justify-center">
            <svg className="w-5 h-5 text-rose-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 01-6.001 0M18 7l-3 9m0-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">
            {t("title")}
          </h1>
        </div>
        <p className="text-muted max-w-2xl leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      {/* Weight guide — visual cards */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">
          {t("guideTitle")}
        </h2>
        <p className="text-sm text-muted mb-6 max-w-2xl">
          {t("guideIntro")}
        </p>

        <div className="space-y-3">
          {gramGuide.map((g) => (
            <div
              key={g.key}
              className={`relative bg-nude-50 rounded-xl border p-5 transition-all ${
                g.popular
                  ? "border-rose/40 ring-1 ring-rose/20"
                  : "border-line"
              }`}
            >
              {g.popular && (
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-rose text-white text-[10px] font-semibold rounded-full uppercase tracking-wider">
                  {t("g150effect")}
                </span>
              )}
              <div className="flex items-start gap-4">
                <div className="text-2xl font-bold text-ink whitespace-nowrap min-w-[72px]">
                  {t(`g${g.key}` as "g100")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink mb-1">
                    {t(`g${g.key}effect` as "g100effect")}
                  </div>
                  <p className="text-sm text-muted mb-3">
                    {t(`g${g.key}desc` as "g100desc")}
                  </p>
                  {/* Volume indicator bar */}
                  <div className="h-2 bg-nude-200/60 rounded-full overflow-hidden">
                    <div className={`h-full ${g.barColor} rounded-full ${g.width}`} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hair type recommendations */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">
          {t("hairTypeTitle")}
        </h2>
        <p className="text-sm text-muted mb-6 max-w-2xl">
          {t("hairTypeIntro")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {hairTypes.map((ht) => (
            <div
              key={ht.key}
              className="bg-nude-50 rounded-xl border border-line p-5 hover:border-blush-200 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-blush-100 flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-rose-deep" fill="currentColor" viewBox="0 0 24 24">
                  <path d={ht.icon} />
                </svg>
              </div>
              <div className="text-sm font-semibold text-ink mb-1">
                {t(`type${ht.key}` as "typeFine")}
              </div>
              <div className="text-lg font-bold text-rose mb-2">
                {t(`type${ht.key}Grams` as "typeFineGrams")}
              </div>
              <p className="text-sm text-muted leading-relaxed">
                {t(`type${ht.key}Note` as "typeFineNote")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Processing methods — clip-in vs tape-in */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-2">
          {t("processingTitle")}
        </h2>
        <p className="text-sm text-muted mb-6 max-w-2xl">
          {t("processingIntro")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="font-semibold text-ink">{t("clipIn")}</div>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              {t("clipInDesc")}
            </p>
          </div>

          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="font-semibold text-ink">{t("tapeIn")}</div>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              {t("tapeInDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Pro tip */}
      <section className="mb-14">
        <div className="bg-gradient-to-br from-blush-100/60 to-nude-100 rounded-xl border border-blush-200/60 p-6">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-rose/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-ink text-sm mb-1">
                {t("tipTitle")}
              </div>
              <p className="text-sm text-muted leading-relaxed">
                {t("tipText")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-ink mb-6">
          {t("faqTitle")}
        </h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <details
              key={i}
              className="group bg-nude-50 rounded-xl border border-line overflow-hidden"
            >
              <summary className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-nude-100 transition-colors">
                <span className="text-sm font-medium text-ink pr-4">
                  {t(`faq${i}q` as "faq1q")}
                </span>
                <svg
                  className="w-4 h-4 text-muted flex-shrink-0 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 text-sm text-muted leading-relaxed border-t border-line pt-3">
                {t(`faq${i}a` as "faq1a")}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="text-center bg-nude-50 rounded-xl border border-line p-8">
        <p className="text-muted mb-5">
          {t("ctaText")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/offer"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
          >
            {t("ctaOffer")}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-2.5 border border-line text-ink text-sm font-medium rounded-lg hover:bg-nude-100 transition-colors"
          >
            {t("ctaContact")}
          </Link>
          <Link
            href="/poradna"
            className="inline-flex items-center justify-center px-6 py-2.5 text-rose text-sm font-medium rounded-lg hover:bg-blush-100 transition-colors"
          >
            {t("ctaAdvice")}
          </Link>
        </div>
      </div>
    </div>
  );
}
