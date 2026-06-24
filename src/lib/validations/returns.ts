import { z } from "zod";

export const initiateReturnSchema = z.object({
  saleId: z.string().min(1),
  saleItemId: z.string().min(1),
  grams: z.number().int().min(1),
  pieces: z.number().int().min(0),
  reason: z.string().min(1).max(2000),
});

export const createComplaintSchema = z.object({
  saleId: z.string().min(1).optional(),
  salonId: z.string().min(1).optional(),
  deliveryId: z.string().min(1),
  grams: z.number().int().min(1),
  pieces: z.number().int().min(0),
  description: z.string().min(1).max(5000),
});

export const supplierRefundSchema = z.object({
  refundHalere: z.number().int().positive(),
  note: z.string().max(2000),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().int().positive(),
  date: z.string().min(1),
  matchedVS: z.string().max(20).optional(),
  source: z.enum(["MANUAL", "BANK_API"]).default("MANUAL"),
  note: z.string().max(2000).optional(),
});

export const sendReminderSchema = z.object({
  invoiceId: z.string().min(1),
});
