import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      authorName TEXT NOT NULL,
      authorPhoto TEXT,
      authorCity TEXT,
      salonName TEXT,
      rating INTEGER NOT NULL DEFAULT 5,
      text TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'MANUAL',
      sourceUrl TEXT,
      instagramEmbed TEXT,
      featured INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      googlePlaceId TEXT,
      googleRating REAL,
      googleTotal INTEGER,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_active_featured ON reviews(active, featured)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_source ON reviews(source)`);

  console.log("Reviews table created!");
}

main().catch(console.error);
