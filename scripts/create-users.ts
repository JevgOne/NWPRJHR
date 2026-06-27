import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL ?? "",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const HASH = "$2b$12$6fGiWnevfl1.MFr4g5fPN.Ff4UMQ3ngSY7w4jhqZ2o6jOfeWfPedO";

const users = [
  { name: "Jevgenij", email: "jevgenij@hairland.cz" },
  { name: "Inga", email: "inga@hairland.cz" },
  { name: "Martin", email: "martin@hairland.cz" },
];

async function main() {
  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`${u.email} already exists, skipping`);
      continue;
    }
    await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        hashedPassword: HASH,
        role: "OWNER",
      },
    });
    console.log(`Created ${u.email} as OWNER`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
