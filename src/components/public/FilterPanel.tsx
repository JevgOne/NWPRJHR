"use client";

import { useTranslations } from "next-intl";
import { getHairColor } from "@/lib/hair-colors";
import { getOriginFlag } from "@/lib/origin-flags";
import { getColorToneInfo } from "@/lib/color-tones";
import { TextureSwatch } from "@/components/TextureSwatch";

interface FilterPanelProps {
  filterOptions: {
    origins: [string, number][];
    lengths: [number, number][];
    colors: [string, number][];
    textures: [string, number][];
    colorTones: [string, number][];
  };
  activeSelling: string;
  activeOrigin: string;
  activeLength: string;
  activeColor: string;
  activeTexture: string;
  activeColorTone: string;
  onSetFilter: (key: string, value: string) => void;
  onToggleFilter: (key: string, value: string) => void;
}

export function FilterPanel({
  filterOptions,
  activeSelling,
  activeOrigin,
  activeLength,
  activeColor,
  activeTexture,
  activeColorTone,
  onSetFilter,
  onToggleFilter,
}: FilterPanelProps) {
  const t = useTranslations("public");

  const colorName = (nameKey: string) => t(`colors.${nameKey}`);
  const originName = (origin: string) => {
    try { return t(`origins.${origin}`); } catch { return origin; }
  };

  return (
    <div className="space-y-4">
      {/* Selling mode toggle */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider self-center mr-1">{t("offer.sellingMode")}</span>
        {[
          { value: "", label: t("offer.allProducts") },
          { value: "BY_GRAM", label: t("offer.byGram") },
          { value: "BY_PIECE", label: t("offer.byPiece") },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onSetFilter("selling", value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeSelling === value
                ? "border-rose bg-blush-100 text-rose-deep"
                : "border-line text-muted hover:bg-nude-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Origins */}
      {filterOptions.origins.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t("offer.originLabel")}</div>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.origins.map(([origin, count]) => (
              <button
                key={origin}
                onClick={() => onToggleFilter("origin", origin)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  activeOrigin === origin
                    ? "border-emerald-400 bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                    : "border-line bg-white text-espresso hover:border-line hover:bg-nude-50"
                }`}
              >
                {getOriginFlag(origin)} {originName(origin)}
                <span className="text-muted ml-0.5">{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lengths */}
      {filterOptions.lengths.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t("offer.lengthLabel")}</div>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.lengths.map(([len, count]) => (
              <button
                key={len}
                onClick={() => onToggleFilter("lengthCm", String(len))}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  activeLength === String(len)
                    ? "border-rose bg-blush-100 text-rose-deep ring-1 ring-blush-300"
                    : "border-line bg-white text-espresso hover:border-line hover:bg-nude-50"
                }`}
              >
                {len} cm
                <span className="text-muted ml-1">{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Colors */}
      {filterOptions.colors.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t("offer.colorLabel")}</div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.colors.map(([code, count]) => {
              const { nameKey } = getHairColor(code);
              const isActive = activeColor === code;
              return (
                <button
                  key={code}
                  onClick={() => onToggleFilter("color", code)}
                  className={`group relative w-9 h-9 rounded-full border-2 overflow-hidden transition-all cursor-pointer ${
                    isActive
                      ? "border-rose ring-2 ring-blush-300 scale-110 z-10"
                      : "border-line hover:border-blush-300 hover:scale-110"
                  }`}
                  title={`${colorName(nameKey)} (${count})`}
                >
                  <span className="block w-full h-full rounded-full" style={{ backgroundColor: getHairColor(code).hex }} />
                  {isActive && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="text-xs font-bold text-white">&#10003;</span>
                    </span>
                  )}
                  <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-0.5 rounded bg-ink text-white text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    {colorName(nameKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Textures */}
      {filterOptions.textures.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t("offer.textureLabel")}</div>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.textures.map(([tex, count]) => (
              <button
                key={tex}
                onClick={() => onToggleFilter("texture", tex)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  activeTexture === tex
                    ? "border-violet-400 bg-violet-100 text-violet-800 ring-1 ring-violet-300"
                    : "border-line bg-white text-espresso hover:border-line hover:bg-nude-50"
                }`}
              >
                <TextureSwatch texture={tex} size={20} />
                {tex}
                <span className="text-muted ml-0.5">{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Tones */}
      {filterOptions.colorTones.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t("offer.colorToneLabel")}</div>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.colorTones.map(([ct, count]) => {
              const info = getColorToneInfo(ct);
              return (
                <button
                  key={ct}
                  onClick={() => onToggleFilter("colorTone", ct)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    activeColorTone === ct
                      ? "border-amber-400 bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                      : "border-line bg-white text-espresso hover:border-line hover:bg-nude-50"
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full inline-block border border-line/50" style={{ backgroundColor: info.hex }} />
                  {ct}
                  <span className="text-muted ml-0.5">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
