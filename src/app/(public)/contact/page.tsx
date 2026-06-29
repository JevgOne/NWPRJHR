import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontaktujte nás — prémiové vlasy k prodloužení, osobní konzultace v Praze. Dovoz zdarma po Praze.",
  alternates: { canonical: "/contact" },
};

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
};

export default async function ContactPage() {
  const t = await getTranslations("public");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="text-3xl font-bold text-ink mb-8">
        {t("contact.title")}
      </h1>

      {/* Trust banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-10">
        <div className="flex gap-4 items-start">
          <div className="text-3xl flex-shrink-0">🚗</div>
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
