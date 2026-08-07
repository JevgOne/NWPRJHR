"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Density = "fine" | "normal" | "thick";
type Method = "clip-in" | "tape-in" | "keratin" | "micro-ring" | "weft";

const OWN_LENGTHS = [10, 15, 20, 25, 30, 35, 40] as const;
const DESIRED_LENGTHS = [30, 35, 40, 45, 50, 55, 60, 65, 70] as const;

const DENSITY_MULTIPLIER: Record<Density, number> = {
  fine: 0.8,
  normal: 1.0,
  thick: 1.25,
};

// Clip-in needs more grams for the same visual effect; tape-in/keratin less
const METHOD_MULTIPLIER: Record<Method, number> = {
  "clip-in": 1.2,
  "tape-in": 0.9,
  keratin: 1.0,
  "micro-ring": 1.0,
  weft: 1.1,
};

// Base grams by extension delta (desired - own length)
function baseGrams(delta: number): number {
  if (delta <= 10) return 80;
  if (delta <= 15) return 100;
  if (delta <= 20) return 120;
  if (delta <= 25) return 140;
  if (delta <= 30) return 160;
  if (delta <= 40) return 180;
  return 200;
}

// Orientační cena za gram (haléře) — mapuje se na kategorie z ceníku
const PRICE_PER_GRAM: Record<string, number> = {
  STANDARD: 5500,
  LUXE: 8500,
  VIRGIN: 11100,
};

function fmtPrice(halere: number): string {
  return Math.round(halere / 100).toLocaleString("cs-CZ");
}

export function GramCalculator() {
  const t = useTranslations("weightGuide.calc");

  const [ownLength, setOwnLength] = useState<number>(25);
  const [desiredLength, setDesiredLength] = useState<number>(45);
  const [density, setDensity] = useState<Density>("normal");
  const [method, setMethod] = useState<Method>("clip-in");

  const result = useMemo(() => {
    const delta = Math.max(desiredLength - ownLength, 5);
    const raw = baseGrams(delta) * DENSITY_MULTIPLIER[density] * METHOD_MULTIPLIER[method];
    // Round to nearest 10
    const grams = Math.round(raw / 10) * 10;
    return {
      grams,
      prices: {
        STANDARD: grams * PRICE_PER_GRAM.STANDARD,
        LUXE: grams * PRICE_PER_GRAM.LUXE,
        VIRGIN: grams * PRICE_PER_GRAM.VIRGIN,
      },
    };
  }, [ownLength, desiredLength, density, method]);

  return (
    <div className="bg-gradient-to-br from-blush-50 to-nude-50 rounded-2xl border border-blush-200/60 p-5 sm:p-7">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-rose/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-ink">
          {t("title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Own hair length */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            {t("ownLength")}
          </label>
          <select
            value={ownLength}
            onChange={(e) => {
              const v = Number(e.target.value);
              setOwnLength(v);
              if (desiredLength <= v) setDesiredLength(v + 10);
            }}
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-rose focus:ring-1 focus:ring-rose/30 outline-none"
          >
            {OWN_LENGTHS.map((l) => (
              <option key={l} value={l}>{l} cm</option>
            ))}
          </select>
        </div>

        {/* Desired length */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            {t("desiredLength")}
          </label>
          <select
            value={desiredLength}
            onChange={(e) => setDesiredLength(Number(e.target.value))}
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-rose focus:ring-1 focus:ring-rose/30 outline-none"
          >
            {DESIRED_LENGTHS.filter((l) => l > ownLength).map((l) => (
              <option key={l} value={l}>{l} cm</option>
            ))}
          </select>
        </div>

        {/* Hair density */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            {t("density")}
          </label>
          <div className="flex gap-2">
            {(["fine", "normal", "thick"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDensity(d)}
                className={`flex-1 rounded-lg border px-2 py-2 text-xs sm:text-sm font-medium transition-all ${
                  density === d
                    ? "border-rose bg-rose/10 text-rose-deep"
                    : "border-line bg-white text-muted hover:border-blush-200"
                }`}
              >
                {t(`density_${d}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Method */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            {t("method")}
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as Method)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-rose focus:ring-1 focus:ring-rose/30 outline-none"
          >
            {(["clip-in", "tape-in", "keratin", "micro-ring", "weft"] as const).map((m) => (
              <option key={m} value={m}>{t(`method_${m}`)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Result */}
      <div className="bg-white rounded-xl border border-line p-5">
        <div className="text-center mb-4">
          <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
            {t("recommended")}
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-rose">
            {result.grams} g
          </div>
          <p className="text-xs text-muted mt-1">
            {t("resultNote")}
          </p>
        </div>

        <div className="border-t border-line pt-4">
          <div className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
            {t("priceEstimate")}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold mb-1">
                Standard
              </div>
              <div className="text-sm font-bold text-ink">
                {fmtPrice(result.prices.STANDARD)} Kč
              </div>
            </div>
            <div className="text-center">
              <div className="inline-block px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[10px] font-semibold mb-1">
                Luxe
              </div>
              <div className="text-sm font-bold text-ink">
                {fmtPrice(result.prices.LUXE)} Kč
              </div>
            </div>
            <div className="text-center">
              <div className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold mb-1">
                Virgin
              </div>
              <div className="text-sm font-bold text-ink">
                {fmtPrice(result.prices.VIRGIN)} Kč
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted text-center mt-2">
            {t("priceNote")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4 pt-4 border-t border-line">
          <Link
            href="/offer"
            className="inline-flex items-center justify-center px-5 py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors w-full sm:w-auto"
          >
            {t("ctaProducts")}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-5 py-2 border border-line text-ink text-sm font-medium rounded-lg hover:bg-nude-100 transition-colors w-full sm:w-auto"
          >
            {t("ctaConsult")}
          </Link>
        </div>
      </div>
    </div>
  );
}
