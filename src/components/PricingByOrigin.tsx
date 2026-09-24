"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";

const ORIGIN_FLAGS: Record<string, string> = {
  "Írán": "\u{1F1EE}\u{1F1F7}",
  "Vietnam": "\u{1F1FB}\u{1F1F3}",
  "Indie": "\u{1F1EE}\u{1F1F3}",
  "Ukrajina": "\u{1F1FA}\u{1F1E6}",
  "Turecko": "\u{1F1F9}\u{1F1F7}",
  "Čína": "\u{1F1E8}\u{1F1F3}",
  "Mongolsko": "\u{1F1F2}\u{1F1F3}",
  "Gruzie": "\u{1F1EC}\u{1F1EA}",
  "Sýrie": "\u{1F1F8}\u{1F1FE}",
  "Rusko": "\u{1F1F7}\u{1F1FA}",
  "Kazachstán": "\u{1F1F0}\u{1F1FF}",
  "Uzbekistán": "\u{1F1FA}\u{1F1FF}",
  "Bělorusko": "\u{1F1E7}\u{1F1FE}",
  "Moldavsko": "\u{1F1F2}\u{1F1E9}",
};


export interface OriginPriceRow {
  lengthCm: number;
  naturalPrice: number | null;  // price per 100g for natural hair
  coloredPrice: number | null;  // price per 100g for colored/blond hair
}

export interface OriginData {
  origin: string;
  displayName: string;  // localized: "Íránské vlasy" / "Іранське волосся"
  texture: string | null;
  coloredColumnLabel: string;  // localized: "Barvené vlasy" / "Blond vlasy"
  rows: OriginPriceRow[];
  minPrice: number;
}

export interface PricingLabels {
  premiumQuality: string;
  length: string;
  naturalHair: string;
  pricePer100g: string;
  priceSubtitle: string; // "Ceník za 100 g"
  footerNote: string;
}

interface Props {
  origins: OriginData[];
  cenikHref: string;
  cenikLabel: string;
  labels: PricingLabels;
}

function fmtPrice(price: number): string {
  return Math.round(price).toLocaleString("cs-CZ");
}

export function PricingByOrigin({ origins, cenikHref, cenikLabel, labels }: Props) {
  const [selected, setSelected] = useState(origins[0]?.origin ?? "");

  if (origins.length === 0) return null;

  const current = origins.find((o) => o.origin === selected) ?? origins[0];
  const hasNatural = current.rows.some((r) => r.naturalPrice !== null);
  const hasColored = current.rows.some((r) => r.coloredPrice !== null);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {origins.map((o) => (
          <button
            key={o.origin}
            onClick={() => setSelected(o.origin)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              selected === o.origin
                ? "bg-espresso text-white shadow-sm"
                : "bg-white border border-line text-espresso hover:bg-nude-100"
            }`}
          >
            <span className="text-base leading-none">{ORIGIN_FLAGS[o.origin] ?? ""}</span>
            <span>{o.origin}</span>
          </button>
        ))}
      </div>

      {/* Price card for selected origin */}
      <div className="bg-white rounded-2xl border border-nude-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-espresso to-espresso/90 px-6 py-5 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold mb-1">
            {labels.premiumQuality}
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            {current.displayName}
          </h3>
          <p className="text-sm text-white/70 italic mt-0.5">
            {labels.priceSubtitle}{current.texture ? ` — ${current.texture.toLowerCase()}` : ""}
          </p>
        </div>

        {/* Price table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="bg-nude-100 text-left py-2.5 px-4 text-xs font-semibold text-espresso/60 uppercase tracking-wider w-[100px]">
                  {labels.length}
                </th>
                {hasNatural && (
                  <th className="bg-espresso/90 text-center py-2.5 px-4 text-xs font-semibold text-white uppercase tracking-wider">
                    {labels.naturalHair}
                    <span className="block text-[10px] font-normal text-white/60 normal-case tracking-normal mt-0.5">
                      {labels.pricePer100g}
                    </span>
                  </th>
                )}
                {hasColored && (
                  <th className="bg-gold/90 text-center py-2.5 px-4 text-xs font-semibold text-white uppercase tracking-wider">
                    {current.coloredColumnLabel}
                    <span className="block text-[10px] font-normal text-white/60 normal-case tracking-normal mt-0.5">
                      {labels.pricePer100g}
                    </span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {current.rows.map((row, i) => (
                <tr
                  key={row.lengthCm}
                  className={i % 2 === 0 ? "bg-white" : "bg-nude-50/50"}
                >
                  <td className="py-3 px-4 font-medium text-espresso">
                    {row.lengthCm} cm
                  </td>
                  {hasNatural && (
                    <td className="py-3 px-4 text-center font-bold text-ink">
                      {row.naturalPrice !== null
                        ? `${fmtPrice(row.naturalPrice)} Kč`
                        : "—"}
                    </td>
                  )}
                  {hasColored && (
                    <td className="py-3 px-4 text-center font-bold text-ink">
                      {row.coloredPrice !== null
                        ? `${fmtPrice(row.coloredPrice)} Kč`
                        : "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-nude-50/50 border-t border-nude-200">
          <p className="text-xs text-muted">
            {labels.footerNote}
          </p>
          <div className="text-center mt-3">
            <Link href={cenikHref as any} className="inline-flex items-center text-sm text-rose font-medium hover:text-rose-deep transition-colors">
              {cenikLabel} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
