import { readFile } from "fs/promises";
import { join } from "path";

export async function loadEmailAttachments(isB2B: boolean) {
  const docsDir = join(process.cwd(), "public", "docs");
  const attachments = [
    { filename: "reklamacni-rad.pdf", content: await readFile(join(docsDir, "reklamacni-rad.pdf")) },
    { filename: "navod-na-peci.pdf", content: await readFile(join(docsDir, "navod-na-peci.pdf")) },
  ];
  if (!isB2B) {
    attachments.push({
      filename: "formular-odstoupeni.pdf",
      content: await readFile(join(docsDir, "formular-odstoupeni.pdf")),
    });
  }
  return attachments;
}
