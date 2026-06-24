import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

function calculateRetailPrice(
  wholesaleHalere: number,
  markupPercent: number
): number {
  const raw = wholesaleHalere * (1 + markupPercent / 100);
  return Math.ceil(raw / 100) * 100;
}

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

  console.log("Seed completed.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
