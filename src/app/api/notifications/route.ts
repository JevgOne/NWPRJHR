import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const unreadOnly = sp.get("unread") === "true";
  const limit = Math.min(100, parseInt(sp.get("limit") ?? "20"));
  const offset = parseInt(sp.get("offset") ?? "0");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { recipientId: session.user.id };
  if (unreadOnly) where.read = false;

  const [total, notifications, unreadCount] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({
      where: { recipientId: session.user.id, read: false },
    }),
  ]);

  return NextResponse.json({ data: notifications, total, unreadCount });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (body.action === "read-all") {
    await prisma.notification.updateMany({
      where: { recipientId: session.user.id, read: false },
      data: { read: true, readAt: new Date() },
    });
    revalidateTag("badges", "max");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
