import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createProductSchema } from "@/lib/validations/product";
import { serializeProductForRole } from "@/lib/api/product-serializer";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const processingType = searchParams.get("processingType");
  const archived = searchParams.get("archived");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (processingType) where.processingType = processingType;
  if (archived !== null) where.archived = archived === "true";
  else where.archived = false;
  const texture = searchParams.get("texture");
  const tone = searchParams.get("tone");
  if (texture) where.texture = texture;
  if (tone) where.tone = tone;
  if (search) where.name = { contains: search, mode: "insensitive" };

  const products = await prisma.product.findMany({
    where,
    include: { variants: { where: { active: true } } },
    orderBy: { createdAt: "desc" },
  });

  const serialized = products.map((p) =>
    serializeProductForRole(p, session.user.role)
  );

  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const product = await prisma.product.create({
    data: parsed.data,
  });

  return NextResponse.json(product, { status: 201 });
}
