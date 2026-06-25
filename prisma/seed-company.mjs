import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const now = new Date().toISOString();

await client.execute({
  sql: `INSERT OR REPLACE INTO companies (id, name, ico, dic, address, addressCity, addressZip, bankAccount, bankIban, bankBic, bankName, contactEmail, contactPhone, isDefault, active, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  args: [
    "company_alvento",
    "Alvento Solutions s.r.o.",
    "24111953",
    null,        // DIČ - doplnit až bude známo
    "Školská 660/3, Nové Město",
    "Praha",
    "110 00",
    "",          // bankovní účet - doplnit
    null,
    null,
    null,
    "info@hairora.cz",
    null,
    1,           // isDefault = true
    1,           // active = true
    now,
    now,
  ],
});

console.log("✓ Alvento Solutions s.r.o. added as default company");
