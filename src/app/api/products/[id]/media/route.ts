import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";
import { addWatermark } from "@/lib/watermark";

const MAX_PHOTO_SIZE = 15 * 1024 * 1024; // 15MB (HEIC files are larger)
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
const VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-quicktime",
  "video/webm",
];

async function processPhoto(
  file: File
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const buffer = await addWatermark(Buffer.from(arrayBuffer));
    return { buffer, contentType: "image/webp", ext: "webp" };
  } catch (e) {
    console.error("[media] watermark failed, uploading original:", e);
    return { buffer: Buffer.from(arrayBuffer), contentType: file.type || "image/jpeg", ext: "jpg" };
  }
}

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
    // Check type by MIME or fall back to extension for HEIC
    const fileType = file.type || "";
    const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isHeic = fileExt === "heic" || fileExt === "heif" || fileType === "image/heic" || fileType === "image/heif";
    const isVideo =
      VIDEO_TYPES.includes(fileType) ||
      fileExt === "mov" ||
      fileExt === "mp4" ||
      fileExt === "webm";
    const isPhoto = PHOTO_TYPES.includes(fileType) || isHeic;

    if (!isPhoto && !isVideo) {
      return NextResponse.json(
        { error: `Nepodporovaný formát: ${file.name}` },
        { status: 400 }
      );
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_PHOTO_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `${file.name} je příliš velký (max ${isVideo ? "50" : "15"}MB)` },
        { status: 400 }
      );
    }

    if (!isVideo && existingPhotos.length + newPhotoUrls.length >= 6) {
      return NextResponse.json(
        { error: "Max 6 fotek na produkt" },
        { status: 400 }
      );
    }

    if (isVideo) {
      // Videos: upload as-is
      const ext = fileExt || "mp4";
      const safeName = `videos/${id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
      const blob = await put(safeName, file, {
        access: "public",
        contentType: fileType || "video/mp4",
      });
      videoUrl = blob.url;
    } else {
      // Photos: process through sharp (HEIC→WebP, watermark)
      const { buffer, contentType, ext } = await processPhoto(file);
      const safeName = `products/${id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
      const blob = await put(safeName, buffer, {
        access: "public",
        contentType,
      });
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
