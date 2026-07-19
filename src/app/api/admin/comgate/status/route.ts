import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPaymentStatus } from "@/lib/comgate";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const transId = request.nextUrl.searchParams.get("transId");
  if (!transId) {
    return NextResponse.json({ error: "transId required" }, { status: 400 });
  }

  const result = await getPaymentStatus(transId);
  return NextResponse.json(result);
}
