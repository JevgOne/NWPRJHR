import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReceivables } from "@/lib/payments";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const receivables = await getReceivables();
  return NextResponse.json(receivables);
}
