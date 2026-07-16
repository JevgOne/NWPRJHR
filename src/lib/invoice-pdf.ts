import { readFileSync } from "fs";
import { join } from "path";
import { PDFDocument, PDFFont, rgb, StandardFonts } from "pdf-lib";
import { getInvoiceTranslations } from "./invoice-translations";
import { generateQRCodeDataUrl } from "./qr-code";
import { generateSpayd } from "./spayd";

let _logoPngBytes: Uint8Array | null = null;
function getLogoPngBytes(): Uint8Array | null {
  if (_logoPngBytes) return _logoPngBytes;
  try {
    const buf = readFileSync(join(process.cwd(), "public/logo-invoice.png"));
    _logoPngBytes = new Uint8Array(buf);
    return _logoPngBytes;
  } catch {
    return null;
  }
}

/**
 * Invoice data expected by the PDF generator.
 * All monetary amounts are integers in halere (1 CZK = 100 halere).
 */
export interface InvoicePdfData {
  type: "INVOICE" | "CREDIT_NOTE";
  number: string;
  issueDate: Date;
  dueDate: Date;
  taxDate?: Date | null;
  variableSymbol: string;
  buyerName: string;
  buyerIco?: string | null;
  buyerDic?: string | null;
  buyerAddress: string;
  buyerLanguage: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  roundingAmount: number;
  note?: string | null;
  originalInvoiceNumber?: string | null;
  /** When true, skip QR payment code (e.g. invoice already paid). */
  skipQr?: boolean;
  company: {
    name: string;
    ico: string;
    dic?: string | null;
    address: string;
    bankAccount: string;
    bankIban?: string | null;
    bankName?: string | null;
  };
  items: {
    description: string;
    quantity: number | string;
    unit: string;
    pricePerUnit: number;
    lineTotal: number;
  }[];
}

function formatCZK(halere: number): string {
  const czk = halere / 100;
  return czk.toLocaleString("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("cs-CZ");
}

// pdf-lib's standard fonts only support Latin-1 (WinAnsi).
// Strip diacritics + transliterate Cyrillic for maximum compatibility.
function toAscii(text: string): string {
  // Transliterate common Cyrillic characters
  const cyrMap: Record<string, string> = {
    А: "A",Б: "B",В: "V",Г: "G",Д: "D",Е: "E",Ё: "Yo",Ж: "Zh",
    З: "Z",И: "I",Й: "Y",К: "K",Л: "L",М: "M",Н: "N",О: "O",
    П: "P",Р: "R",С: "S",Т: "T",У: "U",Ф: "F",Х: "Kh",Ц: "Ts",
    Ч: "Ch",Ш: "Sh",Щ: "Shch",Ъ: "",Ы: "Y",Ь: "",Э: "E",Ю: "Yu",
    Я: "Ya",а: "a",б: "b",в: "v",г: "g",д: "d",е: "e",ё: "yo",
    ж: "zh",з: "z",и: "i",й: "y",к: "k",л: "l",м: "m",н: "n",
    о: "o",п: "p",р: "r",с: "s",т: "t",у: "u",ф: "f",х: "kh",
    ц: "ts",ч: "ch",ш: "sh",щ: "shch",ъ: "",ы: "y",ь: "",э: "e",
    ю: "yu",я: "ya",
    // Ukrainian specific
    І: "I",і: "i",Ї: "Yi",ї: "yi",Є: "Ye",є: "ye",Ґ: "G",ґ: "g",
    "'": "'",
  };

  let result = "";
  for (const ch of text) {
    if (cyrMap[ch] !== undefined) {
      result += cyrMap[ch];
    } else {
      result += ch;
    }
  }

  // Normalize remaining diacritics (Czech č→c, ř→r, etc.)
  return result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Generate a PDF invoice/credit note as a Buffer.
 */
export async function generateInvoicePdf(
  data: InvoicePdfData
): Promise<Uint8Array> {
  const t = getInvoiceTranslations(data.buyerLanguage);
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = height - margin;

  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.85, 0.85, 0.85);

  // Helper functions
  function drawText(
    text: string,
    x: number,
    yPos: number,
    options: { font?: PDFFont; size?: number; color?: typeof black } = {}
  ) {
    page.drawText(toAscii(text), {
      x,
      y: yPos,
      font: options.font ?? fontRegular,
      size: options.size ?? 9,
      color: options.color ?? black,
    });
  }

  function drawTextRight(
    text: string,
    rightX: number,
    yPos: number,
    options: { font?: PDFFont; size?: number; color?: typeof black } = {}
  ) {
    const font = options.font ?? fontRegular;
    const size = options.size ?? 9;
    const w = font.widthOfTextAtSize(toAscii(text), size);
    drawText(text, rightX - w, yPos, options);
  }

  // ---- LOGO ----
  const logoBytes = getLogoPngBytes();
  if (logoBytes) {
    try {
      const logoImage = await doc.embedPng(logoBytes);
      const logoHeight = 36;
      const logoWidth = logoHeight * (logoImage.width / logoImage.height);
      page.drawImage(logoImage, {
        x: margin,
        y: y - logoHeight + 8,
        width: logoWidth,
        height: logoHeight,
      });
      y -= logoHeight + 16;
    } catch {
      // logo embed failure is non-fatal
    }
  }

  // ---- HEADER ----
  const title =
    data.type === "CREDIT_NOTE"
      ? toAscii(t.creditNoteTitle)
      : toAscii(t.title);
  drawText(title, margin, y, { font: fontBold, size: 18 });
  drawTextRight(data.number, width - margin, y, {
    font: fontBold,
    size: 14,
  });
  y -= 30;

  // ---- DATES BAR ----
  const dates = [
    [t.issueDate, formatDate(data.issueDate)],
    [t.dueDate, formatDate(data.dueDate)],
    ...(data.taxDate ? [[t.taxDate, formatDate(data.taxDate)]] : []),
    [t.vs, data.variableSymbol],
  ];
  for (const [label, value] of dates) {
    drawText(label + ":", margin, y, { color: gray, size: 8 });
    drawText(value, margin + 100, y, { size: 8 });
    y -= 13;
  }

  if (data.type === "CREDIT_NOTE" && data.originalInvoiceNumber) {
    drawText(t.referencesInvoice + ":", margin, y, { color: gray, size: 8 });
    drawText(data.originalInvoiceNumber, margin + 100, y, { size: 8 });
    y -= 13;
  }

  y -= 10;

  // ---- SUPPLIER / BUYER ----
  const colWidth = (width - 2 * margin - 20) / 2;

  // Supplier
  drawText(toAscii(t.supplier), margin, y, {
    font: fontBold,
    size: 9,
    color: gray,
  });
  // Buyer
  drawText(toAscii(t.buyer), margin + colWidth + 20, y, {
    font: fontBold,
    size: 9,
    color: gray,
  });
  y -= 4;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: lightGray,
  });
  y -= 14;

  // Supplier details
  const sY = y;
  drawText(data.company.name, margin, y, { font: fontBold, size: 10 });
  y -= 13;
  drawText(data.company.address, margin, y, { size: 8, color: gray });
  y -= 13;
  drawText(`${toAscii(t.ico)}: ${data.company.ico}`, margin, y, { size: 8 });
  y -= 13;
  if (data.company.dic) {
    drawText(`${toAscii(t.dic)}: ${data.company.dic}`, margin, y, {
      size: 8,
    });
    y -= 13;
  }
  drawText(
    `${toAscii(t.bankAccount)}: ${data.company.bankAccount}`,
    margin,
    y,
    { size: 8 }
  );
  y -= 13;
  if (data.company.bankIban) {
    drawText(
      `${toAscii(t.iban)}: ${data.company.bankIban}`,
      margin,
      y,
      { size: 8 }
    );
    y -= 13;
  }
  if (data.company.bankName) {
    drawText(
      `${toAscii(t.bankName)}: ${data.company.bankName}`,
      margin,
      y,
      { size: 8 }
    );
    y -= 13;
  }

  // Buyer details (same Y start)
  let bY = sY;
  const bX = margin + colWidth + 20;
  drawText(data.buyerName, bX, bY, { font: fontBold, size: 10 });
  bY -= 13;
  if (data.buyerAddress) {
    drawText(data.buyerAddress, bX, bY, { size: 8, color: gray });
    bY -= 13;
  }
  if (data.buyerIco) {
    drawText(`${toAscii(t.ico)}: ${data.buyerIco}`, bX, bY, { size: 8 });
    bY -= 13;
  }
  if (data.buyerDic) {
    drawText(`${toAscii(t.dic)}: ${data.buyerDic}`, bX, bY, { size: 8 });
    bY -= 13;
  }

  y = Math.min(y, bY) - 20;

  // ---- ITEMS TABLE ----
  const tableLeft = margin;
  const tableRight = width - margin;
  const colDesc = tableLeft;
  const colQty = tableRight - 200;
  const colPrice = tableRight - 100;
  const colTotal = tableRight;

  // Table header
  page.drawRectangle({
    x: tableLeft,
    y: y - 3,
    width: tableRight - tableLeft,
    height: 16,
    color: rgb(0.95, 0.95, 0.95),
  });
  drawText(t.item, colDesc + 4, y, { font: fontBold, size: 8, color: gray });
  drawTextRight(t.quantity, colQty + 40, y, {
    font: fontBold,
    size: 8,
    color: gray,
  });
  drawTextRight(t.unitPrice, colPrice + 10, y, {
    font: fontBold,
    size: 8,
    color: gray,
  });
  drawTextRight(t.lineTotal, colTotal, y, {
    font: fontBold,
    size: 8,
    color: gray,
  });
  y -= 18;

  // Table rows
  for (const item of data.items) {
    if (y < 100) break; // page overflow guard

    const qty =
      typeof item.quantity === "number"
        ? item.quantity.toString()
        : item.quantity;

    drawText(item.description, colDesc + 4, y, { size: 8 });
    drawTextRight(`${qty} ${item.unit}`, colQty + 40, y, { size: 8 });
    drawTextRight(formatCZK(item.pricePerUnit), colPrice + 10, y, {
      size: 8,
    });
    drawTextRight(formatCZK(item.lineTotal), colTotal, y, { size: 8 });

    y -= 4;
    page.drawLine({
      start: { x: tableLeft, y },
      end: { x: tableRight, y },
      thickness: 0.3,
      color: lightGray,
    });
    y -= 14;
  }

  y -= 8;

  // ---- TOTALS ----
  const totalsX = tableRight - 160;
  const totalsValX = tableRight;

  // Subtotal
  drawText(t.subtotal, totalsX, y, { size: 9, color: gray });
  drawTextRight(`${formatCZK(data.subtotal)} CZK`, totalsValX, y, {
    size: 9,
  });
  y -= 15;

  // VAT
  drawText(t.vat, totalsX, y, { size: 9, color: gray });
  drawTextRight(`${formatCZK(data.vatAmount)} CZK`, totalsValX, y, {
    size: 9,
  });
  y -= 15;

  // Rounding
  if (data.roundingAmount !== 0) {
    drawText(t.rounding, totalsX, y, { size: 8, color: gray });
    drawTextRight(`${formatCZK(data.roundingAmount)} CZK`, totalsValX, y, {
      size: 8,
      color: gray,
    });
    y -= 15;
  }

  // Total line
  page.drawLine({
    start: { x: totalsX, y: y + 4 },
    end: { x: totalsValX, y: y + 4 },
    thickness: 1,
    color: black,
  });
  drawText(t.total, totalsX, y - 4, { font: fontBold, size: 12 });
  drawTextRight(`${formatCZK(data.total)} CZK`, totalsValX, y - 4, {
    font: fontBold,
    size: 12,
  });
  y -= 30;

  // ---- QR CODE ----
  if (
    data.type === "INVOICE" &&
    data.company.bankIban &&
    data.total > 0 &&
    !data.skipQr
  ) {
    try {
      const spayd = generateSpayd({
        iban: data.company.bankIban,
        amount: data.total / 100,
        variableSymbol: data.variableSymbol,
        message: `Faktura ${data.number}`,
      });

      const qrDataUrl = await generateQRCodeDataUrl(spayd);
      // data:image/png;base64,...
      const base64 = qrDataUrl.split(",")[1];
      const qrBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const qrImage = await doc.embedPng(qrBytes);

      const qrSize = 100;
      if (y > qrSize + 30) {
        drawText(t.qrPayment, margin, y, {
          font: fontBold,
          size: 9,
          color: gray,
        });
        y -= 10;
        page.drawImage(qrImage, {
          x: margin,
          y: y - qrSize,
          width: qrSize,
          height: qrSize,
        });
        y -= qrSize + 10;
      }
    } catch {
      // QR generation failure is non-fatal
    }
  }

  // ---- NOTE ----
  if (data.note) {
    drawText(data.note, margin, y, { size: 8, color: gray });
    y -= 15;
  }

  // ---- FOOTER ----
  drawText(
    `${toAscii(t.page)} 1/1`,
    width / 2 - 15,
    30,
    { size: 7, color: gray }
  );

  return doc.save();
}
