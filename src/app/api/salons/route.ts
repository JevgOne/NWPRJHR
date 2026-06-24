import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archived = request.nextUrl.searchParams.get("archived");

  const where: Record<string, unknown> = {};
  if (archived === "false") where.archived = false;
  if (archived === "true") where.archived = true;

  if (session.user.role === "SALON") {
    where.id = session.user.salonId;
  }

  const salons = await prisma.salon.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(salons);
}
