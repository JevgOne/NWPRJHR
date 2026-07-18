import { join } from "path";
import { readFileSync } from "fs";

let watermarkPng: Buffer | null = null;

function getWatermarkPng(): Buffer {
  if (!watermarkPng) {
    watermarkPng = readFileSync(join(process.cwd(), "public", "watermark.png"));
  }
  return watermarkPng;
}

/**
 * Add logo watermark to an image.
 * Scales the watermark to ~20% of image width, places bottom-right with margin.
 * Converts any input format (HEIC/HEIF/JPEG/PNG) to WebP.
 */
export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const imgWidth = metadata.width ?? 800;
  const imgHeight = metadata.height ?? 800;

  const wmSize = Math.round(imgWidth * 0.20);
  const margin = Math.round(imgWidth * 0.03);

  const resized = await sharp(getWatermarkPng())
    .resize(wmSize, wmSize, { fit: "inside" })
    .ensureAlpha()
    .png()
    .toBuffer();

  const resizedMeta = await sharp(resized).metadata();
  const wmW = resizedMeta.width ?? wmSize;
  const wmH = resizedMeta.height ?? wmSize;

  // Apply 35% opacity via dest-in blend
  const watermark = await sharp(resized)
    .composite([
      {
        input: Buffer.from([255, 255, 255, Math.round(255 * 0.35)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  const left = imgWidth - wmW - margin;
  const top = imgHeight - wmH - margin;

  return image
    .composite([
      {
        input: watermark,
        left: Math.max(0, left),
        top: Math.max(0, top),
      },
    ])
    .webp({ quality: 82 })
    .toBuffer();
}
