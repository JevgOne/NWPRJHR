import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paymentSchema } from "@/lib/validations/invoice";
import { checkInvoicePaid } from "@/lib/invoice-status";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const invoiceId = searchParams.get("invoiceId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (invoiceId) where.invoiceId = invoiceId;
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      invoice: { select: { id: true, number: true, total: true, status: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(payments);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const payment = await prisma.payment.create({
    data: {
      invoiceId: parsed.data.invoiceId,
      amount: parsed.data.amount,
      date: new Date(parsed.data.date),
      matchedVS: parsed.data.matchedVS,
      source: parsed.data.source,
      note: parsed.data.note,
    },
  });

  await checkInvoicePaid(parsed.data.invoiceId);

  return NextResponse.json(payment, { status: 201 });
}
