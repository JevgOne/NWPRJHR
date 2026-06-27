import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "HAIRDRESSER" || !session.user.salonId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const stylist = await prisma.stylist.findFirst({
    where: { salonId: session.user.salonId },
  });

  if (!stylist) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    id: stylist.id,
    name: stylist.name,
    slug: stylist.slug,
    photo: stylist.photo,
    bio: stylist.bio,
    specializations: JSON.parse(stylist.specializations) as string[],
    languages: JSON.parse(stylist.languages) as string[],
    certifications: JSON.parse(stylist.certifications) as string[],
    phone: stylist.phone,
    email: stylist.email,
    instagram: stylist.instagram,
    telegram: stylist.telegram,
    whatsapp: stylist.whatsapp,
    city: stylist.city,
    experience: stylist.experience,
    active: stylist.active,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "HAIRDRESSER" || !session.user.salonId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const {
    name,
    bio,
    photo,
    phone,
    email,
    instagram,
    telegram,
    whatsapp,
    city,
    experience,
    languages,
    specializations,
    certifications,
    active,
  } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const data = {
    name: name.trim(),
    slug,
    photo: photo || null,
    bio: bio || null,
    phone: phone || null,
    email: email || null,
    instagram: instagram || null,
    telegram: telegram || null,
    whatsapp: whatsapp || null,
    city: city || null,
    experience: experience != null ? Number(experience) : null,
    languages: JSON.stringify(languages ?? []),
    specializations: JSON.stringify(specializations ?? []),
    certifications: JSON.stringify(certifications ?? []),
    active: active ?? true,
  };

  const existing = await prisma.stylist.findFirst({
    where: { salonId: session.user.salonId },
  });

  let stylist;
  if (existing) {
    // Check slug uniqueness (exclude self)
    const slugConflict = await prisma.stylist.findFirst({
      where: { slug, id: { not: existing.id } },
    });
    const finalSlug = slugConflict ? `${slug}-${existing.id.slice(0, 6)}` : slug;

    stylist = await prisma.stylist.update({
      where: { id: existing.id },
      data: { ...data, slug: finalSlug },
    });
  } else {
    // Check slug uniqueness for new record
    const slugConflict = await prisma.stylist.findFirst({ where: { slug } });
    const finalSlug = slugConflict
      ? `${slug}-${Date.now().toString(36)}`
      : slug;

    stylist = await prisma.stylist.create({
      data: { ...data, slug: finalSlug, salonId: session.user.salonId },
    });
  }

  return NextResponse.json({
    id: stylist.id,
    name: stylist.name,
    slug: stylist.slug,
    active: stylist.active,
  });
}
