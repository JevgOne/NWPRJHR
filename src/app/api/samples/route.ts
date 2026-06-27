import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sampleRequestSchema } from "@/lib/validations/salon";
import { createNotificationForRole } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const status = sp.get("status");
  const salonId = sp.get("salonId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status) where.status = status;
  if (salonId) where.salonId = salonId;

  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
    where.salonId = session.user.salonId;
  }

  const samples = await prisma.sampleRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      salon: { select: { name: true } },
      product: { select: { name: true } },
    },
  });

  return NextResponse.json(samples);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = sampleRequestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );

  let salonId = parsed.data.salonId;
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
    salonId = session.user.salonId!;
  }

  const sample = await prisma.sampleRequest.create({
    data: {
      salonId,
      salonName: parsed.data.salonName,
      productId: parsed.data.productId,
      note: parsed.data.note,
    },
  });

  // Notify owners about sample request
  createNotificationForRole({
    role: "OWNER",
    type: "SAMPLE_REQUEST",
    title: `Zadost o vzorek: ${parsed.data.salonName ?? ""}`,
    message: `Salon "${parsed.data.salonName ?? ""}" zada o vzorek.`,
    data: { sampleId: sample.id, salonName: parsed.data.salonName },
  }).catch(() => {});

  return NextResponse.json(sample, { status: 201 });
}
