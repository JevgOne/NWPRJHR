import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import sharp from "sharp";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

/**
 * Generate an SVG watermark overlay sized to the image.
 * Text "hairland.cz" repeated diagonally across the image,
 * semi-transparent white with subtle shadow.
 */
function createWatermarkSvg(width: number, height: number): Buffer {
  const fontSize = Math.max(Math.round(Math.min(width, height) * 0.06), 16);
  const gap = fontSize * 4;

  // Generate repeated diagonal text
  const texts: string[] = [];
  for (let y = -height; y < height * 2; y += gap) {
    for (let x = -width; x < width * 2; x += gap) {
      texts.push(
        `<text x="${x}" y="${y}" font-size="${fontSize}" font-family="Arial, Helvetica, sans-serif" font-weight="600" fill="white" fill-opacity="0.25" transform="rotate(-30, ${x}, ${y})">hairland.cz</text>`
      );
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${texts.join("")}</svg>`;
  return Buffer.from(svg);
}

async function addWatermark(fileBuffer: Buffer): Promise<Buffer> {
  const image = sharp(fileBuffer);
  const metadata = await image.metadata();
  const w = metadata.width ?? 800;
  const h = metadata.height ?? 600;

  const watermarkSvg = createWatermarkSvg(w, h);

  return image
    .composite([{ input: watermarkSvg, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

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
    const isVideo = VIDEO_TYPES.includes(file.type);
    const isPhoto = PHOTO_TYPES.includes(file.type);

    if (!isPhoto && !isVideo) {
      throw new Error(`Nepodporovaný formát: ${file.name}. Povoleno: JPG, PNG, WebP, MP4, MOV, WebM`);
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_PHOTO_SIZE;
    if (file.size > maxSize) {
      throw new Error(`${file.name} je příliš velký (max ${isVideo ? "50MB" : "5MB"})`);
    }

    let uploadBuffer: Buffer | File = file;
    let contentType = file.type;

    // Add watermark to photos
    if (isPhoto) {
      const arrayBuffer = await file.arrayBuffer();
      uploadBuffer = await addWatermark(Buffer.from(arrayBuffer));
      contentType = "image/jpeg";
    }

    const ext = isPhoto ? "jpg" : (file.name.split(".").pop() ?? "mp4");
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
