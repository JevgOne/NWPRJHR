import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { completeSaleSchema } from "@/lib/validations/sale";
import { completeSale } from "@/lib/sales";
import { createInvoiceFromSale, createInternalDocument } from "@/lib/invoicing";
import { serializeSaleForRole } from "@/lib/api/sale-serializer";
import { logAudit, getClientIp } from "@/lib/audit";
import { sendInvoiceEmail, sendPaymentDetailsEmail } from "@/lib/invoice-email";
import { generateSpayd } from "@/lib/spayd";
import { generateQRCodeDataUrl } from "@/lib/qr-code";

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
  let invoice: { id: string; number: string } | null = null;
  let qrDataUrl: string | null = null;
  let paymentInfo: { bankAccount: string; variableSymbol: string; amount: number; iban?: string } | null = null;

  try {
    if (pt === "CASH") {
      // CASH: payment received -> create invoice + send email immediately
      const inv = await createInvoiceFromSale(sale.id);
      invoice = { id: inv.id, number: inv.number };
      sendInvoiceEmail(inv.id, { skipQr: true }).catch((e) =>
        console.error("[Sales API] Invoice email failed:", e)
      );
    } else if (pt === "TRANSFER") {
      // TRANSFER: no invoice yet — generate QR payment data + send email
      const company = await prisma.company.findFirst({ where: { isDefault: true } });
      const vs = sale.saleNumber ?? sale.id.slice(0, 8);
      if (company?.bankIban) {
        const spayd = generateSpayd({
          iban: company.bankIban,
          amount: sale.totalAmount / 100,
          variableSymbol: vs,
          message: `Prodej ${sale.saleNumber ?? ""}`.trim(),
        });
        qrDataUrl = await generateQRCodeDataUrl(spayd);

        // Send payment details email with QR code
        const saleForEmail = await prisma.sale.findUnique({
          where: { id: sale.id },
          select: {
            salon: { select: { email: true, name: true, language: true } },
            customer: { select: { email: true, name: true } },
            customerType: true,
          },
        });
        const recipientEmail = saleForEmail?.customerType === "SALON"
          ? saleForEmail.salon?.email
          : saleForEmail?.customer?.email;
        const recipientName = saleForEmail?.customerType === "SALON"
          ? saleForEmail.salon?.name ?? ""
          : saleForEmail?.customer?.name ?? "";
        const lang = saleForEmail?.customerType === "SALON"
          ? saleForEmail.salon?.language ?? "cs"
          : "cs";

        if (recipientEmail) {
          sendPaymentDetailsEmail({
            recipientEmail,
            recipientName,
            lang,
            amount: sale.totalAmount,
            bankAccount: company.bankAccount,
            iban: company.bankIban,
            variableSymbol: vs,
            saleNumber: sale.saleNumber ?? "",
          }).catch((e) => console.error("[Sales API] Payment details email failed:", e));
        }
      }
      if (company) {
        paymentInfo = {
          bankAccount: company.bankAccount,
          variableSymbol: vs,
          amount: sale.totalAmount,
          iban: company.bankIban ?? undefined,
        };
      }
    } else if (pt === "PROMO" || pt === "WRITEOFF") {
      // PROMO/WRITEOFF: internal document for accounting
      await createInternalDocument(sale.id, pt);
    }
  } catch (docErr) {
    console.error("[Sales API] Post-sale processing failed:", docErr);
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
    {
      ...serializeSaleForRole(full, session.user.role),
      invoice: invoice ?? undefined,
      qrPayment: qrDataUrl ?? undefined,
      paymentInfo: paymentInfo ?? undefined,
    },
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
