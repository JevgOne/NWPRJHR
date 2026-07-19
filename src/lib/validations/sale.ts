import { z } from "zod";

export const saleItemSchema = z.object({
  variantId: z.string().min(1),
  grams: z.number().int().min(0),
  pieces: z.number().int().min(0),
});

export const discountSchema = z
  .object({
    percent: z.number().int().min(1).max(10000),
    type: z.enum(["STANDARD", "MARKETING", "PERSONAL"]),
    counterPerformanceNote: z.string().max(1000).optional(),
    bearerPartnerIds: z.array(z.string().min(1)).optional(),
  })
  .refine(
    (data) => {
      if (data.type === "MARKETING" && !data.counterPerformanceNote)
        return false;
      return true;
    },
    { message: "Marketing discount requires counter-performance note" }
  );

export const completeSaleSchema = z
  .object({
    customerType: z.enum(["SALON", "RETAIL"]),
    salonId: z.string().min(1).optional(),
    customerId: z.string().min(1).optional(),
    items: z.array(saleItemSchema).min(1).max(100),
    discount: discountSchema.optional(),
    paymentType: z.enum(["TRANSFER", "CASH", "CARD", "PROMO", "WRITEOFF"]).optional(),
    receiptNumber: z.string().max(100).optional(),
    orderId: z.string().min(1).optional(),
    note: z.string().max(2000).optional(),
  })
  .refine(
    (data) => {
      if (data.customerType === "SALON" && !data.salonId) return false;
      return true;
    },
    { message: "salonId required for SALON customer type" }
  );

export const customerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  instagram: z.string().max(100).optional(),
  note: z.string().max(1000).optional(),
});

export const pricePreviewSchema = z.object({
  variantId: z.string().min(1),
  customerType: z.enum(["SALON", "RETAIL"]),
  salonId: z.string().min(1).optional(),
  grams: z.number().int().min(0),
  pieces: z.number().int().min(0),
});
