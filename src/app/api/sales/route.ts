import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { completeSaleSchema } from "@/lib/validations/sale";
import { completeSale } from "@/lib/sales";
import { createInvoiceFromSale, createInternalDocument } from "@/lib/invoicing";
import { serializeSaleForRole } from "@/lib/api/sale-serializer";
import { logAudit, getClientIp } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = completeSaleSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );

  let sale;
  try {
    sale = await completeSale(parsed.data, session.user.id);
  } catch (e) {
    console.error("[Sales API] completeSale failed:", e);
    const message = e instanceof Error ? e.message : "Sale creation failed";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }

  // Post-sale document creation based on payment type
  const pt = parsed.data.paymentType ?? "TRANSFER";
  try {
    if (pt === "TRANSFER") {
      await createInvoiceFromSale(sale.id);
    } else if (pt === "PROMO" || pt === "WRITEOFF") {
      await createInternalDocument(sale.id, pt);
    }
    // CASH — no auto-document, receiptNumber already stored on sale
  } catch (docErr) {
    console.error("[Sales API] Failed to create post-sale document:", docErr);
    // Sale is already completed, don't fail the request
  }

  const full = await prisma.sale.findUniqueOrThrow({
    where: { id: sale.id },
    include: {
      items: true,
      discounts: { include: { bearers: { include: { partner: true } } } },
      salon: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  await logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "SALE_COMPLETED",
    entity: "Sale",
    entityId: sale.id,
    detail: { saleNumber: sale.saleNumber, totalAmount: sale.totalAmount },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(
    serializeSaleForRole(full, session.user.role),
    { status: 201 }
  );
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const salonId = searchParams.get("salonId");
  const customerId = searchParams.get("customerId");
  const customerType = searchParams.get("customerType");
  const userId = searchParams.get("userId");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

  const where: Record<string, unknown> = { status: "COMPLETED" };

  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
    where.salonId = session.user.salonId;
    if (!session.user.salonId)
      return NextResponse.json([], { status: 200 });
  }

  if (from || to) {
    where.completedAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  if (salonId && session.user.role !== "SALON" && session.user.role !== "HAIRDRESSER") where.salonId = salonId;
  if (customerId) where.customerId = customerId;
  if (customerType) where.customerType = customerType;
  if (userId && session.user.role === "OWNER") where.userId = userId;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        items: true,
        discounts: { include: { bearers: { include: { partner: true } } } },
        salon: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { completedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ]);

  const serialized = sales.map((s) =>
    serializeSaleForRole(s, session.user.role)
  );

  return NextResponse.json({
    data: serialized,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
