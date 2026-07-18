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
    },
  });

  if (!invoice)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (
    (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") &&
    invoice.salonId !== session.user.salonId
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const pdfData: InvoicePdfData = {
    type: invoice.type as "INVOICE" | "CREDIT_NOTE",
    number: invoice.number,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    taxDate: invoice.taxDate,
    variableSymbol: invoice.variableSymbol,
    buyerName: invoice.buyerName,
    buyerIco: invoice.buyerIco,
    buyerDic: invoice.buyerDic,
    buyerAddress: invoice.buyerAddress,
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
