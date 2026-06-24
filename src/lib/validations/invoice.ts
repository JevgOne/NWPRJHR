import { z } from "zod";

export const createInvoiceSchema = z.object({
  saleId: z.string().min(1),
  companyId: z.string().min(1).optional(),
});

export const companySchema = z.object({
  name: z.string().min(1).max(200),
  ico: z.string().regex(/^\d{8}$/, "ICO must be 8 digits"),
  dic: z
    .string()
    .regex(/^CZ\d{8,10}$/)
    .optional()
    .or(z.literal("")),
  address: z.string().min(1).max(500),
  addressCity: z.string().max(100).optional(),
  addressZip: z.string().max(10).optional(),
  bankAccount: z.string().min(1).max(100),
  bankIban: z
    .string()
    .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{4,}$/)
    .optional()
    .or(z.literal("")),
  bankBic: z.string().max(11).optional(),
  bankName: z.string().max(100).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(50).optional(),
  isDefault: z.boolean().optional(),
});

export const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().int().positive(),
  date: z.string().min(1),
  matchedVS: z.string().max(20).optional(),
  source: z.enum(["MANUAL", "BANK_API"]).optional(),
  note: z.string().max(500).optional(),
});

export const creditNoteSchema = z.object({
  originalInvoiceId: z.string().min(1),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().positive(),
        unit: z.string(),
        pricePerUnit: z.number().int().positive(),
        lineTotal: z.number().int().positive(),
      })
    )
    .min(1),
  reason: z.string().min(1).max(1000),
});
