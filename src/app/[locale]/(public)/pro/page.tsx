import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("b2b"), getLocale()]);
  const title = t("pageTitle");
  const desc = t("pageDescription");
  return {
    title,
    description: desc,
    alternates: getAlternates("/pro"),
    openGraph: {
      type: "website",
      title: `${title} | Hairland`,
      description: desc,
      url: "https://www.hairland.cz/pro",
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Hairland`,
      description: desc,
    },
  };
}

export default async function ProPage() {
  const t = await getTranslations("b2b");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-ink mb-3">{t("heroTitle")}</h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          {t("heroSubtitle")}
        </p>
      </div>

      {/* Two cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Salon card */}
        <div className="bg-white rounded-2xl border border-line p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-ink">{t("salonCard.title")}</h2>
          </div>
          <p className="text-2xl font-bold text-rose">{t("salonCard.discount")}</p>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              {t("salonCard.benefit1")}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              {t("salonCard.benefit2")}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              {t("salonCard.benefit3")}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              {t("salonCard.benefit4")}
            </li>
          </ul>
          <Link
            href="/registrace"
            className="block w-full py-2.5 text-center bg-rose text-white font-medium rounded-xl hover:bg-rose-deep transition-colors"
          >
            {t("ctaRegister")}
          </Link>
        </div>

        {/* Hairdresser card */}
        <div className="bg-white rounded-2xl border border-line p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-ink">{t("hairdresserCard.title")}</h2>
          </div>
          <p className="text-2xl font-bold text-amber-600">{t("hairdresserCard.discount")}</p>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              {t("hairdresserCard.benefit1")}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              {t("hairdresserCard.benefit2")}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              {t("hairdresserCard.benefit3")}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              {t("hairdresserCard.benefit4")}
            </li>
          </ul>
          <Link
            href="/registrace"
            className="block w-full py-2.5 text-center bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition-colors"
          >
            {t("ctaRegister")}
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-ink text-center mb-8">
          {t("howItWorks.title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-rose/10 text-rose font-bold flex items-center justify-center mx-auto mb-3">
                {step}
              </div>
              <h3 className="font-semibold text-ink mb-1">
                {t(`howItWorks.step${step}Title`)}
              </h3>
              <p className="text-sm text-muted">
                {t(`howItWorks.step${step}Text`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-nude-50 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-ink mb-2">{t("ctaTitle")}</h2>
        <p className="text-sm text-muted mb-4">{t("ctaText")}</p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/registrace"
            className="px-6 py-2.5 bg-rose text-white font-medium rounded-xl hover:bg-rose-deep transition-colors"
          >
            {t("ctaRegister")}
          </Link>
          <Link
            href="/login"
            className="px-6 py-2.5 border border-line text-ink font-medium rounded-xl hover:bg-white transition-colors"
          >
            {t("ctaLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
