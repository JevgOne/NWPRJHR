"use client";

import { getHairColor } from "@/lib/hair-colors";

interface ColorCirclesProps {
  colors: string[];
}

export function ColorCircles({ colors }: ColorCirclesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((code) => {
        const { hex, name } = getHairColor(code);
        return (
          <div key={code} className="group relative">
            <div
              className="w-8 h-8 rounded-full border-2 border-line cursor-default transition-transform group-hover:scale-110"
              style={{ backgroundColor: hex }}
              title={`${code} - ${name}`}
            />
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
