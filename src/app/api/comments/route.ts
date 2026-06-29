import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createCommentSchema = z.object({
  articleSlug: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const articleSlug = searchParams.get("articleSlug");
  if (!articleSlug)
    return NextResponse.json({ error: "articleSlug required" }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { articleSlug, parentId: null },
    include: {
      user: { select: { id: true, name: true, role: true } },
      likes: { select: { userId: true } },
      replies: {
        include: {
          user: { select: { id: true, name: true, role: true } },
          likes: { select: { userId: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(comments);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { articleSlug, content, parentId } = parsed.data;

  // If replying, verify parent exists and belongs to same article
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.articleSlug !== articleSlug)
      return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      articleSlug,
      content,
      parentId: parentId ?? null,
      userId: session.user.id,
    },
    include: {
      user: { select: { id: true, name: true, role: true } },
      likes: { select: { userId: true } },
      replies: { include: { user: { select: { id: true, name: true, role: true } }, likes: { select: { userId: true } } } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
