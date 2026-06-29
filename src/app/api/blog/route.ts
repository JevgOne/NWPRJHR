import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createBlogSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().max(500).optional(),
  content: z.string().optional(),
  coverImage: z.string().url().optional(),
  category: z.string().max(50).optional(),
  published: z.boolean().optional(),
  publishedAt: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const published = searchParams.get("published");
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: Record<string, unknown> = {};

  // Public requests only see published posts
  const session = await auth();
  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "EMPLOYEE";

  if (!isAdmin || published === "true") {
    where.published = true;
  } else if (published === "false") {
    where.published = false;
  }

  if (category) where.category = category;

  const posts = await prisma.blogPost.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = createBlogSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  const existing = await prisma.blogPost.findUnique({ where: { slug: data.slug } });
  if (existing)
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content ?? "",
      coverImage: data.coverImage,
      category: data.category ?? "general",
      published: data.published ?? false,
      publishedAt: data.published ? (data.publishedAt ? new Date(data.publishedAt) : new Date()) : null,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
