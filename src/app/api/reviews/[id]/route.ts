import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyNegativeReview } from "@/lib/telegram";
import { z } from "zod";
import { logAudit, getClientIp } from "@/lib/audit";
import { revalidateTag } from "next/cache";

const updateSchema = z.object({
  authorName: z.string().min(1).max(200).optional(),
  authorPhoto: z.string().max(500).optional(),
  authorCity: z.string().max(100).optional(),
  salonName: z.string().max(200).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  ratingQuality: z.number().int().min(1).max(5).nullable().optional(),
  ratingCommunication: z.number().int().min(1).max(5).nullable().optional(),
  ratingSpeed: z.number().int().min(1).max(5).nullable().optional(),
  text: z.string().min(1).max(5000).optional(),
  source: z.enum(["MANUAL", "GOOGLE", "INSTAGRAM"]).optional(),
  sourceUrl: z.string().max(500).optional(),
  instagramEmbed: z.string().max(10000).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  productId: z.string().nullable().optional(),
});

type Props = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session || !["OWNER", "EMPLOYEE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const review = await prisma.review.update({
    where: { id },
    data: {
      ...data,
      authorPhoto: data.authorPhoto || null,
      authorCity: data.authorCity || null,
      salonName: data.salonName || null,
      sourceUrl: data.sourceUrl || null,
      instagramEmbed: data.instagramEmbed || null,
    },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "Review",
    entityId: id,
    detail: { authorName: review.authorName, rating: review.rating },
    ipAddress: getClientIp(request),
  });

  if (review.rating <= 3) {
    notifyNegativeReview({
      authorName: review.authorName,
      rating: review.rating,
      source: review.source,
      text: review.text,
      sourceUrl: review.sourceUrl,
    }).catch(() => {});
  }

  revalidateTag("reviews", "max");

  return NextResponse.json(review);
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.review.delete({ where: { id } });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "DELETE",
    entity: "Review",
    entityId: id,
    ipAddress: getClientIp(_request),
  });

  revalidateTag("reviews", "max");

  return NextResponse.json({ success: true });
}
