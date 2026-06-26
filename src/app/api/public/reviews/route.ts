import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyNegativeReview } from "@/lib/telegram";
import { z } from "zod";

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

  if (data.rating <= 3) {
    notifyNegativeReview({
      authorName: data.authorName,
      rating: data.rating,
      source: "MANUAL",
      text: data.text,
    }).catch(() => {});
  }

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
