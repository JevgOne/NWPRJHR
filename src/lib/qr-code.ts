import QRCode from "qrcode";

/**
 * Generate QR code as data URL (for embedding in HTML/PDF).
 */
export async function generateQRCodeDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: "M",
    width: 200,
    margin: 2,
  });
}

/**
 * Generate QR code as PNG buffer (for API responses).
 */
export async function generateQRCodeBuffer(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, {
    errorCorrectionLevel: "M",
    width: 200,
    margin: 2,
    type: "png",
  });
}
