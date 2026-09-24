import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const search = request.nextUrl.searchParams.get("search")?.toLowerCase();
  const filter = request.nextUrl.searchParams.get("filter");

  const where: Record<string, unknown> = {};
  if (filter === "unreplied") where.repliedAt = null;
  if (filter === "replied") where.repliedAt = { not: null };

  const messages = await prisma.contactMessage.findMany({
    where,
    orderBy: [{ repliedAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
    take: 200,
  });

  const filtered = search
    ? messages.filter(
        (m) =>
          m.name.toLowerCase().includes(search) ||
          m.email.toLowerCase().includes(search) ||
          m.message.toLowerCase().includes(search) ||
          (m.phone && m.phone.includes(search)) ||
          (m.salonName && m.salonName.toLowerCase().includes(search))
      )
    : messages;

  return NextResponse.json(filtered);
}
