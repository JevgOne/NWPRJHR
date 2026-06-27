import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit, getClientIp } from "@/lib/audit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, id: userId, salonId } = session.user;

  // Only SALON users can request deletion of their salon data
  // OWNER can delete customer data via separate admin endpoint
  if (role === "SALON" || role === "HAIRDRESSER") {
    if (!salonId) {
      return NextResponse.json({ error: "No salon linked" }, { status: 400 });
    }

    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { name: true, email: true },
    });

    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    // Anonymize salon personal data (keep financial records for legal compliance)
    await prisma.salon.update({
      where: { id: salonId },
      data: {
        contactPerson: null,
        email: null,
        phone: null,
        address: null,
        notes: null,
        archived: true,
        archivedAt: new Date(),
      },
    });

    // Anonymize linked user accounts
    const salonUsers = await prisma.user.findMany({
      where: { salonId },
      select: { id: true },
    });

    for (const u of salonUsers) {
      await prisma.user.update({
        where: { id: u.id },
        data: {
          name: "Deleted User",
          email: `deleted-${u.id}@anonymized.local`,
          hashedPassword: "DELETED",
        },
      });
    }

    await logAudit({
      userId,
      userEmail: session.user.email,
      action: "GDPR_DELETE",
      entity: "Salon",
      entityId: salonId,
      detail: { salonName: salon.name },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      message: "Personal data anonymized. Financial records retained for legal compliance.",
    });
  }

  // OWNER deleting a customer's data
  if (role === "OWNER") {
    const body = await request.json();
    const { customerId } = body as { customerId?: string };

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId required" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { name: true, email: true },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: "Anonymized",
        email: null,
        phone: null,
        note: null,
        passwordHash: null,
      },
    });

    await logAudit({
      userId,
      userEmail: session.user.email,
      action: "GDPR_DELETE_CUSTOMER",
      entity: "Customer",
      entityId: customerId,
      detail: { customerName: customer.name },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      message: "Customer personal data anonymized.",
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
