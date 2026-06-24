import { z } from "zod";

export const createOperatingCostSchema = z.object({
  category: z.enum([
    "ADVERTISING",
    "MARKETING",
    "TRANSPORT",
    "RENT",
    "FEES",
    "OTHER",
  ]),
  amountHalere: z.number().int().positive(),
  date: z.string().datetime(),
  description: z.string().max(500).optional(),
  note: z.string().max(2000).optional(),
});

export const updateOperatingCostSchema = createOperatingCostSchema.partial();

export const periodQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export const monthlyPeriodSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

export const recordWithdrawalSchema = z.object({
  partnerId: z.string().min(1),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  amountHalere: z.number().int().positive(),
  note: z.string().max(2000).optional(),
});

export const discountHistoryQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  givenByUserId: z.string().optional(),
  type: z.enum(["STANDARD", "MARKETING", "PERSONAL"]).optional(),
  partnerId: z.string().optional(),
});
