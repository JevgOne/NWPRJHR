import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createComplaint } from "@/lib/complaints";
import { createComplaintSchema } from "@/lib/validations/returns";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = request.nextUrl.searchParams;
  const status = sp.get("status");
  const deliveryId = sp.get("deliveryId");
  const salonId = sp.get("salonId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status) where.status = status;
  if (deliveryId) where.deliveryId = deliveryId;
  if (salonId) where.salonId = salonId;

  const complaints = await prisma.complaint.findMany({
    where,
    include: {
      sale: { select: { saleNumber: true } },
      salon: { select: { id: true, name: true } },
      delivery: {
        select: {
          id: true,
          barcode: true,
          supplier: { select: { name: true } },
        },
      },
      creditNote: { select: { id: true, number: true } },
      createdByUser: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(complaints);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = createComplaintSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const complaint = await createComplaint(parsed.data, session.user.id);
    return NextResponse.json(complaint, { status: 201 });
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
