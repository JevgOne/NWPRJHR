import { z } from "zod";

export const createSalonSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["SALON", "HAIRDRESSER"]).optional(),
  ico: z
    .string()
    .regex(/^\d{8}$/)
    .optional(),
  dic: z
    .string()
    .regex(/^CZ\d{8,10}$/)
    .optional(),
  contactPerson: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  website: z.string().max(500).optional(),
  instagram: z.string().max(200).optional(),
  language: z.enum(["cs", "uk", "ru"]).optional(),
  approved: z.boolean().optional(),
});

export const updateSalonSchema = createSalonSchema.partial();

export const createOrderSchema = z.object({
  salonId: z.string(),
  items: z
    .array(
      z.object({
        variantId: z.string(),
        grams: z.number().int().positive(),
        pieces: z.number().int().min(0),
      })
    )
    .min(1)
    .max(100),
  note: z.string().max(2000).optional(),
});

export const rejectOrderSchema = z.object({
  reason: z.string().min(1).max(1000),
});

export const sampleRequestSchema = z.object({
  salonId: z.string().optional(),
  salonName: z.string().max(200).optional(),
  productId: z.string(),
  note: z.string().max(1000).optional(),
});

export const loyaltySettingsSchema = z.object({
  tier: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM"]),
  revenueThreshold: z.number().int().min(0),
  discountPercent: z.number().int().min(0).max(10000),
});
