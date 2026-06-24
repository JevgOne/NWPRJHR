import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createPartnerSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(200),
  share: z.number().int().min(1).max(10000).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const partners = await prisma.partner.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(partners);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = createPartnerSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );

  const existing = await prisma.partner.findUnique({
    where: { userId: parsed.data.userId },
  });
  if (existing)
    return NextResponse.json(
      { error: "User already linked to a partner" },
      { status: 409 }
    );

  const partner = await prisma.partner.create({
    data: {
      userId: parsed.data.userId,
      name: parsed.data.name,
      share: parsed.data.share,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(partner, { status: 201 });
}
