import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { HeroProductSlider } from "@/components/public/HeroProductSlider";
import { ReviewsSection } from "@/components/public/ReviewsSection";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const BLOB = "https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/hair";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HairSalon",
  name: "Hairland",
  url: "https://www.hairland.cz",
  description:
    "Prémiové přírodní vlasy k prodloužení — clip-in, tape-in, micro ring",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Praha",
    addressCountry: "CZ",
  },
  email: "info@hairland.cz",
  sameAs: ["https://www.instagram.com/hairland.cz"],
};

export default async function LandingPage() {
  const t = await getTranslations("public");
  const tCategory = await getTranslations("category");

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-200 border-2 border-white ring-1 ring-line overflow-hidden">
                  <img src={`/swatches/color-${code}.png`} alt={t(nameKey)} className="w-full h-full object-cover" />
                </div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-blush-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
                1️⃣
              </div>
              <h3 className="font-semibold text-ink mb-1 text-sm">{t("landing.step1Title")}</h3>
              <p className="text-xs text-muted">
                {t("landing.step1Desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-blush-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
                2️⃣
              </div>
              <h3 className="font-semibold text-ink mb-1 text-sm">{t("landing.step2Title")}</h3>
              <p className="text-xs text-muted">
                {t("landing.step2Desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-blush-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
                3️⃣
              </div>
              <h3 className="font-semibold text-ink mb-1 text-sm">{t("landing.step3Title")}</h3>
              <p className="text-xs text-muted">
                {t("landing.step3Desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-blush-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
                4️⃣
              </div>
              <h3 className="font-semibold text-ink mb-1 text-sm">{t("landing.step4Title")}</h3>
              <p className="text-xs text-muted">
                {t("landing.step4Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ink text-center mb-3">
            {t("landing.trustTitle")}
          </h2>
          <p className="text-muted text-center mb-10 max-w-xl mx-auto">
            {t("landing.trustSubtitle")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4 p-5 bg-nude-50 rounded-xl border border-line">
              <div className="text-3xl flex-shrink-0">🤝</div>
              <div>
                <h3 className="font-semibold text-ink mb-1">{t("landing.trust1Title")}</h3>
                <p className="text-sm text-muted">
                  {t("landing.trust1Desc")}
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-nude-50 rounded-xl border border-line">
              <div className="text-3xl flex-shrink-0">✋</div>
              <div>
                <h3 className="font-semibold text-ink mb-1">{t("landing.trust2Title")}</h3>
                <p className="text-sm text-muted">
                  {t("landing.trust2Desc")}
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-nude-50 rounded-xl border border-line">
              <div className="text-3xl flex-shrink-0">🚗</div>
              <div>
                <h3 className="font-semibold text-ink mb-1">{t("landing.trust3Title")}</h3>
                <p className="text-sm text-muted">
                  {t("landing.trust3Desc")}
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-nude-50 rounded-xl border border-line">
              <div className="text-3xl flex-shrink-0">⏰</div>
              <div>
                <h3 className="font-semibold text-ink mb-1">{t("landing.trust4Title")}</h3>
                <p className="text-sm text-muted">
                  {t("landing.trust4Desc")}
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-nude-50 rounded-xl border border-line">
              <div className="text-3xl flex-shrink-0">🌍</div>
              <div>
                <h3 className="font-semibold text-ink mb-1">{t("landing.trust5Title")}</h3>
                <p className="text-sm text-muted">
                  {t("landing.trust5Desc")}
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-nude-50 rounded-xl border border-line">
              <div className="text-3xl flex-shrink-0">🧾</div>
              <div>
                <h3 className="font-semibold text-ink mb-1">{t("landing.trust6Title")}</h3>
                <p className="text-sm text-muted">
                  {t("landing.trust6Desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <ReviewsSection />

      {/* Trilingual support */}
      <section className="py-12 bg-nude-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-3 text-4xl mb-4">
            <span>🇨🇿</span><span>🇺🇦</span><span>🇷🇺</span>
          </div>
          <h3 className="text-lg font-semibold text-ink mb-2">{t("landing.langTitle")}</h3>
          <p className="text-sm text-muted max-w-lg mx-auto">
            {t("landing.langDesc")}
          </p>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-ink mb-3">
            {t("landing.ctaTitle")}
          </h2>
          <p className="text-muted mb-6 max-w-lg mx-auto">
            {t("landing.ctaDesc")}
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/contact"
              className="px-6 py-3 bg-rose hover:bg-rose-deep text-white font-medium rounded-lg transition-colors"
            >
              {t("landing.ctaContact")}
            </Link>
            <Link
              href="/kadernice"
              className="px-6 py-3 bg-white text-rose border border-blush-200 hover:bg-blush-100 font-medium rounded-lg transition-colors"
            >
              {t("landing.ctaHairdressers")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
