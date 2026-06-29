import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Doprava a vrácení — doručení vlasů po celé ČR",
  description:
    "Doprava zdarma po Praze, Česká pošta 99 Kč, osobní odběr. 14denní právo na vrácení. Platba hotově, kartou i převodem.",
  alternates: { canonical: "/doprava" },
  openGraph: {
    type: "website",
    title: "Doprava a vrácení — doručení vlasů po celé ČR | Hairland",
    description:
      "Doprava zdarma po Praze, Česká pošta 99 Kč, osobní odběr. 14denní právo na vrácení. Platba hotově, kartou i převodem.",
    url: "https://www.hairland.cz/doprava",
    siteName: "Hairland",
    locale: "cs_CZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "Doprava a vrácení — doručení vlasů po celé ČR | Hairland",
    description:
      "Doprava zdarma po Praze, Česká pošta 99 Kč, osobní odběr. 14denní právo na vrácení. Platba hotově, kartou i převodem.",
  },
};

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

export default function DopravaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(shippingJsonLd) }}
      />

      <h1 className="text-3xl font-bold text-ink mb-8">Doprava a vrácení</h1>

      {/* Delivery options */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-ink mb-4">
          Možnosti doručení
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-lg font-bold text-ink mb-1">Zdarma</div>
            <div className="text-sm font-medium text-rose mb-2">
              Osobní doručení — Praha
            </div>
            <p className="text-sm text-muted">
              Doručíme vám vlasy osobně kamkoli po Praze. Možnost doručení ve
              stejný den.
            </p>
          </div>
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-lg font-bold text-ink mb-1">99 Kč</div>
            <div className="text-sm font-medium text-rose mb-2">
              Česká pošta — celá ČR
            </div>
            <p className="text-sm text-muted">
              Balíček Českou poštou. Dodání během 2–3 pracovních dnů.
            </p>
          </div>
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-lg font-bold text-ink mb-1">Zdarma</div>
            <div className="text-sm font-medium text-rose mb-2">
              Osobní odběr — Praha
            </div>
            <p className="text-sm text-muted">
              Vyzvedněte si objednávku osobně po domluvě. Možnost konzultace na
              místě.
            </p>
          </div>
        </div>
      </section>

      {/* Delivery times */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-ink mb-4">Doba doručení</h2>
        <div className="bg-nude-50 rounded-xl border border-line overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left p-3 font-medium text-muted">
                  Způsob
                </th>
                <th className="text-left p-3 font-medium text-muted">
                  Doba doručení
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <td className="p-3 text-ink">Osobní doručení — Praha</td>
                <td className="p-3 text-ink">Stejný den</td>
              </tr>
              <tr className="border-b border-line">
                <td className="p-3 text-ink">Česká pošta</td>
                <td className="p-3 text-ink">2–3 pracovní dny</td>
              </tr>
              <tr>
                <td className="p-3 text-ink">Osobní odběr</td>
                <td className="p-3 text-ink">Po domluvě</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Returns */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-ink mb-4">
          Vrácení a reklamace
        </h2>
        <div className="bg-nude-50 rounded-xl border border-line p-5 space-y-3">
          <p className="text-sm text-muted">
            Máte právo vrátit zboží do <strong className="text-ink">14 dnů</strong> od
            převzetí bez udání důvodu.
          </p>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="text-rose mt-0.5">&#10003;</span>
              Vlasy musí být nepoužité, nepoškozené a v původním obalu.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose mt-0.5">&#10003;</span>
              Kontaktujte nás e-mailem nebo telefonicky pro domluvení vrácení.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose mt-0.5">&#10003;</span>
              Peníze vrátíme do 14 dnů od přijetí vraceného zboží.
            </li>
          </ul>
          <p className="text-xs text-muted">
            Podrobnosti naleznete v{" "}
            <Link
              href="/obchodni-podminky"
              className="text-rose hover:text-rose-deep underline"
            >
              obchodních podmínkách
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Payment */}
      <section>
        <h2 className="text-xl font-semibold text-ink mb-4">
          Způsoby platby
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-sm font-semibold text-ink mb-1">Hotovost</div>
            <p className="text-sm text-muted">
              Platba hotově při osobním doručení nebo odběru.
            </p>
          </div>
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-sm font-semibold text-ink mb-1">
              Platba kartou
            </div>
            <p className="text-sm text-muted">
              Přijímáme platební karty Visa, Mastercard.
            </p>
          </div>
          <div className="bg-nude-50 rounded-xl border border-line p-5">
            <div className="text-sm font-semibold text-ink mb-1">
              Bankovní převod
            </div>
            <p className="text-sm text-muted">
              Platba předem na účet. Údaje obdržíte v potvrzení objednávky.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
