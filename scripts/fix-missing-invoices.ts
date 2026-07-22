/**
 * Retroactively create invoices for completed sales that are missing them.
 * This fixes sales created when the invoices.reservationId column was missing.
 *
 * Usage: npx tsx scripts/fix-missing-invoices.ts
 * Requires: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.production.local
 */
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.production.local") });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!.replace(/\\n/g, ""),
});

async function main() {
  console.log("=== Fix Missing Invoices ===\n");

  // Find completed sales without invoices
  const result = await client.execute(`
    SELECT s.id, s.saleNumber, s.paymentType, s.totalAmount, s.orderId
    FROM sales s
    LEFT JOIN invoices i ON i.saleId = s.id
    WHERE s.status = 'COMPLETED'
      AND i.id IS NULL
  `);

  if (result.rows.length === 0) {
    console.log("No sales missing invoices. All good!");
    return;
  }

  console.log(`Found ${result.rows.length} sale(s) without invoices:\n`);
  for (const row of result.rows) {
    console.log(`  Sale ${row.saleNumber} — ${row.paymentType} — ${Number(row.totalAmount) / 100} CZK`);
  }

  console.log("\nTo create invoices for these sales, call the confirm-payment API for each:");
  console.log("Or trigger createInvoiceFromSale() programmatically.\n");

  // We'll use the Prisma-based approach via dynamic import
  // Set up the adapter
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaLibSql } = await import("@prisma/adapter-libsql");

  const adapter = new PrismaLibSql(client);
  const prisma = new PrismaClient({ adapter } as any);

  const { createInvoiceFromSale } = await import("../src/lib/invoicing");

  // Override the global prisma instance
  const dbModule = await import("../src/lib/db");
  (dbModule as any).prisma = prisma;

  for (const row of result.rows) {
    const saleId = row.id as string;
    const saleNumber = row.saleNumber as string;
    try {
      console.log(`Creating invoice for Sale ${saleNumber}...`);
      const invoice = await createInvoiceFromSale(saleId);
      console.log(`  ✓ Invoice ${invoice.number} created`);

      // Mark as PAID for CARD/CASH sales
      const paymentType = row.paymentType as string;
      if (paymentType === "CARD" || paymentType === "CASH") {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: invoice.total,
            date: new Date(),
            matchedVS: invoice.variableSymbol,
            source: "MANUAL",
            note: `Retroaktivní potvrzení platby (${paymentType})`,
          },
        });
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: "PAID" },
        });
        console.log(`  ✓ Invoice marked as PAID`);
      }
    } catch (e: any) {
      console.error(`  ✗ Failed for Sale ${saleNumber}: ${e.message}`);
    }
  }

  console.log("\n✅ Done!");
  await prisma.$disconnect();
}

main().catch(console.error);
