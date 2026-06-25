import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Using randomuser.me for realistic portrait photos (free, no API key needed)
const updates = [
  { id: "stylist_01", photo: "https://randomuser.me/api/portraits/women/44.jpg" },
  { id: "stylist_02", photo: "https://randomuser.me/api/portraits/women/68.jpg" },
  { id: "stylist_03", photo: "https://randomuser.me/api/portraits/women/75.jpg" },
  { id: "stylist_04", photo: "https://randomuser.me/api/portraits/women/90.jpg" },
  { id: "stylist_05", photo: "https://randomuser.me/api/portraits/women/85.jpg" },
];

for (const u of updates) {
  await client.execute({
    sql: "UPDATE stylists SET photo = ?, updatedAt = ? WHERE id = ?",
    args: [u.photo, new Date().toISOString(), u.id],
  });
  console.log(`✓ ${u.id} → photo set`);
}

console.log("Done! Stylist photos updated.");
