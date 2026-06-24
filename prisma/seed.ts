import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import { hash } from "bcryptjs";
import dotenv from "dotenv";
import { calculateRetailPrice } from "../src/lib/pricing";

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const adapter = new PrismaLibSQL(client);
const prisma = new PrismaClient({ adapter });

async function main() {
  // === Users ===
  const ownerPassword = await hash("owner123", 12);
  await prisma.user.upsert({
    where: { email: "owner@hairora.cz" },
    update: {},
    create: {
      email: "owner@hairora.cz",
      name: "Admin Hairora",
      hashedPassword: ownerPassword,
      role: "OWNER",
    },
  });

  const employeePassword = await hash("employee123", 12);
  await prisma.user.upsert({
    where: { email: "employee@hairora.cz" },
    update: {},
    create: {
      email: "employee@hairora.cz",
      name: "Prodejce",
      hashedPassword: employeePassword,
      role: "EMPLOYEE",
    },
  });

  const salon = await prisma.salon.upsert({
    where: { id: "test-salon-1" },
    update: {},
    create: {
      id: "test-salon-1",
      name: "Salon Krasa Praha",
      ico: "12345678",
      city: "Praha",
      language: "cs",
      tier: "SILVER",
      totalRevenue: 7_500_000,
      points: 750,
    },
  });

  const salonPassword = await hash("salon123", 12);
  await prisma.user.upsert({
    where: { email: "salon@hairora.cz" },
    update: {},
    create: {
      email: "salon@hairora.cz",
      name: "Salon Krasa",
      hashedPassword: salonPassword,
      role: "SALON",
      salonId: salon.id,
    },
  });

  // === Price Settings ===
  const priceSettingsData = [
    { category: "VIRGIN" as const, markupPercent: 80 },
    { category: "PREMIUM" as const, markupPercent: 60 },
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

  // === Products & Variants ===
  const markupMap: Record<string, number> = {};
  for (const ps of priceSettingsData) markupMap[ps.category] = ps.markupPercent;

  const productsData = [
    {
      name: "Panenske Clip-In",
      nameUk: "Незаймане Clip-In (Virgin)",
      nameRu: "Натуральные Clip-In (Virgin)",
      category: "VIRGIN" as const,
      processingType: "CLIP_IN" as const,
      slug: "panenske-clip-in",
      variants: [
        { lengthCm: 30, color: "1B", wholesalePricePerGram: 1500 },
        { lengthCm: 30, color: "613", wholesalePricePerGram: 1800 },
        { lengthCm: 40, color: "1B", wholesalePricePerGram: 1800 },
        { lengthCm: 40, color: "613", wholesalePricePerGram: 2100 },
        { lengthCm: 50, color: "1B", wholesalePricePerGram: 2200 },
        { lengthCm: 50, color: "613", wholesalePricePerGram: 2500 },
        { lengthCm: 60, color: "1B", wholesalePricePerGram: 2800 },
        { lengthCm: 60, color: "613", wholesalePricePerGram: 3200 },
      ],
    },
    {
      name: "Premium Tape-In",
      nameUk: "Преміум Tape-In",
      nameRu: "Премиум Tape-In",
      category: "PREMIUM" as const,
      processingType: "TAPE_IN" as const,
      slug: "premium-tape-in",
      variants: [
        { lengthCm: 40, color: "1B", wholesalePricePerGram: 1200 },
        { lengthCm: 40, color: "4", wholesalePricePerGram: 1200 },
        { lengthCm: 50, color: "1B", wholesalePricePerGram: 1500 },
        { lengthCm: 50, color: "4", wholesalePricePerGram: 1500 },
      ],
    },
    {
      name: "Standard Keratin",
      nameUk: "Стандарт Keratin",
      nameRu: "Стандарт Keratin",
      category: "STANDARD" as const,
      processingType: "KERATIN" as const,
      slug: "standard-keratin",
      variants: [
        { lengthCm: 50, color: "1B", wholesalePricePerGram: 800 },
        { lengthCm: 50, color: "613", wholesalePricePerGram: 900 },
        { lengthCm: 60, color: "1B", wholesalePricePerGram: 1000 },
      ],
    },
  ];

  for (const pd of productsData) {
    const { variants, ...productData } = pd;
    const markup = markupMap[productData.category] ?? 0;

    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productData,
        photos: [],
      },
    });

    for (const v of variants) {
      await prisma.variant.upsert({
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
          retailPricePerGram: calculateRetailPrice(
            v.wholesalePricePerGram,
            markup
          ),
        },
      });
    }
  }

  // === Suppliers ===
  const supplier1 = await prisma.supplier.upsert({
    where: { id: "supplier-ukraine-1" },
    update: {},
    create: {
      id: "supplier-ukraine-1",
      name: "Hair Factory Ukraine",
      contactName: "Olena",
      country: "UA",
      email: "olena@hairfactory.ua",
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
    },
  });

  // === Deliveries (stock-in) ===
  // Find variants for deliveries
  const allVariants = await prisma.variant.findMany({
    include: { product: true },
  });

  const findVariant = (slug: string, lengthCm: number, color: string) => {
    return allVariants.find(
      (v) =>
        v.product.slug === slug &&
        v.lengthCm === lengthCm &&
        v.color === color
    );
  };

  const v1 = findVariant("panenske-clip-in", 50, "1B");
  const v2 = findVariant("premium-tape-in", 40, "1B");

  if (v1) {
    const existing1 = await prisma.delivery.findUnique({
      where: { barcode: "HR-20260601-A1B2" },
    });
    if (!existing1) {
      const d1 = await prisma.delivery.create({
        data: {
          variantId: v1.id,
          supplierId: supplier1.id,
          purchasePricePerGramRaw: 500,
          currency: "UAH",
          exchangeRate: 6500,
          purchasePricePerGramCZK: Math.round((500 * 6500) / 10000),
          initialGrams: 500,
          initialPieces: 0,
          remainingGrams: 500,
          remainingPieces: 0,
          barcode: "HR-20260601-A1B2",
          stockedAt: new Date("2026-06-01"),
        },
      });
      await prisma.stockMovement.create({
        data: {
          deliveryId: d1.id,
          variantId: v1.id,
          type: "RECEIPT",
          grams: 500,
          pieces: 0,
          userId: (await prisma.user.findUnique({ where: { email: "owner@hairora.cz" } }))!.id,
        },
      });
    }
  }

  if (v2) {
    const existing2 = await prisma.delivery.findUnique({
      where: { barcode: "HR-20260615-C3D4" },
    });
    if (!existing2) {
      const d2 = await prisma.delivery.create({
        data: {
          variantId: v2.id,
          supplierId: supplier2.id,
          purchasePricePerGramRaw: 200,
          currency: "USD",
          exchangeRate: 235000,
          purchasePricePerGramCZK: Math.round((200 * 235000) / 10000),
          initialGrams: 200,
          initialPieces: 10,
          pieceWeightGrams: 20,
          remainingGrams: 200,
          remainingPieces: 10,
          barcode: "HR-20260615-C3D4",
          stockedAt: new Date("2026-06-15"),
        },
      });
      await prisma.stockMovement.create({
        data: {
          deliveryId: d2.id,
          variantId: v2.id,
          type: "RECEIPT",
          grams: 200,
          pieces: 10,
          userId: (await prisma.user.findUnique({ where: { email: "owner@hairora.cz" } }))!.id,
        },
      });
    }
  }

  // === Partners ===
  const owner = await prisma.user.findUnique({ where: { email: "owner@hairora.cz" } });
  if (owner) {
    await prisma.partner.upsert({
      where: { userId: owner.id },
      update: {},
      create: {
        name: "Admin Partner",
        userId: owner.id,
        share: 3333,
      },
    });
  }

  // === Customers (retail) ===
  await prisma.customer.upsert({
    where: { id: "customer-1" },
    update: {},
    create: {
      id: "customer-1",
      name: "Jana Novakova",
      email: "jana@example.com",
      phone: "+420111222333",
    },
  });

  await prisma.customer.upsert({
    where: { id: "customer-2" },
    update: {},
    create: {
      id: "customer-2",
      name: "Petra Svobodova",
      email: "petra@example.com",
    },
  });

  // === Default Company ===
  await prisma.company.upsert({
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

  // === Loyalty Settings ===
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

  // === Additional Salons ===
  await prisma.salon.upsert({
    where: { id: "test-salon-2" },
    update: {},
    create: {
      id: "test-salon-2",
      name: "Salon Olena",
      contactPerson: "Olena",
      city: "Brno",
      language: "uk",
      tier: "BRONZE",
    },
  });

  await prisma.salon.upsert({
    where: { id: "test-salon-3" },
    update: {},
    create: {
      id: "test-salon-3",
      name: "Salon Natalia",
      contactPerson: "Natalia",
      city: "Ostrava",
      language: "ru",
      tier: "GOLD",
      totalRevenue: 20_000_000,
      points: 2000,
    },
  });

  // === Operating Costs (sample) ===
  if (owner) {
    const sampleCosts = [
      {
        category: "RENT" as const,
        amountHalere: 1_500_000,
        date: new Date("2026-06-01"),
        description: "Nájem sklad červen 2026",
      },
      {
        category: "TRANSPORT" as const,
        amountHalere: 350_000,
        date: new Date("2026-06-05"),
        description: "Doprava dodávka z Ukrajiny",
      },
      {
        category: "ADVERTISING" as const,
        amountHalere: 500_000,
        date: new Date("2026-06-10"),
        description: "Instagram reklama červen",
      },
      {
        category: "FEES" as const,
        amountHalere: 80_000,
        date: new Date("2026-06-15"),
        description: "Bankovní poplatky",
      },
    ];

    for (const cost of sampleCosts) {
      const existing = await prisma.operatingCost.findFirst({
        where: { description: cost.description, date: cost.date },
      });
      if (!existing) {
        await prisma.operatingCost.create({
          data: {
            ...cost,
            createdByUserId: owner.id,
          },
        });
      }
    }
  }

  console.log("Seed completed.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
