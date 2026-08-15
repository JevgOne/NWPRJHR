import path from "path";
import { readFile } from "fs/promises";

/**
 * Add watermark overlay to an image using public/watermark.png.
 * Resizes watermark to match input dimensions, applies 50% opacity,
 * composites over the original. Converts output to WebP.
 */
export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const imgWidth = metadata.width ?? 800;
  const imgHeight = metadata.height ?? 800;

  // Load and resize watermark PNG to match input image
  const wmPath = path.join(process.cwd(), "public/watermark.png");
  const wmBuffer = await readFile(wmPath);
  const resizedWm = await sharp(wmBuffer)
    .resize(imgWidth, imgHeight, { fit: "fill" })
    .ensureAlpha()
    .toBuffer();

  // Reduce watermark opacity to 50% by halving the alpha channel
  const { data, info } = await sharp(resizedWm)
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) {
    data[i] = Math.round(data[i] * 0.5);
  }
  const wmWithOpacity = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  return image
    .composite([{ input: wmWithOpacity, left: 0, top: 0 }])
    .webp({ quality: 82 })
    .toBuffer();
}
