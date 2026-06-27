import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Obchodní podmínky",
  description: "Obchodní podmínky e-shopu Hairland.cz — prodej prémiových vlasů k prodloužení.",
  alternates: { canonical: "/obchodni-podminky" },
};

export default async function ObchodniPodminkyPage() {
  const t = await getTranslations("public.terms");

  const sectionNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-ink mb-2">
        {t("title")}
      </h1>
      <p className="text-sm text-muted mb-8">
        {t("subtitle")}
      </p>

      <div className="space-y-8">
        {sectionNumbers.map((num) => (
          <section key={num}>
            <h2 className="text-lg font-semibold text-ink mb-2">
              {t(`section${num}Title`)}
            </h2>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
              {t(`section${num}Text`)}
            </p>
            {num === 9 && (
              <Link
                href="/privacy"
                className="inline-block mt-2 text-sm text-rose hover:text-rose-deep underline"
              >
                {t("section9Link")}
              </Link>
            )}
          </section>
        ))}
      </div>

      <p className="mt-12 text-sm text-muted">
        {t("lastUpdated")}
      </p>
    </div>
  );
}
