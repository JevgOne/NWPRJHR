import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  return {
    title: t("aboutTitle"),
    description: t("aboutDescription"),
    alternates: getAlternates("/about"),
    openGraph: {
      type: "website",
      title: `${t("aboutTitle")} | Hairland`,
      description: t("aboutDescription"),
      url: "https://www.hairland.cz/about",
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "https://www.hairland.cz/hero-vzornik.jpg",
          width: 735,
          height: 707,
          alt: "Hairland — prémiové vlasy k prodloužení",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("aboutTitle")} | Hairland`,
      description: t("aboutDescription"),
      images: ["https://www.hairland.cz/hero-vzornik.jpg"],
    },
  };
}

export default async function AboutPage() {
  const t = await getTranslations("public");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Breadcrumbs items={[
        { label: t("nav.home"), href: "/" },
        { label: t("nav.about") },
      ]} />
      <h1 className="text-3xl font-bold text-ink mb-4">
        {t("about.title")}
      </h1>
      <p className="text-lg text-muted leading-relaxed mb-10 max-w-3xl">
        {t("about.intro")}
      </p>

      {/* Story */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-ink mb-4">
          {t("about.storyTitle")}
        </h2>
        <p className="text-muted leading-relaxed mb-4">
          {t("about.storyText1")}
        </p>
        <p className="text-muted leading-relaxed">
          {t("about.storyText2")}
        </p>
      </section>

      {/* What we do */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-ink mb-4">
          {t("about.whatWeDoTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["import", "processing", "support"] as const).map((key) => (
            <div key={key} className="bg-nude-50 rounded-xl p-5">
              <div className="text-2xl mb-2">{t(`about.${key}Icon` as any)}</div>
              <h3 className="font-semibold text-ink text-sm mb-1">{t(`about.${key}Title` as any)}</h3>
              <p className="text-muted text-sm leading-relaxed">{t(`about.${key}Text` as any)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why us — values */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-ink mb-4">
          {t("about.valuesTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["quality", "directImport", "customProcessing", "personalApproach"] as const).map((key) => (
            <div key={key} className="p-5 bg-nude-50 rounded-xl border border-line">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blush-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm">{t(`about.value${key.charAt(0).toUpperCase() + key.slice(1)}Icon` as any)}</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink mb-1">
                    {t(`about.value${key.charAt(0).toUpperCase() + key.slice(1)}` as any)}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {t(`about.value${key.charAt(0).toUpperCase() + key.slice(1)}Desc` as any)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Numbers */}
      <section className="mb-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(["origins", "languages", "turnaround", "delivery"] as const).map((key) => (
            <div key={key} className="text-center p-4 bg-blush-50 rounded-xl">
              <div className="text-2xl font-bold text-rose mb-1">{t(`about.stat${key.charAt(0).toUpperCase() + key.slice(1)}Value` as any)}</div>
              <div className="text-xs text-muted">{t(`about.stat${key.charAt(0).toUpperCase() + key.slice(1)}Label` as any)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* B2B */}
      <section className="mb-12">
        <div className="bg-espresso text-nude-200 rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white mb-3">
            {t("about.b2bTitle")}
          </h2>
          <p className="text-nude-200/80 text-sm leading-relaxed mb-4">
            {t("about.b2bText")}
          </p>
          <Link
            href="/registrace"
            className="inline-block px-5 py-2.5 bg-rose text-white font-medium rounded-xl hover:bg-rose-deep transition-colors text-sm"
          >
            {t("about.b2bCta")}
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-xl font-semibold text-ink mb-3">
          {t("about.ctaTitle")}
        </h2>
        <p className="text-muted text-sm mb-5 max-w-lg mx-auto">
          {t("about.ctaText")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/offer"
            className="px-6 py-3 bg-rose text-white font-medium rounded-xl hover:bg-rose-deep transition-colors text-sm"
          >
            {t("about.ctaOffer")}
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 border border-line text-ink font-medium rounded-xl hover:bg-nude-50 transition-colors text-sm"
          >
            {t("about.ctaContact")}
          </Link>
        </div>
      </section>
    </div>
  );
}
