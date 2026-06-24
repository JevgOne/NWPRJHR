import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getComplaintsByDelivery } from "@/lib/complaints";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = request.nextUrl.searchParams;
  const supplierId = sp.get("supplierId") ?? undefined;
  const from = sp.get("from") ? new Date(sp.get("from")!) : undefined;
  const to = sp.get("to") ? new Date(sp.get("to")!) : undefined;

  const stats = await getComplaintsByDelivery({ supplierId, from, to });
  return NextResponse.json(stats);
}
