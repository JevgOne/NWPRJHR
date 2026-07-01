import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logAudit, getClientIp } from "@/lib/audit";

const updateBlogSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  titleUk: z.string().max(200).nullable().optional(),
  titleRu: z.string().max(200).nullable().optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().max(500).nullable().optional(),
  excerptUk: z.string().max(500).nullable().optional(),
  excerptRu: z.string().max(500).nullable().optional(),
  content: z.string().optional(),
  contentUk: z.string().nullable().optional(),
  contentRu: z.string().nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
  category: z.string().max(50).optional(),
  published: z.boolean().optional(),
  publishedAt: z.string().nullable().optional(),
  metaTitle: z.string().max(200).nullable().optional(),
  metaDescription: z.string().max(500).nullable().optional(),
  ogImage: z.string().url().nullable().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const parsed = updateBlogSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  // Check slug uniqueness if changing
  if (data.slug) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: data.slug } });
    if (existing && existing.id !== id)
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.titleUk !== undefined) updateData.titleUk = data.titleUk;
  if (data.titleRu !== undefined) updateData.titleRu = data.titleRu;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.excerptUk !== undefined) updateData.excerptUk = data.excerptUk;
  if (data.excerptRu !== undefined) updateData.excerptRu = data.excerptRu;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.contentUk !== undefined) updateData.contentUk = data.contentUk;
  if (data.contentRu !== undefined) updateData.contentRu = data.contentRu;
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
  if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
  if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
  if (data.ogImage !== undefined) updateData.ogImage = data.ogImage;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.published !== undefined) {
    updateData.published = data.published;
    if (data.published && !data.publishedAt) {
      // Auto-set publishedAt when first publishing
      const current = await prisma.blogPost.findUnique({ where: { id }, select: { publishedAt: true } });
      if (!current?.publishedAt) updateData.publishedAt = new Date();
    }
  }
  if (data.publishedAt !== undefined) {
    updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
  }

  const post = await prisma.blogPost.update({ where: { id }, data: updateData });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "BlogPost",
    entityId: id,
    detail: { title: post.title },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(post);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.blogPost.delete({ where: { id } });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "DELETE",
    entity: "BlogPost",
    entityId: id,
    ipAddress: getClientIp(_request),
  });

  return NextResponse.json({ ok: true });
}
