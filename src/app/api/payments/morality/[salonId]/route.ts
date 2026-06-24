import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPaymentMorality } from "@/lib/payments";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { salonId } = await params;
  const morality = await getPaymentMorality(salonId);
  return NextResponse.json(morality);
}
