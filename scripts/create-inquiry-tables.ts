import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  console.log("Creating inquiries table...");
  await client.execute(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      salonName TEXT,
      message TEXT,
      locale TEXT NOT NULL DEFAULT 'cs',
      status TEXT NOT NULL DEFAULT 'NEW',
      assignedTo TEXT,
      assignedAt DATETIME,
      internalNote TEXT,
      contactedAt DATETIME,
      completedAt DATETIME,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_inquiries_createdAt ON inquiries(createdAt)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email)`);

  console.log("Creating inquiry_items table...");
  await client.execute(`
    CREATE TABLE IF NOT EXISTS inquiry_items (
      id TEXT PRIMARY KEY NOT NULL,
      inquiryId TEXT NOT NULL,
      productId TEXT NOT NULL,
      productName TEXT NOT NULL,
      lengthCm INTEGER NOT NULL,
      color TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit TEXT NOT NULL DEFAULT 'g',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inquiryId) REFERENCES inquiries(id) ON DELETE CASCADE
    )
  `);

  await client.execute(`CREATE INDEX IF NOT EXISTS idx_inquiry_items_inquiryId ON inquiry_items(inquiryId)`);

  console.log("Creating contact_messages table...");
  await client.execute(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      salonName TEXT,
      message TEXT NOT NULL,
      locale TEXT NOT NULL DEFAULT 'cs',
      assignedTo TEXT,
      assignedAt DATETIME,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`CREATE INDEX IF NOT EXISTS idx_contact_messages_createdAt ON contact_messages(createdAt)`);

  console.log("Done! All tables created successfully.");
}

main().catch(console.error);
