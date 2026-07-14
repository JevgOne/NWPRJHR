import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { photos: true, video: true },
  });
  if (!product)
    return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0)
    return NextResponse.json({ error: "No files provided" }, { status: 400 });

  const existingPhotos: string[] = JSON.parse(product.photos || "[]");
  const newPhotoUrls: string[] = [];
  let videoUrl: string | null = product.video;

  for (const file of files) {
    const isVideo = VIDEO_TYPES.includes(file.type);
    const isPhoto = PHOTO_TYPES.includes(file.type);

    if (!isPhoto && !isVideo) {
      return NextResponse.json(
        { error: `Nepodporovaný formát: ${file.name}` },
        { status: 400 }
      );
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_PHOTO_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `${file.name} je příliš velký (max ${isVideo ? "50" : "5"}MB)` },
        { status: 400 }
      );
    }

    if (!isVideo && existingPhotos.length + newPhotoUrls.length >= 6) {
      return NextResponse.json(
        { error: "Max 6 fotek na produkt" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() ?? (isVideo ? "mp4" : "jpg");
    const folder = isVideo ? "videos" : "products";
    const safeName = `${folder}/${id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;

    const blob = await put(safeName, file, {
      access: "public",
      contentType: file.type,
    });

    if (isVideo) {
      videoUrl = blob.url;
    } else {
      newPhotoUrls.push(blob.url);
    }
  }

  const allPhotos = [...existingPhotos, ...newPhotoUrls];
  const updated = await prisma.product.update({
    where: { id },
    data: {
      photos: JSON.stringify(allPhotos),
      ...(videoUrl !== product.video ? { video: videoUrl } : {}),
    },
  });

  revalidateTag("products", "max");

  return NextResponse.json({
    photos: allPhotos,
    video: updated.video,
  });
}
