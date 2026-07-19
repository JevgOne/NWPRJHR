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
    "company_altro",
    "Altro servis group s.r.o.",
    "23673389",
    "CZ23673389",
    "Školská 660/3, Nové Město",
    "Praha",
    "110 00",
    "6424423004/5500",
    "CZ5550000000006424423004",
    "RZBCCZPP",
    "Raiffeisenbank",
    "info@hairland.cz",
    null,
    1,           // isDefault = true
    1,           // active = true
    now,
    now,
  ],
});

console.log("✓ Altro servis group s.r.o. added as default company");
