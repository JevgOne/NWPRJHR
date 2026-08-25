import { ImageResponse } from "next/og";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { getHairColor } from "@/lib/hair-colors";

/** Simple Czech color labels for OG images (no i18n context available) */
const COLOR_LABELS: Record<string, string> = {
  c1: "platinová blond",
  c2: "světlá blond",
  c3: "tmavá blond",
  c4: "světle hnědá",
  c5: "hnědá",
  c6: "tmavě hnědá",
  c7: "čokoládová",
  c8: "tmavá",
  c9: "černá",
  c10: "černá",
  combre: "ombré",
  other: "jiná",
};

export const runtime = "nodejs";
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  VIRGIN: { bg: "#fef3c7", text: "#92400e", label: "VIRGIN" },
  LUXE: { bg: "#ede9fe", text: "#5b21b6", label: "LUXE" },
  STANDARD: { bg: "#d1fae5", text: "#065f46", label: "STANDARD" },
  SALE: { bg: "#ffe4e6", text: "#9f1239", label: "SALE" },
};

async function getProductData(slugOrId: string) {
  const product = await prisma.product.findFirst({
    where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
    select: {
      name: true,
      category: true,
      texture: true,
      origin: true,
      photos: true,
      ogImage: true,
      variants: {
        where: { active: true },
        select: {
          lengthCm: true,
          color: true,
          retailPricePerGram: true,
          sellingMode: true,
          retailPricePerPiece: true,
        },
      },
    },
  });
  if (!product) return null;
  return {
    ...product,
    photos: JSON.parse(product.photos || "[]") as string[],
  };
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  // Only generate for single-segment (product detail), not attribute pages
  if (slug.length !== 1) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#faf8f6",
            fontFamily: "Inter",
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 700, color: "#3a2c2a" }}>
            Hairland
          </div>
        </div>
      ),
      { ...size }
    );
  }

  const product = await getProductData(slug[0]);

  // Fallback if product not found
  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#faf8f6",
            fontFamily: "Inter",
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 700, color: "#3a2c2a" }}>
            Hairland
          </div>
        </div>
      ),
      { ...size }
    );
  }

  const [interBold, interRegular] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/Inter-Bold.ttf")),
    readFile(join(process.cwd(), "public/fonts/Inter-Regular.ttf")),
  ]);

  // Derive product info
  const lengths = [...new Set(product.variants.map((v) => v.lengthCm))].sort(
    (a, b) => a - b
  );
  const lengthStr =
    lengths.length > 0
      ? lengths.length <= 3
        ? lengths.map((l) => `${l} cm`).join(", ")
        : `${lengths[0]}–${lengths[lengths.length - 1]} cm`
      : "";

  const colorCodes = [...new Set(product.variants.map((v) => v.color))];
  const colorNames = colorCodes
    .slice(0, 3)
    .map((c) => COLOR_LABELS[getHairColor(c).nameKey] ?? c);

  const gramPrices = product.variants
    .filter((v) => v.sellingMode !== "BY_PIECE" && v.retailPricePerGram > 0)
    .map((v) => v.retailPricePerGram);
  const minPpg =
    gramPrices.length > 0 ? Math.round(Math.min(...gramPrices) / 100) : null;

  const piecePrices = product.variants
    .filter(
      (v) => v.sellingMode === "BY_PIECE" && (v.retailPricePerPiece ?? 0) > 0
    )
    .map((v) => v.retailPricePerPiece!);
  const minPiecePrice =
    piecePrices.length > 0
      ? Math.round(Math.min(...piecePrices) / 100)
      : null;

  const priceStr = minPpg
    ? `od ${minPpg} Kč/g`
    : minPiecePrice
      ? `od ${minPiecePrice.toLocaleString("cs-CZ")} Kč`
      : null;

  const cat = CATEGORY_COLORS[product.category] ?? CATEGORY_COLORS.STANDARD;
  const photoUrl = product.ogImage || product.photos[0] || null;
  const textureLabel = product.texture
    ? product.texture.charAt(0).toUpperCase() + product.texture.slice(1)
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#faf8f6",
          fontFamily: "Inter",
        }}
      >
        {/* Left side — product info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "50px 50px 50px 60px",
            width: photoUrl ? "55%" : "100%",
          }}
        >
          {/* Top: brand + category badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#3a2c2a",
                letterSpacing: "-0.5px",
              }}
            >
              Hairland
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: "6px",
                backgroundColor: cat.bg,
                color: cat.text,
              }}
            >
              {cat.label}
            </div>
          </div>

          {/* Middle: product name + details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#3a2c2a",
                lineHeight: 1.2,
                maxWidth: "500px",
              }}
            >
              {product.name}
            </div>

            {/* Details row */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              {textureLabel && (
                <div
                  style={{
                    fontSize: 16,
                    padding: "6px 14px",
                    borderRadius: "20px",
                    backgroundColor: "#f3eeeb",
                    color: "#5c4a42",
                  }}
                >
                  {textureLabel}
                </div>
              )}
              {lengthStr && (
                <div
                  style={{
                    fontSize: 16,
                    padding: "6px 14px",
                    borderRadius: "20px",
                    backgroundColor: "#f3eeeb",
                    color: "#5c4a42",
                  }}
                >
                  {lengthStr}
                </div>
              )}
              {colorNames.length > 0 && (
                <div
                  style={{
                    fontSize: 16,
                    padding: "6px 14px",
                    borderRadius: "20px",
                    backgroundColor: "#f3eeeb",
                    color: "#5c4a42",
                  }}
                >
                  {colorNames.join(", ")}
                </div>
              )}
            </div>

            {/* Price */}
            {priceStr && (
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#c2185b",
                  marginTop: "8px",
                }}
              >
                {priceStr}
              </div>
            )}
          </div>

          {/* Bottom: tagline */}
          <div style={{ fontSize: 16, color: "#8c7b74" }}>
            100% pravé vlasy z jedné hlavy — hairland.cz
          </div>
        </div>

        {/* Right side — product photo */}
        {photoUrl && (
          <div
            style={{
              width: "45%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt=""
              width={540}
              height={630}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: interBold, weight: 700, style: "normal" },
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
      ],
    }
  );
}
