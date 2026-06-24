import type { Product, Variant } from "@prisma/client";
import type { Role } from "@prisma/client";
import { roundHalereUp } from "../rounding";

type VariantWithProduct = Variant & { product?: Product };

export function serializeVariantForRole(
  variant: VariantWithProduct,
  role: Role,
  salonDiscountPercent?: number
) {
  const base = {
    id: variant.id,
    productId: variant.productId,
    lengthCm: variant.lengthCm,
    color: variant.color,
    active: variant.active,
  };

  switch (role) {
    case "OWNER":
      return {
        ...base,
        wholesalePricePerGram: variant.wholesalePricePerGram,
        retailPricePerGram: variant.retailPricePerGram,
        retailManualOverride: variant.retailManualOverride,
      };

    case "EMPLOYEE":
      return {
        ...base,
        wholesalePricePerGram: variant.wholesalePricePerGram,
        retailPricePerGram: variant.retailPricePerGram,
      };

    case "SALON": {
      const salonPrice = salonDiscountPercent
        ? roundHalereUp(
            variant.wholesalePricePerGram * (1 - salonDiscountPercent / 100)
          )
        : variant.wholesalePricePerGram;
      return {
        ...base,
        pricePerGram: salonPrice,
      };
    }
  }
}

export function serializeProductForRole(
  product: Product & { variants?: Variant[] },
  role: Role,
  salonDiscountPercent?: number
) {
  const base = {
    id: product.id,
    name: product.name,
    nameUk: product.nameUk,
    nameRu: product.nameRu,
    description: product.description,
    descriptionUk: product.descriptionUk,
    descriptionRu: product.descriptionRu,
    category: product.category,
    processingType: product.processingType,
    photos: product.photos,
    archived: product.archived,
    slug: product.slug,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };

  if (!product.variants) return base;

  return {
    ...base,
    variants: product.variants.map((v) =>
      serializeVariantForRole(v, role, salonDiscountPercent)
    ),
  };
}
