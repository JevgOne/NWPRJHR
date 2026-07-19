import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createPacket } from "@/lib/packeta";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { saleId } = body;

  if (!saleId) {
    return NextResponse.json({ error: "saleId required" }, { status: 400 });
  }

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      customer: true,
      items: true,
    },
  });

  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  // Use shipping data from Sale itself (copied from Inquiry at sale creation)
  if (!sale.packetaPointId) {
    return NextResponse.json({ error: "No Packeta point found for this sale" }, { status: 400 });
  }

  // Weight estimate from grams (minimum 0.5 kg for Packeta)
  const totalGrams = sale.items.reduce((sum, item) => sum + item.grams, 0);
  const weightKg = Math.max(0.5, totalGrams / 1000);

  // Value in CZK (from halere)
  const valueCzk = sale.totalAmount / 100;

  const result = await createPacket({
    number: sale.saleNumber || sale.id.slice(-8),
    name: sale.customer?.firstName || "",
    surname: sale.customer?.lastName || "",
    email: sale.customer?.email || "",
    phone: sale.customer?.phone || undefined,
    addressId: parseInt(sale.packetaPointId),
    weight: weightKg,
    value: valueCzk,
  });

  if (result.success) {
    await prisma.sale.update({
      where: { id: saleId },
      data: {
        shippingTrackingId: result.barcode,
        shippingStatus: "SHIPPED",
      },
    });

    return NextResponse.json({
      success: true,
      packetId: result.packetId,
      barcode: result.barcode,
    });
  }

  return NextResponse.json(
    { error: result.error || "Packeta API error" },
    { status: 500 }
  );
}
