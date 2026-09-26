import { readFile } from "fs/promises";
import { join } from "path";

export async function loadEmailAttachments(isB2B: boolean) {
  const docsDir = join(process.cwd(), "public", "docs");
  const attachments: { filename: string; content: Buffer }[] = [];

  const files = [
    "reklamacni-rad.pdf",
    "navod-na-peci.pdf",
    ...(!isB2B ? ["formular-odstoupeni.pdf"] : []),
  ];

  for (const filename of files) {
    try {
      const content = await readFile(join(docsDir, filename));
      attachments.push({ filename, content });
    } catch {
      console.warn(`[email-attachments] Missing PDF: ${filename} — skipping`);
    }
  }

  return attachments;
}
