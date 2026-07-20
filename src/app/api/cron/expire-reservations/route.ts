import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { expireOverdueReservations } from "@/lib/reservations";
import { createNotificationForRole } from "@/lib/notifications";
import { invalidateStockCache } from "@/lib/stock";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Expire overdue ProductReservations (existing)
  const expiredCount = await expireOverdueReservations();

  if (expiredCount > 0) {
    createNotificationForRole({
      role: "OWNER",
      type: "RESERVATION_EXPIRED",
      title: `${expiredCount} rezervaci expirovalo`,
      message: `${expiredCount} nezaplacenych rezervaci bylo automaticky expirovano.`,
      data: { expiredCount },
    }).catch(() => {});
  }

  // 2. Expire overdue Order Reservations (e-shop orders with expiresAt)
  const now = new Date();
  const expiredOrderReservations = await prisma.reservation.findMany({
    where: {
      active: true,
      expiresAt: { lt: now },
    },
    select: { id: true, orderId: true },
  });

  let expiredOrderCount = 0;
  if (expiredOrderReservations.length > 0) {
    // Deactivate expired reservations
    await prisma.reservation.updateMany({
      where: {
        id: { in: expiredOrderReservations.map((r) => r.id) },
        active: true,
      },
      data: { active: false },
    });

    // Cancel associated AWAITING_PAYMENT orders
    const orderIds = [...new Set(expiredOrderReservations.map((r) => r.orderId).filter(Boolean))];
    if (orderIds.length > 0) {
      const result = await prisma.order.updateMany({
        where: {
          id: { in: orderIds as string[] },
          status: "AWAITING_PAYMENT",
        },
        data: { status: "CANCELLED" },
      });
      expiredOrderCount = result.count;
    }

    invalidateStockCache();

    if (expiredOrderCount > 0) {
      createNotificationForRole({
        role: "OWNER",
        type: "RESERVATION_EXPIRED",
        title: `${expiredOrderCount} e-shop objednavek expirovalo`,
        message: `${expiredOrderCount} nezaplacenych objednavek bylo automaticky zruseno.`,
        data: { expiredOrderCount },
      }).catch(() => {});
    }
  }

  return NextResponse.json({
    expiredCount,
    expiredOrderCount,
    timestamp: new Date().toISOString(),
  });
}
