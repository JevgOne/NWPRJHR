import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPacketLabel } from "@/lib/packeta";

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

  const pdf = await getPacketLabel(packetId);
  if (!pdf) {
    return NextResponse.json({ error: "Label generation failed" }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="packeta-label-${packetId}.pdf"`,
    },
  });
}
