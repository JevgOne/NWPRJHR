/**
 * Add text watermark "www.hairland.cz" to an image.
 * Uses Sharp SVG composite — no external PNG file needed.
 * Converts any input format (HEIC/HEIF/JPEG/PNG) to WebP.
 */
export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const imgWidth = metadata.width ?? 800;
  const imgHeight = metadata.height ?? 800;

  const fontSize = Math.max(16, Math.round(imgWidth * 0.03));
  const margin = Math.round(imgWidth * 0.03);

  const text = "www.hairland.cz";
  const svgWidth = text.length * fontSize * 0.6;
  const svgHeight = fontSize * 1.5;

  const svg = Buffer.from(`
    <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold"
        fill="white" opacity="0.4"
        stroke="rgba(0,0,0,0.15)" stroke-width="1"
      >${text}</text>
    </svg>
  `.trim());

  const left = Math.max(0, imgWidth - Math.round(svgWidth) - margin);
  const top = Math.max(0, imgHeight - Math.round(svgHeight) - margin);

  return image
    .composite([{ input: svg, left, top }])
    .webp({ quality: 82 })
    .toBuffer();
}
