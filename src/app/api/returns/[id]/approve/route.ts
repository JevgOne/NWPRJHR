import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { approveReturn } from "@/lib/returns";
import { logAudit, getClientIp } from "@/lib/audit";
import { revalidateTag } from "next/cache";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const ret = await approveReturn(id, session.user.id);

    logAudit({
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      action: "APPROVE",
      entity: "Return",
      entityId: id,
      ipAddress: getClientIp(_request),
    });

    revalidateTag("dashboard", "max");
    return NextResponse.json(ret);
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
