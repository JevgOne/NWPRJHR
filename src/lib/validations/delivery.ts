import { z } from "zod";

export const stockInSchema = z
  .object({
    variantId: z.string().min(1),
    supplierId: z.string().min(1),
    purchasePricePerGramRaw: z.number().int().positive(),
    currency: z.enum(["CZK", "USD", "EUR", "UAH"]),
    exchangeRate: z.number().int().positive(),
    totalGrams: z.number().int().positive(),
    totalPieces: z.number().int().min(0),
    pieceWeightGrams: z.number().int().positive().optional(),
    barcode: z.string().max(100).optional(),
    batchCode: z.string().max(100).optional(),
    stockedAt: z.string().datetime().optional(),
    note: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (data.totalPieces > 0 && !data.pieceWeightGrams) return false;
      return true;
    },
    { message: "pieceWeightGrams is required when totalPieces > 0" }
  )
  .refine(
    (data) => {
      if (data.currency === "CZK" && data.exchangeRate !== 10000) return false;
      return true;
    },
    { message: "For CZK currency, exchangeRate must be 10000 (1:1)" }
  );

export const supplierSchema = z.object({
  name: z.string().min(1).max(200),
  contactName: z.string().max(200).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  note: z.string().max(1000).optional(),
});

export const deliveryUpdateSchema = z.object({
  barcode: z.string().max(100).optional(),
  note: z.string().max(1000).optional(),
  receivedInvoiceFile: z.string().optional(),
});
