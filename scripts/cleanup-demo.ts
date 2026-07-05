/**
 * Cleanup script: Remove all demo/seed data from Turso DB.
 *
 * KEEP:
 *   - 3 real admin users: jevgenij@hairland.cz, inga@hairland.cz, martin@hairland.cz
 *   - Firma Alvento Solutions s.r.o. (company)
 *   - ALL products and variants (real data)
 *   - Price settings, loyalty settings, B2B settings
 *   - Invoice counters
 *   - Blog posts, batch announcements, promo codes, spin entries
 *   - Complaint tickets (from public form)
 *   - Contact messages, inquiries (from public form)
 *
 * DELETE (in FK-safe order):
 *   - Demo notifications, payment reminders
 *   - Discount bearers → discounts
 *   - Payments → invoice items → invoices
 *   - Stock movements → sale items → sales
 *   - Returns, complaints
 *   - Order items → reservations → orders
 *   - Sample requests
 *   - Operating costs, partner withdrawals → partners
 *   - Deliveries (demo only — identified by demo supplier IDs)
 *   - Demo customers
 *   - Stylists (seeded)
 *   - Demo salons (6 seeded ones)
 *   - Demo users (identified by @hairora.cz, @salonolena.cz, @salonnatalia.cz emails)
 *   - Demo company "Hairora s.r.o." (id: company-default)
 *   - Seeded reviews (all 8)
 *   - Audit logs referencing demo users
 *
 * Uses Turso HTTP API directly (not Prisma).
 */

const TURSO_URL = process.env.TURSO_DATABASE_URL || "https://hairora-eu-jevgone.aws-eu-west-1.turso.io";
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_TOKEN) {
  console.error("TURSO_AUTH_TOKEN is required");
  process.exit(1);
}

const API_URL = TURSO_URL.replace("libsql://", "https://").replace(/\/$/, "") + "/v2/pipeline";

interface TursoStatement {
  type: "execute";
  stmt: { sql: string; args?: Array<{ type: "text" | "integer"; value: string }> };
}

interface TursoResult {
  results: Array<{
    type: string;
    response?: {
      type: string;
      result?: {
        affected_row_count: number;
        rows?: Array<Array<{ type: string; value: string }>>;
        cols?: Array<{ name: string }>;
      };
    };
    error?: { message: string };
  }>;
}

async function executePipeline(statements: TursoStatement[]): Promise<TursoResult> {
  const body = JSON.stringify({
    requests: [
      ...statements,
      { type: "close" },
    ],
  });

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TURSO_TOKEN}`,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Turso API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<TursoResult>;
}

function sql(query: string): TursoStatement {
  return { type: "execute", stmt: { sql: query } };
}

// Known demo IDs from seed.ts
const DEMO_USER_EMAILS = [
  "owner@hairora.cz",
  "employee@hairora.cz",
  "salon@hairora.cz",
  "olena@salonolena.cz",
  "natalia@salonnatalia.cz",
  "partner2@hairora.cz",
  "partner3@hairora.cz",
];

const DEMO_SALON_IDS = [
  "salon-krasa-praha",
  "salon-olena-brno",
  "salon-natalia-ostrava",
  "salon-glamour-plzen",
  "salon-beauty-liberec",
  "salon-oksana-cb",
];

const DEMO_SUPPLIER_IDS = [
  "supplier-ukraine-1",
  "supplier-china-1",
  "supplier-india-1",
  "supplier-vietnam-1",
];

const DEMO_DELIVERY_IDS = Array.from({ length: 15 }, (_, i) =>
  `del-${String(i + 1).padStart(2, "0")}`
);

const DEMO_SALE_IDS = Array.from({ length: 10 }, (_, i) =>
  `sale-${String(i + 1).padStart(2, "0")}`
);

const DEMO_INVOICE_IDS = Array.from({ length: 10 }, (_, i) =>
  `inv-${String(i + 1).padStart(2, "0")}`
);

const DEMO_CUSTOMER_IDS = Array.from({ length: 5 }, (_, i) =>
  `cust-${String(i + 1).padStart(2, "0")}`
);

const DEMO_RETURN_IDS = ["ret-01", "ret-02", "ret-03"];
const DEMO_COMPLAINT_IDS = ["comp-01", "comp-02", "comp-03"];
const DEMO_ORDER_IDS = ["ord-01", "ord-02", "ord-03", "ord-04"];
const DEMO_SAMPLE_IDS = ["sr-01", "sr-02", "sr-03"];

function inList(ids: string[]): string {
  return ids.map((id) => `'${id}'`).join(", ");
}

async function main() {
  console.log("=== Hairora Demo Data Cleanup ===\n");

  // Step 1: First, get demo user IDs by email
  console.log("Step 0: Looking up demo user IDs...");
  const lookupResult = await executePipeline([
    sql(`SELECT id, email FROM users WHERE email IN (${inList(DEMO_USER_EMAILS)})`),
  ]);

  const userRows = lookupResult.results[0]?.response?.result?.rows ?? [];
  const demoUserIds = userRows.map((row) => row[0].value);
  console.log(`  Found ${demoUserIds.length} demo users: ${userRows.map((r) => r[1].value).join(", ")}`);

  if (demoUserIds.length === 0) {
    console.log("No demo users found. Database may already be clean.");
    return;
  }

  // Step 1: Delete leaf entities (no FK dependents)
  console.log("\nStep 1: Deleting notifications, payment reminders, audit logs...");
  const step1 = await executePipeline([
    // Notifications for demo users
    sql(`DELETE FROM notifications WHERE recipientId IN (${inList(demoUserIds)})`),
    // Payment reminders for demo salons
    sql(`DELETE FROM payment_reminders WHERE salonId IN (${inList(DEMO_SALON_IDS)})`),
    // Audit logs for demo users
    sql(`DELETE FROM audit_logs WHERE userId IN (${inList(demoUserIds)})`),
    // Comment likes by demo users
    sql(`DELETE FROM comment_likes WHERE userId IN (${inList(demoUserIds)})`),
    // Article likes by demo users
    sql(`DELETE FROM article_likes WHERE userId IN (${inList(demoUserIds)})`),
    // Comments by demo users
    sql(`DELETE FROM comments WHERE userId IN (${inList(demoUserIds)})`),
  ]);
  for (let i = 0; i < step1.results.length - 1; i++) {
    const r = step1.results[i];
    if (r.error) console.error(`  Error: ${r.error.message}`);
    else console.log(`  Deleted ${r.response?.result?.affected_row_count ?? 0} rows`);
  }

  // Step 2: Delete discount bearers → discounts (FK chain)
  console.log("\nStep 2: Deleting discount bearers, discounts...");
  const step2 = await executePipeline([
    // Discount bearers for discounts on demo sales
    sql(`DELETE FROM discount_bearers WHERE discountId IN (
      SELECT id FROM discounts WHERE saleId IN (${inList(DEMO_SALE_IDS)})
    )`),
    // Discounts on demo sales
    sql(`DELETE FROM discounts WHERE saleId IN (${inList(DEMO_SALE_IDS)})`),
  ]);
  for (let i = 0; i < step2.results.length - 1; i++) {
    const r = step2.results[i];
    if (r.error) console.error(`  Error: ${r.error.message}`);
    else console.log(`  Deleted ${r.response?.result?.affected_row_count ?? 0} rows`);
  }

  // Step 3: Delete payments → invoice items → invoices
  console.log("\nStep 3: Deleting payments, invoice items, invoices...");
  const step3 = await executePipeline([
    sql(`DELETE FROM payments WHERE invoiceId IN (${inList(DEMO_INVOICE_IDS)})`),
    sql(`DELETE FROM invoice_items WHERE invoiceId IN (${inList(DEMO_INVOICE_IDS)})`),
    sql(`DELETE FROM invoices WHERE id IN (${inList(DEMO_INVOICE_IDS)})`),
  ]);
  for (let i = 0; i < step3.results.length - 1; i++) {
    const r = step3.results[i];
    if (r.error) console.error(`  Error: ${r.error.message}`);
    else console.log(`  Deleted ${r.response?.result?.affected_row_count ?? 0} rows`);
  }

  // Step 4: Delete returns, complaints (they reference sales, deliveries)
  console.log("\nStep 4: Deleting returns, complaints...");
  const step4 = await executePipeline([
    sql(`DELETE FROM returns WHERE id IN (${inList(DEMO_RETURN_IDS)})`),
    sql(`DELETE FROM complaints WHERE id IN (${inList(DEMO_COMPLAINT_IDS)})`),
  ]);
  for (let i = 0; i < step4.results.length - 1; i++) {
    const r = step4.results[i];
    if (r.error) console.error(`  Error: ${r.error.message}`);
    else console.log(`  Deleted ${r.response?.result?.affected_row_count ?? 0} rows`);
  }

  // Step 5: Delete stock movements → sale items → sales
  console.log("\nStep 5: Deleting stock movements, sale items, sales...");
  const step5 = await executePipeline([
    // Stock movements linked to demo deliveries
    sql(`DELETE FROM stock_movements WHERE deliveryId IN (${inList(DEMO_DELIVERY_IDS)})`),
    // Sale items from demo sales
    sql(`DELETE FROM sale_items WHERE saleId IN (${inList(DEMO_SALE_IDS)})`),
    // Demo sales
    sql(`DELETE FROM sales WHERE id IN (${inList(DEMO_SALE_IDS)})`),
  ]);
  for (let i = 0; i < step5.results.length - 1; i++) {
    const r = step5.results[i];
    if (r.error) console.error(`  Error: ${r.error.message}`);
    else console.log(`  Deleted ${r.response?.result?.affected_row_count ?? 0} rows`);
  }

  // Step 6: Delete order items → reservations → orders
  console.log("\nStep 6: Deleting order items, reservations, orders...");
  const step6 = await executePipeline([
    sql(`DELETE FROM order_items WHERE orderId IN (${inList(DEMO_ORDER_IDS)})`),
    sql(`DELETE FROM reservations WHERE orderId IN (${inList(DEMO_ORDER_IDS)})`),
    sql(`DELETE FROM orders WHERE id IN (${inList(DEMO_ORDER_IDS)})`),
  ]);
  for (let i = 0; i < step6.results.length - 1; i++) {
    const r = step6.results[i];
    if (r.error) console.error(`  Error: ${r.error.message}`);
    else console.log(`  Deleted ${r.response?.result?.affected_row_count ?? 0} rows`);
  }

  // Step 7: Delete sample requests, operating costs
  console.log("\nStep 7: Deleting sample requests, operating costs...");
  const step7 = await executePipeline([
    sql(`DELETE FROM sample_requests WHERE id IN (${inList(DEMO_SAMPLE_IDS)})`),
    // Operating costs created by demo users
    sql(`DELETE FROM operating_costs WHERE createdByUserId IN (${inList(demoUserIds)})`),
  ]);
  for (let i = 0; i < step7.results.length - 1; i++) {
    const r = step7.results[i];
    if (r.error) console.error(`  Error: ${r.error.message}`);
    else console.log(`  Deleted ${r.response?.result?.affected_row_count ?? 0} rows`);
  }

  // Step 8: Delete partner withdrawals → partners
  console.log("\nStep 8: Deleting partner withdrawals, partners...");
  const step8 = await executePipeline([
    sql(`DELETE FROM partner_withdrawals WHERE partnerId IN (
      SELECT id FROM partners WHERE userId IN (${inList(demoUserIds)})
    )`),
    sql(`DELETE FROM partners WHERE userId IN (${inList(demoUserIds)})`),
  ]);
  for (let i = 0; i < step8.results.length - 1; i++) {
    const r = step8.results[i];
    if (r.error) console.error(`  Error: ${r.error.message}`);
    else console.log(`  Deleted ${r.response?.result?.affected_row_count ?? 0} rows`);
  }

  // Step 9: Delete deliveries (demo suppliers only)
  console.log("\nStep 9: Deleting demo deliveries...");
  const step9 = await executePipeline([
    sql(`DELETE FROM deliveries WHERE id IN (${inList(DEMO_DELIVERY_IDS)})`),
  ]);
  for (let i = 0; i < step9.results.length - 1; i++) {
    const r = step9.results[i];
    if (r.error) console.error(`  Error: ${r.error.message}`);
    else console.log(`  Deleted ${r.response?.result?.affected_row_count ?? 0} rows`);
  }

  // Step 10: Delete suppliers
  console.log("\nStep 10: Deleting demo suppliers...");
  const step10 = await executePipeline([
    sql(`DELETE FROM suppliers WHERE id IN (${inList(DEMO_SUPPLIER_IDS)})`),
  ]);
  for (let i = 0; i < step10.results.length - 1; i++) {
    const r = step10.results[i];
    if (r.error) console.error(`  Error: ${r.error.message}`);
    else console.log(`  Deleted ${r.response?.result?.affected_row_count ?? 0} rows`);
  }

  // Step 11: Delete demo customers
  console.log("\nStep 11: Deleting demo customers...");
  const step11 = await executePipeline([
    sql(`DELETE FROM customers WHERE id IN (${inList(DEMO_CUSTOMER_IDS)})`),
  ]);
  for (let i = 0; i < step11.results.length - 1; i++) {
    const r = step11.results[i];
    if (r.error) console.error(`  Error: ${r.error.message}`);
    else console.log(`  Deleted ${r.response?.result?.affected_row_count ?? 0} rows`);
  }

  // Step 12: Delete stylists (all seeded — real stylists will be added later)
  console.log("\nStep 12: Deleting seeded stylists...");
  const step12 = await executePipeline([
    sql(`DELETE FROM stylists WHERE salonId IN (${inList(DEMO_SALON_IDS)}) OR name IN ('Natalia Petrova', 'Olena Kovalenko', 'Katerina Bondarenko', 'Marina Savchenko', 'Alina Kovalchuk')`),
  ]);
  for (let i = 0; i < step12.results.length - 1; i++) {
    const r = step12.results[i];
    if (r.error) console.error(`  Error: ${r.error.message}`);
    else console.log(`  Deleted ${r.response?.result?.affected_row_count ?? 0} rows`);
  }

  // Step 13: Delete seeded reviews (all 8)
  console.log("\nStep 13: Deleting seeded reviews...");
  const step13 = await executePipeline([
    sql(`DELETE FROM reviews WHERE authorName IN ('Natálie K.', 'Olena M.', 'Petra Dvořáková', 'Анна С.', 'Lucie Nováková', 'Марина Б.', 'Kateřina H.', 'Svetlana T.')`),
  ]);
  for (let i = 0; i < step13.results.length - 1; i++) {
    const r = step13.results[i];
    if (r.error) console.error(`  Error: ${r.error.message}`);
    else console.log(`  Deleted ${r.response?.result?.affected_row_count ?? 0} rows`);
  }

  // Step 14: Delete demo salons
  console.log("\nStep 14: Deleting demo salons...");
  const step14 = await executePipeline([
    sql(`DELETE FROM salons WHERE id IN (${inList(DEMO_SALON_IDS)})`),
  ]);
  for (let i = 0; i < step14.results.length - 1; i++) {
    const r = step14.results[i];
    if (r.error) console.error(`  Error: ${r.error.message}`);
    else console.log(`  Deleted ${r.response?.result?.affected_row_count ?? 0} rows`);
  }

  // Step 15: Delete demo users
  console.log("\nStep 15: Deleting demo users...");
  const step15 = await executePipeline([
    sql(`DELETE FROM users WHERE email IN (${inList(DEMO_USER_EMAILS)})`),
  ]);
  for (let i = 0; i < step15.results.length - 1; i++) {
    const r = step15.results[i];
    if (r.error) console.error(`  Error: ${r.error.message}`);
    else console.log(`  Deleted ${r.response?.result?.affected_row_count ?? 0} rows`);
  }

  // Step 16: Delete demo company "Hairora s.r.o."
  console.log("\nStep 16: Deleting demo company 'Hairora s.r.o.'...");
  const step16 = await executePipeline([
    sql(`DELETE FROM companies WHERE id = 'company-default' AND ico = '12345678'`),
  ]);
  for (let i = 0; i < step16.results.length - 1; i++) {
    const r = step16.results[i];
    if (r.error) console.error(`  Error: ${r.error.message}`);
    else console.log(`  Deleted ${r.response?.result?.affected_row_count ?? 0} rows`);
  }

  // Step 17: Verify what's left
  console.log("\n=== Verification ===");
  const verify = await executePipeline([
    sql(`SELECT COUNT(*) as cnt FROM users`),
    sql(`SELECT email FROM users`),
    sql(`SELECT COUNT(*) as cnt FROM salons`),
    sql(`SELECT COUNT(*) as cnt FROM products`),
    sql(`SELECT COUNT(*) as cnt FROM variants`),
    sql(`SELECT COUNT(*) as cnt FROM companies`),
    sql(`SELECT name, ico FROM companies`),
    sql(`SELECT COUNT(*) as cnt FROM sales`),
    sql(`SELECT COUNT(*) as cnt FROM invoices`),
    sql(`SELECT COUNT(*) as cnt FROM deliveries`),
    sql(`SELECT COUNT(*) as cnt FROM suppliers`),
    sql(`SELECT COUNT(*) as cnt FROM customers`),
    sql(`SELECT COUNT(*) as cnt FROM reviews`),
    sql(`SELECT COUNT(*) as cnt FROM stylists`),
  ]);

  const labels = [
    "Users", "User emails", "Salons", "Products", "Variants",
    "Companies", "Company details", "Sales", "Invoices",
    "Deliveries", "Suppliers", "Customers", "Reviews", "Stylists",
  ];

  for (let i = 0; i < labels.length; i++) {
    const r = verify.results[i];
    if (r.error) {
      console.log(`  ${labels[i]}: ERROR — ${r.error.message}`);
    } else {
      const rows = r.response?.result?.rows;
      if (rows && rows.length > 0) {
        if (rows[0].length === 1) {
          console.log(`  ${labels[i]}: ${rows[0][0].value}`);
        } else {
          console.log(`  ${labels[i]}: ${rows.map((row) => row.map((c) => c.value).join(" | ")).join(", ")}`);
        }
      }
    }
  }

  console.log("\n=== Cleanup complete! ===");
}

main().catch((e) => {
  console.error("Cleanup failed:", e);
  process.exit(1);
});
