import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

const getCachedAllStylists = unstable_cache(
  async () => {
    return prisma.stylist.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      include: { salon: { select: { name: true } } },
    });
  },
  ["public-stylists-all"],
  { revalidate: 300, tags: ["stylists"] }
);

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  return {
    title: t("kadernicTitle"),
    description: t("kadernicDescription"),
    alternates: getAlternates("/kadernice"),
    openGraph: {
      type: "website",
      title: `${t("kadernicTitle")} | Hairland`,
      description: t("kadernicDescription"),
      url: "https://www.hairland.cz/kadernice",
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "https://www.hairland.cz/og/og-kadernice.jpg",
          width: 1200,
          height: 630,
          alt: "Hairland — prémiové vlasy k prodloužení",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("kadernicTitle")} | Hairland`,
      description: t("kadernicDescription"),
      images: ["https://www.hairland.cz/og/og-kadernice.jpg"],
    },
  };
}

const langFlags: Record<string, string> = {
  cs: "🇨🇿",
  uk: "🇺🇦",
  ru: "🇷🇺",
  en: "🇬🇧",
};

export default async function StylistsPublicPage() {
  const [t, tNav, stylists, locale] = await Promise.all([
    getTranslations("public.stylists"),
    getTranslations("public.nav"),
    getCachedAllStylists(),
    getLocale(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("title"),
    inLanguage: locale,
    itemListElement: stylists.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.hairland.cz/kadernice/${s.slug}`,
      name: s.name,
    })),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs items={[
        { label: tNav("home"), href: "/" },
        { label: t("title") },
      ]} />
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>
        <p className="text-muted text-sm mt-1">
          {t("subtitle")}
        </p>
      </div>

      {stylists.length === 0 && (
        <div className="text-center py-16">
          <svg className="w-10 h-10 mx-auto text-rose mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
          <h2 className="text-lg font-semibold text-ink mb-2">{t("noStylists")}</h2>
          <p className="text-muted text-sm max-w-md mx-auto mb-6">
            {t("noStylistsDesc")}
          </p>
          <Link
            href="/registrace"
            className="inline-block px-6 py-3 bg-rose text-white font-medium rounded-xl hover:bg-rose-deep transition-colors"
          >
            {t("registerAsStylist")}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stylists.map((s) => {
          const specs: string[] = JSON.parse(s.specializations || "[]");
          const langs: string[] = JSON.parse(s.languages || "[]");

          return (
            <Link
              key={s.id}
              href={`/kadernice/${s.slug}`}
              className="group flex flex-col bg-white rounded-xl border border-line hover:shadow-md hover:border-blush-300 transition-all overflow-hidden"
            >
              {/* Photo + badge */}
              <div className="flex justify-center pt-5 pb-2 relative">
                {s.featured && (
                  <span className="absolute top-3 right-3 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Top
                  </span>
                )}
                <div className="w-20 h-20 rounded-full bg-nude-100 overflow-hidden ring-2 ring-line relative">
                  {s.photo ? (
                    <Image src={s.photo} alt={s.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-blush-100 flex items-center justify-center"><svg className="w-8 h-8 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg></div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 px-4 pb-4 text-center">
                <h3 className="text-sm font-bold text-ink group-hover:text-rose transition-colors">
                  {s.name}
                </h3>
                <p className="text-[11px] text-muted mt-0.5">
                  {s.city}{s.experience ? ` · ${s.experience} ${t("yearsExperience")}` : ""}
                </p>
                {s.salon && (
                  <p className="text-[10px] text-rose mt-0.5">{s.salon.name}</p>
                )}

                <div className="flex justify-center gap-1 mt-2">
                  {langs.map((l) => (
                    <span key={l} className="text-sm">{langFlags[l] || l}</span>
                  ))}
                </div>

                <p className="text-[11px] text-muted mt-2 line-clamp-2 min-h-[2rem]">
                  {s.bio || ""}
                </p>

                <div className="mt-auto pt-2">
                  {specs.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1">
                      {specs.slice(0, 2).map((sp) => (
                        <span key={sp} className="text-[10px] bg-blush-100 text-rose-deep px-1.5 py-0.5 rounded-full">
                          {sp}
                        </span>
                      ))}
                      {specs.length > 2 && (
                        <span className="text-[10px] text-muted">+{specs.length - 2}</span>
                      )}
                    </div>
                  )}
                  <div className="mt-2 text-[11px] text-rose font-medium group-hover:underline">
                    {t("viewProfile")}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
