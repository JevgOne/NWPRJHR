import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const statements = [
  `CREATE TABLE IF NOT EXISTS "stylists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "photo" TEXT,
    "bio" TEXT,
    "bioUk" TEXT,
    "bioRu" TEXT,
    "specializations" TEXT NOT NULL DEFAULT '[]',
    "languages" TEXT NOT NULL DEFAULT '[]',
    "phone" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "telegram" TEXT,
    "whatsapp" TEXT,
    "city" TEXT,
    "experience" INTEGER,
    "certifications" TEXT NOT NULL DEFAULT '[]',
    "portfolio" TEXT NOT NULL DEFAULT '[]',
    "featured" INTEGER NOT NULL DEFAULT 0,
    "active" INTEGER NOT NULL DEFAULT 1,
    "salonId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stylists_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "salons" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "stylists_slug_key" ON "stylists"("slug")`,
  `CREATE INDEX IF NOT EXISTS "stylists_active_idx" ON "stylists"("active")`,
  `CREATE INDEX IF NOT EXISTS "stylists_featured_idx" ON "stylists"("featured")`,
  `CREATE INDEX IF NOT EXISTS "stylists_salonId_idx" ON "stylists"("salonId")`,
  `CREATE INDEX IF NOT EXISTS "stylists_city_idx" ON "stylists"("city")`,
];

for (const sql of statements) {
  await client.execute(sql);
  console.log("OK:", sql.substring(0, 60) + "...");
}

console.log("Done! Stylists table created.");
