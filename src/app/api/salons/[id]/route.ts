import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateSalonSchema } from "@/lib/validations/salon";
import { createSalonNotification } from "@/lib/notifications";
import { sendNotificationEmail } from "@/lib/email";
import { getApprovalConfirmationEmail } from "@/lib/email-templates";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if ((session.user.role === "SALON" || session.user.role === "HAIRDRESSER") && session.user.salonId !== id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const salon = await prisma.salon.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { items: true },
      },
      sales: {
        orderBy: { completedAt: "desc" },
        take: 10,
        select: {
          id: true,
          saleNumber: true,
          totalAmount: true,
          completedAt: true,
          status: true,
        },
      },
      invoices: {
        orderBy: { issueDate: "desc" },
        take: 10,
        select: {
          id: true,
          number: true,
          total: true,
          status: true,
          issueDate: true,
          dueDate: true,
        },
      },
      sampleRequests: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          product: { select: { name: true } },
        },
      },
      _count: {
        select: { orders: true, sales: true, invoices: true, sampleRequests: true },
      },
    },
  });

  if (!salon)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Calculate stats for OWNER
  if (session.user.role === "OWNER") {
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        salonId: id,
        status: { in: ["ISSUED", "AWAITING", "OVERDUE"] },
      },
      select: { total: true, status: true },
    });

    const totalDebt = unpaidInvoices.reduce((s, i) => s + i.total, 0);
    const overdueCount = unpaidInvoices.filter((i) => i.status === "OVERDUE").length;

    return NextResponse.json({
      ...salon,
      stats: { totalDebt, overdueCount },
    });
  }

  return NextResponse.json(salon);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSalonSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );

  // Check if this is an approval (approved changing from false to true)
  const existingSalon = await prisma.salon.findUnique({ where: { id }, select: { approved: true } });
  const isApproval = !existingSalon?.approved && parsed.data.approved === true;

  const salon = await prisma.salon.update({
    where: { id },
    data: parsed.data,
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: isApproval ? "APPROVE" : "UPDATE",
    entity: "Salon",
    entityId: id,
    detail: { changes: parsed.data, salonName: salon.name },
    ipAddress: getClientIp(request),
  });

  // Notify salon user when approved
  if (isApproval) {
    createSalonNotification({
      salonId: id,
      type: "REGISTRATION",
      title: "Registrace schválena",
      message: "Váš B2B účet byl schválen. Nyní můžete objednávat.",
      data: { approved: true },
    }).catch(() => {});

    // Email confirmation to salon users
    const salonData = await prisma.salon.findUnique({
      where: { id },
      select: { language: true, name: true },
    });
    const salonUsers = await prisma.user.findMany({
      where: { salonId: id, role: { in: ["SALON", "HAIRDRESSER"] } },
      select: { email: true, name: true },
    });

    const lang = salonData?.language ?? "cs";
    for (const user of salonUsers) {
      if (!user.email) continue;
      const emailData = getApprovalConfirmationEmail(lang, {
        name: user.name ?? undefined,
        salonName: salonData?.name ?? "",
      });
      sendNotificationEmail({
        to: user.email,
        toName: user.name ?? undefined,
        subject: emailData.subject,
        body: emailData.text,
        html: emailData.html,
      }).catch(() => {});
    }
  }

  return NextResponse.json(salon);
}
