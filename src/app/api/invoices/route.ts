import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createInvoiceSchema } from "@/lib/validations/invoice";
import { createInvoiceFromSale } from "@/lib/invoicing";
import { logAudit, getClientIp } from "@/lib/audit";
import { createSalonNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const salonId = searchParams.get("salonId");
  const companyId = searchParams.get("companyId");
  const type = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

  const where: Record<string, unknown> = {};

  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
    where.salonId = session.user.salonId;
    if (!session.user.salonId)
      return NextResponse.json({ data: [], total: 0, page, limit, totalPages: 0 });
  }

  if (status) where.status = status;
  if (salonId && session.user.role !== "SALON" && session.user.role !== "HAIRDRESSER") where.salonId = salonId;
  if (companyId) where.companyId = companyId;
  if (type) where.type = type;
  if (from || to) {
    where.issueDate = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        company: { select: { name: true } },
        items: true,
      },
      orderBy: { issueDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({
    data: invoices,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const invoice = await createInvoiceFromSale(
    parsed.data.saleId,
    parsed.data.companyId
  );

  await logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "INVOICE_CREATED",
    entity: "Invoice",
    entityId: invoice.id,
    detail: { number: invoice.number, total: invoice.total },
    ipAddress: getClientIp(request),
  });

  // Notify salon about new invoice
  if (invoice.salonId) {
    createSalonNotification({
      salonId: invoice.salonId,
      type: "INVOICE_ISSUED",
      data: { invoiceId: invoice.id, invoiceNumber: invoice.number },
    }).catch(() => {});
  }

  return NextResponse.json(invoice, { status: 201 });
}
