import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { creditNoteSchema } from "@/lib/validations/invoice";
import { createCreditNote } from "@/lib/invoicing";
import { reduceSalonRevenue } from "@/lib/loyalty";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const salonId = searchParams.get("salonId");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10))
  );

  const where: Record<string, unknown> = { type: "CREDIT_NOTE" };

  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
    where.salonId = session.user.salonId;
    if (!session.user.salonId)
      return NextResponse.json({
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      });
  }

  if (salonId && session.user.role !== "SALON" && session.user.role !== "HAIRDRESSER") where.salonId = salonId;

  const [creditNotes, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        company: { select: { name: true } },
        originalInvoice: { select: { id: true, number: true } },
        items: true,
      },
      orderBy: { issueDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({
    data: creditNotes,
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
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = creditNoteSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const creditNote = await createCreditNote(
    parsed.data.originalInvoiceId,
    parsed.data.items,
    parsed.data.reason
  );

  // Reduce salon loyalty revenue on credit note
  if (creditNote.salonId) {
    const returnAmount = Math.abs(creditNote.subtotal);
    await reduceSalonRevenue(creditNote.salonId, returnAmount);
  }

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "CREATE",
    entity: "CreditNote",
    entityId: creditNote.id,
    detail: { number: creditNote.number, total: creditNote.total, originalInvoiceId: parsed.data.originalInvoiceId },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(creditNote, { status: 201 });
}
