import sharp from "sharp";
import path from "path";

const WM_DARK = path.join(process.cwd(), "public", "watermark-dark.png");
const WM_LIGHT = path.join(process.cwd(), "public", "watermark-light.png");

/**
 * Detect average brightness of an image (0 = black, 255 = white).
 */
async function averageBrightness(buffer: Buffer): Promise<number> {
  const { data, info } = await sharp(buffer)
    .resize(100, 100, { fit: "cover" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  return sum / data.length;
}

/**
 * Add a diagonal tiled watermark with HAIRLAND logo across the entire image.
 * Auto-selects dark or light logo based on image brightness.
 * ~15% opacity, rotated -30° in diamond pattern.
 */
export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const imgW = metadata.width ?? 800;
  const imgH = metadata.height ?? 600;

  // Pick watermark based on brightness
  const brightness = await averageBrightness(imageBuffer);
  const wmPath = brightness > 140 ? WM_DARK : WM_LIGHT;

  // Scale watermark to ~30% of image width
  const wmTargetW = Math.round(imgW * 0.3);
  const watermarkBase = await sharp(wmPath)
    .resize(wmTargetW)
    .ensureAlpha()
    .toBuffer();

  const wmMeta = await sharp(watermarkBase).metadata();
  const wmW = wmMeta.width ?? wmTargetW;
  const wmH = wmMeta.height ?? Math.round(wmTargetW / 2);

  // Build tile grid on a large canvas
  const diagonal = Math.ceil(Math.sqrt(imgW * imgW + imgH * imgH));
  const canvasSize = diagonal + wmW * 2;

  const spacingX = wmW + 60;
  const spacingY = wmH + 80;
  const composites: sharp.OverlayOptions[] = [];

  for (let y = 0; y < canvasSize; y += spacingY) {
    const row = Math.floor(y / spacingY);
    const offsetX = row % 2 === 0 ? 0 : Math.round(spacingX / 2);
    for (let x = 0; x < canvasSize; x += spacingX) {
      composites.push({
        input: watermarkBase,
        left: x + offsetX,
        top: y,
      });
    }
  }

  // Create tiled canvas
  const tiledCanvas = await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  // Rotate -30°
  const rotated = await sharp(tiledCanvas)
    .rotate(-30, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Extract center portion matching original image size
  const rotMeta = await sharp(rotated).metadata();
  const rotW = rotMeta.width ?? canvasSize;
  const rotH = rotMeta.height ?? canvasSize;
  const extractLeft = Math.max(0, Math.round((rotW - imgW) / 2));
  const extractTop = Math.max(0, Math.round((rotH - imgH) / 2));

  const overlay = await sharp(rotated)
    .extract({
      left: extractLeft,
      top: extractTop,
      width: Math.min(imgW, rotW - extractLeft),
      height: Math.min(imgH, rotH - extractTop),
    })
    // Reduce opacity to ~15%
    .composite([
      {
        input: Buffer.from([255, 255, 255, Math.round(255 * 0.15)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  return image
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();
}
