import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET active announcement (public)
export async function GET() {
  const announcement = await prisma.batchAnnouncement.findFirst({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  if (!announcement) {
    return NextResponse.json(null);
  }

  // Add 24h for stocking time
  const availableDate = new Date(announcement.arrivalDate);
  availableDate.setHours(availableDate.getHours() + 24);

  // Only show if available date is in the future
  if (availableDate < new Date()) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    id: announcement.id,
    arrivalDate: announcement.arrivalDate,
    availableDate,
    description: announcement.description,
  });
}

// POST create/update announcement (owner only)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { arrivalDate, description } = body;

  if (!arrivalDate) {
    return NextResponse.json({ error: "arrivalDate is required" }, { status: 400 });
  }

  // Deactivate all existing
  await prisma.batchAnnouncement.updateMany({
    where: { active: true },
    data: { active: false },
  });

  const announcement = await prisma.batchAnnouncement.create({
    data: {
      arrivalDate: new Date(arrivalDate),
      description: description || null,
      active: true,
    },
  });

  return NextResponse.json(announcement, { status: 201 });
}

// DELETE deactivate announcement (owner only)
export async function DELETE() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.batchAnnouncement.updateMany({
    where: { active: true },
    data: { active: false },
  });

  return NextResponse.json({ ok: true });
}
