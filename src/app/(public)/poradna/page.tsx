import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { articles } from "./articles";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("advice");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: { canonical: "/poradna" },
  };
}

const categoryColors: Record<string, string> = {
  types: "bg-nude-100 text-espresso",
  care: "bg-green-100 text-green-700",
  guide: "bg-amber-100 text-amber-700",
  quality: "bg-purple-100 text-purple-700",
};

export default async function AdvicePage() {
  const t = await getTranslations("advice");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-ink mb-3">
          {t("heroTitle")}
        </h1>
        <p className="text-muted max-w-xl mx-auto">
          {t("heroSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/poradna/${a.slug}`}
            className="group block bg-white rounded-xl border border-line hover:border-blush-300 hover:shadow-md transition-all p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${categoryColors[a.category]}`}
              >
                {t(`cat.${a.category}` as "cat.types")}
              </span>
              <span className="text-[10px] text-muted">
                {a.readMin} min
              </span>
            </div>
            <h2 className="font-semibold text-ink group-hover:text-rose transition-colors mb-1">
              {t(a.titleKey as "typesTitle")}
            </h2>
            <p className="text-sm text-muted line-clamp-2">
              {t(a.descKey as "typesDesc")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
