import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPacketTracking, getPacketStatus } from "@/lib/packeta";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const packetId = request.nextUrl.searchParams.get("packetId");
  if (!packetId) {
    return NextResponse.json({ error: "packetId required" }, { status: 400 });
  }

  const [status, tracking] = await Promise.all([
    getPacketStatus(packetId),
    getPacketTracking(packetId),
  ]);

  return NextResponse.json({ status, tracking });
}
