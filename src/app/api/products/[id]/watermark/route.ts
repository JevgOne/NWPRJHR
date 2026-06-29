import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";
import { addWatermark } from "@/lib/watermark";

/**
 * POST: Re-process all existing photos for a product with watermark.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { photos: true },
  });
  if (!product)
    return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const photos: string[] = JSON.parse(product.photos || "[]");
  if (photos.length === 0)
    return NextResponse.json({ error: "No photos to process" }, { status: 400 });

  const newUrls: string[] = [];

  for (const url of photos) {
    // Fetch existing photo
    const res = await fetch(url);
    if (!res.ok) {
      newUrls.push(url); // keep original if fetch fails
      continue;
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    // Apply watermark
    const watermarked = await addWatermark(buffer);

    // Upload watermarked version
    const safeName = `products/${id}-wm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.jpg`;
    const blob = await put(safeName, watermarked, {
      access: "public",
      contentType: "image/jpeg",
    });

    newUrls.push(blob.url);
  }

  // Update product with watermarked photos
  await prisma.product.update({
    where: { id },
    data: { photos: JSON.stringify(newUrls) },
  });

  return NextResponse.json({ photos: newUrls });
}
