"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Density = "fine" | "normal" | "thick";
type Method = "clip-in" | "tape-in" | "keratin" | "micro-ring" | "weft";

interface PriceCategory {
  category: string;
  avgPricePerGram: number;
}

interface GramageCalculatorProps {
  priceData: PriceCategory[];
}

const OWN_LENGTHS = [10, 15, 20, 25, 30, 35, 40, 45, 50] as const;
const DESIRED_LENGTHS = [30, 35, 40, 45, 50, 55, 60, 65, 70] as const;

const DENSITY_MULTIPLIER: Record<Density, number> = {
  fine: 0.75,
  normal: 1.0,
  thick: 1.3,
};

const METHOD_MULTIPLIER: Record<Method, number> = {
  "clip-in": 1.2,
  "tape-in": 1.0,
  keratin: 0.95,
  "micro-ring": 0.95,
  weft: 1.1,
};

const CATEGORY_STYLES: Record<string, { pill: string }> = {
  STANDARD: { pill: "bg-emerald-100 text-emerald-800" },
  LUXE: { pill: "bg-violet-100 text-violet-800" },
  VIRGIN: { pill: "bg-amber-100 text-amber-800" },
};

const CATEGORY_LABELS: Record<string, string> = {
  STANDARD: "Standard",
  LUXE: "Luxe",
  VIRGIN: "Virgin",
};

function calculateGrams(
  ownLength: number,
  desiredLength: number,
  density: Density,
  method: Method,
): { min: number; max: number; recommended: number } {
  const extensionLength = desiredLength - ownLength;
  const baseLengthGrams = 80 + (extensionLength / 10) * 40;

  const base = baseLengthGrams * DENSITY_MULTIPLIER[density] * METHOD_MULTIPLIER[method];
  const recommended = Math.round(base / 10) * 10;
  const min = Math.round((base * 0.85) / 10) * 10;
  const max = Math.round((base * 1.15) / 10) * 10;

  return {
    min: Math.max(80, Math.min(min, 300)),
    max: Math.max(100, Math.min(max, 350)),
    recommended: Math.max(100, Math.min(recommended, 300)),
  };
}

function fmtPrice(halere: number): string {
  return Math.round(halere / 100).toLocaleString("cs-CZ");
}

export function GramageCalculator({ priceData }: GramageCalculatorProps) {
  const t = useTranslations("weightGuide");

  const [ownLength, setOwnLength] = useState<number>(25);
  const [desiredLength, setDesiredLength] = useState<number>(45);
  const [density, setDensity] = useState<Density>("normal");
  const [method, setMethod] = useState<Method>("clip-in");

  const isValid = desiredLength > ownLength;

  const result = useMemo(() => {
    if (!isValid) return null;
    return calculateGrams(ownLength, desiredLength, density, method);
  }, [ownLength, desiredLength, density, method, isValid]);

  return (
    <div className="bg-gradient-to-br from-blush-50 to-nude-50 rounded-2xl border border-blush-200/60 p-5 sm:p-7">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-rose/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-ink">
          {t("calcTitle")}
        </h2>
      </div>
      <p className="text-sm text-muted mb-5 ml-12">
        {t("calcSubtitle")}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Own hair length */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            {t("calcOwnLength")}
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
              <option key={l} value={l}>{t("calcCm", { value: l })}</option>
            ))}
          </select>
        </div>

        {/* Desired length */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            {t("calcDesiredLength")}
          </label>
          <select
            value={desiredLength}
            onChange={(e) => setDesiredLength(Number(e.target.value))}
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-rose focus:ring-1 focus:ring-rose/30 outline-none"
          >
            {DESIRED_LENGTHS.filter((l) => l > ownLength).map((l) => (
              <option key={l} value={l}>{t("calcCm", { value: l })}</option>
            ))}
          </select>
        </div>

        {/* Hair density */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            {t("calcDensity")}
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
                {t(`calcDensity${d.charAt(0).toUpperCase() + d.slice(1)}` as "calcDensityFine")}
              </button>
            ))}
          </div>
        </div>

        {/* Method */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            {t("calcMethod")}
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as Method)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-rose focus:ring-1 focus:ring-rose/30 outline-none"
          >
            <option value="clip-in">{t("calcMethodClipIn")}</option>
            <option value="tape-in">{t("calcMethodTapeIn")}</option>
            <option value="keratin">{t("calcMethodKeratin")}</option>
            <option value="micro-ring">{t("calcMethodMicroRing")}</option>
            <option value="weft">{t("calcMethodWeft")}</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {!isValid && (
        <div className="bg-rose/5 border border-rose/20 rounded-xl p-4 text-center text-sm text-rose-deep">
          {t("calcErrorLength")}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl border border-line p-5">
          <div className="text-center mb-4">
            <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
              {t("calcResult")}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-muted mb-1">
              {t("calcRange", { min: result.min, max: result.max })}
            </div>
            <div className="text-sm font-medium text-ink">
              {t("calcRecommended")}: <span className="text-xl font-bold text-rose">{result.recommended} g</span>
            </div>
          </div>

          {priceData.length > 0 && (
            <div className="border-t border-line pt-4">
              <div className="grid grid-cols-3 gap-3">
                {priceData.map(({ category, avgPricePerGram }) => {
                  const style = CATEGORY_STYLES[category];
                  const label = CATEGORY_LABELS[category] ?? category;
                  const price = result.recommended * avgPricePerGram;
                  return (
                    <div key={category} className="text-center">
                      <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1 ${style?.pill ?? "bg-gray-100 text-gray-800"}`}>
                        {label}
                      </div>
                      <div className="text-sm font-bold text-ink">
                        {t("calcPriceFrom", { price: fmtPrice(price) })}
                      </div>
                      <div className="text-[10px] text-muted">
                        {t("calcPriceFor", { grams: result.recommended })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-[10px] text-muted text-center mt-3">
            {t("calcNote")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4 pt-4 border-t border-line">
            <Link
              href="/vlasy-k-prodlouzeni"
              className="inline-flex items-center justify-center px-5 py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose-deep transition-colors w-full sm:w-auto"
            >
              {t("calcCta")}
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-5 py-2 border border-line text-ink text-sm font-medium rounded-lg hover:bg-nude-100 transition-colors w-full sm:w-auto"
            >
              {t("calcCtaConsult")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
