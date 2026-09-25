import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logAudit, getClientIp } from "@/lib/audit";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  titleUk: z.string().max(200).optional(),
  titleRu: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  descriptionUk: z.string().max(2000).optional(),
  descriptionRu: z.string().max(2000).optional(),
  photoBefore: z.string().url(),
  photoAfter: z.string().url(),
  processingType: z.enum(["CLIP_IN", "TAPE_IN", "KERATIN", "WEFT", "MICRO_RING", "BANGS", "OTHER"]),
  lengthCm: z.number().int().min(1).max(150).optional(),
  weightGrams: z.number().int().min(1).max(1000).optional(),
  hairOrigin: z.string().max(100).optional(),
  stylistName: z.string().max(200).optional(),
  clientConsent: z.boolean().default(true),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  const sp = request.nextUrl.searchParams;
  const publicOnly = sp.get("public") === "true";

  if (publicOnly) {
    const items = await prisma.transformation.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(items);
  }

  if (!session || !["OWNER", "EMPLOYEE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = sp.get("type");
  const where: Record<string, unknown> = {};
  if (type) where.processingType = type;

  const items = await prisma.transformation.findMany({
    where,
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !["OWNER", "EMPLOYEE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const item = await prisma.transformation.create({
    data: {
      title: data.title,
      titleUk: data.titleUk || null,
      titleRu: data.titleRu || null,
      description: data.description || null,
      descriptionUk: data.descriptionUk || null,
      descriptionRu: data.descriptionRu || null,
      photoBefore: data.photoBefore,
      photoAfter: data.photoAfter,
      processingType: data.processingType,
      lengthCm: data.lengthCm ?? null,
      weightGrams: data.weightGrams ?? null,
      hairOrigin: data.hairOrigin || null,
      stylistName: data.stylistName || null,
      clientConsent: data.clientConsent,
      featured: data.featured,
      active: data.active,
      sortOrder: data.sortOrder,
    },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "CREATE",
    entity: "Transformation",
    entityId: item.id,
    detail: { title: data.title, processingType: data.processingType },
    ipAddress: getClientIp(request),
  });

  revalidateTag("transformations", { expire: 0 });

  return NextResponse.json(item);
}
