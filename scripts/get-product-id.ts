import "dotenv/config";
import { createClient } from "@libsql/client";

const c = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });

async function main() {
  const r = await c.execute("SELECT id FROM products WHERE archived = 0 LIMIT 1");
  console.log(r.rows[0]?.id);

  const reviews = await c.execute("SELECT id, authorName, featured FROM reviews LIMIT 5");
  console.log("Reviews in DB:", reviews.rows.length);
  reviews.rows.forEach(r => console.log(`  ${r.id} - ${r.authorName} (featured: ${r.featured})`));
}
main();
