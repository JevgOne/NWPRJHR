import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["OWNER", "EMPLOYEE"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { notes } = await request.json();

  const salon = await prisma.salon.update({
    where: { id },
    data: { notes: notes ?? null },
  });

  return NextResponse.json({ notes: salon.notes });
}
