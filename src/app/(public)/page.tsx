import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getHairColor } from "@/lib/hair-colors";
import { HeroProductSlider } from "@/components/public/HeroProductSlider";
import { ReviewsSection } from "@/components/public/ReviewsSection";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const BLOB = "https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair";

const storeJsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "Hairland",
  url: "https://www.hairland.cz",
  description:
    "Prémiové surové vlasy k prodloužení. Zpracování na zakázku — clip-in, tape-in, micro ring. Přímý import, skladem v Praze.",
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
};

export default async function LandingPage() {
  const [t, tCategory, stylists] = await Promise.all([
    getTranslations("public"),
    getTranslations("category"),
    prisma.stylist.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      take: 6,
      include: { salon: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {/* Hero — text + benefits + product slider */}
      <section className="bg-white pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-ink mb-3">
              {t("landing.heroTitle")}
            </h1>
            <p className="text-muted mb-4 max-w-xl mx-auto">
              {t("landing.heroSubtitle")}
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted">
              <span>{t("landing.badgeInStock")}</span>
              <span>{t("landing.badgeCustom")}</span>
              <span>{t("landing.badgeDelivery")}</span>
              <span>{t("landing.badgeOrigin")}</span>
            </div>
          </div>

          {/* Product slider */}
          <div className="px-4">
            <HeroProductSlider />
          </div>

          <div className="flex gap-3 justify-center mt-6">
            <Link
              href="/offer"
              className="px-5 py-2.5 bg-rose hover:bg-rose-deep text-white text-sm font-medium rounded-lg transition-colors"
            >
              {t("landing.viewFullOffer")}
            </Link>
            <Link
              href="/contact"
              className="px-5 py-2.5 bg-white text-espresso border border-line hover:bg-nude-50 text-sm font-medium rounded-lg transition-colors"
            >
              {t("landing.contactUs")}
            </Link>
          </div>
        </div>
      </section>

      {/* Product categories with photos */}
      <section className="py-10 bg-nude-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-ink text-center mb-6">
            {t("landing.chooseFromOffer")}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(
              [
                { key: "virgin" as const, img: `${BLOB}/volne-vlasy.jpg`, descKey: "landing.categoryDescVirgin" as const },
                { key: "premium" as const, img: `${BLOB}/odstiny-prehled.jpg`, descKey: "landing.categoryDescPremium" as const },
                { key: "standard" as const, img: `${BLOB}/extensions-techniky.jpg`, descKey: "landing.categoryDescStandard" as const },
                { key: "sale" as const, img: `${BLOB}/keratinove-vlasy.jpg`, descKey: "landing.categoryDescSale" as const },
              ]
            ).map(({ key, img, descKey }) => (
              <Link
                key={key}
                href={`/offer?category=${key.toUpperCase()}`}
                className="group block overflow-hidden rounded-xl border border-line hover:border-blush-300 hover:shadow-md transition-all"
              >
                <div className="relative h-32">
                  <img src={img} alt={tCategory(key)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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

      {/* Color palette */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-ink mb-3">
              {t("landing.colorPaletteTitle")}
            </h2>
            <p className="text-muted max-w-xl mx-auto">
              {t("landing.colorPaletteSubtitle")}
            </p>
          </div>

          {/* Individual shades — photo swatches */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 mb-8">
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
              <Link key={code} href={`/offer?color=${code}`} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-200 border-2 border-white ring-1 ring-line" style={{ backgroundColor: getHairColor(code).hex }} />
                <span className="text-[10px] sm:text-xs text-muted font-medium text-center leading-tight">{t(nameKey)}</span>
              </Link>
            ))}
          </div>

          <div className="flex justify-center">
            <img
              src={`${BLOB}/odstiny-prehled.jpg`}
              alt={t("landing.colorPaletteAlt")}
              className="w-full max-w-2xl h-48 md:h-56 object-cover rounded-xl shadow-md"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-nude-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ink text-center mb-3">
            {t("landing.howItWorksTitle")}
          </h2>
          <p className="text-muted text-center mb-10 max-w-xl mx-auto">
            {t("landing.howItWorksSubtitle")}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "1️⃣", titleKey: "landing.step1Title" as const, descKey: "landing.step1Desc" as const },
              { icon: "2️⃣", titleKey: "landing.step2Title" as const, descKey: "landing.step2Desc" as const },
              { icon: "3️⃣", titleKey: "landing.step3Title" as const, descKey: "landing.step3Desc" as const },
              { icon: "4️⃣", titleKey: "landing.step4Title" as const, descKey: "landing.step4Desc" as const },
            ].map(({ icon, titleKey, descKey }) => (
              <div key={titleKey} className="text-center">
                <div className="w-12 h-12 bg-blush-100 rounded-2xl flex items-center justify-center mx-auto mb-2 text-xl">
                  {icon}
                </div>
                <h3 className="font-semibold text-ink mb-1 text-sm">{t(titleKey)}</h3>
                <p className="text-xs text-muted">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust section — 4 items, no duplicates */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ink text-center mb-3">
            {t("landing.trustTitle")}
          </h2>
          <p className="text-muted text-center mb-10 max-w-xl mx-auto">
            {t("landing.trustSubtitle")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: "👁️", titleKey: "landing.trust1Title" as const, descKey: "landing.trust1Desc" as const },
              { icon: "🌍", titleKey: "landing.trust2Title" as const, descKey: "landing.trust2Desc" as const },
              { icon: "✂️", titleKey: "landing.trust3Title" as const, descKey: "landing.trust3Desc" as const },
              { icon: "🧾", titleKey: "landing.trust4Title" as const, descKey: "landing.trust4Desc" as const },
            ].map(({ icon, titleKey, descKey }) => (
              <div key={titleKey} className="flex gap-4 p-5 bg-nude-50 rounded-xl border border-line">
                <div className="text-3xl flex-shrink-0">{icon}</div>
                <div>
                  <h3 className="font-semibold text-ink mb-1">{t(titleKey)}</h3>
                  <p className="text-sm text-muted">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <ReviewsSection />

      {/* Partner stylists */}
      {stylists.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-ink mb-3">
                {t("landing.stylistsTitle")}
              </h2>
              <p className="text-muted max-w-xl mx-auto">
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
                    className="group flex flex-col items-center bg-nude-50 rounded-xl border border-line hover:shadow-md hover:border-blush-300 transition-all p-3"
                  >
                    <div className="w-16 h-16 rounded-full bg-nude-100 overflow-hidden ring-2 ring-line mb-2">
                      {s.photo ? (
                        <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-blush-100 flex items-center justify-center text-2xl">💇‍♀️</div>
                      )}
                    </div>
                    <h3 className="text-xs font-semibold text-ink group-hover:text-rose transition-colors text-center">
                      {s.name}
                    </h3>
                    <p className="text-[10px] text-muted mt-0.5">📍 {s.city}</p>
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
      )}

      {/* Trilingual banner */}
      <div className="bg-nude-50 py-3 text-center text-sm text-muted">
        {t("landing.langBanner")}
      </div>

      {/* Final CTA — contact + B2B + links */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-ink mb-3">
            {t("landing.ctaTitle")}
          </h2>
          <p className="text-muted mb-6 max-w-lg mx-auto">
            {t("landing.ctaDesc")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
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
          <div className="border-t border-line pt-6">
            <p className="text-sm text-muted mb-3">{t("landing.b2bTitle")}</p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/pro"
                className="text-sm text-rose hover:text-rose-deep font-medium transition-colors"
              >
                {t("landing.b2bCta")} &rarr;
              </Link>
              <Link
                href="/registrace"
                className="text-sm text-rose hover:text-rose-deep font-medium transition-colors"
              >
                {t("landing.b2bRegister")} &rarr;
              </Link>
              <Link
                href="/kadernice"
                className="text-sm text-rose hover:text-rose-deep font-medium transition-colors"
              >
                {t("landing.ctaHairdressers")} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
