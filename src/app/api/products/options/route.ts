import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [textures, colorTones] = await Promise.all([
    prisma.product.findMany({
      where: { texture: { not: null }, archived: false },
      select: { texture: true },
      distinct: ["texture"],
    }),
    prisma.product.findMany({
      where: { colorTone: { not: null }, archived: false },
      select: { colorTone: true },
      distinct: ["colorTone"],
    }),
  ]);

  return NextResponse.json({
    textures: textures.map((p) => p.texture).filter(Boolean),
    colorTones: colorTones.map((p) => p.colorTone).filter(Boolean),
  });
}
