import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getHairColor } from "@/lib/hair-colors";
import { PhotoGallery } from "./PhotoGallery";
import { ColorCircles } from "./ColorCircles";

type Props = {
  params: Promise<{ id: string }>;
};

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      nameUk: true,
      nameRu: true,
      description: true,
      descriptionUk: true,
      descriptionRu: true,
      category: true,
      processingType: true,
      origin: true,
      photos: true,
      variants: {
        where: { active: true },
        select: {
          lengthCm: true,
          color: true,
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return { title: "Produkt nenalezen" };
  }
  return {
    title: product.name,
    description:
      product.description ??
      `${product.name} - ${product.category} vlasy k prodloužení`,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const t = await getTranslations("public.products");
  const tCategory = await getTranslations("category");
  const tCommon = await getTranslations("common");

  const lengths = [...new Set(product.variants.map((v) => v.lengthCm))].sort(
    (a, b) => a - b
  );
  const colors = [...new Set(product.variants.map((v) => v.color))];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <Link
        href="/offer"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-6"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {tCommon("back")}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Photo gallery */}
        <PhotoGallery photos={product.photos} alt={product.name} />

        {/* Right: Product info */}
        <div>
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">
              {tCategory(product.category.toLowerCase())}
            </span>
            {product.origin && (
              <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
                {product.origin}
              </span>
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>

          {/* Description */}
          {product.description && (
            <p className="text-gray-600 mb-6 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Lengths */}
          {lengths.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                {t("lengths")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {lengths.map((len) => (
                  <span
                    key={len}
                    className="inline-block px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200"
                  >
                    {len} cm
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {colors.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                {t("colors")}
              </h2>
              <ColorCircles colors={colors} />
            </div>
          )}

          {/* Variant table */}
          {lengths.length > 0 && (
            <div className="mb-6">
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">
                        {t("lengths")}
                      </th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">
                        {t("colors")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lengths.map((len) => {
                      const variantColors = [
                        ...new Set(
                          product.variants
                            .filter((v) => v.lengthCm === len)
                            .map((v) => v.color)
                        ),
                      ];
                      return (
                        <tr
                          key={len}
                          className="border-t border-gray-100"
                        >
                          <td className="px-4 py-2.5 font-medium text-gray-900">
                            {len} cm
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap gap-1.5">
                              {variantColors.map((code) => {
                                const { hex, name } = getHairColor(code);
                                return (
                                  <span
                                    key={code}
                                    className="inline-flex items-center gap-1.5 text-xs text-gray-600"
                                  >
                                    <span
                                      className="w-4 h-4 rounded-full border border-gray-300 inline-block flex-shrink-0"
                                      style={{ backgroundColor: hex }}
                                    />
                                    {code}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CTA */}
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Kontaktujte nás
          </Link>
        </div>
      </div>
    </div>
  );
}
