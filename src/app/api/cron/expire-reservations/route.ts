import { NextRequest, NextResponse } from "next/server";
import { expireOverdueReservations } from "@/lib/reservations";
import { createNotificationForRole } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({
    expiredCount,
    timestamp: new Date().toISOString(),
  });
}
