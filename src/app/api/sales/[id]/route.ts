import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeSaleForRole } from "@/lib/api/sale-serializer";

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
      salon: true,
      customer: true,
      user: true,
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
  };

  return NextResponse.json(result);
}
