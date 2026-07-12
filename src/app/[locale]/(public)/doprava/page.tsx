import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getTranslations, getLocale } from "next-intl/server";
import { getAlternates, OG_LOCALES } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("metadata"), getLocale()]);
  return {
    title: t("dopravaTitle"),
    description: t("dopravaDescription"),
    alternates: getAlternates("/doprava"),
    openGraph: {
      type: "website",
      title: `${t("dopravaTitle")} | Hairland`,
      description: t("dopravaDescription"),
      url: "https://www.hairland.cz/doprava",
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
      title: `${t("dopravaTitle")} | Hairland`,
      description: t("dopravaDescription"),
      images: ["https://www.hairland.cz/hero-vzornik.png"],
    },
  };
}

const shippingJsonLd = {
  "@context": "https://schema.org",
  "@type": "OfferShippingDetails",
  shippingRate: [
    {
      "@type": "MonetaryAmount",
      value: "0",
      currency: "CZK",
      description: "Osobní doručení po Praze zdarma",
    },
    {
      "@type": "MonetaryAmount",
      value: "99",
      currency: "CZK",
      description: "Česká pošta — zbytek ČR",
    },
  ],
  shippingDestination: {
    "@type": "DefinedRegion",
    addressCountry: "CZ",
  },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: {
      "@type": "QuantitativeValue",
      minValue: 0,
      maxValue: 1,
      unitCode: "DAY",
    },
    transitTime: {
      "@type": "QuantitativeValue",
      minValue: 0,
      maxValue: 3,
      unitCode: "DAY",
    },
  },
};

export default async function DopravaPage() {
  const t = await getTranslations("shipping");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(shippingJsonLd) }}
      />
      <Breadcrumbs items={[
        { label: t("home"), href: "/" },
        { label: t("breadcrumb") },
      ]} />

      <h1 className="text-3xl font-bold text-ink mb-8">{t("title")}</h1>

      {/* Delivery options */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-ink mb-4">
          {t("deliveryOptions")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-lg font-bold text-ink mb-1">{t("free")}</div>
            <div className="text-sm font-medium text-rose mb-2">
              {t("personalDelivery")}
            </div>
            <p className="text-sm text-muted">
              {t("personalDeliveryDesc")}
            </p>
          </div>
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-lg font-bold text-ink mb-1">{t("czechPostPrice")}</div>
            <div className="text-sm font-medium text-rose mb-2">
              {t("czechPost")}
            </div>
            <p className="text-sm text-muted">
              {t("czechPostDesc")}
            </p>
          </div>
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-lg font-bold text-ink mb-1">{t("free")}</div>
            <div className="text-sm font-medium text-rose mb-2">
              {t("personalPickup")}
            </div>
            <p className="text-sm text-muted">
              {t("personalPickupDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Delivery times */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-ink mb-4">{t("deliveryTimes")}</h2>
        <div className="bg-nude-50 rounded-xl border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left p-3 font-medium text-muted">
                  {t("methodHeader")}
                </th>
                <th className="text-left p-3 font-medium text-muted">
                  {t("timeHeader")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <td className="p-3 text-ink">{t("personalDelivery")}</td>
                <td className="p-3 text-ink">{t("sameDay")}</td>
              </tr>
              <tr className="border-b border-line">
                <td className="p-3 text-ink">{t("czechPostSimple")}</td>
                <td className="p-3 text-ink">{t("twoThreeDays")}</td>
              </tr>
              <tr>
                <td className="p-3 text-ink">{t("personalPickupSimple")}</td>
                <td className="p-3 text-ink">{t("byArrangement")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Returns */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-ink mb-4">
          {t("returnsTitle")}
        </h2>
        <div className="bg-nude-50 rounded-xl border border-line p-5 space-y-3">
          <p
            className="text-sm text-muted"
            dangerouslySetInnerHTML={{ __html: t("returnsPeriod") }}
          />
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="text-rose mt-0.5">&#10003;</span>
              {t("returnsCondition1")}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose mt-0.5">&#10003;</span>
              {t("returnsCondition2")}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose mt-0.5">&#10003;</span>
              {t("returnsCondition3")}
            </li>
          </ul>
          <p className="text-xs text-muted">
            {t("returnsMore")}{" "}
            <Link
              href="/obchodni-podminky"
              className="text-rose hover:text-rose-deep underline"
            >
              {t("termsLink")}
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Payment */}
      <section>
        <h2 className="text-xl font-semibold text-ink mb-4">
          {t("paymentTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-sm font-semibold text-ink mb-1">{t("cash")}</div>
            <p className="text-sm text-muted">
              {t("cashDesc")}
            </p>
          </div>
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-sm font-semibold text-ink mb-1">
              {t("card")}
            </div>
            <p className="text-sm text-muted">
              {t("cardDesc")}
            </p>
          </div>
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-sm font-semibold text-ink mb-1">
              {t("bankTransfer")}
            </div>
            <p className="text-sm text-muted">
              {t("bankTransferDesc")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
