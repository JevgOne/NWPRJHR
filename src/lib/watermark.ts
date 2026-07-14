import sharp from "sharp";

/**
 * Generate SVG text watermark "www.hairland.cz" sized to the image.
 * Semi-transparent white text in bottom-right corner.
 */
function createWatermarkSvg(imgWidth: number): Buffer {
  const fontSize = Math.round(imgWidth * 0.035);
  const padding = Math.round(imgWidth * 0.02);
  const textWidth = fontSize * 10;
  const svgHeight = fontSize + padding * 2;
  const svgWidth = textWidth + padding * 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
    <text x="${svgWidth - padding}" y="${svgHeight - padding}"
      font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="500"
      fill="white" fill-opacity="0.30" text-anchor="end"
      letter-spacing="2">www.hairland.cz</text>
  </svg>`;

  return Buffer.from(svg);
}

/**
 * Add text watermark "www.hairland.cz" to an image.
 * Converts any input format (HEIC/HEIF/JPEG/PNG) to WebP.
 * Returns WebP buffer.
 */
export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width ?? 800;

  const watermarkSvg = createWatermarkSvg(width);

  return image
    .composite([
      {
        input: watermarkSvg,
        gravity: "southeast",
      },
    ])
    .webp({ quality: 82 })
    .toBuffer();
}
