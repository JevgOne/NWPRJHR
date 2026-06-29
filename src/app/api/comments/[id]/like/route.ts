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

  const { id } = await params;

  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId: id, userId: session.user.id } },
  });

  if (existing) {
    // Unlike
    await prisma.commentLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  // Like
  await prisma.commentLike.create({
    data: { commentId: id, userId: session.user.id },
  });
  return NextResponse.json({ liked: true });
}
