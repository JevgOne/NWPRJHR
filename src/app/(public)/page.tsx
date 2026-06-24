import { useTranslations } from "next-intl";
import Link from "next/link";

export default function HomePage() {
  const t = useTranslations("public");

  return (
    <div>
      <section className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            {t("heroTitle")}
          </h1>
          <p className="text-xl text-gray-300 mb-8">{t("heroSubtitle")}</p>
          <Link
            href="/login"
            className="inline-block bg-white text-gray-900 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {t("contact")}
          </Link>
        </div>
      </section>
    </div>
  );
}
