import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      company: true,
      items: true,
      payments: true,
      sale: { select: { id: true, saleNumber: true, customerType: true } },
      creditNotes: { select: { id: true, number: true, total: true } },
      originalInvoice: { select: { id: true, number: true } },
    },
  });

  if (!invoice)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (
    session.user.role === "SALON" &&
    invoice.salonId !== session.user.salonId
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(invoice);
}
