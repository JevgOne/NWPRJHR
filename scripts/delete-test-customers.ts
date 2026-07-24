/**
 * TASK-103: Delete test customers from DB.
 *
 * Targets:
 *   - "Test ApiTest"
 *   - "Jitka Zkouška" / "Jitka Zkouska"
 *
 * All FK relations are nullable — SET NULL before delete.
 *
 * Usage: npx tsx scripts/delete-test-customers.ts
 */

import { prisma } from "../src/lib/db";

async function main() {
  // Step 1: Find test customers
  const testCustomers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: "ApiTest" } },
        { name: { contains: "Zkouška" } },
        { name: { contains: "Zkouska" } },
      ],
    },
    select: { id: true, name: true, email: true },
  });

  if (testCustomers.length === 0) {
    console.log("No test customers found. Already deleted?");
    return;
  }

  console.log(`Found ${testCustomers.length} test customer(s):`);
  for (const c of testCustomers) {
    console.log(`  - "${c.name}" (${c.email ?? "no email"}) [${c.id}]`);
  }

  // Step 2: Check related records
  for (const c of testCustomers) {
    const [sales, invoices, orders, inquiries, reservations, referrals] = await Promise.all([
      prisma.sale.count({ where: { customerId: c.id } }),
      prisma.invoice.count({ where: { customerId: c.id } }),
      prisma.order.count({ where: { customerId: c.id } }),
      prisma.inquiry.count({ where: { customerId: c.id } }),
      prisma.productReservation.count({ where: { customerId: c.id } }),
      prisma.referral.count({ where: { referrerCustomerId: c.id } }),
    ]);

    console.log(`\n  "${c.name}" related records:`);
    console.log(`    Sales: ${sales}, Invoices: ${invoices}, Orders: ${orders}`);
    console.log(`    Inquiries: ${inquiries}, Reservations: ${reservations}, Referrals: ${referrals}`);
  }

  // Step 3: Disconnect relations and delete
  for (const c of testCustomers) {
    console.log(`\nDeleting "${c.name}"...`);

    // SET NULL on all FK references
    const [s, i, o, inq, pr, ref] = await Promise.all([
      prisma.sale.updateMany({ where: { customerId: c.id }, data: { customerId: null } }),
      prisma.invoice.updateMany({ where: { customerId: c.id }, data: { customerId: null } }),
      prisma.order.updateMany({ where: { customerId: c.id }, data: { customerId: null } }),
      prisma.inquiry.updateMany({ where: { customerId: c.id }, data: { customerId: null } }),
      prisma.productReservation.updateMany({ where: { customerId: c.id }, data: { customerId: null } }),
      prisma.referral.updateMany({ where: { referrerCustomerId: c.id }, data: { referrerCustomerId: null } }),
    ]);

    console.log(`  Disconnected: ${s.count} sales, ${i.count} invoices, ${o.count} orders, ${inq.count} inquiries, ${pr.count} reservations, ${ref.count} referrals`);

    // Delete the customer
    await prisma.customer.delete({ where: { id: c.id } });
    console.log(`  DELETED: "${c.name}" (${c.id})`);
  }

  console.log("\nDone. All test customers removed.");
}

main()
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  })
  .finally(() => process.exit());
