import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  const salon = await prisma.salon.findUnique({ where: { id } });
  if (!salon)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.salon.update({
    where: { id },
    data: { archived: !salon.archived },
  });

  return NextResponse.json(updated);
}
