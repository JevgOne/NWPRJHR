import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getAlternates, getOgUrl, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  return {
    title: t("faqTitle"),
    description: t("faqDescription"),
    alternates: getAlternates("/poradna", locale),
    openGraph: {
      type: "website",
      title: `${t("faqTitle")} | Hairland`,
      description: t("faqDescription"),
      url: getOgUrl("/poradna", locale),
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("faqTitle")} | Hairland`,
      description: t("faqDescription"),
    },
  };
}

const CATEGORIES = [
  { key: "cat1", questions: [1, 2, 3, 4, 5] },
  { key: "cat2", questions: [6, 7, 8, 9, 10] },
  { key: "cat3", questions: [11, 12, 13, 14, 15] },
  { key: "cat4", questions: [16, 17, 18, 19] },
  { key: "cat5", questions: [20, 21, 22] },
  { key: "cat6", questions: [23, 24, 25, 26] },
  { key: "cat7", questions: [27, 28, 29] },
  { key: "cat8", questions: [30, 31, 32] },
] as const;

export default async function FaqPage() {
  const [t, tNav] = await Promise.all([
    getTranslations("public.faq"),
    getTranslations("public.nav"),
  ]);

  const allQuestions = CATEGORIES.flatMap((cat) =>
    cat.questions.map((num) => ({
      "@type": "Question" as const,
      name: t(`q${num}` as any),
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: t(`a${num}` as any),
      },
    }))
  );

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allQuestions,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Breadcrumbs items={[
        { label: tNav("home"), href: "/" },
        { label: t("title") },
      ]} />
      <h1 className="text-3xl font-bold text-ink mb-2">{t("title")}</h1>
      <p className="text-sm text-muted mb-8">{t("subtitle")}</p>

      <div className="space-y-8">
        {CATEGORIES.map((cat) => (
          <section key={cat.key}>
            <h2 className="text-lg font-semibold text-ink mb-3">
              {t(cat.key as any)}
            </h2>
            <div className="space-y-2">
              {cat.questions.map((num) => (
                <details
                  key={num}
                  className="group bg-nude-50 rounded-xl border border-line overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-nude-100 transition-colors">
                    <span className="text-sm font-medium text-ink pr-4">
                      {t(`q${num}` as any)}
                    </span>
                    <svg className="w-4 h-4 text-muted flex-shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 text-sm text-muted leading-relaxed border-t border-line pt-3">
                    {t(`a${num}` as any)}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 text-center bg-nude-50 rounded-xl border border-line p-8">
        <p className="text-muted text-sm mb-4">{t("ctaText")}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/contact" className="px-6 py-2.5 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors">
            {t("ctaContact")}
          </Link>
          <Link href="/vlasy-k-prodlouzeni" className="px-6 py-2.5 border border-line text-ink text-sm font-medium rounded-lg hover:bg-nude-100 transition-colors">
            {t("ctaOffer")}
          </Link>
        </div>
      </div>
    </div>
  );
}
