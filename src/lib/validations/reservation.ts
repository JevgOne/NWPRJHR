import { z } from "zod";

export const createReservationSchema = z.object({
  customerType: z.enum(["SALON", "RETAIL", "HAIRDRESSER"]),
  salonId: z.string().optional(),
  customerId: z.string().optional(),
  contactName: z.string().max(200).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(50).optional(),
  variantId: z.string(),
  grams: z.number().int().min(0),
  pieces: z.number().int().min(0),
  paymentDueDate: z.string().optional(), // ISO date string
  note: z.string().max(2000).optional(),
  discount: z.object({
    percent: z.number().int().min(0).max(10000),
    type: z.enum(["STANDARD", "MARKETING", "PERSONAL"]),
    counterPerformanceNote: z.string().max(500).optional(),
    bearerPartnerIds: z.array(z.string()).optional(),
  }).optional(),
});

export const updateReservationSchema = z.object({
  note: z.string().max(2000).optional(),
  internalNote: z.string().max(2000).optional(),
  paymentDueDate: z.string().optional(),
  paymentNote: z.string().max(2000).optional(),
});
