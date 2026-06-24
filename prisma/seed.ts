import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import dotenv from "dotenv";
import { calculateRetailPrice } from "../src/lib/pricing";

dotenv.config();

const adapter = new PrismaPg(process.env.DATABASE_URL!);
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
      name: "Salon Krasa",
      city: "Praha",
      language: "cs",
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

  console.log("Seed completed.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
