import { z } from "zod";

/** Strip HTML/script tags from user input to prevent XSS */
const stripTags = (s: string) => s.replace(/<[^>]*>/g, "").trim();

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
  name: z.string().min(1).max(200).transform(stripTags),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional().transform((v) => v ? stripTags(v) : v),
  salonName: z.string().max(200).optional().transform((v) => v ? stripTags(v) : v),
  message: z.string().min(1).max(5000).transform(stripTags),
  customerPhotos: z.array(z.string().url()).max(3).optional().default([]),
  locale: z.enum(["cs", "uk", "ru", "en"]).default("cs"),
});

const productItemSchema = z.object({
  brand: z.string().max(200).transform(stripTags),
  frequency: z.string().max(50).transform(stripTags),
});

export const complaintTicketSchema = z.object({
  customerType: z.enum(["RETAIL", "SALON", "HAIRDRESSER"]),
  name: z.string().min(1).max(200).transform(stripTags),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional().transform((v) => v ? stripTags(v) : v),
  salonName: z.string().max(200).optional().transform((v) => v ? stripTags(v) : v),
  complaintType: z.enum(["DEFECT", "RETURN", "WITHDRAWAL"]),
  orderNumber: z.string().max(100).optional().transform((v) => v ? stripTags(v) : v),
  description: z.string().min(10).max(5000).transform(stripTags),
  photos: z.array(z.string().url()).max(10).default([]),
  desiredResolution: z.enum(["REPAIR", "REPLACEMENT", "DISCOUNT", "REFUND"]).optional(),
  termsAccepted: z.literal(true),
  appliedBy: z.string().max(500).optional().transform((v) => v ? stripTags(v) : v),
  processedBy: z.string().max(500).optional().transform((v) => v ? stripTags(v) : v),
  products: z.object({
    shampoo: productItemSchema.optional(),
    conditioner: productItemSchema.optional(),
    mask: productItemSchema.optional(),
    oilSerum: productItemSchema.optional(),
    ampoule: productItemSchema.optional(),
    thermoprotection: productItemSchema.optional(),
  }).optional(),
  heatChemical: z.object({
    usesFlatiron: z.enum(["yes", "no"]).optional(),
    flatironTemp: z.string().max(50).optional().transform((v) => v ? stripTags(v) : v),
    thermoprotectionFreq: z.enum(["always", "sometimes", "never"]).optional(),
    usesDye: z.enum(["yes", "no"]).optional(),
    dyeDetails: z.string().max(500).optional().transform((v) => v ? stripTags(v) : v),
    poolSea: z.enum(["yes", "no"]).optional(),
    sleepsLoose: z.enum(["yes", "no"]).optional(),
  }).optional(),
});
