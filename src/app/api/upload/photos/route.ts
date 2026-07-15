import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-quicktime", "video/webm"];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0)
    return NextResponse.json({ error: "No files provided" }, { status: 400 });

  if (files.length > 10)
    return NextResponse.json(
      { error: "Max 10 files per upload" },
      { status: 400 }
    );

  const photoUrls: string[] = [];
  let videoUrl: string | null = null;

  const uploads = files.map(async (file) => {
    const fileType = file.type || "";
    const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isHeic = fileExt === "heic" || fileExt === "heif" || fileType === "image/heic" || fileType === "image/heif";
    const isVideo = VIDEO_TYPES.includes(fileType) || fileExt === "mov" || fileExt === "mp4" || fileExt === "webm";
    const isPhoto = PHOTO_TYPES.includes(fileType) || isHeic;

    if (!isPhoto && !isVideo) {
      throw new Error(`Nepodporovaný formát: ${file.name}. Povoleno: JPG, PNG, WebP, HEIC, MP4, MOV, WebM`);
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_PHOTO_SIZE;
    if (file.size > maxSize) {
      throw new Error(`${file.name} je příliš velký (max ${isVideo ? "50MB" : "15MB"})`);
    }

    let uploadBuffer: Buffer | File = file;
    let contentType = file.type;
    let outputExt = file.name.split(".").pop() ?? "jpg";

    // Add watermark to photos → always outputs WebP
    if (isPhoto) {
      const arrayBuffer = await file.arrayBuffer();
      try {
        uploadBuffer = await addWatermark(Buffer.from(arrayBuffer));
        contentType = "image/webp";
        outputExt = "webp";
      } catch (e) {
        console.error("[upload/photos] watermark failed, uploading original:", e);
        uploadBuffer = Buffer.from(arrayBuffer);
        outputExt = "jpg";
      }
    }

    const ext = isPhoto ? outputExt : (file.name.split(".").pop() ?? "mp4");
    const folder = isVideo ? "videos" : "products";
    const safeName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const blob = await put(safeName, uploadBuffer, {
      access: "public",
      contentType,
    });

    return { url: blob.url, isVideo };
  });

  try {
    const results = await Promise.all(uploads);
    for (const r of results) {
      if (r.isVideo) {
        videoUrl = r.url;
      } else {
        photoUrls.push(r.url);
      }
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 }
    );
  }

  return NextResponse.json({ photoUrls, videoUrl }, { status: 201 });
}
