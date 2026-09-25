import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logAudit, getClientIp } from "@/lib/audit";
import { revalidateTag } from "next/cache";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  titleUk: z.string().max(200).nullable().optional(),
  titleRu: z.string().max(200).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  descriptionUk: z.string().max(2000).nullable().optional(),
  descriptionRu: z.string().max(2000).nullable().optional(),
  photoBefore: z.string().url().optional(),
  photoAfter: z.string().url().optional(),
  processingType: z.enum(["CLIP_IN", "TAPE_IN", "KERATIN", "WEFT", "MICRO_RING", "BANGS", "OTHER"]).optional(),
  lengthCm: z.number().int().min(1).max(150).nullable().optional(),
  weightGrams: z.number().int().min(1).max(1000).nullable().optional(),
  hairOrigin: z.string().max(100).nullable().optional(),
  stylistName: z.string().max(200).nullable().optional(),
  clientConsent: z.boolean().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
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
      { status: 400 },
    );
  }

  const item = await prisma.transformation.update({
    where: { id },
    data: parsed.data,
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "Transformation",
    entityId: id,
    detail: { title: item.title },
    ipAddress: getClientIp(request),
  });

  revalidateTag("transformations", { expire: 0 });

  return NextResponse.json(item);
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.transformation.delete({ where: { id } });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "DELETE",
    entity: "Transformation",
    entityId: id,
    ipAddress: getClientIp(request),
  });

  revalidateTag("transformations", { expire: 0 });

  return NextResponse.json({ success: true });
}
