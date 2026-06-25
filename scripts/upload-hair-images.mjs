import { put } from "@vercel/blob";
import { readFileSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("Missing BLOB_READ_WRITE_TOKEN in .env");
  process.exit(1);
}

const images = [
  { file: "volne-vlasy.jpg", path: "hair/volne-vlasy.jpg" },
  { file: "volne-vlasy-promo.jpg", path: "hair/volne-vlasy-promo.jpg" },
  { file: "keratinove-vlasy.jpg", path: "hair/keratinove-vlasy.jpg" },
  { file: "clip-in.jpg", path: "hair/clip-in.jpg" },
  { file: "tape-in.jpg", path: "hair/tape-in.jpg" },
  { file: "odstiny-prehled.jpg", path: "hair/odstiny-prehled.jpg" },
  { file: "extensions-techniky.jpg", path: "hair/extensions-techniky.jpg" },
];

const dir = join(process.cwd(), "public", "images", "hair");

const urls = {};

for (const img of images) {
  const filePath = join(dir, img.file);
  const buffer = readFileSync(filePath);

  const blob = await put(img.path, buffer, {
    access: "public",
    contentType: "image/jpeg",
  });

  urls[img.file] = blob.url;
  console.log(`✓ ${img.file} → ${blob.url}`);
}

console.log("\n--- URLs for code ---");
console.log(JSON.stringify(urls, null, 2));
