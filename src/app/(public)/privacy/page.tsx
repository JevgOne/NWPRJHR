import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  const sections = [
    "dataCollected",
    "purpose",
    "storage",
    "rights",
    "cookies",
    "contact",
  ] as const;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-ink mb-8">{t("title")}</h1>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section}>
            <h2 className="text-xl font-semibold text-ink mb-3">
              {t(`${section}.title`)}
            </h2>
            <p className="text-muted leading-relaxed whitespace-pre-line">
              {t(`${section}.text`)}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-12 text-sm text-muted">
        {t("lastUpdated")}
      </p>
    </div>
  );
}
