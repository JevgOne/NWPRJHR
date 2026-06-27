"use client";

/**
 * Visual hair texture swatch — SVG lines inside a circle/box,
 * colored according to the product's tone/color.
 *
 * Patterns:
 *  straight     — vertical straight lines  ||||
 *  slightlyWavy — gentle sine waves
 *  wavy         — pronounced S-curves
 *  curly        — tight spiral curls
 */

import { useId } from "react";
import { getTextureInfo } from "@/lib/hair-textures";
import { getToneInfo } from "@/lib/hair-tones";

interface TextureSwatchProps {
  texture: string;
  /** Hex color for the hair strands — falls back to tone hex or neutral brown */
  color?: string;
  /** Tone name to derive color from if color not given */
  tone?: string | null;
  /** Size in pixels (default 28) */
  size?: number;
  /** Additional className */
  className?: string;
  /** Show label text next to swatch */
  showLabel?: boolean;
}

// SVG path generators for each texture pattern (5 strands)
function straightPaths(w: number, h: number): string[] {
  const pad = w * 0.22;
  const top = h * 0.18;
  const bot = h * 0.82;
  const gap = (w - 2 * pad) / 4;
  return Array.from({ length: 5 }, (_, i) => {
    const x = pad + i * gap;
    return `M${x.toFixed(1)} ${top.toFixed(1)} L${x.toFixed(1)} ${bot.toFixed(1)}`;
  });
}

function slightlyWavyPaths(w: number, h: number): string[] {
  const pad = w * 0.22;
  const top = h * 0.18;
  const bot = h * 0.82;
  const gap = (w - 2 * pad) / 4;
  const amp = w * 0.04;
  const segH = (bot - top) / 4;
  return Array.from({ length: 5 }, (_, i) => {
    const x = pad + i * gap;
    let d = `M${x.toFixed(1)} ${top.toFixed(1)}`;
    for (let s = 0; s < 4; s++) {
      const dir = s % 2 === 0 ? 1 : -1;
      const y1 = top + s * segH;
      const y2 = top + (s + 1) * segH;
      const cy = (y1 + y2) / 2;
      d += ` Q${(x + dir * amp).toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y2.toFixed(1)}`;
    }
    return d;
  });
}

function wavyPaths(w: number, h: number): string[] {
  const pad = w * 0.22;
  const top = h * 0.18;
  const bot = h * 0.82;
  const gap = (w - 2 * pad) / 4;
  const amp = w * 0.08;
  const segH = (bot - top) / 4;
  return Array.from({ length: 5 }, (_, i) => {
    const x = pad + i * gap;
    let d = `M${x.toFixed(1)} ${top.toFixed(1)}`;
    for (let s = 0; s < 4; s++) {
      const dir = s % 2 === 0 ? 1 : -1;
      const y1 = top + s * segH;
      const y2 = top + (s + 1) * segH;
      const cy = (y1 + y2) / 2;
      d += ` Q${(x + dir * amp).toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y2.toFixed(1)}`;
    }
    return d;
  });
}

function curlyPaths(w: number, h: number): string[] {
  const pad = w * 0.22;
  const top = h * 0.18;
  const bot = h * 0.82;
  const gap = (w - 2 * pad) / 4;
  const amp = w * 0.10;
  const segH = (bot - top) / 6;
  return Array.from({ length: 5 }, (_, i) => {
    const x = pad + i * gap;
    let d = `M${x.toFixed(1)} ${top.toFixed(1)}`;
    for (let s = 0; s < 6; s++) {
      const dir = s % 2 === 0 ? 1 : -1;
      const y1 = top + s * segH;
      const y2 = top + (s + 1) * segH;
      const cy = (y1 + y2) / 2;
      d += ` Q${(x + dir * amp).toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y2.toFixed(1)}`;
    }
    return d;
  });
}

function getPathsForTexture(nameKey: string, w: number, h: number): string[] {
  switch (nameKey) {
    case "straight":
      return straightPaths(w, h);
    case "slightlyWavy":
      return slightlyWavyPaths(w, h);
    case "wavy":
      return wavyPaths(w, h);
    case "curly":
      return curlyPaths(w, h);
    default:
      return wavyPaths(w, h);
  }
}

export function TextureSwatch({
  texture,
  color,
  tone,
  size = 28,
  className = "",
  showLabel = false,
}: TextureSwatchProps) {
  const clipId = useId();
  const info = getTextureInfo(texture);
  // Determine strand color: explicit color > tone hex > neutral brown
  const strandColor =
    color || (tone ? getToneInfo(tone).hex : "#7A5230");
  const paths = getPathsForTexture(info.nameKey, size, size);
  const strokeW = Math.max(1.2, size * 0.06);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="flex-shrink-0"
        aria-label={texture}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 0.5}
          fill="#FFF9F5"
          stroke="#E5DDD5"
          strokeWidth={1}
        />
        {/* Clip to circle */}
        <defs>
          <clipPath id={clipId}>
            <circle cx={size / 2} cy={size / 2} r={size / 2 - 1.5} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {paths.map((d, i) => (
            <path
              key={i}
              d={d}
              stroke={strandColor}
              strokeWidth={strokeW}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </g>
      </svg>
      {showLabel && (
        <span className="text-xs font-medium text-ink">{texture}</span>
      )}
    </span>
  );
}
