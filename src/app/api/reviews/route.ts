import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyNegativeReview } from "@/lib/telegram";
import { z } from "zod";
import { logAudit, getClientIp } from "@/lib/audit";

const reviewSchema = z.object({
  authorName: z.string().min(1).max(200),
  authorPhoto: z.string().max(500).optional().default(""),
  authorCity: z.string().max(100).optional().default(""),
  salonName: z.string().max(200).optional().default(""),
  rating: z.number().int().min(1).max(5).default(5),
  ratingQuality: z.number().int().min(1).max(5).optional(),
  ratingCommunication: z.number().int().min(1).max(5).optional(),
  ratingSpeed: z.number().int().min(1).max(5).optional(),
  text: z.string().min(1).max(5000),
  source: z.enum(["MANUAL", "GOOGLE", "INSTAGRAM"]).default("MANUAL"),
  sourceUrl: z.string().max(500).optional().default(""),
  instagramEmbed: z.string().max(10000).optional().default(""),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  const sp = request.nextUrl.searchParams;
  const publicOnly = sp.get("public") === "true";

  if (publicOnly) {
    const reviews = await prisma.review.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 20,
    });
    return NextResponse.json(reviews);
  }

  if (!session || !["OWNER", "EMPLOYEE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviews = await prisma.review.findMany({
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(reviews);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !["OWNER", "EMPLOYEE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const review = await prisma.review.create({
    data: {
      authorName: data.authorName,
      authorPhoto: data.authorPhoto || null,
      authorCity: data.authorCity || null,
      salonName: data.salonName || null,
      rating: data.rating,
      ratingQuality: data.ratingQuality ?? null,
      ratingCommunication: data.ratingCommunication ?? null,
      ratingSpeed: data.ratingSpeed ?? null,
      text: data.text,
      source: data.source,
      sourceUrl: data.sourceUrl || null,
      instagramEmbed: data.instagramEmbed || null,
      featured: data.featured,
      active: data.active,
    },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "CREATE",
    entity: "Review",
    entityId: review.id,
    detail: { authorName: data.authorName, rating: data.rating },
    ipAddress: getClientIp(request),
  });

  if (data.rating <= 3) {
    notifyNegativeReview({
      authorName: data.authorName,
      rating: data.rating,
      source: data.source,
      text: data.text,
      sourceUrl: data.sourceUrl,
    }).catch(() => {});
  }

  return NextResponse.json(review);
}
