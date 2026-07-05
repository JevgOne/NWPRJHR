import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { logAudit, getClientIp } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const stylist = await prisma.stylist.create({
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
      portfolio: body.portfolio ?? "[]",
    },
  });

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "CREATE",
    entity: "Stylist",
    entityId: stylist.id,
    detail: { name: stylist.name },
    ipAddress: getClientIp(req),
  });

  revalidateTag("stylists", "max");

  return NextResponse.json(stylist, { status: 201 });
}
