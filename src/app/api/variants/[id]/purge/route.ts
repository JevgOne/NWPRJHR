import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit, getClientIp } from "@/lib/audit";

/**
 * Hard-delete a variant and all related inventory data.
 * Blocks if variant has completed sales or confirmed orders.
 * If the parent product has no remaining variants, deletes it too.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const variant = await prisma.variant.findUnique({
    where: { id },
    select: {
      id: true,
      productId: true,
      color: true,
      lengthCm: true,
      product: { select: { name: true } },
    },
  });

  if (!variant)
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });

  // Block if there are completed sales
  const completedSales = await prisma.saleItem.count({
    where: { variantId: id, sale: { status: "COMPLETED" } },
  });
  if (completedSales > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${completedSales} completed sale(s) reference this variant` },
      { status: 409 }
    );
  }

  // Block if there are confirmed/shipped orders
  const activeOrders = await prisma.orderItem.count({
    where: {
      variantId: id,
      order: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED"] } },
    },
  });
  if (activeOrders > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${activeOrders} active order(s) reference this variant` },
      { status: 409 }
    );
  }

  // Delete everything in a transaction
  const productId = variant.productId;

  await prisma.$transaction(async (tx) => {
    // 1. Delete stock movements
    await tx.stockMovement.deleteMany({ where: { variantId: id } });

    // 2. Delete reservations
    await tx.reservation.deleteMany({ where: { variantId: id } });

    // 3. Delete product reservations
    await tx.productReservation.deleteMany({ where: { variantId: id } });

    // 4. Delete stock subscriptions
    await tx.stockSubscription.deleteMany({ where: { variantId: id } });

    // 5. Delete sale items (only from DRAFT/CANCELLED sales)
    await tx.saleItem.deleteMany({ where: { variantId: id } });

    // 6. Delete order items (only from CANCELLED/AWAITING_PAYMENT orders)
    await tx.orderItem.deleteMany({ where: { variantId: id } });

    // 7. Delete deliveries (returns + complaints first)
    const deliveryIds = (
      await tx.delivery.findMany({ where: { variantId: id }, select: { id: true } })
    ).map((d) => d.id);

    if (deliveryIds.length > 0) {
      await tx.return.deleteMany({ where: { deliveryId: { in: deliveryIds } } });
      await tx.complaint.deleteMany({ where: { deliveryId: { in: deliveryIds } } });
      await tx.delivery.deleteMany({ where: { variantId: id } });
    }

    // 8. Delete the variant
    await tx.variant.delete({ where: { id } });

    // 9. If product has no remaining variants, delete product too
    const remainingVariants = await tx.variant.count({ where: { productId } });
    if (remainingVariants === 0) {
      // Clean up product relations
      await tx.sampleRequest.deleteMany({ where: { productId } });
      await tx.review.deleteMany({ where: { productId } });
      await tx.product.delete({ where: { id: productId } });
    }
  });

  const remainingVariants = await prisma.variant.count({ where: { productId } }).catch(() => 0);
  const productDeleted = remainingVariants === 0;

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "PURGE",
    entity: "Variant",
    entityId: id,
    detail: {
      productId,
      productName: variant.product.name,
      color: variant.color,
      lengthCm: variant.lengthCm,
      productDeleted,
    },
    ipAddress: getClientIp(request),
  });

  revalidatePath("/inventory");
  revalidatePath("/inventory/movements");
  revalidateTag("dashboard", "max");
  revalidateTag("products", "max");

  return NextResponse.json({
    ok: true,
    variantDeleted: id,
    productDeleted: productDeleted ? productId : null,
  });
}
