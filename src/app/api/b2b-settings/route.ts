import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logAudit, getClientIp } from "@/lib/audit";

const updateSchema = z.object({
  hairdresserDiscountPct: z.number().int().min(0).max(10000),
  salonDiscountPct: z.number().int().min(0).max(10000),
});

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "OWNER" && role !== "SALON" && role !== "HAIRDRESSER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await prisma.b2BSettings.findFirst();
  const data = settings ?? {
    id: null,
    hairdresserDiscountPct: 2000,
    salonDiscountPct: 3600,
  };

  // B2B users only see their own discount percentage
  if (role === "HAIRDRESSER") {
    return NextResponse.json({ discountPct: data.hairdresserDiscountPct });
  }
  if (role === "SALON") {
    return NextResponse.json({ discountPct: data.salonDiscountPct });
  }

  // OWNER sees everything
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const settings = await prisma.b2BSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      hairdresserDiscountPct: parsed.data.hairdresserDiscountPct,
      salonDiscountPct: parsed.data.salonDiscountPct,
    },
    update: {
      hairdresserDiscountPct: parsed.data.hairdresserDiscountPct,
      salonDiscountPct: parsed.data.salonDiscountPct,
    },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "B2BSettings",
    detail: { hairdresserDiscountPct: parsed.data.hairdresserDiscountPct, salonDiscountPct: parsed.data.salonDiscountPct },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(settings);
}
