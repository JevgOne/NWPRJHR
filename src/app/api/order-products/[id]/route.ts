import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id }, select: { id: true, orderOnly: true } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.product.update({
    where: { id },
    data: { archived: true },
  });

  revalidateTag("products", { expire: 0 });

  return NextResponse.json({ ok: true });
}
