import { prisma } from "./db";
import { ZipArchive } from "archiver";
import * as fs from "fs/promises";

interface PdfBundleParams {
  from: Date;
  to: Date;
}

export async function generatePdfBundle(
  params: PdfBundleParams
): Promise<{ buffer: Buffer; invoiceCount: number; creditNoteCount: number }> {
  const invoices = await prisma.invoice.findMany({
    where: {
      issueDate: { gte: params.from, lte: params.to },
      status: { not: "CANCELLED" },
      pdfPath: { not: null },
    },
    orderBy: { number: "asc" },
  });

  const invoiceCount = invoices.filter((i) => i.type === "INVOICE").length;
  const creditNoteCount = invoices.filter(
    (i) => i.type === "CREDIT_NOTE"
  ).length;

  return new Promise((resolve, reject) => {
    const archive = new ZipArchive({ zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () =>
      resolve({
        buffer: Buffer.concat(chunks),
        invoiceCount,
        creditNoteCount,
      })
    );
    archive.on("error", reject);

    (async () => {
      for (const invoice of invoices) {
        if (!invoice.pdfPath) continue;
        try {
          const pdfBuffer = await fs.readFile(invoice.pdfPath);
          const prefix =
            invoice.type === "CREDIT_NOTE" ? "dobropis" : "faktura";
          archive.append(pdfBuffer, {
            name: `${prefix}-${invoice.number}.pdf`,
          });
        } catch {
          // Skip missing PDF files
        }
      }
      await archive.finalize();
    })().catch(reject);
  });
}
