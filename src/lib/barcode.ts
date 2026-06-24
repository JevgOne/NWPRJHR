/**
 * Generate a unique barcode for a delivery.
 * Format: HR-YYYYMMDD-XXXX (Hairora prefix + date + random 4 chars)
 */
export function generateBarcode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HR-${date}-${random}`;
}
