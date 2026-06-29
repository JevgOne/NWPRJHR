import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const articleSlug = searchParams.get("articleSlug");
  if (!articleSlug)
    return NextResponse.json({ error: "articleSlug required" }, { status: 400 });

  const count = await prisma.articleLike.count({ where: { articleSlug } });

  const session = await auth();
  let liked = false;
  if (session) {
    const existing = await prisma.articleLike.findUnique({
      where: { articleSlug_userId: { articleSlug, userId: session.user.id } },
    });
    liked = !!existing;
  }

  return NextResponse.json({ count, liked });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const articleSlug = body.articleSlug;
  if (!articleSlug)
    return NextResponse.json({ error: "articleSlug required" }, { status: 400 });

  const existing = await prisma.articleLike.findUnique({
    where: { articleSlug_userId: { articleSlug, userId: session.user.id } },
  });

  if (existing) {
    await prisma.articleLike.delete({ where: { id: existing.id } });
    const count = await prisma.articleLike.count({ where: { articleSlug } });
    return NextResponse.json({ liked: false, count });
  }

  await prisma.articleLike.create({
    data: { articleSlug, userId: session.user.id },
  });
  const count = await prisma.articleLike.count({ where: { articleSlug } });
  return NextResponse.json({ liked: true, count });
}
