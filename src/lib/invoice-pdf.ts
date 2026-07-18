import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { getInvoiceTranslations } from "./invoice-translations";
import { generateQRCodeDataUrl } from "./qr-code";
import { generateSpayd } from "./spayd";
import { getInterRegular, getInterBold } from "./invoice-fonts";

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
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  buyerInstagram?: string | null;
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
    contactEmail?: string | null;
    contactPhone?: string | null;
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
  І: "I",і: "i",Ї: "Yi",ї: "yi",Є: "Ye",є: "ye",Ґ: "G",ґ: "g",
  "'": "'",
};

// Sanitize text for PDF rendering.
// With custom font (Inter): keep Czech diacritics, only transliterate Cyrillic.
// Without (Helvetica fallback): also strip diacritics.
function sanitizeText(text: string, stripDiacritics = false): string {
  let result = "";
  for (const ch of text) {
    if (cyrMap[ch] !== undefined) {
      result += cyrMap[ch];
    } else {
      result += ch;
    }
  }
  if (stripDiacritics) {
    result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  return result;
}

// Brand colors
const espresso = rgb(0.227, 0.173, 0.161);   // #3a2c29
const muted = rgb(0.45, 0.40, 0.38);          // #736662
const accent = rgb(0.761, 0.639, 0.420);       // #c2a36b
const lineColor = rgb(0.88, 0.84, 0.80);       // #e1d6cc
const bgLight = rgb(0.976, 0.965, 0.953);      // #f9f7f3
const white = rgb(1, 1, 1);

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

  // Register fontkit for custom font embedding (Czech/Ukrainian diacritics)
  doc.registerFontkit(fontkit);

  // Use embedded Inter fonts (base64 bundled — works reliably on Vercel serverless)
  let fontRegular: PDFFont;
  let fontBold: PDFFont;
  let hasDiacritics = false;

  try {
    fontRegular = await doc.embedFont(getInterRegular(), { subset: true });
    fontBold = await doc.embedFont(getInterBold(), { subset: true });
    hasDiacritics = true;
  } catch {
    fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  }

  const ml = 50;  // margin left
  const mr = 50;  // margin right
  const contentWidth = width - ml - mr;
  const rightEdge = width - mr;
  let y = height - 45;

  const strip = !hasDiacritics; // strip diacritics if using Helvetica fallback

  // ---- Helper functions ----
  function text(
    s: string, x: number, yPos: number,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {}
  ) {
    page.drawText(sanitizeText(s, strip), {
      x, y: yPos,
      font: opts.font ?? fontRegular,
      size: opts.size ?? 9,
      color: opts.color ?? espresso,
    });
  }

  function textRight(
    s: string, x: number, yPos: number,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {}
  ) {
    const f = opts.font ?? fontRegular;
    const sz = opts.size ?? 9;
    const w = f.widthOfTextAtSize(sanitizeText(s, strip), sz);
    text(s, x - w, yPos, opts);
  }

  function line(x1: number, yPos: number, x2: number, thickness = 0.5, color = lineColor) {
    page.drawLine({ start: { x: x1, y: yPos }, end: { x: x2, y: yPos }, thickness, color });
  }

  function rect(x: number, yPos: number, w: number, h: number, color: ReturnType<typeof rgb>) {
    page.drawRectangle({ x, y: yPos, width: w, height: h, color });
  }

  // ---- HEADER ----
  const logoBytes = getLogoPngBytes();
  if (logoBytes) {
    try {
      const logoImage = await doc.embedPng(logoBytes);
      const logoH = 32;
      const logoW = logoH * (logoImage.width / logoImage.height);
      page.drawImage(logoImage, { x: ml, y: y - logoH + 8, width: logoW, height: logoH });
    } catch { /* non-fatal */ }
  }

  // Invoice number — top right, prominent
  textRight(data.number, rightEdge, y - 2, { font: fontBold, size: 16, color: espresso });

  const title = data.type === "CREDIT_NOTE" ? t.creditNoteTitle : t.title;
  textRight(sanitizeText(title), rightEdge, y - 18, { size: 9, color: muted });

  y -= 50;

  // Accent line under header
  line(ml, y, rightEdge, 2, accent);
  y -= 20;

  // ---- INFO ROW (dates + VS) ----
  const infoItems: [string, string][] = [
    [t.issueDate, formatDate(data.issueDate)],
    ...(data.taxDate ? [[t.taxDate, formatDate(data.taxDate)] as [string, string]] : []),
    [t.vs, data.variableSymbol],
  ];

  if (data.type === "CREDIT_NOTE" && data.originalInvoiceNumber) {
    infoItems.push([t.referencesInvoice, data.originalInvoiceNumber]);
  }

  // Draw info items in a row
  const infoColWidth = contentWidth / infoItems.length;
  infoItems.forEach(([label, value], i) => {
    const x = ml + i * infoColWidth;
    text(sanitizeText(label), x, y, { size: 7, color: muted });
    text(value, x, y - 12, { font: fontBold, size: 9 });
  });

  y -= 35;

  // ---- SUPPLIER / BUYER ----
  const halfW = (contentWidth - 30) / 2;
  const buyerX = ml + halfW + 30;

  // Section headers
  rect(ml, y - 3, halfW, 16, bgLight);
  rect(buyerX, y - 3, halfW, 16, bgLight);
  text(sanitizeText(t.supplier), ml + 8, y, { font: fontBold, size: 8, color: muted });
  text(sanitizeText(t.buyer), buyerX + 8, y, { font: fontBold, size: 8, color: muted });
  y -= 20;

  // Supplier details
  const sY = y;
  text(data.company.name, ml + 8, y, { font: fontBold, size: 10 });
  y -= 15;
  text(data.company.address, ml + 8, y, { size: 8, color: muted });
  y -= 15;
  text(`${sanitizeText(t.ico)}: ${data.company.ico}`, ml + 8, y, { size: 8 });
  y -= 13;
  if (data.company.dic) {
    text(`${sanitizeText(t.dic)}: ${data.company.dic}`, ml + 8, y, { size: 8 });
    y -= 13;
  }
  text(`${sanitizeText(t.bankAccount)}: ${data.company.bankAccount || "7141812004/5500"}`, ml + 8, y, { size: 8 });
  y -= 13;
  if (data.company.bankIban) {
    text(`IBAN: ${data.company.bankIban}`, ml + 8, y, { size: 8 });
    y -= 13;
  }
  if (data.company.bankName) {
    text(`${sanitizeText(t.bankName)}: ${data.company.bankName}`, ml + 8, y, { size: 8 });
    y -= 13;
  }
  if (data.company.contactPhone) {
    text(`Tel: ${data.company.contactPhone}`, ml + 8, y, { size: 8 });
    y -= 13;
  }
  if (data.company.contactEmail) {
    text(`E-mail: ${data.company.contactEmail}`, ml + 8, y, { size: 8 });
    y -= 13;
  }

  // Buyer details (same start Y)
  let bY = sY;
  text(data.buyerName, buyerX + 8, bY, { font: fontBold, size: 10 });
  bY -= 15;
  if (data.buyerAddress) {
    text(data.buyerAddress, buyerX + 8, bY, { size: 8, color: muted });
    bY -= 15;
  }
  if (data.buyerIco) {
    text(`${sanitizeText(t.ico)}: ${data.buyerIco}`, buyerX + 8, bY, { size: 8 });
    bY -= 13;
  }
  if (data.buyerDic) {
    text(`${sanitizeText(t.dic)}: ${data.buyerDic}`, buyerX + 8, bY, { size: 8 });
    bY -= 13;
  }
  if (data.buyerEmail) {
    text(`E-mail: ${data.buyerEmail}`, buyerX + 8, bY, { size: 8, color: muted });
    bY -= 13;
  }
  if (data.buyerPhone) {
    text(`Tel: ${data.buyerPhone}`, buyerX + 8, bY, { size: 8, color: muted });
    bY -= 13;
  }
  if (data.buyerInstagram) {
    text(`IG: ${data.buyerInstagram}`, buyerX + 8, bY, { size: 8, color: muted });
    bY -= 13;
  }

  y = Math.min(y, bY) - 25;

  // ---- ITEMS TABLE ----
  // Column positions — fixed widths for clean alignment
  const colDescX = ml;
  const colQtyX = rightEdge - 195;   // quantity right-edge
  const colUnitX = rightEdge - 110;  // unit price right-edge
  const colTotalX = rightEdge;       // line total right-edge

  // Table header background
  rect(ml, y - 4, contentWidth, 18, espresso);
  text(t.item, colDescX + 8, y, { font: fontBold, size: 8, color: white });
  textRight(t.quantity, colQtyX, y, { font: fontBold, size: 8, color: white });
  textRight(sanitizeText(t.unitPrice), colUnitX, y, { font: fontBold, size: 8, color: white });
  textRight(t.lineTotal, colTotalX - 4, y, { font: fontBold, size: 8, color: white });
  y -= 22;

  // Table rows
  for (let i = 0; i < data.items.length; i++) {
    if (y < 120) break; // page overflow guard
    const item = data.items[i];

    // Alternating row background
    if (i % 2 === 0) {
      rect(ml, y - 5, contentWidth, 18, bgLight);
    }

    const qty = typeof item.quantity === "number" ? item.quantity.toString() : item.quantity;

    text(item.description, colDescX + 8, y, { size: 8 });
    textRight(`${qty} ${item.unit}`, colQtyX, y, { size: 8 });
    textRight(formatCZK(item.pricePerUnit), colUnitX, y, { size: 8 });
    textRight(formatCZK(item.lineTotal), colTotalX - 4, y, { size: 8 });
    y -= 18;
  }

  // Bottom table line
  line(ml, y + 2, rightEdge, 0.5);
  y -= 20;

  // ---- TOTALS ----
  const totalsLabelX = rightEdge - 200;
  const totalsValueX = rightEdge - 4;

  // Subtotal
  text(sanitizeText(t.subtotal), totalsLabelX, y, { size: 9, color: muted });
  textRight(`${formatCZK(data.subtotal)} CZK`, totalsValueX, y, { size: 9 });
  y -= 16;

  // VAT
  text(sanitizeText(t.vat), totalsLabelX, y, { size: 9, color: muted });
  textRight(`${formatCZK(data.vatAmount)} CZK`, totalsValueX, y, { size: 9 });
  y -= 16;

  // Rounding
  if (data.roundingAmount !== 0) {
    text(sanitizeText(t.rounding), totalsLabelX, y, { size: 8, color: muted });
    textRight(`${formatCZK(data.roundingAmount)} CZK`, totalsValueX, y, { size: 8, color: muted });
    y -= 16;
  }

  // Total — highlighted box
  y -= 4;
  const totalBoxH = 30;
  const totalTextY = y - totalBoxH / 2 + 5;
  rect(totalsLabelX - 10, y - totalBoxH + 8, rightEdge - totalsLabelX + 14, totalBoxH, espresso);
  text(sanitizeText(t.total), totalsLabelX, totalTextY, { font: fontBold, size: 11, color: white });
  textRight(`${formatCZK(data.total)} CZK`, totalsValueX, totalTextY, { font: fontBold, size: 11, color: white });
  y -= totalBoxH + 15;

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
      const base64 = qrDataUrl.split(",")[1];
      const qrBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const qrImage = await doc.embedPng(qrBytes);

      const qrSize = 90;
      if (y > qrSize + 40) {
        text(sanitizeText(t.qrPayment), ml, y, { font: fontBold, size: 8, color: muted });
        y -= 8;
        page.drawImage(qrImage, { x: ml, y: y - qrSize, width: qrSize, height: qrSize });
        y -= qrSize + 12;
      }
    } catch { /* non-fatal */ }
  }

  // ---- NOTE ----
  if (data.note) {
    text(data.note, ml, y, { size: 8, color: muted });
    y -= 15;
  }

  // ---- FOOTER ----
  line(ml, 55, rightEdge, 0.5, lineColor);
  const footerParts = ["www.hairland.cz"];
  if (data.company.contactEmail) footerParts.push(data.company.contactEmail);
  if (data.company.contactPhone) footerParts.push(data.company.contactPhone);
  text(footerParts.join("  |  "), ml, 42, { size: 7, color: muted });
  textRight(`${sanitizeText(t.page)} 1/1`, rightEdge, 42, { size: 7, color: muted });

  return doc.save();
}
