import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSalonSchema } from "@/lib/validations/salon";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const archived = sp.get("archived");
  const tier = sp.get("tier");
  const city = sp.get("city");
  const search = sp.get("search");
  const type = sp.get("type");
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(sp.get("limit") ?? "50"));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (archived === "false") where.archived = false;
  else if (archived === "true") where.archived = true;
  else where.archived = false; // default: active only

  if (tier) where.tier = tier;
  if (type) where.type = type;
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (search) where.name = { contains: search, mode: "insensitive" };

  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
    where.id = session.user.salonId;
  }

  const [total, salons] = await Promise.all([
    prisma.salon.count({ where }),
    prisma.salon.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { orders: true, sales: true } },
      },
    }),
  ]);

  return NextResponse.json({
    data: salons,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = createSalonSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );

  const salon = await prisma.salon.create({
    data: parsed.data,
  });

  return NextResponse.json(salon, { status: 201 });
}
