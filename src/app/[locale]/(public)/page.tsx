import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { getHairColor } from "@/lib/hair-colors";
import { getCachedAllProducts } from "@/lib/cached-products";
import { HeroProductSlider } from "@/components/public/HeroProductSlider";
import { ReviewsSection } from "@/components/public/ReviewsSection";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

const getCachedStylists = unstable_cache(
  async () => {
    return prisma.stylist.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      take: 6,
      include: { salon: { select: { name: true } } },
    });
  },
  ["homepage-stylists"],
  { revalidate: 300, tags: ["stylists"] }
);

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: getAlternates("/"),
    openGraph: {
      type: "website",
      title: `${t("homeTitle")} | Hairland`,
      description: t("homeDescription"),
      url: "https://www.hairland.cz",
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "https://www.hairland.cz/og/og-home.jpg",
          width: 1200,
          height: 630,
          alt: t("homeTitle"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("homeTitle")} | Hairland`,
      description: t("homeDescription"),
      images: ["https://www.hairland.cz/og/og-home.jpg"],
    },
  };
}

const BLOB = "/images/hair";

const DEFAULT_IG_PHOTOS = [
  `${BLOB}/volne-vlasy.jpg`,
  `${BLOB}/odstiny-prehled.jpg`,
  `${BLOB}/extensions-techniky.jpg`,
  `${BLOB}/keratinove-vlasy.jpg`,
];

const getCachedIgPhotos = unstable_cache(
  async () => {
    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: "instagram_photos" },
      });
      if (setting?.value) {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed) && parsed.length === 4) return parsed as string[];
      }
    } catch {}
    return DEFAULT_IG_PHOTOS;
  },
  ["homepage-ig-photos"],
  { revalidate: 60, tags: ["site-settings"] }
);

function buildStoreJsonLd(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Hairland",
    url: "https://www.hairland.cz",
    description,
    image: "https://www.hairland.cz/icons/icon-512x512.png",
    logo: "https://www.hairland.cz/icons/icon-512x512.png",
    telephone: "+420608553103",
    priceRange: "500 Kč - 17 000 Kč",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Školská 660/3",
      addressLocality: "Praha",
      postalCode: "110 00",
      addressCountry: "CZ",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 50.0804,
      longitude: 14.4261,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    email: "info@hairland.cz",
    sameAs: ["https://www.instagram.com/hairland.cz"],
  };
}

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Hairland",
  url: "https://www.hairland.cz",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.hairland.cz/offer?search={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Hairland",
  url: "https://www.hairland.cz",
  logo: "https://www.hairland.cz/icons/icon-512x512.png",
  sameAs: [
    "https://www.instagram.com/hairland.cz/",
    "https://www.facebook.com/profile.php?id=61591480246246",
    "https://wa.me/420608553103",
  ],
};

export default async function LandingPage() {
  const [t, tCategory, tPt, stylists, allProducts, igPhotos] = await Promise.all([
    getTranslations("public"),
    getTranslations("category"),
    getTranslations("processingType"),
    getCachedStylists(),
    getCachedAllProducts(),
    getCachedIgPhotos(),
  ]);

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildStoreJsonLd(t("landing.heroSubtitle"))) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {/* Hero — compact, clean */}
      <section className="bg-white pt-8 sm:pt-12 pb-8 sm:pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-ink mb-2 leading-tight">
              {t("landing.heroTitle")}
            </h1>
            <p className="text-sm sm:text-base text-muted max-w-lg mx-auto font-light">
              {t("landing.heroSubtitle")}
            </p>
          </div>

          {/* Hero image */}
          <div className="relative aspect-[4/3] sm:aspect-[2/1] rounded-xl sm:rounded-2xl overflow-hidden mb-8 sm:mb-10 max-w-4xl mx-auto">
            <Image src="/hero-vzornik.png" alt={t("landing.heroImageAlt")} fill className="object-cover" sizes="(max-width: 768px) 100vw, 896px" priority />
          </div>

          {/* Trust badges — H2 + H3 */}
          <h2 className="sr-only">{t("landing.whyHairland")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-x-6 mb-4 sm:mb-6">
            {([
              { titleKey: "badgeNatural" as const, descKey: "badgeNaturalDesc" as const, icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                </svg>
              )},
              { titleKey: "badgeImport" as const, descKey: "badgeImportDesc" as const, icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              )},
              { titleKey: "badgeInvoice" as const, descKey: "badgeInvoiceDesc" as const, icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              )},
              { titleKey: "badgeOrigin" as const, descKey: "badgeOriginDesc" as const, icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              )},
            ]).map(({ titleKey, descKey, icon }) => (
              <div key={titleKey} className="flex flex-col items-center text-center py-2 sm:py-3 gap-1.5">
                <div className="text-rose/70">
                  {icon}
                </div>
                <div>
                  <h3 className="font-semibold text-ink text-xs sm:text-sm">
                    {t(`landing.${titleKey}`)}
                  </h3>
                  <p className="text-[11px] text-muted">
                    {t(`landing.${descKey}`)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Processing type links */}
          <div className="border-t border-line pt-6 sm:pt-8 mt-2">
            <p className="text-xs text-muted text-center mb-3">{t("landing.processingTypes")}</p>
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
              {([
                { slug: "clip-in", href: "/clip-in" },
                { slug: "tape-in", href: "/tape-in" },
                { slug: "keratin", href: "/keratin" },
                { slug: "micro-ring", href: "/micro-ring" },
                { slug: "weft", href: "/tresove-vlasy" },
              ] as const).map(({ slug: catSlug, href: catHref }) => (
                <Link
                  key={catSlug}
                  href={catHref}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-nude-50 text-espresso hover:bg-blush-100 hover:text-rose-deep transition-all duration-200 text-xs sm:text-sm font-medium hover:shadow-sm"
                >
                  {tPt(`${catSlug}.name` as any)}
                </Link>
              ))}
            </div>
          </div>

          {/* Product slider */}
          <div className="border-t border-line pt-6 sm:pt-8 mt-6 sm:mt-8 px-4">
            <HeroProductSlider products={allProducts} />
          </div>

          <div className="flex gap-3 justify-center mt-4 sm:mt-6">
            <Link
              href="/offer"
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-rose hover:bg-rose-deep text-white text-xs sm:text-sm font-medium rounded-lg transition-all duration-300 hover:shadow-md"
            >
              {t("landing.viewFullOffer")}
            </Link>
            <Link
              href="/contact"
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white text-espresso border border-line hover:bg-nude-50 text-xs sm:text-sm font-medium rounded-lg transition-all duration-300 hover:shadow-md"
            >
              {t("landing.contactUs")}
            </Link>
          </div>
        </div>
      </section>

      {/* Product categories with photos */}
      <ScrollReveal>
        <section className="py-10 sm:py-14 bg-nude-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-ink text-center mb-6 tracking-tight">
              {t("landing.chooseFromOffer")}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {(
                [
                  { key: "virgin" as const, img: `${BLOB}/volne-vlasy.jpg`, descKey: "landing.categoryDescVirgin" as const },
                  { key: "luxe" as const, img: `${BLOB}/odstiny-prehled.jpg`, descKey: "landing.categoryDescLuxe" as const },
                  { key: "standard" as const, img: `${BLOB}/extensions-techniky.jpg`, descKey: "landing.categoryDescStandard" as const },
                  { key: "sale" as const, img: `${BLOB}/keratinove-vlasy.jpg`, descKey: "landing.categoryDescSale" as const },
                ]
              ).map(({ key, img, descKey }) => (
                <Link
                  key={key}
                  href={`/offer?category=${key.toUpperCase()}`}
                  className="group block overflow-hidden rounded-xl border border-line hover:border-blush-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-32">
                    <Image src={img} alt={`${tCategory(key)} — ${t("landing.categoryImageAlt")}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-3 bg-white text-center">
                    <h3 className="font-semibold text-ink text-sm">
                      {tCategory(key)}
                    </h3>
                    <p className="text-[11px] text-muted mt-0.5">{t(descKey)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Color palette */}
      <ScrollReveal>
      <section className="py-10 sm:py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-ink mb-3 tracking-tight">
              {t("landing.colorPaletteTitle")}
            </h2>
            <p className="text-muted max-w-xl mx-auto font-light">
              {t("landing.colorPaletteSubtitle")}
            </p>
          </div>

          {/* Individual shades — photo swatches */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3 mb-8 overflow-hidden">
            {[
              { code: "1", nameKey: "colors.c1" as const },
              { code: "2", nameKey: "colors.c2" as const },
              { code: "3", nameKey: "colors.c3" as const },
              { code: "4", nameKey: "colors.c4" as const },
              { code: "5", nameKey: "colors.c5" as const },
              { code: "6", nameKey: "colors.c6" as const },
              { code: "7", nameKey: "colors.c7" as const },
              { code: "8", nameKey: "colors.c8" as const },
              { code: "9", nameKey: "colors.c9" as const },
              { code: "10", nameKey: "colors.c10" as const },
            ].map(({ code, nameKey }) => (
              <Link key={code} href={`/offer?color=${code}`} className="flex flex-col items-center gap-1 sm:gap-2 group min-w-0">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-200 border-2 border-white ring-1 ring-line flex-shrink-0" style={{ backgroundColor: getHairColor(code).hex }} />
                <span className="text-[9px] sm:text-xs text-muted font-medium text-center leading-tight truncate w-full">{t(nameKey)}</span>
              </Link>
            ))}
          </div>

          <div className="flex justify-center">
            <div className="relative w-full max-w-2xl h-48 md:h-56 rounded-xl shadow-md overflow-hidden">
              <Image
                src={`${BLOB}/odstiny-prehled.jpg`}
                alt={t("landing.colorPaletteAlt")}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* How it works */}
      <ScrollReveal>
      <section className="py-10 sm:py-14 bg-nude-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-ink text-center mb-3 tracking-tight">
            {t("landing.howItWorksTitle")}
          </h2>
          <p className="text-muted text-center mb-10 max-w-xl mx-auto font-light">
            {t("landing.howItWorksSubtitle")}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: 1, titleKey: "landing.step1Title" as const, descKey: "landing.step1Desc" as const },
              { step: 2, titleKey: "landing.step2Title" as const, descKey: "landing.step2Desc" as const },
              { step: 3, titleKey: "landing.step3Title" as const, descKey: "landing.step3Desc" as const },
              { step: 4, titleKey: "landing.step4Title" as const, descKey: "landing.step4Desc" as const },
            ].map(({ step, titleKey, descKey }) => (
              <div key={titleKey} className="text-center p-4 bg-white rounded-xl border border-line hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <span className="text-xs font-medium text-rose tracking-wide">{step}.</span>
                <h3 className="font-semibold text-ink mb-1 text-sm mt-1">{t(titleKey)}</h3>
                <p className="text-xs text-muted">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* Trust section — 4 items, no duplicates */}
      <ScrollReveal>
      <section className="py-10 sm:py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-ink text-center mb-3 tracking-tight">
            {t("landing.trustTitle")}
          </h2>
          <p className="text-muted text-center mb-10 max-w-xl mx-auto font-light">
            {t("landing.trustSubtitle")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                titleKey: "landing.trust1Title" as const, descKey: "landing.trust1Desc" as const,
                icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
              },
              {
                titleKey: "landing.trust2Title" as const, descKey: "landing.trust2Desc" as const,
                icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
              },
              {
                titleKey: "landing.trust3Title" as const, descKey: "landing.trust3Desc" as const,
                icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m7.848 8.25 1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863 2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0 7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664" /></svg>,
              },
              {
                titleKey: "landing.trust4Title" as const, descKey: "landing.trust4Desc" as const,
                icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>,
              },
            ].map(({ icon, titleKey, descKey }) => (
              <div key={titleKey} className="flex gap-4 p-5 bg-nude-50 rounded-xl border border-line hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-rose/10 text-rose flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <h3 className="font-semibold text-ink mb-1">{t(titleKey)}</h3>
                  <p className="text-sm text-muted">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* Reviews */}
      <ReviewsSection />

      {/* Partner stylists */}
      {stylists.length > 0 && (
        <ScrollReveal>
        <section className="py-10 sm:py-14 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-ink mb-3 tracking-tight">
                {t("landing.stylistsTitle")}
              </h2>
              <p className="text-muted max-w-xl mx-auto font-light">
                {t("landing.stylistsSubtitle")}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {stylists.map((s) => {
                const specs: string[] = JSON.parse(s.specializations || "[]");
                return (
                  <Link
                    key={s.id}
                    href={`/kadernice/${s.slug}`}
                    className="group flex flex-col items-center bg-nude-50 rounded-xl border border-line hover:shadow-lg hover:border-blush-300 hover:-translate-y-1 transition-all duration-300 p-3"
                  >
                    <div className="w-16 h-16 rounded-full bg-nude-100 overflow-hidden ring-2 ring-line mb-2 relative">
                      {s.photo ? (
                        <Image src={s.photo} alt={s.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-blush-100 flex items-center justify-center">
                          <svg className="w-8 h-8 text-rose/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xs font-semibold text-ink group-hover:text-rose transition-colors text-center">
                      {s.name}
                    </h3>
                    <p className="text-[10px] text-muted mt-0.5">{s.city}</p>
                    {s.salon && (
                      <p className="text-[10px] text-rose mt-0.5">{s.salon.name}</p>
                    )}
                    {specs.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-0.5 mt-1.5">
                        {specs.slice(0, 2).map((sp) => (
                          <span key={sp} className="text-[9px] bg-blush-100 text-rose-deep px-1.5 py-0.5 rounded-full">
                            {sp}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="flex gap-3 justify-center mt-6">
              <Link
                href="/kadernice"
                className="px-5 py-2.5 bg-rose hover:bg-rose-deep text-white text-sm font-medium rounded-lg transition-colors"
              >
                {t("landing.allStylists")}
              </Link>
              <Link
                href="/registrace"
                className="px-5 py-2.5 bg-white text-rose border border-blush-200 hover:bg-blush-100 text-sm font-medium rounded-lg transition-colors"
              >
                {t("landing.registerSalon")}
              </Link>
            </div>
          </div>
        </section>
        </ScrollReveal>
      )}

      {/* Trilingual banner */}
      <div className="bg-nude-50 py-3 text-center text-sm text-muted">
        {t("landing.langBanner")}
      </div>

      {/* Instagram section */}
      <ScrollReveal>
      <section className="py-12 sm:py-16 bg-nude-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-rose" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">{t("landing.igTitle")}</h2>
              </div>
              <p className="text-sm text-muted">{t("landing.igDesc")}</p>
            </div>
            <a
              href="https://www.instagram.com/hairland.cz/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-espresso hover:bg-ink text-white text-sm font-medium rounded-lg transition-colors shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              {t("landing.igFollow")}
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {igPhotos.map((src, i) => (
              <a
                key={i}
                href="https://www.instagram.com/hairland.cz/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-xl overflow-hidden"
              >
                <Image src={src} alt={`Instagram post ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/30 transition-colors duration-300 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* Final CTA — contact + B2B + links */}
      <ScrollReveal>
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-ink mb-3 tracking-tight">
            {t("landing.ctaTitle")}
          </h2>
          <p className="text-muted mb-6 max-w-lg mx-auto">
            {t("landing.ctaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link
              href="/contact"
              className="px-6 py-3 bg-rose hover:bg-rose-deep text-white font-medium rounded-lg transition-colors"
            >
              {t("landing.ctaContact")}
            </Link>
            <Link
              href="/offer"
              className="px-6 py-3 bg-white text-ink border border-line hover:bg-nude-50 font-medium rounded-lg transition-colors"
            >
              {t("landing.viewFullOffer")}
            </Link>
          </div>
          <div className="border-t border-line pt-5">
            <p className="text-xs text-muted mb-2">{t("landing.b2bTitle")}</p>
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 justify-center">
              <Link
                href="/pro"
                className="text-xs text-rose hover:text-rose-deep font-medium transition-colors py-1"
              >
                {t("landing.b2bCta")}
              </Link>
              <span className="hidden sm:inline text-xs text-line">·</span>
              <Link
                href="/registrace"
                className="text-xs text-rose hover:text-rose-deep font-medium transition-colors py-1"
              >
                {t("landing.b2bRegister")}
              </Link>
              <span className="hidden sm:inline text-xs text-line">·</span>
              <Link
                href="/kadernice"
                className="text-xs text-rose hover:text-rose-deep font-medium transition-colors py-1"
              >
                {t("landing.ctaHairdressers")}
              </Link>
            </div>
          </div>
        </div>
      </section>
      </ScrollReveal>
    </div>
  );
}
