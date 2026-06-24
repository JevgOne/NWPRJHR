import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
  const t = await getTranslations("public");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {t("about.title")}
      </h1>

      {/* Mission */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t("about.missionTitle")}
        </h2>
        <p className="text-gray-600 leading-relaxed">
          {t("about.missionText")}
        </p>
      </section>

      {/* Values */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t("about.valuesTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            [
              "about.valueQuality",
              "about.valueTrust",
              "about.valuePartnership",
              "about.valueTransparency",
            ] as const
          ).map((key) => (
            <div
              key={key}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-indigo-600"
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
                <span className="text-sm font-medium text-gray-900">
                  {t(key)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
