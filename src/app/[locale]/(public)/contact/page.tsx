import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { ContactForm } from "./ContactForm";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  return {
    title: t("contactTitle"),
    description: t("contactDescription"),
    alternates: getAlternates("/contact"),
    openGraph: {
      type: "website",
      title: `${t("contactTitle")} | Hairland`,
      description: t("contactDescription"),
      url: "https://www.hairland.cz/contact",
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "https://www.hairland.cz/hero-vzornik.png",
          width: 735,
          height: 707,
          alt: "Hairland — prémiové vlasy k prodloužení",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("contactTitle")} | Hairland`,
      description: t("contactDescription"),
      images: ["https://www.hairland.cz/hero-vzornik.png"],
    },
  };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Hairland",
  url: "https://www.hairland.cz",
  telephone: "+420608553103",
  email: "info@hairland.cz",
  image: "https://www.hairland.cz/icons/icon-512x512.png",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Školská 660/3",
    addressLocality: "Praha",
    postalCode: "110 00",
    addressCountry: "CZ",
  },
  priceRange: "500 Kč - 17 000 Kč",
  description:
    "Prémiové surové vlasy k prodloužení. Zpracování na zakázku — clip-in, tape-in, micro ring. Osobní konzultace, dovoz zdarma po Praze.",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "18:00",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 50.0804,
    longitude: 14.4261,
  },
  hasMap: "https://maps.google.com/?q=Školská+660/3,+Praha",
  currenciesAccepted: "CZK",
  paymentAccepted: "Hotově, Kartou, Převodem",
};

export default async function ContactPage() {
  const t = await getTranslations("public");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs items={[
        { label: t("nav.home"), href: "/" },
        { label: t("nav.contact") },
      ]} />
      <h1 className="text-3xl font-bold text-ink mb-8">
        {t("contact.title")}
      </h1>

      {/* Trust banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-10">
        <div className="flex gap-4 items-start">
          <svg className="w-7 h-7 flex-shrink-0 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
          <div>
            <h2 className="font-semibold text-emerald-900 mb-1">{t("contact.trustTitle")}</h2>
            <p className="text-sm text-emerald-800" dangerouslySetInnerHTML={{ __html: t("contact.trustText") }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact info */}
        <div>
          <h2 className="text-lg font-semibold text-ink mb-4">
            {t("contact.infoTitle")}
          </h2>
          <div className="space-y-3 text-sm text-muted">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-muted flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span>info@hairland.cz</span>
            </div>

            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-muted flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <a href="tel:+420608553103" className="hover:text-ink transition-colors">
                +420 608 553 103
              </a>
            </div>

            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-muted flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>WhatsApp · Telegram</span>
            </div>

            <div className="mt-6 p-4 bg-nude-50 rounded-lg border border-line">
              <p className="font-medium text-ink mb-1">🇨🇿 🇺🇦 🇷🇺 {t("contact.languageBanner")}</p>
              <p className="text-xs text-muted">{t("contact.languageBannerText")}</p>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <ContactForm />
      </div>
    </div>
  );
}
