import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user.role !== "SALON" && session.user.role !== "HAIRDRESSER") || !session.user.salonId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const salon = await prisma.salon.findUniqueOrThrow({
    where: { id: session.user.salonId },
    select: {
      id: true,
      name: true,
      type: true,
      tier: true,
      points: true,
      totalRevenue: true,
      language: true,
      contactPerson: true,
      email: true,
      phone: true,
      city: true,
      address: true,
    },
  });

  const b2bSettings = await prisma.b2BSettings.findFirst();
  const discountPercent = salon.type === "SALON"
    ? (b2bSettings?.salonDiscountPct ?? 3000)
    : (b2bSettings?.hairdresserDiscountPct ?? 2000);

  return NextResponse.json({
    ...salon,
    discountPercent,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user.role !== "SALON" && session.user.role !== "HAIRDRESSER") || !session.user.salonId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { language } = await request.json();
  if (!["cs", "uk", "ru"].includes(language))
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });

  const salon = await prisma.salon.update({
    where: { id: session.user.salonId },
    data: { language },
  });

  return NextResponse.json({ language: salon.language });
}
