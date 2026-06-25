import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await client.execute("ALTER TABLE products ADD COLUMN origin TEXT");
console.log("✓ Added origin column to products table");
