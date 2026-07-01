import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { logAudit, getClientIp } from "@/lib/audit";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const stylist = await prisma.stylist.update({
    where: { id },
    data: {
      name: body.name,
      slug: body.slug,
      bio: body.bio,
      bioUk: body.bioUk,
      bioRu: body.bioRu,
      phone: body.phone,
      email: body.email,
      instagram: body.instagram,
      telegram: body.telegram,
      whatsapp: body.whatsapp,
      city: body.city,
      experience: body.experience,
      salonId: body.salonId,
      featured: body.featured ?? false,
      active: body.active ?? true,
      specializations: body.specializations ?? "[]",
      languages: body.languages ?? "[]",
      certifications: body.certifications ?? "[]",
    },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "UPDATE",
    entity: "Stylist",
    entityId: id,
    detail: { name: stylist.name },
    ipAddress: getClientIp(req),
  });

  return NextResponse.json(stylist);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.stylist.delete({ where: { id } });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "DELETE",
    entity: "Stylist",
    entityId: id,
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
