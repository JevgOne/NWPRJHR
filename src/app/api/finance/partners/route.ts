import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  calculatePartnerSettlement,
  getCumulativeSettlement,
} from "@/lib/partner-settlement";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const cumulative = searchParams.get("cumulative");

  if (cumulative === "true") {
    const from = searchParams.get("from");
    if (!from)
      return NextResponse.json(
        { error: "Missing 'from' for cumulative" },
        { status: 400 }
      );
    const result = await getCumulativeSettlement(new Date(from));
    return NextResponse.json(result);
  }

  const year = parseInt(searchParams.get("year") ?? "", 10);
  const month = parseInt(searchParams.get("month") ?? "", 10);

  if (!year || !month || month < 1 || month > 12)
    return NextResponse.json(
      { error: "Missing or invalid 'year' and 'month'" },
      { status: 400 }
    );

  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0, 23, 59, 59, 999);

  const result = await calculatePartnerSettlement({ from, to });
  return NextResponse.json(result);
}
