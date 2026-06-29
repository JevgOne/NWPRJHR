import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      archived: false,
    },
    select: {
      name: true,
      photos: true,
      variants: {
        where: { active: true, retailPricePerGram: { gt: 0 } },
        select: { retailPricePerGram: true },
        take: 1,
        orderBy: { retailPricePerGram: "asc" },
      },
    },
  });

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
            background: "linear-gradient(135deg, #fdf2f0 0%, #fef6f3 100%)",
            fontSize: 48,
            color: "#6b5e5a",
            fontFamily: "Georgia, serif",
          }}
        >
          Hairland
        </div>
      ),
      { ...size }
    );
  }

  const photos = JSON.parse(product.photos || "[]") as string[];
  const firstPhoto = photos[0] ?? null;

  const minRetailHalere = product.variants[0]?.retailPricePerGram ?? null;
  const pricePer100g = minRetailHalere ? Math.ceil(minRetailHalere / 100) * 100 : null;
  const priceLabel = pricePer100g
    ? `od ${new Intl.NumberFormat("cs-CZ").format(pricePer100g / 100)} Kc / 100g`
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #fdf2f0 0%, #fef6f3 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Left: product photo */}
        {firstPhoto && (
          <div
            style={{
              width: "480px",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px",
            }}
          >
            <img
              src={firstPhoto}
              width={400}
              height={500}
              style={{
                objectFit: "cover",
                borderRadius: "16px",
              }}
            />
          </div>
        )}

        {/* Right: text content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: firstPhoto ? "40px 60px 40px 0" : "40px 60px",
          }}
        >
          {/* Product name */}
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: "#6b5e5a",
              lineHeight: 1.2,
              marginBottom: "24px",
              display: "flex",
            }}
          >
            {product.name}
          </div>

          {/* Price */}
          {priceLabel && (
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#e85d75",
                marginBottom: "40px",
                display: "flex",
              }}
            >
              {priceLabel}
            </div>
          )}

          {/* Brand footer */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: "auto",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#e85d75",
                marginBottom: "4px",
                display: "flex",
              }}
            >
              Hairland
            </div>
            <div
              style={{
                fontSize: 18,
                color: "#6b5e5a",
                display: "flex",
              }}
            >
              www.hairland.cz
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
