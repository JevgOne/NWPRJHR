import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getAlternates, getOgUrl, OG_LOCALES } from "@/lib/seo";
import { CITIES } from "@/lib/city-landing-data";

type Locale = "cs" | "uk" | "ru";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  const title = t("cityHubTitle");
  const desc = t("cityHubDescription");
  return {
    title,
    description: desc,
    alternates: getAlternates("/prodlouzeni-vlasu", locale),
    openGraph: {
      type: "website",
      title: `${title} | Hairland`,
      description: desc,
      url: getOgUrl("/prodlouzeni-vlasu", locale),
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

export default async function CityHubPage() {
  const [t, locale] = await Promise.all([
    getTranslations("cityLanding"),
    getLocale() as Promise<Locale>,
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <Breadcrumbs
        items={[
          { label: t("home"), href: "/" },
          { label: t("hubBreadcrumb") },
        ]}
      />
      <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mb-2">
        {t("hubTitle")}
      </h1>
      <p className="text-sm text-muted mb-8">{t("hubSubtitle")}</p>

      {/* Praha callout */}
      <div className="mb-8 p-4 bg-blush-50 border border-blush-200 rounded-xl">
        <p className="text-sm text-muted">
          {t("hubPraha")}{" "}
          <Link href="/prodlouzeni-vlasu-praha" className="text-rose underline font-medium">
            {t("hubPrahaLink")}
          </Link>
        </p>
      </div>

      {/* City grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {CITIES.map((city) => (
          <Link
            key={city.slug}
            href={{ pathname: '/prodlouzeni-vlasu/[city]' as any, params: { city: city.slug } }}
            className="bg-nude-50 rounded-xl border border-line p-4 hover:border-blush-200 transition-colors group"
          >
            <div className="text-sm font-semibold text-ink group-hover:text-rose transition-colors">
              {city.name[locale] ?? city.name.cs}
            </div>
            <div className="text-xs text-muted mt-1">
              {city.region[locale] ?? city.region.cs}
            </div>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted mb-4">{t("ctaText")}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/vlasy-k-prodlouzeni"
            className="px-6 py-2.5 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors"
          >
            {t("ctaNabidka")}
          </Link>
          <Link
            href="/kontakt"
            className="px-6 py-2.5 border border-line text-ink text-sm font-medium rounded-lg hover:bg-nude-100 transition-colors"
          >
            {t("ctaKonzultace")}
          </Link>
        </div>
      </div>
    </div>
  );
}
