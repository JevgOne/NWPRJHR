import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { ContactForm } from "./ContactForm";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getAlternates, getOgUrl, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  return {
    title: t("contactTitle"),
    description: t("contactDescription"),
    alternates: getAlternates("/kontakt", locale),
    openGraph: {
      type: "website",
      title: `${t("contactTitle")} | Hairland`,
      description: t("contactDescription"),
      url: getOgUrl("/kontakt", locale),
      siteName: "Hairland",
      locale: OG_LOCALES[locale] ?? "cs_CZ",
      images: [
        {
          url: "https://www.hairland.cz/og/og-contact.jpg",
          width: 1200,
          height: 630,
          alt: t("contactTitle"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("contactTitle")} | Hairland`,
      description: t("contactDescription"),
      images: ["https://www.hairland.cz/og/og-contact.jpg"],
    },
  };
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const [t, sp] = await Promise.all([getTranslations("public"), searchParams]);

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
    description: t("contact.jsonLdDescription"),
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
    paymentAccepted: t("contact.paymentAccepted"),
  };

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

            <div className="flex items-center gap-4">
              <a href="https://wa.me/420608553103" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-ink transition-colors">
                <svg className="w-5 h-5 flex-shrink-0 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span>WhatsApp</span>
              </a>
              <span className="text-line">·</span>
              <a href="https://t.me/hairland_cz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-ink transition-colors">
                <svg className="w-5 h-5 flex-shrink-0 text-sky-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                <span>Telegram</span>
              </a>
            </div>

            <div className="mt-6 p-4 bg-nude-50 rounded-lg border border-line">
              <p className="font-medium text-ink mb-1">🇨🇿 🇺🇦 🇷🇺 {t("contact.languageBanner")}</p>
              <p className="text-xs text-muted">{t("contact.languageBannerText")}</p>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <ContactForm reason={sp.reason} />
      </div>
    </div>
  );
}
