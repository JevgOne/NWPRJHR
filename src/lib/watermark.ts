/**
 * Add text watermark "www.hairland.cz" to an image.
 * Repeating diagonal pattern across the entire image, 50% opacity.
 * Uses Sharp SVG composite — no external PNG file needed.
 * Converts any input format (HEIC/HEIF/JPEG/PNG) to WebP.
 */
export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const imgWidth = metadata.width ?? 800;
  const imgHeight = metadata.height ?? 800;

  const fontSize = Math.max(18, Math.round(imgWidth * 0.04));
  const text = "www.hairland.cz";

  // Build repeating diagonal watermark text across the full image
  const spacingX = Math.round(fontSize * 12);
  const spacingY = Math.round(fontSize * 5);

  const textElements: string[] = [];
  for (let y = -spacingY; y < imgHeight + spacingY; y += spacingY) {
    for (let x = -spacingX; x < imgWidth + spacingX; x += spacingX) {
      textElements.push(
        `<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" opacity="0.5" stroke="rgba(0,0,0,0.2)" stroke-width="1">${text}</text>`
      );
    }
  }

  const svg = Buffer.from(
    `<svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">` +
      `<g transform="rotate(-30, ${imgWidth / 2}, ${imgHeight / 2})">` +
      textElements.join("") +
      `</g></svg>`
  );

  return image
    .composite([{ input: svg, left: 0, top: 0 }])
    .webp({ quality: 82 })
    .toBuffer();
}
