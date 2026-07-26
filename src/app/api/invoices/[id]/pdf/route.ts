import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateInvoicePdf, type InvoicePdfData } from "@/lib/invoice-pdf";

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
      originalInvoice: { select: { number: true } },
      payments: { orderBy: { date: "asc" as const }, take: 1 },
      sale: {
        select: {
          paymentType: true,
          customerType: true,
          customer: { select: { email: true, phone: true, instagram: true } },
          salon: { select: { email: true, phone: true } },
        },
      },
    },
  });

  if (!invoice)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (
    (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") &&
    invoice.salonId !== session.user.salonId
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const paymentMethodLabel = invoice.sale?.paymentType === "CASH"
    ? "Hotově"
    : invoice.sale?.paymentType === "CARD"
    ? "Kartou"
    : invoice.sale?.paymentType === "TRANSFER"
    ? "Převodem"
    : null;

  const pdfData: InvoicePdfData = {
    type: invoice.type as "INVOICE" | "CREDIT_NOTE" | "DEPOSIT",
    number: invoice.number,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    paidDate: invoice.status === "PAID" ? new Date() : null,
    paymentMethod: paymentMethodLabel,
    taxDate: invoice.taxDate,
    variableSymbol: invoice.variableSymbol,
    buyerName: invoice.buyerName,
    buyerIco: invoice.buyerIco,
    buyerDic: invoice.buyerDic,
    buyerAddress: invoice.buyerAddress,
    buyerEmail: invoice.buyerEmail ?? invoice.sale?.customer?.email ?? invoice.sale?.salon?.email,
    buyerPhone: invoice.sale?.customer?.phone ?? invoice.sale?.salon?.phone,
    buyerInstagram: invoice.sale?.customer?.instagram,
    buyerLanguage: invoice.buyerLanguage,
    subtotal: invoice.subtotal,
    vatRate: invoice.vatRate,
    vatAmount: invoice.vatAmount,
    total: invoice.total,
    roundingAmount: invoice.roundingAmount,
    note: invoice.note,
    originalInvoiceNumber: invoice.originalInvoice?.number ?? null,
    company: {
      name: invoice.company.name,
      ico: invoice.company.ico,
      dic: invoice.company.dic,
      address: invoice.company.address,
      bankAccount: invoice.company.bankAccount,
      bankIban: invoice.company.bankIban,
      bankName: invoice.company.bankName,
      contactEmail: invoice.company.contactEmail,
      contactPhone: invoice.company.contactPhone,
    },
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unit: item.unit,
      pricePerUnit: item.pricePerUnit,
      lineTotal: item.lineTotal,
    })),
  };

  const pdfBytes = await generateInvoicePdf(pdfData);

  const filename =
    invoice.type === "CREDIT_NOTE"
      ? `dobropis-${invoice.number}.pdf`
      : `faktura-${invoice.number}.pdf`;

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
