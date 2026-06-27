import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSalonNotification } from "@/lib/notifications";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const sample = await prisma.sampleRequest.findUnique({ where: { id } });
  if (!sample)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {
    status: body.status,
    resolvedBy: session.user.id,
  };

  if (body.grams !== undefined) data.grams = body.grams;
  if (body.pieces !== undefined) data.pieces = body.pieces;
  if (body.resolution) data.resolution = body.resolution;

  if (["RETURNED", "WRITTEN_OFF"].includes(body.status)) {
    data.resolvedAt = new Date();
  }

  if (body.status === "SENT") {
    data.resolvedAt = new Date();
  }

  const updated = await prisma.sampleRequest.update({
    where: { id },
    data,
  });

  // Notify salon when sample is sent
  if (body.status === "SENT" && sample.salonId) {
    createSalonNotification({
      salonId: sample.salonId,
      type: "SAMPLE_REQUEST",
      title: "Vzorek odeslan",
      message: "Vas vzorek byl odeslan.",
      data: { sampleId: id },
    }).catch(() => {});
  }

  return NextResponse.json(updated);
}
