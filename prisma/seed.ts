import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create owner user
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

  // Create employee user
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

  // Create a test salon
  const salon = await prisma.salon.upsert({
    where: { id: "test-salon-1" },
    update: {},
    create: {
      id: "test-salon-1",
      name: "Salon Krása",
      city: "Praha",
      language: "cs",
    },
  });

  // Create salon user
  const salonPassword = await hash("salon123", 12);
  await prisma.user.upsert({
    where: { email: "salon@hairora.cz" },
    update: {},
    create: {
      email: "salon@hairora.cz",
      name: "Salon Krása",
      hashedPassword: salonPassword,
      role: "SALON",
      salonId: salon.id,
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
