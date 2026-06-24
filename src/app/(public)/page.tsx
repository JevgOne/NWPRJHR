import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function LandingPage() {
  const t = await getTranslations("public");
  const tCategory = await getTranslations("category");

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white py-20 lg:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            {t("hero.title")}
          </h1>
          <p className="text-lg lg:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {t("hero.subtitle")}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/contact"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              {t("hero.cta")}
            </Link>
            <Link
              href="/offer"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
            >
              {t("hero.viewOffer")}
            </Link>
          </div>
        </div>
      </section>

      {/* Product categories */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            {t("nav.products")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(["virgin", "premium", "standard", "sale"] as const).map(
              (cat) => (
                <Link
                  key={cat}
                  href={`/offer?category=${cat.toUpperCase()}`}
                  className="group block p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {tCategory(cat)}
                  </h3>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* USPs */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            {t("whyHairora")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(
              [
                "usp.directImport",
                "usp.qualityGuarantee",
                "usp.personalApproach",
                "usp.trilingualSupport",
              ] as const
            ).map((key) => (
              <div
                key={key}
                className="p-6 bg-white rounded-xl border border-gray-200"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900">{t(key)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t("ctaTitle")}
          </h2>
          <p className="text-gray-600 mb-6">{t("ctaSubtitle")}</p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            {t("hero.cta")}
          </Link>
        </div>
      </section>
    </div>
  );
}
