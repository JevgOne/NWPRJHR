import { prisma } from "../src/lib/db";

async function main() {
  // Find all inquiries without customerId, grouped by email
  const inquiries = await prisma.inquiry.findMany({
    where: { customerId: null },
    orderBy: { createdAt: "desc" },
  });

  if (inquiries.length === 0) {
    console.log("No unlinked inquiries found.");
    return;
  }

  // Group by lowercase email
  const byEmail = new Map<string, typeof inquiries>();
  for (const inq of inquiries) {
    const email = inq.email.toLowerCase().trim();
    if (!byEmail.has(email)) byEmail.set(email, []);
    byEmail.get(email)!.push(inq);
  }

  let customersCreated = 0;
  let inquiriesLinked = 0;

  for (const [email, group] of byEmail) {
    // Check if customer exists
    let customer = await prisma.customer.findFirst({
      where: { email },
    });

    if (!customer) {
      // Create from most recent inquiry
      const latest = group[0];
      const nameParts = latest.name.split(" ");
      const firstName = nameParts[0] || latest.name;
      const lastName = nameParts.slice(1).join(" ") || "";

      customer = await prisma.customer.create({
        data: {
          firstName,
          lastName,
          name: latest.name,
          email,
          phone: latest.phone || null,
          city: latest.city || null,
        },
      });
      customersCreated++;
    }

    // Link all inquiries to this customer
    const ids = group.map((i) => i.id);
    await prisma.inquiry.updateMany({
      where: { id: { in: ids } },
      data: { customerId: customer.id },
    });
    inquiriesLinked += ids.length;
  }

  console.log(`Done: ${customersCreated} customers created, ${inquiriesLinked} inquiries linked.`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
