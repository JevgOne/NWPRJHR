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

export const newStockInSchema = z
  .object({
    category: z.enum(["VIRGIN", "PREMIUM", "STANDARD", "SALE"]),
    origin: z.string().min(1),
    texture: z.string().min(1),
    color: z.string().min(1),
    lengthCm: z.number().int().positive().max(150),
    supplierId: z.string().min(1),
    purchasePricePerGramRaw: z.number().int().min(0),
    currency: z.enum(["CZK", "USD", "EUR", "UAH"]),
    exchangeRate: z.number().int().positive(),
    totalGrams: z.number().int().min(0),
    totalPieces: z.number().int().min(0).default(0),
    pieceWeightGrams: z.number().int().positive().optional(),
    sellingMode: z.enum(["BY_GRAM", "BY_PIECE"]).default("BY_GRAM"),
    pricePerPiece: z.number().int().positive().optional(),
    retailPricePerPiece: z.number().int().positive().optional(),
    stockedAt: z.string().datetime().optional(),
    note: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (data.sellingMode === "BY_PIECE") {
        return (
          data.pricePerPiece != null &&
          data.totalPieces > 0 &&
          data.pieceWeightGrams != null
        );
      }
      return true;
    },
    {
      message:
        "BY_PIECE mode requires pricePerPiece, totalPieces > 0, and pieceWeightGrams",
    }
  )
  .refine(
    (data) => {
      if (data.sellingMode === "BY_GRAM") {
        return data.totalGrams > 0;
      }
      return true;
    },
    { message: "BY_GRAM mode requires totalGrams > 0" }
  )
  .refine(
    (data) => {
      if (data.sellingMode === "BY_GRAM") {
        return data.purchasePricePerGramRaw > 0;
      }
      return true;
    },
    { message: "BY_GRAM mode requires purchasePricePerGramRaw > 0" }
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
