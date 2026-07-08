import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { notifyNegativeReview } from "@/lib/telegram";
import { createNotificationForRole } from "@/lib/notifications";
import { z } from "zod";

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 3_600_000; // 1 hour
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);
  rateLimitMap.set(ip, recent);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

const submitSchema = z.object({
  authorName: z.string().min(1).max(200),
  authorCity: z.string().max(100).optional(),
  rating: z.number().int().min(1).max(5),
  ratingQuality: z.number().int().min(1).max(5).optional(),
  ratingCommunication: z.number().int().min(1).max(5).optional(),
  ratingSpeed: z.number().int().min(1).max(5).optional(),
  text: z.string().min(5).max(5000),
  productId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Verify product exists if provided
  if (data.productId) {
    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
  }

  const review = await prisma.review.create({
    data: {
      authorName: data.authorName,
      authorCity: data.authorCity || null,
      rating: data.rating,
      ratingQuality: data.ratingQuality ?? null,
      ratingCommunication: data.ratingCommunication ?? null,
      ratingSpeed: data.ratingSpeed ?? null,
      text: data.text,
      productId: data.productId || null,
      source: "MANUAL",
      active: false, // Requires admin approval
    },
  });

  // In-app notification for owners
  createNotificationForRole({
    role: "OWNER",
    type: "NEW_REVIEW",
    title: `Nová recenze: ${data.authorName} (${data.rating}★)`,
    message: `${data.authorName} přidal/a recenzi (${data.rating}★): "${data.text.slice(0, 100)}${data.text.length > 100 ? "..." : ""}"`,
    data: { reviewId: review.id, authorName: data.authorName, rating: data.rating },
  }).catch(() => {});

  if (data.rating <= 3) {
    notifyNegativeReview({
      authorName: data.authorName,
      rating: data.rating,
      source: "MANUAL",
      text: data.text,
    }).catch(() => {});
  }

  revalidateTag("reviews", "max");

  return NextResponse.json({ success: true, id: review.id });
}

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");

  const where: Record<string, unknown> = { active: true };
  if (productId) where.productId = productId;

  const reviews = await prisma.review.findMany({
    where,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 20,
    select: {
      id: true,
      authorName: true,
      authorCity: true,
      salonName: true,
      rating: true,
      ratingQuality: true,
      ratingCommunication: true,
      ratingSpeed: true,
      text: true,
      source: true,
      sourceUrl: true,
      authorPhoto: true,
      featured: true,
      createdAt: true,
    },
  });

  return NextResponse.json(reviews);
}
