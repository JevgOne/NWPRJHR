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
  customerPhotos: z.array(z.string().url()).max(3).optional().default([]),
  locale: z.enum(["cs", "uk", "ru", "en"]).default("cs"),
});

const productItemSchema = z.object({
  brand: z.string().max(200),
  frequency: z.string().max(50),
});

export const complaintTicketSchema = z.object({
  customerType: z.enum(["RETAIL", "SALON", "HAIRDRESSER"]),
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional(),
  salonName: z.string().max(200).optional(),
  complaintType: z.enum(["DEFECT", "RETURN", "WITHDRAWAL"]),
  orderNumber: z.string().max(100).optional(),
  description: z.string().min(10).max(5000),
  photos: z.array(z.string().url()).max(10).default([]),
  desiredResolution: z.enum(["REPAIR", "REPLACEMENT", "DISCOUNT", "REFUND"]).optional(),
  termsAccepted: z.literal(true),
  appliedBy: z.string().max(500).optional(),
  processedBy: z.string().max(500).optional(),
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
    flatironTemp: z.string().max(50).optional(),
    thermoprotectionFreq: z.enum(["always", "sometimes", "never"]).optional(),
    usesDye: z.enum(["yes", "no"]).optional(),
    dyeDetails: z.string().max(500).optional(),
    poolSea: z.enum(["yes", "no"]).optional(),
    sleepsLoose: z.enum(["yes", "no"]).optional(),
  }).optional(),
});
