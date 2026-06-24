import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFinanceSummary } from "@/lib/finance";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to)
    return NextResponse.json(
      { error: "Missing 'from' and 'to' query parameters" },
      { status: 400 }
    );

  const summary = await getFinanceSummary({
    from: new Date(from),
    to: new Date(to),
  });

  return NextResponse.json(summary);
}
