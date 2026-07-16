import { prisma } from "@/lib/db";

export async function upsertCustomerFromContact(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
}): Promise<string> {
  const emailLower = data.email.toLowerCase().trim();
  const name = `${data.firstName} ${data.lastName}`.trim();

  const existing = await prisma.customer.findFirst({
    where: { email: emailLower },
  });

  if (existing) {
    const updates: Record<string, string> = {};
    if (!existing.phone && data.phone) updates.phone = data.phone;
    if (!existing.city && data.city) updates.city = data.city;
    if (!existing.firstName && data.firstName) updates.firstName = data.firstName;
    if (!existing.lastName && data.lastName) updates.lastName = data.lastName;
    if ((!existing.firstName || !existing.lastName) && data.firstName && data.lastName) {
      updates.name = name;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.customer.update({
        where: { id: existing.id },
        data: updates,
      });
    }

    return existing.id;
  }

  const customer = await prisma.customer.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      name,
      email: emailLower,
      phone: data.phone || null,
      city: data.city || null,
    },
  });

  return customer.id;
}
