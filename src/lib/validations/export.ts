import { z } from "zod";

export const exportQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  format: z.enum(["xlsx", "csv"]).default("xlsx"),
});

export const pohodaExportSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  ico: z.string().min(8).max(8),
});

export const contactFormSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional(),
  salonName: z.string().max(200).optional(),
  message: z.string().min(1).max(5000),
  locale: z.enum(["cs", "uk", "ru"]).default("cs"),
});
