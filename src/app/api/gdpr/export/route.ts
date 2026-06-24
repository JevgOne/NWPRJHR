import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(request: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, id: userId, salonId } = session.user;

  if (role === "SALON") {
    if (!salonId) {
      return NextResponse.json({ error: "No salon linked" }, { status: 400 });
    }

    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
        orders: { select: { id: true, orderNumber: true, status: true, estimatedTotal: true, createdAt: true } },
        invoices: { select: { id: true, number: true, total: true, status: true, issueDate: true, dueDate: true } },
        sales: { select: { id: true, saleNumber: true, totalAmount: true, status: true, completedAt: true } },
        sampleRequests: { select: { id: true, status: true, grams: true, createdAt: true } },
      },
    });

    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    await logAudit({
      userId,
      userEmail: session.user.email,
      action: "GDPR_EXPORT",
      entity: "Salon",
      entityId: salonId,
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({
      exportDate: new Date().toISOString(),
      type: "salon_data_export",
      salon: {
        name: salon.name,
        ico: salon.ico,
        dic: salon.dic,
        contactPerson: salon.contactPerson,
        email: salon.email,
        phone: salon.phone,
        city: salon.city,
        address: salon.address,
        language: salon.language,
        tier: salon.tier,
        points: salon.points,
        totalRevenue: salon.totalRevenue,
        startDate: salon.startDate,
        createdAt: salon.createdAt,
      },
      users: salon.users,
      orders: salon.orders,
      invoices: salon.invoices,
      sales: salon.sales,
      sampleRequests: salon.sampleRequests,
    });
  }

  // OWNER/EMPLOYEE — export own user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });

  await logAudit({
    userId,
    userEmail: session.user.email,
    action: "GDPR_EXPORT",
    entity: "User",
    entityId: userId,
    ipAddress: getClientIp(request),
  });

  return NextResponse.json({
    exportDate: new Date().toISOString(),
    type: "user_data_export",
    user,
  });
}
