import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  const cols = ["ratingQuality", "ratingCommunication", "ratingSpeed"];
  for (const col of cols) {
    try {
      await client.execute(`ALTER TABLE reviews ADD COLUMN ${col} INTEGER`);
      console.log(`Added column ${col}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("duplicate column")) {
        console.log(`Column ${col} already exists, skipping`);
      } else {
        throw e;
      }
    }
  }
  console.log("Done!");
}

main().catch(console.error);
