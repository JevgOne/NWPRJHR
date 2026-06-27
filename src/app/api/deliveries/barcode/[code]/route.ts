import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeDeliveryForRole } from "@/lib/api/delivery-serializer";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { code } = await params;

  const delivery = await prisma.delivery.findUnique({
    where: { barcode: code },
    include: {
      supplier: true,
      variant: { include: { product: true } },
    },
  });

  if (!delivery)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const serialized = serializeDeliveryForRole(delivery, session.user.role);
  if (!serialized)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    ...serialized,
    variant: {
      id: delivery.variant.id,
      lengthCm: delivery.variant.lengthCm,
      color: delivery.variant.color,
      product: {
        id: delivery.variant.product.id,
        name: delivery.variant.product.name,
        category: delivery.variant.product.category,
      },
    },
  });
}
