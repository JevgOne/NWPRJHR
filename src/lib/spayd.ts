/**
 * Generate SPAYD (Short Payment Descriptor) string.
 * Czech standard for QR payment codes used by banking apps.
 *
 * Format: SPD*1.0*ACC:CZ1234567890/0100*AM:1235.00*CC:CZK*X-VS:20260001*MSG:Faktura 2026-0001
 */

export interface SpaydInput {
  iban: string;
  amount: number; // CZK (whole crowns)
  currency?: string;
  variableSymbol: string;
  message?: string;
}

export function generateSpayd(input: SpaydInput): string {
  const parts = [
    "SPD*1.0",
    `ACC:${input.iban}`,
    `AM:${input.amount.toFixed(2)}`,
    `CC:${input.currency ?? "CZK"}`,
    `X-VS:${input.variableSymbol}`,
  ];

  if (input.message) {
    const safeMsg = input.message
      .substring(0, 60)
      .replace(/[^a-zA-Z0-9 ]/g, "");
    parts.push(`MSG:${safeMsg}`);
  }

  return parts.join("*");
}
