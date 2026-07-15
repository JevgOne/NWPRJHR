import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";
import { addWatermark } from "@/lib/watermark";

export const maxDuration = 60;

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
  const inputBuffer = Buffer.from(arrayBuffer);
  try {
    const buffer = await addWatermark(inputBuffer);
    return { buffer, contentType: "image/webp", ext: "webp" };
  } catch (e) {
    console.error("[media] watermark failed, converting without watermark:", e);
    try {
      const sharp = (await import("sharp")).default;
      const buffer = await sharp(inputBuffer).jpeg({ quality: 85 }).toBuffer();
      return { buffer, contentType: "image/jpeg", ext: "jpg" };
    } catch (e2) {
      console.error("[media] sharp conversion also failed:", e2);
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      return { buffer: inputBuffer, contentType: file.type || "application/octet-stream", ext };
    }
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

  // 1. Validate all files before processing
  let photoCount = 0;
  for (const file of files) {
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

    if (isPhoto) photoCount++;
  }

  if (existingPhotos.length + photoCount > 6) {
    return NextResponse.json(
      { error: "Max 6 fotek na produkt" },
      { status: 400 }
    );
  }

  // 2. Process all files in parallel
  const uploads = files.map(async (file) => {
    const fileType = file.type || "";
    const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isVideo =
      VIDEO_TYPES.includes(fileType) ||
      fileExt === "mov" ||
      fileExt === "mp4" ||
      fileExt === "webm";

    if (isVideo) {
      const ext = fileExt || "mp4";
      const safeName = `videos/${id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
      const blob = await put(safeName, file, {
        access: "public",
        contentType: fileType || "video/mp4",
      });
      return { url: blob.url, isVideo: true };
    } else {
      const { buffer, contentType, ext } = await processPhoto(file);
      const safeName = `products/${id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
      const blob = await put(safeName, buffer, {
        access: "public",
        contentType,
      });
      return { url: blob.url, isVideo: false };
    }
  });

  let results: { url: string; isVideo: boolean }[];
  try {
    results = await Promise.all(uploads);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }

  const newPhotoUrls: string[] = [];
  let videoUrl: string | null = product.video;
  for (const r of results) {
    if (r.isVideo) {
      videoUrl = r.url;
    } else {
      newPhotoUrls.push(r.url);
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
