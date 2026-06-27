"use client";

import { useTranslations } from "next-intl";
import { getHairColor } from "@/lib/hair-colors";

interface ColorCirclesProps {
  colors: string[];
}

export function ColorCircles({ colors }: ColorCirclesProps) {
  const t = useTranslations("public.colors");
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((code) => {
        const { nameKey } = getHairColor(code);
        const name = t(nameKey);
        return (
          <div key={code} className="group relative">
            <div
              className="w-8 h-8 rounded-full border-2 border-line cursor-default transition-transform group-hover:scale-110 overflow-hidden"
              title={`${code} - ${name}`}
            >
              <img src={`/swatches/color-${code}.png`} alt={name} className="w-full h-full object-cover" />
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-espresso text-white text-xs rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
              {code} - {name}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-espresso" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
