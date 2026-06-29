import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only author or admin can edit
  const isAdmin = session.user.role === "OWNER" || session.user.role === "EMPLOYEE";
  if (comment.userId !== session.user.id && !isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.comment.update({
    where: { id },
    data: { content: parsed.data.content, editedAt: new Date() },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only author or admin can delete
  const isAdmin = session.user.role === "OWNER" || session.user.role === "EMPLOYEE";
  if (comment.userId !== session.user.id && !isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Delete all replies too
  await prisma.comment.deleteMany({ where: { parentId: id } });
  await prisma.comment.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
