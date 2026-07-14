import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { hash } from "bcryptjs";
import dotenv from "dotenv";
import { calculateRetailPrice } from "../src/lib/pricing";

dotenv.config();

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deterministic date helper (months ago from a reference date) */
function daysAgo(days: number): Date {
  const d = new Date("2026-06-24T10:00:00Z");
  d.setDate(d.getDate() - days);
  return d;
}

/** Generate a simple barcode string */
function barcode(date: string, code: string): string {
  return `HR-${date}-${code}`;
}

/** Compute VAT (21 %) from a net amount in halere */
function vat21(net: number): number {
  return Math.round(net * 0.21);
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding Hairora demo data ...");

  // ========================================================================
  // 1. PRICE SETTINGS
  // ========================================================================
  const priceSettingsData = [
    { category: "VIRGIN" as const, markupPercent: 80 },
    { category: "LUXE" as const, markupPercent: 60 },
    { category: "STANDARD" as const, markupPercent: 50 },
    { category: "SALE" as const, markupPercent: 30 },
  ];
  for (const ps of priceSettingsData) {
    await prisma.priceSettings.upsert({
      where: { category: ps.category },
      update: { markupPercent: ps.markupPercent },
      create: ps,
    });
  }
  const markupMap: Record<string, number> = {};
  for (const ps of priceSettingsData) markupMap[ps.category] = ps.markupPercent;
  console.log("  Price settings OK");

  // ========================================================================
  // 2. LOYALTY SETTINGS
  // ========================================================================
  const loyaltyDefaults = [
    { tier: "BRONZE" as const, revenueThreshold: 0, discountPercent: 0 },
    { tier: "SILVER" as const, revenueThreshold: 5_000_000, discountPercent: 300 },
    { tier: "GOLD" as const, revenueThreshold: 15_000_000, discountPercent: 600 },
    { tier: "PLATINUM" as const, revenueThreshold: 40_000_000, discountPercent: 1000 },
  ];
  for (const ls of loyaltyDefaults) {
    await prisma.loyaltySettings.upsert({
      where: { tier: ls.tier },
      update: {},
      create: ls,
    });
  }
  console.log("  Loyalty settings OK");

  // ========================================================================
  // 2b. B2B SETTINGS
  // ========================================================================
  await prisma.b2BSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      hairdresserDiscountPct: 2000, // 20%
      salonDiscountPct: 3600, // 36%
    },
  });
  console.log("  B2B settings OK");

  // ========================================================================
  // 3. COMPANY
  // ========================================================================
  const company = await prisma.company.upsert({
    where: { id: "company-default" },
    update: {},
    create: {
      id: "company-default",
      name: "Hairora s.r.o.",
      ico: "12345678",
      dic: "CZ12345678",
      address: "Na Příkopě 12, 110 00 Praha 1",
      addressCity: "Praha",
      addressZip: "11000",
      bankAccount: "123456789/0100",
      bankIban: "CZ6508000000000123456789",
      bankBic: "KOMBCZPP",
      bankName: "Komerční banka",
      contactEmail: "info@hairora.cz",
      contactPhone: "+420123456789",
      isDefault: true,
    },
  });
  console.log("  Company OK");

  // ========================================================================
  // 4. SALONS  (6 salons, mix tiers/languages/cities)
  // ========================================================================
  const salon1 = await prisma.salon.upsert({
    where: { id: "salon-krasa-praha" },
    update: {},
    create: {
      id: "salon-krasa-praha",
      name: "Salon Krása Praha",
      ico: "12345678",
      contactPerson: "Markéta Dvořáková",
      email: "info@salonkrasa.cz",
      phone: "+420222333444",
      city: "Praha",
      address: "Vinohradská 42, Praha 2",
      language: "cs",
      tier: "SILVER",
      totalRevenue: 7_500_000,
      points: 750,
      startDate: daysAgo(365),
    },
  });

  const salon2 = await prisma.salon.upsert({
    where: { id: "salon-olena-brno" },
    update: {},
    create: {
      id: "salon-olena-brno",
      name: "Salon Olena",
      contactPerson: "Olena Kovalenko",
      email: "olena@salonolena.cz",
      phone: "+420555666777",
      city: "Brno",
      address: "Masarykova 15, Brno",
      language: "uk",
      tier: "BRONZE",
      totalRevenue: 2_000_000,
      points: 200,
      startDate: daysAgo(180),
    },
  });

  const salon3 = await prisma.salon.upsert({
    where: { id: "salon-natalia-ostrava" },
    update: {},
    create: {
      id: "salon-natalia-ostrava",
      name: "Salon Natalia",
      contactPerson: "Natalia Petrova",
      email: "natalia@salonnatalia.cz",
      phone: "+420777888999",
      city: "Ostrava",
      address: "Stodolní 8, Ostrava",
      language: "ru",
      tier: "GOLD",
      totalRevenue: 20_000_000,
      points: 2000,
      startDate: daysAgo(540),
    },
  });

  const salon4 = await prisma.salon.upsert({
    where: { id: "salon-glamour-plzen" },
    update: {},
    create: {
      id: "salon-glamour-plzen",
      name: "Glamour Hair Studio",
      ico: "87654321",
      contactPerson: "Lucie Procházková",
      email: "info@glamourhair.cz",
      phone: "+420333444555",
      city: "Plzeň",
      address: "Americká 28, Plzeň",
      language: "cs",
      tier: "PLATINUM",
      totalRevenue: 45_000_000,
      points: 4500,
      startDate: daysAgo(730),
    },
  });

  const salon5 = await prisma.salon.upsert({
    where: { id: "salon-beauty-liberec" },
    update: {},
    create: {
      id: "salon-beauty-liberec",
      name: "Beauty Point Liberec",
      contactPerson: "Eva Horáková",
      email: "eva@beautypoint.cz",
      phone: "+420488599600",
      city: "Liberec",
      address: "Moskevská 5, Liberec",
      language: "cs",
      tier: "BRONZE",
      totalRevenue: 800_000,
      points: 80,
      startDate: daysAgo(60),
    },
  });

  const salon6 = await prisma.salon.upsert({
    where: { id: "salon-oksana-cb" },
    update: {},
    create: {
      id: "salon-oksana-cb",
      name: "Salon Oksana",
      contactPerson: "Oksana Lysenko",
      email: "oksana@salonoksana.cz",
      phone: "+420611722833",
      city: "České Budějovice",
      address: "Lannova 12, České Budějovice",
      language: "uk",
      tier: "SILVER",
      totalRevenue: 9_000_000,
      points: 900,
      startDate: daysAgo(400),
    },
  });
  console.log("  Salons OK (6)");

  // ========================================================================
  // 5. USERS  (3 core + additional salon users)
  // ========================================================================
  const ownerPassword = await hash("owner123", 12);
  const owner = await prisma.user.upsert({
    where: { email: "owner@hairora.cz" },
    update: {},
    create: {
      email: "owner@hairora.cz",
      name: "Admin Hairland",
      hashedPassword: ownerPassword,
      role: "OWNER",
    },
  });

  const employeePassword = await hash("employee123", 12);
  const employee = await prisma.user.upsert({
    where: { email: "employee@hairora.cz" },
    update: {},
    create: {
      email: "employee@hairora.cz",
      name: "Prodejce",
      hashedPassword: employeePassword,
      role: "EMPLOYEE",
    },
  });

  const salonPassword = await hash("salon123", 12);
  const salonUser = await prisma.user.upsert({
    where: { email: "salon@hairora.cz" },
    update: {},
    create: {
      email: "salon@hairora.cz",
      name: "Salon Krása",
      hashedPassword: salonPassword,
      role: "SALON",
      salonId: salon1.id,
    },
  });

  // Additional salon users
  const salonUser2 = await prisma.user.upsert({
    where: { email: "olena@salonolena.cz" },
    update: {},
    create: {
      email: "olena@salonolena.cz",
      name: "Olena Kovalenko",
      hashedPassword: await hash("salon123", 12),
      role: "SALON",
      salonId: salon2.id,
    },
  });

  const salonUser3 = await prisma.user.upsert({
    where: { email: "natalia@salonnatalia.cz" },
    update: {},
    create: {
      email: "natalia@salonnatalia.cz",
      name: "Natalia Petrova",
      hashedPassword: await hash("salon123", 12),
      role: "SALON",
      salonId: salon3.id,
    },
  });
  console.log("  Users OK (5)");

  // ========================================================================
  // 6. PRODUCTS & VARIANTS  (8 products, many variants)
  // ========================================================================
  const productsData = [
    // --- VIRGIN ---
    {
      name: "Panenské Clip-In",
      nameUk: "Незаймане Clip-In",
      nameRu: "Натуральные Clip-In",
      category: "VIRGIN" as const,
      processingType: "CLIP_IN" as const,
      slug: "panenske-clip-in",
      variants: [
        { lengthCm: 30, color: "1B", wholesalePricePerGram: 1500 },
        { lengthCm: 40, color: "1B", wholesalePricePerGram: 1800 },
        { lengthCm: 40, color: "613", wholesalePricePerGram: 2100 },
        { lengthCm: 50, color: "1B", wholesalePricePerGram: 2200 },
        { lengthCm: 50, color: "613", wholesalePricePerGram: 2500 },
        { lengthCm: 60, color: "1B", wholesalePricePerGram: 2800 },
        { lengthCm: 60, color: "613", wholesalePricePerGram: 3200 },
      ],
    },
    {
      name: "Panenské Tape-In",
      nameUk: "Незаймане Tape-In",
      nameRu: "Натуральные Tape-In",
      category: "VIRGIN" as const,
      processingType: "TAPE_IN" as const,
      slug: "panenske-tape-in",
      variants: [
        { lengthCm: 40, color: "1B", wholesalePricePerGram: 1900 },
        { lengthCm: 40, color: "2", wholesalePricePerGram: 1900 },
        { lengthCm: 50, color: "1B", wholesalePricePerGram: 2300 },
        { lengthCm: 50, color: "27", wholesalePricePerGram: 2400 },
        { lengthCm: 60, color: "1B", wholesalePricePerGram: 2900 },
      ],
    },
    {
      name: "Panenské Keratin",
      nameUk: "Незаймане Кератин",
      nameRu: "Натуральные Кератин",
      category: "VIRGIN" as const,
      processingType: "KERATIN" as const,
      slug: "panenske-keratin",
      variants: [
        { lengthCm: 50, color: "1B", wholesalePricePerGram: 2100 },
        { lengthCm: 50, color: "4", wholesalePricePerGram: 2100 },
        { lengthCm: 60, color: "1B", wholesalePricePerGram: 2700 },
        { lengthCm: 70, color: "1B", wholesalePricePerGram: 3400 },
      ],
    },
    // --- LUXE ---
    {
      name: "Luxe Clip-In",
      nameUk: "Люкс Clip-In",
      nameRu: "Люкс Clip-In",
      category: "LUXE" as const,
      processingType: "CLIP_IN" as const,
      slug: "luxe-clip-in",
      variants: [
        { lengthCm: 40, color: "1B", wholesalePricePerGram: 1200 },
        { lengthCm: 40, color: "4", wholesalePricePerGram: 1200 },
        { lengthCm: 50, color: "1B", wholesalePricePerGram: 1500 },
        { lengthCm: 50, color: "613", wholesalePricePerGram: 1700 },
        { lengthCm: 60, color: "1B", wholesalePricePerGram: 1900 },
      ],
    },
    {
      name: "Luxe Tape-In",
      nameUk: "Люкс Tape-In",
      nameRu: "Люкс Tape-In",
      category: "LUXE" as const,
      processingType: "TAPE_IN" as const,
      slug: "luxe-tape-in",
      variants: [
        { lengthCm: 40, color: "1B", wholesalePricePerGram: 1200 },
        { lengthCm: 40, color: "4", wholesalePricePerGram: 1200 },
        { lengthCm: 50, color: "1B", wholesalePricePerGram: 1500 },
        { lengthCm: 50, color: "4", wholesalePricePerGram: 1500 },
        { lengthCm: 60, color: "2", wholesalePricePerGram: 1800 },
      ],
    },
    // --- STANDARD ---
    {
      name: "Standard Keratin",
      nameUk: "Стандарт Кератин",
      nameRu: "Стандарт Кератин",
      category: "STANDARD" as const,
      processingType: "KERATIN" as const,
      slug: "standard-keratin",
      variants: [
        { lengthCm: 40, color: "1B", wholesalePricePerGram: 700 },
        { lengthCm: 50, color: "1B", wholesalePricePerGram: 800 },
        { lengthCm: 50, color: "613", wholesalePricePerGram: 900 },
        { lengthCm: 60, color: "1B", wholesalePricePerGram: 1000 },
      ],
    },
    {
      name: "Standard Micro Ring",
      nameUk: "Стандарт Мікро Рінг",
      nameRu: "Стандарт Микро Ринг",
      category: "STANDARD" as const,
      processingType: "MICRO_RING" as const,
      slug: "standard-micro-ring",
      variants: [
        { lengthCm: 40, color: "1B", wholesalePricePerGram: 650 },
        { lengthCm: 40, color: "2", wholesalePricePerGram: 650 },
        { lengthCm: 50, color: "1B", wholesalePricePerGram: 750 },
        { lengthCm: 50, color: "4", wholesalePricePerGram: 800 },
        { lengthCm: 60, color: "1B", wholesalePricePerGram: 950 },
      ],
    },
    // --- SALE ---
    {
      name: "Výprodej Weft",
      nameUk: "Розпродаж Weft",
      nameRu: "Распродажа Weft",
      category: "SALE" as const,
      processingType: "WEFT" as const,
      slug: "vyprodej-weft",
      variants: [
        { lengthCm: 30, color: "1B", wholesalePricePerGram: 400 },
        { lengthCm: 40, color: "1B", wholesalePricePerGram: 500 },
        { lengthCm: 40, color: "4", wholesalePricePerGram: 500 },
      ],
    },
  ];

  // Store created variants for later use
  const variantMap: Record<string, string> = {}; // "slug|length|color" -> variantId

  for (const pd of productsData) {
    const { variants, ...productFields } = pd;
    const markup = markupMap[productFields.category] ?? 0;

    const product = await prisma.product.upsert({
      where: { slug: productFields.slug },
      update: {},
      create: { ...productFields, photos: "[]" },
    });

    for (const v of variants) {
      const variant = await prisma.variant.upsert({
        where: {
          productId_lengthCm_color: {
            productId: product.id,
            lengthCm: v.lengthCm,
            color: v.color,
          },
        },
        update: {},
        create: {
          productId: product.id,
          lengthCm: v.lengthCm,
          color: v.color,
          wholesalePricePerGram: v.wholesalePricePerGram,
          retailPricePerGram: calculateRetailPrice(v.wholesalePricePerGram, markup),
        },
      });
      variantMap[`${pd.slug}|${v.lengthCm}|${v.color}`] = variant.id;
    }
  }
  console.log("  Products & Variants OK (8 products)");

  // helper to resolve variant id
  const vid = (slug: string, len: number, color: string) => {
    const key = `${slug}|${len}|${color}`;
    const id = variantMap[key];
    if (!id) throw new Error(`Variant not found: ${key}`);
    return id;
  };

  // ========================================================================
  // 7. SUPPLIERS  (4 suppliers)
  // ========================================================================
  const supplier1 = await prisma.supplier.upsert({
    where: { id: "supplier-ukraine-1" },
    update: {},
    create: {
      id: "supplier-ukraine-1",
      name: "Hair Factory Ukraine",
      contactName: "Olena Shevchenko",
      country: "UA",
      email: "olena@hairfactory.ua",
      phone: "+380501234567",
      note: "Hlavní dodavatel virgin vlasů",
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { id: "supplier-china-1" },
    update: {},
    create: {
      id: "supplier-china-1",
      name: "Premium Hair China",
      contactName: "Li Wei",
      country: "CN",
      email: "liwei@premiumhair.cn",
      phone: "+8613812345678",
      note: "Dodavatel standard a premium řad",
    },
  });

  const supplier3 = await prisma.supplier.upsert({
    where: { id: "supplier-india-1" },
    update: {},
    create: {
      id: "supplier-india-1",
      name: "Temple Hair India",
      contactName: "Priya Sharma",
      country: "IN",
      email: "priya@templehair.in",
      phone: "+919876543210",
      note: "Dodavatel keratin a micro ring",
    },
  });

  const supplier4 = await prisma.supplier.upsert({
    where: { id: "supplier-vietnam-1" },
    update: {},
    create: {
      id: "supplier-vietnam-1",
      name: "Saigon Hair Export",
      contactName: "Nguyen Thi Mai",
      country: "VN",
      email: "mai@saigonhair.vn",
      phone: "+84901234567",
      note: "Výprodejové a weft vlasy",
    },
  });
  console.log("  Suppliers OK (4)");

  // ========================================================================
  // 8. DELIVERIES  (15 deliveries with stock movements)
  // ========================================================================

  // Helper to create a delivery + RECEIPT stock movement idempotently
  async function createDelivery(data: {
    id: string;
    variantId: string;
    supplierId: string;
    purchasePricePerGramRaw: number;
    currency: "CZK" | "USD" | "EUR" | "UAH";
    exchangeRate: number;
    initialGrams: number;
    initialPieces: number;
    pieceWeightGrams?: number;
    remainingGrams: number;
    remainingPieces: number;
    barcodeStr: string;
    stockedAt: Date;
    note?: string;
  }) {
    const purchasePricePerGramCZK = Math.round(
      (data.purchasePricePerGramRaw * data.exchangeRate) / 10000
    );

    const existing = await prisma.delivery.findUnique({
      where: { barcode: data.barcodeStr },
    });
    if (existing) return existing;

    const delivery = await prisma.delivery.create({
      data: {
        id: data.id,
        variantId: data.variantId,
        supplierId: data.supplierId,
        purchasePricePerGramRaw: data.purchasePricePerGramRaw,
        currency: data.currency,
        exchangeRate: data.exchangeRate,
        purchasePricePerGramCZK,
        initialGrams: data.initialGrams,
        initialPieces: data.initialPieces,
        pieceWeightGrams: data.pieceWeightGrams ?? null,
        remainingGrams: data.remainingGrams,
        remainingPieces: data.remainingPieces,
        barcode: data.barcodeStr,
        stockedAt: data.stockedAt,
        note: data.note,
      },
    });

    await prisma.stockMovement.create({
      data: {
        deliveryId: delivery.id,
        variantId: data.variantId,
        type: "RECEIPT",
        grams: data.initialGrams,
        pieces: data.initialPieces,
        userId: owner.id,
      },
    });

    return delivery;
  }

  // D1: Virgin Clip-In 50cm 1B from Ukraine (UAH)
  const d1 = await createDelivery({
    id: "del-01",
    variantId: vid("panenske-clip-in", 50, "1B"),
    supplierId: supplier1.id,
    purchasePricePerGramRaw: 500,
    currency: "UAH",
    exchangeRate: 6500, // 0.65 CZK/UAH * 10000
    initialGrams: 500,
    initialPieces: 0,
    remainingGrams: 200, // 300g sold
    remainingPieces: 0,
    barcodeStr: barcode("20260401", "A1B2"),
    stockedAt: daysAgo(84),
    note: "Dubnová dodávka virgin",
  });

  // D2: Premium Tape-In 40cm 1B from China (USD)
  const d2 = await createDelivery({
    id: "del-02",
    variantId: vid("premium-tape-in", 40, "1B"),
    supplierId: supplier2.id,
    purchasePricePerGramRaw: 200,
    currency: "USD",
    exchangeRate: 235000, // 23.50 CZK/USD
    initialGrams: 300,
    initialPieces: 15,
    pieceWeightGrams: 20,
    remainingGrams: 140, // 160g sold
    remainingPieces: 7,
    barcodeStr: barcode("20260405", "C3D4"),
    stockedAt: daysAgo(80),
  });

  // D3: Standard Keratin 50cm 1B from India (USD)
  const d3 = await createDelivery({
    id: "del-03",
    variantId: vid("standard-keratin", 50, "1B"),
    supplierId: supplier3.id,
    purchasePricePerGramRaw: 150,
    currency: "USD",
    exchangeRate: 235000,
    initialGrams: 600,
    initialPieces: 0,
    remainingGrams: 350, // 250g sold
    remainingPieces: 0,
    barcodeStr: barcode("20260410", "E5F6"),
    stockedAt: daysAgo(75),
  });

  // D4: Virgin Clip-In 60cm 613 from Ukraine (UAH)
  const d4 = await createDelivery({
    id: "del-04",
    variantId: vid("panenske-clip-in", 60, "613"),
    supplierId: supplier1.id,
    purchasePricePerGramRaw: 700,
    currency: "UAH",
    exchangeRate: 6500,
    initialGrams: 400,
    initialPieces: 0,
    remainingGrams: 300,
    remainingPieces: 0,
    barcodeStr: barcode("20260412", "G7H8"),
    stockedAt: daysAgo(73),
  });

  // D5: Premium Clip-In 50cm 1B from China (USD)
  const d5 = await createDelivery({
    id: "del-05",
    variantId: vid("premium-clip-in", 50, "1B"),
    supplierId: supplier2.id,
    purchasePricePerGramRaw: 250,
    currency: "USD",
    exchangeRate: 235000,
    initialGrams: 400,
    initialPieces: 0,
    remainingGrams: 250,
    remainingPieces: 0,
    barcodeStr: barcode("20260420", "I9J0"),
    stockedAt: daysAgo(65),
  });

  // D6: Standard Micro Ring 50cm 1B from India (USD)
  const d6 = await createDelivery({
    id: "del-06",
    variantId: vid("standard-micro-ring", 50, "1B"),
    supplierId: supplier3.id,
    purchasePricePerGramRaw: 130,
    currency: "USD",
    exchangeRate: 235000,
    initialGrams: 500,
    initialPieces: 0,
    remainingGrams: 380,
    remainingPieces: 0,
    barcodeStr: barcode("20260425", "K1L2"),
    stockedAt: daysAgo(60),
  });

  // D7: Virgin Tape-In 50cm 1B from Ukraine (UAH)
  const d7 = await createDelivery({
    id: "del-07",
    variantId: vid("panenske-tape-in", 50, "1B"),
    supplierId: supplier1.id,
    purchasePricePerGramRaw: 550,
    currency: "UAH",
    exchangeRate: 6500,
    initialGrams: 350,
    initialPieces: 0,
    remainingGrams: 250,
    remainingPieces: 0,
    barcodeStr: barcode("20260501", "M3N4"),
    stockedAt: daysAgo(54),
  });

  // D8: Premium Tape-In 50cm 4 from China (USD)
  const d8 = await createDelivery({
    id: "del-08",
    variantId: vid("premium-tape-in", 50, "4"),
    supplierId: supplier2.id,
    purchasePricePerGramRaw: 220,
    currency: "USD",
    exchangeRate: 235000,
    initialGrams: 250,
    initialPieces: 0,
    remainingGrams: 180,
    remainingPieces: 0,
    barcodeStr: barcode("20260505", "O5P6"),
    stockedAt: daysAgo(50),
  });

  // D9: Virgin Keratin 60cm 1B from Ukraine (EUR)
  const d9 = await createDelivery({
    id: "del-09",
    variantId: vid("panenske-keratin", 60, "1B"),
    supplierId: supplier1.id,
    purchasePricePerGramRaw: 600,
    currency: "EUR",
    exchangeRate: 254000, // 25.40 CZK/EUR
    initialGrams: 300,
    initialPieces: 0,
    remainingGrams: 230,
    remainingPieces: 0,
    barcodeStr: barcode("20260510", "Q7R8"),
    stockedAt: daysAgo(45),
  });

  // D10: Standard Keratin 60cm 1B from India (USD)
  const d10 = await createDelivery({
    id: "del-10",
    variantId: vid("standard-keratin", 60, "1B"),
    supplierId: supplier3.id,
    purchasePricePerGramRaw: 180,
    currency: "USD",
    exchangeRate: 235000,
    initialGrams: 400,
    initialPieces: 0,
    remainingGrams: 320,
    remainingPieces: 0,
    barcodeStr: barcode("20260515", "S9T0"),
    stockedAt: daysAgo(40),
  });

  // D11: Sale Weft 40cm 1B from Vietnam (USD)
  const d11 = await createDelivery({
    id: "del-11",
    variantId: vid("vyprodej-weft", 40, "1B"),
    supplierId: supplier4.id,
    purchasePricePerGramRaw: 80,
    currency: "USD",
    exchangeRate: 235000,
    initialGrams: 800,
    initialPieces: 0,
    remainingGrams: 600,
    remainingPieces: 0,
    barcodeStr: barcode("20260520", "U1V2"),
    stockedAt: daysAgo(35),
  });

  // D12: Virgin Clip-In 40cm 1B from Ukraine (UAH) - recent
  const d12 = await createDelivery({
    id: "del-12",
    variantId: vid("panenske-clip-in", 40, "1B"),
    supplierId: supplier1.id,
    purchasePricePerGramRaw: 450,
    currency: "UAH",
    exchangeRate: 6500,
    initialGrams: 350,
    initialPieces: 0,
    remainingGrams: 300,
    remainingPieces: 0,
    barcodeStr: barcode("20260601", "W3X4"),
    stockedAt: daysAgo(23),
  });

  // D13: Premium Clip-In 40cm 4 from China (CNY — test currency mapping → use USD)
  const d13 = await createDelivery({
    id: "del-13",
    variantId: vid("premium-clip-in", 40, "4"),
    supplierId: supplier2.id,
    purchasePricePerGramRaw: 190,
    currency: "USD",
    exchangeRate: 235000,
    initialGrams: 200,
    initialPieces: 0,
    remainingGrams: 150,
    remainingPieces: 0,
    barcodeStr: barcode("20260605", "Y5Z6"),
    stockedAt: daysAgo(19),
  });

  // D14: Standard Micro Ring 40cm 2 from India (EUR)
  const d14 = await createDelivery({
    id: "del-14",
    variantId: vid("standard-micro-ring", 40, "2"),
    supplierId: supplier3.id,
    purchasePricePerGramRaw: 120,
    currency: "EUR",
    exchangeRate: 254000,
    initialGrams: 300,
    initialPieces: 0,
    remainingGrams: 260,
    remainingPieces: 0,
    barcodeStr: barcode("20260610", "A7B8"),
    stockedAt: daysAgo(14),
  });

  // D15: Virgin Tape-In 40cm 2 from Ukraine (UAH)
  const d15 = await createDelivery({
    id: "del-15",
    variantId: vid("panenske-tape-in", 40, "2"),
    supplierId: supplier1.id,
    purchasePricePerGramRaw: 480,
    currency: "UAH",
    exchangeRate: 6500,
    initialGrams: 250,
    initialPieces: 0,
    remainingGrams: 220,
    remainingPieces: 0,
    barcodeStr: barcode("20260615", "C9D0"),
    stockedAt: daysAgo(9),
  });
  console.log("  Deliveries + RECEIPT movements OK (15)");

  // ========================================================================
  // 9. CUSTOMERS (5 retail customers)
  // ========================================================================
  const cust1 = await prisma.customer.upsert({
    where: { id: "cust-01" },
    update: {},
    create: {
      id: "cust-01",
      name: "Jana Nováková",
      email: "jana.novakova@email.cz",
      phone: "+420601111222",
    },
  });

  const cust2 = await prisma.customer.upsert({
    where: { id: "cust-02" },
    update: {},
    create: {
      id: "cust-02",
      name: "Petra Svobodová",
      email: "petra.svobodova@email.cz",
      phone: "+420602333444",
    },
  });

  const cust3 = await prisma.customer.upsert({
    where: { id: "cust-03" },
    update: {},
    create: {
      id: "cust-03",
      name: "Kateřina Černá",
      email: "katerina.cerna@email.cz",
      phone: "+420603555666",
    },
  });

  const cust4 = await prisma.customer.upsert({
    where: { id: "cust-04" },
    update: {},
    create: {
      id: "cust-04",
      name: "Martina Kolářová",
      email: "martina.kolarova@email.cz",
    },
  });

  const cust5 = await prisma.customer.upsert({
    where: { id: "cust-05" },
    update: {},
    create: {
      id: "cust-05",
      name: "Tereza Malá",
      email: "tereza.mala@email.cz",
      phone: "+420605777888",
    },
  });
  console.log("  Customers OK (5)");

  // ========================================================================
  // 10. SALES, SALE ITEMS, DISCOUNTS, STOCK MOVEMENTS, INVOICES, PAYMENTS
  // ========================================================================

  // Helper: get variant wholesale & retail price
  async function getVariantPrices(variantId: string) {
    const v = await prisma.variant.findUniqueOrThrow({ where: { id: variantId } });
    return { wholesale: v.wholesalePricePerGram, retail: v.retailPricePerGram };
  }

  // We need delivery purchasePricePerGramCZK for cost calculations
  async function getDeliveryCost(deliveryId: string) {
    const d = await prisma.delivery.findUniqueOrThrow({ where: { id: deliveryId } });
    return d.purchasePricePerGramCZK;
  }

  let invoiceSeq = 1;
  function nextInvoiceNumber(): string {
    return `FV-2026-${String(invoiceSeq++).padStart(4, "0")}`;
  }

  // --- Sale helper ---
  async function createSale(params: {
    saleId: string;
    saleNumber: string;
    customerType: "SALON" | "RETAIL";
    salonId?: string;
    customerId?: string;
    userId: string;
    completedAt: Date;
    items: Array<{
      variantId: string;
      deliveryId: string;
      grams: number;
      pieces: number;
      pricePerGram: number; // selling price per gram
    }>;
    discount?: {
      percent: number;
      type: "STANDARD" | "MARKETING" | "PERSONAL";
    };
  }) {
    // Check if sale already exists
    const existingSale = await prisma.sale.findUnique({ where: { id: params.saleId } });
    if (existingSale) return existingSale;

    // Calculate item totals
    let subtotal = 0;
    let totalCost = 0;
    const itemsData: Array<{
      variantId: string;
      deliveryId: string;
      grams: number;
      pieces: number;
      pricePerGramUsed: number;
      purchasePricePerGramCZK: number;
      lineTotal: number;
    }> = [];

    for (const item of params.items) {
      const cost = await getDeliveryCost(item.deliveryId);
      const lineTotal = item.pricePerGram * item.grams;
      subtotal += lineTotal;
      totalCost += cost * item.grams;
      itemsData.push({
        variantId: item.variantId,
        deliveryId: item.deliveryId,
        grams: item.grams,
        pieces: item.pieces,
        pricePerGramUsed: item.pricePerGram,
        purchasePricePerGramCZK: cost,
        lineTotal,
      });
    }

    let discountAmount = 0;
    if (params.discount) {
      discountAmount = Math.round(subtotal * params.discount.percent / 10000);
    }

    const totalBeforeVat = subtotal - discountAmount;
    const vatAmount = vat21(totalBeforeVat);
    const totalAmount = totalBeforeVat + vatAmount;
    const grossMargin = totalBeforeVat - totalCost;

    const sale = await prisma.sale.create({
      data: {
        id: params.saleId,
        saleNumber: params.saleNumber,
        customerType: params.customerType,
        salonId: params.salonId ?? null,
        customerId: params.customerId ?? null,
        status: "COMPLETED",
        subtotal,
        discountAmount,
        totalBeforeVat,
        vatRate: 2100,
        vatAmount,
        totalAmount,
        totalCostOfGoods: totalCost,
        grossMargin,
        userId: params.userId,
        completedAt: params.completedAt,
        createdAt: params.completedAt,
      },
    });

    // Create sale items + ISSUE stock movements
    for (const item of itemsData) {
      const saleItem = await prisma.saleItem.create({
        data: {
          saleId: sale.id,
          variantId: item.variantId,
          grams: item.grams,
          pieces: item.pieces,
          pricePerGramUsed: item.pricePerGramUsed,
          deliveryId: item.deliveryId,
          purchasePricePerGramCZK: item.purchasePricePerGramCZK,
          lineTotal: item.lineTotal,
        },
      });

      await prisma.stockMovement.create({
        data: {
          deliveryId: item.deliveryId,
          variantId: item.variantId,
          type: "ISSUE",
          grams: item.grams,
          pieces: item.pieces,
          userId: params.userId,
          saleItemId: saleItem.id,
        },
      });
    }

    // Create discount record if applicable
    if (params.discount) {
      await prisma.discount.create({
        data: {
          saleId: sale.id,
          percent: params.discount.percent,
          type: params.discount.type,
          amountHalere: discountAmount,
          givenByUserId: params.userId,
        },
      });
    }

    return sale;
  }

  // --- Invoice helper ---
  async function createInvoice(params: {
    invoiceId: string;
    sale: { id: string; totalBeforeVat: number; vatAmount: number; totalAmount: number };
    salonId?: string;
    customerId?: string;
    buyerName: string;
    buyerIco?: string;
    buyerAddress: string;
    buyerEmail?: string;
    buyerLanguage?: string;
    status: "ISSUED" | "PAID" | "OVERDUE" | "AWAITING";
    issueDate: Date;
    dueDate: Date;
    items: Array<{
      description: string;
      quantity: number;
      unit: string;
      pricePerUnit: number;
      lineTotal: number;
    }>;
  }) {
    const existing = await prisma.invoice.findUnique({ where: { id: params.invoiceId } });
    if (existing) return existing;

    const invNumber = nextInvoiceNumber();
    const vs = invNumber.replace(/[^0-9]/g, "");

    const invoice = await prisma.invoice.create({
      data: {
        id: params.invoiceId,
        type: "INVOICE",
        number: invNumber,
        companyId: company.id,
        salonId: params.salonId ?? null,
        customerId: params.customerId ?? null,
        buyerName: params.buyerName,
        buyerIco: params.buyerIco,
        buyerAddress: params.buyerAddress,
        buyerEmail: params.buyerEmail,
        buyerLanguage: params.buyerLanguage ?? "cs",
        saleId: params.sale.id,
        issueDate: params.issueDate,
        dueDate: params.dueDate,
        variableSymbol: vs,
        subtotal: params.sale.totalBeforeVat,
        vatRate: 2100,
        vatAmount: params.sale.vatAmount,
        total: params.sale.totalAmount,
        status: params.status,
      },
    });

    for (const item of params.items) {
      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          pricePerUnit: item.pricePerUnit,
          lineTotal: item.lineTotal,
        },
      });
    }

    return invoice;
  }

  // ---- SALE 1: Salon Krása - Virgin Clip-In 50cm (SALON) ----
  const vci50Price = (await getVariantPrices(vid("panenske-clip-in", 50, "1B"))).wholesale; // salon pays wholesale
  const sale1 = await createSale({
    saleId: "sale-01",
    saleNumber: "S-2026-0001",
    customerType: "SALON",
    salonId: salon1.id,
    userId: owner.id,
    completedAt: daysAgo(70),
    items: [
      {
        variantId: vid("panenske-clip-in", 50, "1B"),
        deliveryId: d1.id,
        grams: 100,
        pieces: 0,
        pricePerGram: vci50Price,
      },
    ],
  });
  const inv1 = await createInvoice({
    invoiceId: "inv-01",
    sale: sale1,
    salonId: salon1.id,
    buyerName: "Salon Krása Praha",
    buyerIco: "12345678",
    buyerAddress: "Vinohradská 42, Praha 2",
    buyerEmail: "info@salonkrasa.cz",
    status: "PAID",
    issueDate: daysAgo(70),
    dueDate: daysAgo(56),
    items: [
      {
        description: "Panenské Clip-In 50cm 1B - 100g",
        quantity: 100,
        unit: "g",
        pricePerUnit: vci50Price,
        lineTotal: vci50Price * 100,
      },
    ],
  });
  // Payment for inv1
  await prisma.payment.create({
    data: {
      invoiceId: inv1.id,
      amount: sale1.totalAmount,
      date: daysAgo(60),
      matchedVS: inv1.variableSymbol,
      source: "MANUAL",
      note: "Bankovní převod",
    },
  }).catch(() => {}); // ignore if exists

  // ---- SALE 2: Salon Natalia - Premium Tape-In 40cm (SALON, with STANDARD discount) ----
  const pti40Price = (await getVariantPrices(vid("premium-tape-in", 40, "1B"))).wholesale;
  const sale2 = await createSale({
    saleId: "sale-02",
    saleNumber: "S-2026-0002",
    customerType: "SALON",
    salonId: salon3.id,
    userId: owner.id,
    completedAt: daysAgo(65),
    items: [
      {
        variantId: vid("premium-tape-in", 40, "1B"),
        deliveryId: d2.id,
        grams: 80,
        pieces: 4,
        pricePerGram: pti40Price,
      },
    ],
    discount: { percent: 600, type: "STANDARD" }, // GOLD tier = 6%
  });
  const inv2 = await createInvoice({
    invoiceId: "inv-02",
    sale: sale2,
    salonId: salon3.id,
    buyerName: "Salon Natalia",
    buyerAddress: "Stodolní 8, Ostrava",
    buyerEmail: "natalia@salonnatalia.cz",
    buyerLanguage: "ru",
    status: "PAID",
    issueDate: daysAgo(65),
    dueDate: daysAgo(51),
    items: [
      {
        description: "Premium Tape-In 40cm 1B - 80g (4 ks)",
        quantity: 80,
        unit: "g",
        pricePerUnit: pti40Price,
        lineTotal: pti40Price * 80,
      },
    ],
  });
  await prisma.payment.create({
    data: {
      invoiceId: inv2.id,
      amount: sale2.totalAmount,
      date: daysAgo(55),
      matchedVS: inv2.variableSymbol,
      source: "MANUAL",
    },
  }).catch(() => {});

  // ---- SALE 3: Retail - Jana Nováková buys Virgin Clip-In 50cm ----
  const vci50Retail = (await getVariantPrices(vid("panenske-clip-in", 50, "1B"))).retail;
  const sale3 = await createSale({
    saleId: "sale-03",
    saleNumber: "S-2026-0003",
    customerType: "RETAIL",
    customerId: cust1.id,
    userId: employee.id,
    completedAt: daysAgo(60),
    items: [
      {
        variantId: vid("panenske-clip-in", 50, "1B"),
        deliveryId: d1.id,
        grams: 80,
        pieces: 0,
        pricePerGram: vci50Retail,
      },
    ],
  });
  const inv3 = await createInvoice({
    invoiceId: "inv-03",
    sale: sale3,
    customerId: cust1.id,
    buyerName: "Jana Nováková",
    buyerAddress: "Karlovo nám. 5, Praha 2",
    buyerEmail: "jana.novakova@email.cz",
    status: "PAID",
    issueDate: daysAgo(60),
    dueDate: daysAgo(46),
    items: [
      {
        description: "Panenské Clip-In 50cm 1B - 80g",
        quantity: 80,
        unit: "g",
        pricePerUnit: vci50Retail,
        lineTotal: vci50Retail * 80,
      },
    ],
  });
  await prisma.payment.create({
    data: {
      invoiceId: inv3.id,
      amount: sale3.totalAmount,
      date: daysAgo(58),
      matchedVS: inv3.variableSymbol,
      source: "MANUAL",
    },
  }).catch(() => {});

  // ---- SALE 4: Salon Glamour - Standard Keratin 50cm + Micro Ring (SALON, PLATINUM discount) ----
  const sk50Price = (await getVariantPrices(vid("standard-keratin", 50, "1B"))).wholesale;
  const smr50Price = (await getVariantPrices(vid("standard-micro-ring", 50, "1B"))).wholesale;
  const sale4 = await createSale({
    saleId: "sale-04",
    saleNumber: "S-2026-0004",
    customerType: "SALON",
    salonId: salon4.id,
    userId: owner.id,
    completedAt: daysAgo(50),
    items: [
      {
        variantId: vid("standard-keratin", 50, "1B"),
        deliveryId: d3.id,
        grams: 150,
        pieces: 0,
        pricePerGram: sk50Price,
      },
      {
        variantId: vid("standard-micro-ring", 50, "1B"),
        deliveryId: d6.id,
        grams: 120,
        pieces: 0,
        pricePerGram: smr50Price,
      },
    ],
    discount: { percent: 1000, type: "STANDARD" }, // PLATINUM = 10%
  });
  const inv4 = await createInvoice({
    invoiceId: "inv-04",
    sale: sale4,
    salonId: salon4.id,
    buyerName: "Glamour Hair Studio",
    buyerIco: "87654321",
    buyerAddress: "Americká 28, Plzeň",
    buyerEmail: "info@glamourhair.cz",
    status: "PAID",
    issueDate: daysAgo(50),
    dueDate: daysAgo(36),
    items: [
      {
        description: "Standard Keratin 50cm 1B - 150g",
        quantity: 150,
        unit: "g",
        pricePerUnit: sk50Price,
        lineTotal: sk50Price * 150,
      },
      {
        description: "Standard Micro Ring 50cm 1B - 120g",
        quantity: 120,
        unit: "g",
        pricePerUnit: smr50Price,
        lineTotal: smr50Price * 120,
      },
    ],
  });
  await prisma.payment.create({
    data: {
      invoiceId: inv4.id,
      amount: sale4.totalAmount,
      date: daysAgo(42),
      matchedVS: inv4.variableSymbol,
      source: "MANUAL",
    },
  }).catch(() => {});

  // ---- SALE 5: Retail - Petra Svobodová buys Virgin Clip-In 60cm 613 ----
  const vci60613Retail = (await getVariantPrices(vid("panenske-clip-in", 60, "613"))).retail;
  const sale5 = await createSale({
    saleId: "sale-05",
    saleNumber: "S-2026-0005",
    customerType: "RETAIL",
    customerId: cust2.id,
    userId: employee.id,
    completedAt: daysAgo(45),
    items: [
      {
        variantId: vid("panenske-clip-in", 60, "613"),
        deliveryId: d4.id,
        grams: 100,
        pieces: 0,
        pricePerGram: vci60613Retail,
      },
    ],
  });
  const inv5 = await createInvoice({
    invoiceId: "inv-05",
    sale: sale5,
    customerId: cust2.id,
    buyerName: "Petra Svobodová",
    buyerAddress: "Janáčkova 18, Brno",
    buyerEmail: "petra.svobodova@email.cz",
    status: "PAID",
    issueDate: daysAgo(45),
    dueDate: daysAgo(31),
    items: [
      {
        description: "Panenské Clip-In 60cm 613 - 100g",
        quantity: 100,
        unit: "g",
        pricePerUnit: vci60613Retail,
        lineTotal: vci60613Retail * 100,
      },
    ],
  });
  await prisma.payment.create({
    data: {
      invoiceId: inv5.id,
      amount: sale5.totalAmount,
      date: daysAgo(43),
      matchedVS: inv5.variableSymbol,
      source: "MANUAL",
    },
  }).catch(() => {});

  // ---- SALE 6: Salon Oksana - Virgin Tape-In 50cm + Premium Tape-In 50cm (SALON) ----
  const vti50Price = (await getVariantPrices(vid("panenske-tape-in", 50, "1B"))).wholesale;
  const pti50Price = (await getVariantPrices(vid("premium-tape-in", 50, "4"))).wholesale;
  const sale6 = await createSale({
    saleId: "sale-06",
    saleNumber: "S-2026-0006",
    customerType: "SALON",
    salonId: salon6.id,
    userId: owner.id,
    completedAt: daysAgo(35),
    items: [
      {
        variantId: vid("panenske-tape-in", 50, "1B"),
        deliveryId: d7.id,
        grams: 100,
        pieces: 0,
        pricePerGram: vti50Price,
      },
      {
        variantId: vid("premium-tape-in", 50, "4"),
        deliveryId: d8.id,
        grams: 70,
        pieces: 0,
        pricePerGram: pti50Price,
      },
    ],
    discount: { percent: 300, type: "STANDARD" }, // SILVER = 3%
  });
  const inv6 = await createInvoice({
    invoiceId: "inv-06",
    sale: sale6,
    salonId: salon6.id,
    buyerName: "Salon Oksana",
    buyerAddress: "Lannova 12, České Budějovice",
    buyerEmail: "oksana@salonoksana.cz",
    buyerLanguage: "uk",
    status: "ISSUED",
    issueDate: daysAgo(35),
    dueDate: daysAgo(21),
    items: [
      {
        description: "Panenské Tape-In 50cm 1B - 100g",
        quantity: 100,
        unit: "g",
        pricePerUnit: vti50Price,
        lineTotal: vti50Price * 100,
      },
      {
        description: "Premium Tape-In 50cm 4 - 70g",
        quantity: 70,
        unit: "g",
        pricePerUnit: pti50Price,
        lineTotal: pti50Price * 70,
      },
    ],
  });
  // Partial payment for inv6
  await prisma.payment.create({
    data: {
      invoiceId: inv6.id,
      amount: Math.round(sale6.totalAmount * 0.5),
      date: daysAgo(25),
      matchedVS: inv6.variableSymbol,
      source: "MANUAL",
      note: "Záloha 50 %",
    },
  }).catch(() => {});

  // ---- SALE 7: Salon Olena - Standard Keratin 50cm 613 (SALON, marketing discount) ----
  const sk50613Price = (await getVariantPrices(vid("standard-keratin", 50, "613"))).wholesale;
  const sale7 = await createSale({
    saleId: "sale-07",
    saleNumber: "S-2026-0007",
    customerType: "SALON",
    salonId: salon2.id,
    userId: employee.id,
    completedAt: daysAgo(28),
    items: [
      {
        variantId: vid("standard-keratin", 50, "613"),
        deliveryId: d3.id,
        grams: 100,
        pieces: 0,
        pricePerGram: sk50613Price,
      },
    ],
    discount: { percent: 500, type: "MARKETING" }, // 5% marketing
  });
  const inv7 = await createInvoice({
    invoiceId: "inv-07",
    sale: sale7,
    salonId: salon2.id,
    buyerName: "Salon Olena",
    buyerAddress: "Masarykova 15, Brno",
    buyerEmail: "olena@salonolena.cz",
    buyerLanguage: "uk",
    status: "OVERDUE",
    issueDate: daysAgo(28),
    dueDate: daysAgo(14),
    items: [
      {
        description: "Standard Keratin 50cm 613 - 100g",
        quantity: 100,
        unit: "g",
        pricePerUnit: sk50613Price,
        lineTotal: sk50613Price * 100,
      },
    ],
  });

  // ---- SALE 8: Retail - Kateřina Černá buys Premium Clip-In 50cm ----
  const pci50Retail = (await getVariantPrices(vid("premium-clip-in", 50, "1B"))).retail;
  const sale8 = await createSale({
    saleId: "sale-08",
    saleNumber: "S-2026-0008",
    customerType: "RETAIL",
    customerId: cust3.id,
    userId: employee.id,
    completedAt: daysAgo(20),
    items: [
      {
        variantId: vid("premium-clip-in", 50, "1B"),
        deliveryId: d5.id,
        grams: 150,
        pieces: 0,
        pricePerGram: pci50Retail,
      },
    ],
    discount: { percent: 300, type: "PERSONAL" }, // 3% personal
  });
  const inv8 = await createInvoice({
    invoiceId: "inv-08",
    sale: sale8,
    customerId: cust3.id,
    buyerName: "Kateřina Černá",
    buyerAddress: "Husova 7, Praha 1",
    buyerEmail: "katerina.cerna@email.cz",
    status: "PAID",
    issueDate: daysAgo(20),
    dueDate: daysAgo(6),
    items: [
      {
        description: "Premium Clip-In 50cm 1B - 150g",
        quantity: 150,
        unit: "g",
        pricePerUnit: pci50Retail,
        lineTotal: pci50Retail * 150,
      },
    ],
  });
  await prisma.payment.create({
    data: {
      invoiceId: inv8.id,
      amount: sale8.totalAmount,
      date: daysAgo(18),
      matchedVS: inv8.variableSymbol,
      source: "MANUAL",
    },
  }).catch(() => {});

  // ---- SALE 9: Salon Krása - Sale Weft 40cm + Virgin Keratin 60cm (SALON) ----
  const swPrice = (await getVariantPrices(vid("vyprodej-weft", 40, "1B"))).wholesale;
  const vk60Price = (await getVariantPrices(vid("panenske-keratin", 60, "1B"))).wholesale;
  const sale9 = await createSale({
    saleId: "sale-09",
    saleNumber: "S-2026-0009",
    customerType: "SALON",
    salonId: salon1.id,
    userId: owner.id,
    completedAt: daysAgo(12),
    items: [
      {
        variantId: vid("vyprodej-weft", 40, "1B"),
        deliveryId: d11.id,
        grams: 200,
        pieces: 0,
        pricePerGram: swPrice,
      },
      {
        variantId: vid("panenske-keratin", 60, "1B"),
        deliveryId: d9.id,
        grams: 70,
        pieces: 0,
        pricePerGram: vk60Price,
      },
    ],
    discount: { percent: 300, type: "STANDARD" }, // SILVER
  });
  const inv9 = await createInvoice({
    invoiceId: "inv-09",
    sale: sale9,
    salonId: salon1.id,
    buyerName: "Salon Krása Praha",
    buyerIco: "12345678",
    buyerAddress: "Vinohradská 42, Praha 2",
    buyerEmail: "info@salonkrasa.cz",
    status: "ISSUED",
    issueDate: daysAgo(12),
    dueDate: daysAgo(-2), // due in 2 days
    items: [
      {
        description: "Výprodej Weft 40cm 1B - 200g",
        quantity: 200,
        unit: "g",
        pricePerUnit: swPrice,
        lineTotal: swPrice * 200,
      },
      {
        description: "Panenské Keratin 60cm 1B - 70g",
        quantity: 70,
        unit: "g",
        pricePerUnit: vk60Price,
        lineTotal: vk60Price * 70,
      },
    ],
  });

  // ---- SALE 10: Retail - Tereza Malá buys Standard Keratin 60cm ----
  const sk60Retail = (await getVariantPrices(vid("standard-keratin", 60, "1B"))).retail;
  const sale10 = await createSale({
    saleId: "sale-10",
    saleNumber: "S-2026-0010",
    customerType: "RETAIL",
    customerId: cust5.id,
    userId: employee.id,
    completedAt: daysAgo(5),
    items: [
      {
        variantId: vid("standard-keratin", 60, "1B"),
        deliveryId: d10.id,
        grams: 80,
        pieces: 0,
        pricePerGram: sk60Retail,
      },
    ],
  });
  const inv10 = await createInvoice({
    invoiceId: "inv-10",
    sale: sale10,
    customerId: cust5.id,
    buyerName: "Tereza Malá",
    buyerAddress: "Korunní 33, Praha 2",
    buyerEmail: "tereza.mala@email.cz",
    status: "AWAITING",
    issueDate: daysAgo(5),
    dueDate: daysAgo(-9), // due in 9 days
    items: [
      {
        description: "Standard Keratin 60cm 1B - 80g",
        quantity: 80,
        unit: "g",
        pricePerUnit: sk60Retail,
        lineTotal: sk60Retail * 80,
      },
    ],
  });

  console.log("  Sales (10) + SaleItems + Invoices (10) + Payments OK");

  // ========================================================================
  // 11. RETURNS (3 returns)
  // ========================================================================

  // Find sale items for returns
  const sale1Items = await prisma.saleItem.findMany({ where: { saleId: sale1.id } });
  const sale5Items = await prisma.saleItem.findMany({ where: { saleId: sale5.id } });
  const sale7Items = await prisma.saleItem.findMany({ where: { saleId: sale7.id } });

  // Return 1: Approved return from Salon Krása - 30g back to stock
  const return1Existing = await prisma.return.findFirst({ where: { id: "ret-01" } });
  if (!return1Existing && sale1Items.length > 0) {
    const ret1 = await prisma.return.create({
      data: {
        id: "ret-01",
        saleId: sale1.id,
        saleItemId: sale1Items[0].id,
        salonId: salon1.id,
        deliveryId: d1.id,
        grams: 30,
        pieces: 0,
        reason: "Zákaznice vrátila nepoužité vlasy, nedopovídala barva",
        status: "APPROVED",
        approvedByUserId: owner.id,
        approvedAt: daysAgo(55),
        createdByUserId: owner.id,
        createdAt: daysAgo(58),
      },
    });

    // Stock movement for approved return
    await prisma.stockMovement.create({
      data: {
        deliveryId: d1.id,
        variantId: vid("panenske-clip-in", 50, "1B"),
        type: "RETURN",
        grams: 30,
        pieces: 0,
        userId: owner.id,
        returnId: ret1.id,
      },
    });
  }

  // Return 2: Pending return from retail customer Petra
  const return2Existing = await prisma.return.findFirst({ where: { id: "ret-02" } });
  if (!return2Existing && sale5Items.length > 0) {
    await prisma.return.create({
      data: {
        id: "ret-02",
        saleId: sale5.id,
        saleItemId: sale5Items[0].id,
        deliveryId: d4.id,
        grams: 20,
        pieces: 0,
        reason: "Zákaznice vrací nerozbalený balíček",
        status: "PENDING",
        createdByUserId: owner.id,
        createdAt: daysAgo(30),
      },
    });
  }

  // Return 3: Approved return from Salon Olena
  const return3Existing = await prisma.return.findFirst({ where: { id: "ret-03" } });
  if (!return3Existing && sale7Items.length > 0) {
    const ret3 = await prisma.return.create({
      data: {
        id: "ret-03",
        saleId: sale7.id,
        saleItemId: sale7Items[0].id,
        salonId: salon2.id,
        deliveryId: d3.id,
        grams: 40,
        pieces: 0,
        reason: "Salon vrací neprodané vlasy, přebytek objednávky",
        status: "APPROVED",
        approvedByUserId: owner.id,
        approvedAt: daysAgo(20),
        createdByUserId: owner.id,
        createdAt: daysAgo(22),
      },
    });

    await prisma.stockMovement.create({
      data: {
        deliveryId: d3.id,
        variantId: vid("standard-keratin", 50, "613"),
        type: "RETURN",
        grams: 40,
        pieces: 0,
        userId: owner.id,
        returnId: ret3.id,
      },
    });
  }
  console.log("  Returns OK (3)");

  // ========================================================================
  // 12. COMPLAINTS (3 complaints)
  // ========================================================================
  const complaint1Existing = await prisma.complaint.findFirst({ where: { id: "comp-01" } });
  if (!complaint1Existing) {
    await prisma.complaint.create({
      data: {
        id: "comp-01",
        saleId: sale2.id,
        salonId: salon3.id,
        deliveryId: d2.id,
        grams: 40,
        pieces: 2,
        description: "Vlasy se třepí po prvním mytí, podezření na špatnou kvalitu šarže",
        status: "OPEN",
        createdByUserId: owner.id,
        createdAt: daysAgo(40),
      },
    });

    await prisma.stockMovement.create({
      data: {
        deliveryId: d2.id,
        variantId: vid("premium-tape-in", 40, "1B"),
        type: "COMPLAINT",
        grams: 40,
        pieces: 2,
        userId: owner.id,
        complaintId: "comp-01",
      },
    });
  }

  const complaint2Existing = await prisma.complaint.findFirst({ where: { id: "comp-02" } });
  if (!complaint2Existing) {
    await prisma.complaint.create({
      data: {
        id: "comp-02",
        saleId: sale4.id,
        salonId: salon4.id,
        deliveryId: d6.id,
        grams: 30,
        pieces: 0,
        description: "Nerovnoměrná barva, viditelné skvrny v šarži",
        status: "RESOLVED",
        resolvedAt: daysAgo(30),
        supplierRefundHalere: 150_000,
        supplierRefundDate: daysAgo(25),
        supplierNote: "Dodavatel uznal reklamaci, vráceno 1 500 CZK",
        createdByUserId: owner.id,
        createdAt: daysAgo(45),
      },
    });

    await prisma.stockMovement.create({
      data: {
        deliveryId: d6.id,
        variantId: vid("standard-micro-ring", 50, "1B"),
        type: "COMPLAINT",
        grams: 30,
        pieces: 0,
        userId: owner.id,
        complaintId: "comp-02",
      },
    });
  }

  const complaint3Existing = await prisma.complaint.findFirst({ where: { id: "comp-03" } });
  if (!complaint3Existing) {
    await prisma.complaint.create({
      data: {
        id: "comp-03",
        deliveryId: d9.id,
        grams: 15,
        pieces: 0,
        description: "Keratin bondy se rozpadají, nekvalitní zpracování",
        status: "SUPPLIER_CLAIM",
        supplierNote: "Odesláno dodavateli k posouzení",
        createdByUserId: owner.id,
        createdAt: daysAgo(15),
      },
    });
  }
  console.log("  Complaints OK (3)");

  // ========================================================================
  // 13. ORDERS (4 salon orders)
  // ========================================================================
  const order1Existing = await prisma.order.findFirst({ where: { id: "ord-01" } });
  if (!order1Existing) {
    const order1 = await prisma.order.create({
      data: {
        id: "ord-01",
        orderNumber: "OBJ-2026-0001",
        salonId: salon1.id,
        status: "COMPLETED",
        estimatedTotal: 500_000,
        confirmedAt: daysAgo(68),
        confirmedBy: owner.id,
        completedAt: daysAgo(65),
        note: "Pravidelná objednávka",
        createdAt: daysAgo(72),
      },
    });
    await prisma.orderItem.create({
      data: {
        orderId: order1.id,
        variantId: vid("panenske-clip-in", 50, "1B"),
        grams: 100,
        pieces: 0,
        pricePerGram: vci50Price,
        lineTotal: vci50Price * 100,
      },
    });
  }

  const order2Existing = await prisma.order.findFirst({ where: { id: "ord-02" } });
  if (!order2Existing) {
    const order2 = await prisma.order.create({
      data: {
        id: "ord-02",
        orderNumber: "OBJ-2026-0002",
        salonId: salon3.id,
        status: "CONFIRMED",
        estimatedTotal: 800_000,
        confirmedAt: daysAgo(5),
        confirmedBy: owner.id,
        note: "Velká objednávka pro letní sezónu",
        internalNote: "Ověřit dostupnost 60cm variant",
        createdAt: daysAgo(8),
      },
    });
    await prisma.orderItem.create({
      data: {
        orderId: order2.id,
        variantId: vid("panenske-keratin", 60, "1B"),
        grams: 200,
        pieces: 0,
        pricePerGram: vk60Price,
        lineTotal: vk60Price * 200,
      },
    });
    await prisma.orderItem.create({
      data: {
        orderId: order2.id,
        variantId: vid("premium-tape-in", 50, "4"),
        grams: 100,
        pieces: 0,
        pricePerGram: pti50Price,
        lineTotal: pti50Price * 100,
      },
    });
  }

  const order3Existing = await prisma.order.findFirst({ where: { id: "ord-03" } });
  if (!order3Existing) {
    const order3 = await prisma.order.create({
      data: {
        id: "ord-03",
        orderNumber: "OBJ-2026-0003",
        salonId: salon5.id,
        status: "NEW",
        estimatedTotal: 300_000,
        note: "První objednávka nového salonu",
        createdAt: daysAgo(3),
      },
    });
    await prisma.orderItem.create({
      data: {
        orderId: order3.id,
        variantId: vid("standard-keratin", 50, "1B"),
        grams: 100,
        pieces: 0,
        pricePerGram: sk50Price,
        lineTotal: sk50Price * 100,
      },
    });
  }

  const order4Existing = await prisma.order.findFirst({ where: { id: "ord-04" } });
  if (!order4Existing) {
    const order4 = await prisma.order.create({
      data: {
        id: "ord-04",
        orderNumber: "OBJ-2026-0004",
        salonId: salon6.id,
        status: "COMPLETED",
        estimatedTotal: 450_000,
        confirmedAt: daysAgo(38),
        confirmedBy: owner.id,
        completedAt: daysAgo(35),
        createdAt: daysAgo(40),
      },
    });
    await prisma.orderItem.create({
      data: {
        orderId: order4.id,
        variantId: vid("panenske-tape-in", 50, "1B"),
        grams: 100,
        pieces: 0,
        pricePerGram: vti50Price,
        lineTotal: vti50Price * 100,
      },
    });
  }
  console.log("  Orders OK (4)");

  // ========================================================================
  // 14. OPERATING COSTS (8 entries over last 3 months)
  // ========================================================================
  const costsData = [
    { category: "RENT" as const, amountHalere: 1_500_000, date: daysAgo(84), description: "Nájem sklad duben 2026" },
    { category: "TRANSPORT" as const, amountHalere: 450_000, date: daysAgo(80), description: "Doprava dodávky z Ukrajiny" },
    { category: "ADVERTISING" as const, amountHalere: 500_000, date: daysAgo(70), description: "Instagram reklama duben" },
    { category: "RENT" as const, amountHalere: 1_500_000, date: daysAgo(54), description: "Nájem sklad květen 2026" },
    { category: "FEES" as const, amountHalere: 85_000, date: daysAgo(50), description: "Bankovní poplatky květen" },
    { category: "TRANSPORT" as const, amountHalere: 380_000, date: daysAgo(35), description: "Doprava dodávky z Číny" },
    { category: "RENT" as const, amountHalere: 1_500_000, date: daysAgo(23), description: "Nájem sklad červen 2026" },
    { category: "ADVERTISING" as const, amountHalere: 750_000, date: daysAgo(15), description: "Facebook + Instagram reklama červen" },
    { category: "FEES" as const, amountHalere: 92_000, date: daysAgo(10), description: "Bankovní poplatky červen" },
    { category: "OTHER" as const, amountHalere: 250_000, date: daysAgo(5), description: "Kancelářské potřeby a obalový materiál" },
  ];

  for (const cost of costsData) {
    const existing = await prisma.operatingCost.findFirst({
      where: { description: cost.description },
    });
    if (!existing) {
      await prisma.operatingCost.create({
        data: { ...cost, createdByUserId: owner.id },
      });
    }
  }
  console.log("  Operating costs OK (10)");

  // ========================================================================
  // 15. PARTNERS (3 partners)
  // ========================================================================
  await prisma.partner.upsert({
    where: { userId: owner.id },
    update: {},
    create: {
      name: "Admin Partner (Hlavní)",
      userId: owner.id,
      share: 5000, // 50%
    },
  });

  // Create additional partner users
  const partner2Password = await hash("partner123", 12);
  const partner2User = await prisma.user.upsert({
    where: { email: "partner2@hairora.cz" },
    update: {},
    create: {
      email: "partner2@hairora.cz",
      name: "Jan Novotný",
      hashedPassword: partner2Password,
      role: "OWNER",
    },
  });
  await prisma.partner.upsert({
    where: { userId: partner2User.id },
    update: {},
    create: {
      name: "Jan Novotný",
      userId: partner2User.id,
      share: 3000, // 30%
    },
  });

  const partner3User = await prisma.user.upsert({
    where: { email: "partner3@hairora.cz" },
    update: {},
    create: {
      email: "partner3@hairora.cz",
      name: "Martin Dvořák",
      hashedPassword: await hash("partner123", 12),
      role: "OWNER",
    },
  });
  await prisma.partner.upsert({
    where: { userId: partner3User.id },
    update: {},
    create: {
      name: "Martin Dvořák",
      userId: partner3User.id,
      share: 2000, // 20%
    },
  });
  console.log("  Partners OK (3)");

  // ========================================================================
  // 16. SAMPLE REQUESTS (3)
  // ========================================================================
  const products = await prisma.product.findMany();
  const findProduct = (slug: string) => products.find((p) => p.slug === slug);

  const sr1Existing = await prisma.sampleRequest.findFirst({ where: { id: "sr-01" } });
  if (!sr1Existing) {
    await prisma.sampleRequest.create({
      data: {
        id: "sr-01",
        salonId: salon5.id,
        salonName: "Beauty Point Liberec",
        productId: findProduct("panenske-clip-in")!.id,
        status: "APPROVED",
        grams: 20,
        resolvedAt: daysAgo(50),
        resolvedBy: owner.id,
        resolution: "Odesláno kurýrem, 20g vzorkové balení",
        note: "Nový salon, chce vyzkoušet kvalitu",
        createdAt: daysAgo(55),
      },
    });
  }

  const sr2Existing = await prisma.sampleRequest.findFirst({ where: { id: "sr-02" } });
  if (!sr2Existing) {
    await prisma.sampleRequest.create({
      data: {
        id: "sr-02",
        salonId: salon2.id,
        salonName: "Salon Olena",
        productId: findProduct("premium-tape-in")!.id,
        status: "SENT",
        grams: 15,
        resolvedAt: daysAgo(10),
        resolvedBy: owner.id,
        resolution: "Vzorky odeslány",
        note: "Chce porovnat s virgin řadou",
        createdAt: daysAgo(12),
      },
    });
  }

  const sr3Existing = await prisma.sampleRequest.findFirst({ where: { id: "sr-03" } });
  if (!sr3Existing) {
    await prisma.sampleRequest.create({
      data: {
        id: "sr-03",
        salonId: salon4.id,
        salonName: "Glamour Hair Studio",
        productId: findProduct("standard-micro-ring")!.id,
        status: "REQUESTED",
        grams: 25,
        note: "Zvažuje rozšíření nabídky o micro ring",
        createdAt: daysAgo(3),
      },
    });
  }
  console.log("  Sample requests OK (3)");

  // ========================================================================
  // 17. NOTIFICATIONS (6 for different users)
  // ========================================================================
  const notifData = [
    {
      recipientId: owner.id,
      type: "NEW_ORDER" as const,
      title: "Nová objednávka OBJ-2026-0003",
      message: "Salon Beauty Point Liberec vytvořil novou objednávku Standard Keratin 50cm.",
      read: false,
      createdAt: daysAgo(3),
    },
    {
      recipientId: owner.id,
      type: "SAMPLE_REQUEST" as const,
      title: "Žádost o vzorek",
      message: "Glamour Hair Studio požádal o vzorek Standard Micro Ring (25g).",
      read: false,
      createdAt: daysAgo(3),
    },
    {
      recipientId: owner.id,
      type: "RETURN_REQUEST" as const,
      title: "Nová vratka ke schválení",
      message: "Petra Svobodová žádá o vrácení 20g Panenské Clip-In 60cm 613.",
      read: true,
      readAt: daysAgo(28),
      createdAt: daysAgo(30),
    },
    {
      recipientId: salonUser.id,
      type: "INVOICE_ISSUED" as const,
      title: "Nová faktura FV-2026-0009",
      message: "Byla vystavena faktura za objednávku Výprodej Weft + Panenské Keratin.",
      read: false,
      createdAt: daysAgo(12),
    },
    {
      recipientId: salonUser3.id,
      type: "ORDER_CONFIRMED" as const,
      title: "Objednávka OBJ-2026-0002 potvrzena",
      message: "Vaše objednávka byla potvrzena a připravuje se k expedici.",
      read: true,
      readAt: daysAgo(4),
      createdAt: daysAgo(5),
    },
    {
      recipientId: salonUser2.id,
      type: "PAYMENT_REMINDER" as const,
      title: "Upomínka: Faktura po splatnosti",
      message: "Faktura FV-2026-0007 je po splatnosti. Prosíme o úhradu.",
      read: false,
      createdAt: daysAgo(7),
    },
  ];

  for (const n of notifData) {
    const existing = await prisma.notification.findFirst({
      where: { title: n.title, recipientId: n.recipientId },
    });
    if (!existing) {
      await prisma.notification.create({ data: n });
    }
  }
  console.log("  Notifications OK (6)");

  // ========================================================================
  // 18. INVOICE COUNTER
  // ========================================================================
  await prisma.invoiceCounter.upsert({
    where: { year: 2026 },
    update: { lastNumber: invoiceSeq - 1 },
    create: { year: 2026, lastNumber: invoiceSeq - 1 },
  });
  console.log("  Invoice counter OK");

  // ========================================================================
  // DONE
  // ========================================================================
  console.log("\nSeed completed successfully!");
  console.log("Summary:");
  console.log("  - 8 users (owner, employee, 3 salon users, 2 partner users + employee)");
  console.log("  - 6 salons (BRONZE, SILVER, GOLD, PLATINUM)");
  console.log("  - 8 products with ~40 variants");
  console.log("  - 4 suppliers (UA, CN, IN, VN)");
  console.log("  - 15 deliveries with RECEIPT stock movements");
  console.log("  - 10 sales with invoices, discounts, and ISSUE stock movements");
  console.log("  - 5 retail customers");
  console.log("  - 3 returns (2 APPROVED, 1 PENDING)");
  console.log("  - 3 complaints (OPEN, RESOLVED, SUPPLIER_CLAIM)");
  console.log("  - 4 orders (COMPLETED, CONFIRMED, NEW, COMPLETED)");
  console.log("  - 10 operating costs");
  console.log("  - 3 partners (50/30/20 split)");
  console.log("  - 3 sample requests");
  console.log("  - 6 notifications");
  console.log("  - 1 company + loyalty settings + price settings");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
