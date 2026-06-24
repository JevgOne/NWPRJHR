import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getDiscountHistory,
  getDiscountSummaryByGiver,
} from "@/lib/discount-history";
import type { DiscountType } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const summary = searchParams.get("summary");

  if (!from || !to)
    return NextResponse.json(
      { error: "Missing 'from' and 'to' query parameters" },
      { status: 400 }
    );

  const period = { from: new Date(from), to: new Date(to) };

  if (summary === "true") {
    const result = await getDiscountSummaryByGiver(period);
    return NextResponse.json(result);
  }

  const givenByUserId = searchParams.get("givenByUserId") ?? undefined;
  const type = (searchParams.get("type") as DiscountType) ?? undefined;
  const partnerId = searchParams.get("partnerId") ?? undefined;

  const result = await getDiscountHistory({
    period,
    givenByUserId,
    type,
    partnerId,
  });

  return NextResponse.json(result);
}
