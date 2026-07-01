import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deliveryUpdateSchema } from "@/lib/validations/delivery";
import { serializeDeliveryForRole } from "@/lib/api/delivery-serializer";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: {
      supplier: true,
      variant: { include: { product: true } },
      stockMovements: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!delivery)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const serialized = serializeDeliveryForRole(delivery, session.user.role);
  if (!serialized)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Add variant info and movements for detail view
  const result = {
    ...serialized,
    variant: {
      id: delivery.variant.id,
      lengthCm: delivery.variant.lengthCm,
      color: delivery.variant.color,
      product: {
        id: delivery.variant.product.id,
        name: delivery.variant.product.name,
        category: delivery.variant.product.category,
        processingType: delivery.variant.product.processingType,
      },
    },
    ...(session.user.role === "OWNER"
      ? {
          stockMovements: delivery.stockMovements.map((m) => ({
            id: m.id,
            type: m.type,
            grams: m.grams,
            pieces: m.pieces,
            note: m.note,
            createdAt: m.createdAt,
            user: m.user,
          })),
        }
      : {}),
  };

  return NextResponse.json(result);
}

export async function PUT(
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
  const parsed = deliveryUpdateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.delivery.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const delivery = await prisma.delivery.update({
    where: { id },
    data: parsed.data,
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "Delivery",
    entityId: id,
    detail: { changes: parsed.data },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(delivery);
}
