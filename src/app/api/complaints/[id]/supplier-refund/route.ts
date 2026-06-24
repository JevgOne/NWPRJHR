import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordSupplierRefund } from "@/lib/complaints";
import { supplierRefundSchema } from "@/lib/validations/returns";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const parsed = supplierRefundSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const complaint = await recordSupplierRefund(
      id,
      parsed.data.refundHalere,
      parsed.data.note
    );
    return NextResponse.json(complaint);
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
