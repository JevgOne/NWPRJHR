import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  nameUk: z.string().max(200).optional(),
  nameRu: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  descriptionUk: z.string().max(2000).optional(),
  descriptionRu: z.string().max(2000).optional(),
  category: z.enum(["VIRGIN", "PREMIUM", "STANDARD", "SALE"]),
  processingType: z.enum([
    "CLIP_IN",
    "TAPE_IN",
    "KERATIN",
    "WEFT",
    "MICRO_RING",
    "OTHER",
  ]),
  origin: z.string().max(200).optional(),
  texture: z.string().max(200).nullable().optional(),
  colorTone: z.string().max(200).nullable().optional(),
  photos: z.string().optional(),
  video: z.string().url().nullable().optional(),
  metaTitle: z.string().max(70).nullable().optional(),
  metaDescription: z.string().max(200).nullable().optional(),
  ogImage: z.string().url().nullable().optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createVariantsSchema = z.object({
  variants: z
    .array(
      z.object({
        lengthCm: z.number().int().positive().max(150),
        color: z.string().min(1).max(100),
        wholesalePricePerGram: z.number().int().min(0),
        retailPricePerGram: z.number().int().min(0).optional(),
        costPricePerGram: z.number().int().min(0).optional(),
        sellingMode: z.enum(["BY_GRAM", "BY_PIECE"]).optional(),
        pricePerPiece: z.number().int().positive().optional(),
        retailPricePerPiece: z.number().int().positive().optional(),
      })
    )
    .min(1)
    .max(500),
});

export const updateVariantSchema = z.object({
  costPricePerGram: z.number().int().min(0).optional(),
  wholesalePricePerGram: z.number().int().positive().optional(),
  retailPricePerGram: z.number().int().positive().optional(),
  retailManualOverride: z.boolean().optional(),
  sellingMode: z.enum(["BY_GRAM", "BY_PIECE"]).optional(),
  pricePerPiece: z.number().int().positive().optional(),
  retailPricePerPiece: z.number().int().positive().optional(),
  availableToOrder: z.boolean().optional(),
  orderLeadDays: z.number().int().min(1).max(90).nullable().optional(),
  active: z.boolean().optional(),
});

export const updatePriceSettingsSchema = z.object({
  category: z.enum(["VIRGIN", "PREMIUM", "STANDARD", "SALE"]),
  markupPercent: z.number().int().min(0).max(1000),
});
