import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const msg = await prisma.contactMessage.findUnique({ where: { id } });
  if (!msg)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.contactMessage.update({
    where: { id },
    data: body.replied
      ? { repliedAt: new Date(), repliedBy: session.user.name ?? session.user.email ?? "" }
      : { repliedAt: null, repliedBy: null },
  });

  return NextResponse.json(updated);
}
