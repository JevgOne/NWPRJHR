import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeSaleForRole } from "@/lib/api/sale-serializer";
import { fifoReturn } from "@/lib/fifo";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
        },
      },
      discounts: { include: { bearers: { include: { partner: true } } } },
      salon: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true, role: true } },
      invoice: { select: { id: true, number: true, status: true } },
    },
  });

  if (!sale)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if ((session.user.role === "SALON" || session.user.role === "HAIRDRESSER") && sale.salonId !== session.user.salonId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const serialized = serializeSaleForRole(sale, session.user.role);

  // Enrich with variant details for detail view
  const result = {
    ...serialized,
    items: sale.items.map((item) => ({
      ...(session.user.role === "OWNER"
        ? {
            id: item.id,
            variantId: item.variantId,
            grams: item.grams,
            pieces: item.pieces,
            pricePerGramUsed: item.pricePerGramUsed,
            deliveryId: item.deliveryId,
            purchasePricePerGramCZK: item.purchasePricePerGramCZK,
            lineTotal: item.lineTotal,
            itemMargin:
              item.lineTotal - item.purchasePricePerGramCZK * item.grams,
          }
        : {
            id: item.id,
            variantId: item.variantId,
            grams: item.grams,
            pieces: item.pieces,
            pricePerGramUsed: item.pricePerGramUsed,
            lineTotal: item.lineTotal,
          }),
      variant: {
        id: item.variant.id,
        lengthCm: item.variant.lengthCm,
        color: item.variant.color,
        product: {
          id: item.variant.product.id,
          name: item.variant.product.name,
          category: item.variant.product.category,
          processingType: item.variant.product.processingType,
        },
      },
    })),
    note: sale.note,
    invoice: sale.invoice ?? undefined,
  };

  return NextResponse.json(result);
}

export async function POST(
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

  if (body.action !== "cancel")
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUniqueOrThrow({
        where: { id },
        include: { items: true },
      });

      if (sale.status === "CANCELLED")
        throw new Error("Sale is already cancelled");

      // Return stock for each sale item
      for (const item of sale.items) {
        await fifoReturn(
          item.deliveryId,
          item.grams,
          item.pieces,
          session.user.id,
          tx
        );
      }

      // Cancel sale
      const updated = await tx.sale.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      // Cancel associated invoice if exists
      const invoice = await tx.invoice.findUnique({
        where: { saleId: id },
      });
      if (invoice) {
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: "CANCELLED" },
        });
      }

      return { sale: updated, invoiceCancelled: !!invoice };
    }, { timeout: 15000 });

    logAudit({
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      action: "CANCEL",
      entity: "Sale",
      entityId: id,
      detail: { saleNumber: result.sale.saleNumber, invoiceCancelled: result.invoiceCancelled },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ success: true, sale: result.sale });
  } catch (e) {
    console.error("[Sale Cancel] Failed:", { saleId: id, error: e });
    const message = e instanceof Error ? e.message : "Cancel failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
