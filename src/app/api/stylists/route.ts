import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role === "SALON") {
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

  return NextResponse.json(stylist, { status: 201 });
}
