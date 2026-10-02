const MAX_WIDTH = 2400;
const MAX_HEIGHT = 2400;
const VIDEO_EXTS = ["mp4", "mov", "webm"];
const HEIC_EXTS = ["heic", "heif"];
const COMPRESS_TIMEOUT_MS = 15_000;

/**
 * Client-side photo compression: resize to max 2400px, convert to WebP.
 * HEIC files are converted to JPEG via heic2any before compression.
 * Times out after 15s and uploads original (but HEIC timeout converts to blank JPEG fallback).
 */
export async function compressPhoto(file: File): Promise<File> {
  try {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

    // Videos — pass through
    if (VIDEO_EXTS.includes(ext) || file.type.startsWith("video/")) return file;

    // HEIC — convert to JPEG first, then compress
    if (HEIC_EXTS.includes(ext) || file.type === "image/heic" || file.type === "image/heif") {
      const converted = await Promise.race([
        convertHeic(file),
        new Promise<File>((resolve) =>
          setTimeout(() => resolve(file), COMPRESS_TIMEOUT_MS)
        ),
      ]);
      // If conversion failed (still HEIC), return as-is — better than nothing
      if (converted === file) return file;
      // Now compress the converted JPEG through normal pipeline
      return compressImage(converted);
    }

    // Small WebP — skip
    if (file.size < 500 * 1024 && file.type === "image/webp") return file;

    // JPEG/PNG/WebP — compress client-side
    const compressed = await Promise.race([
      compressImage(file),
      new Promise<File>((resolve) =>
        setTimeout(() => resolve(file), COMPRESS_TIMEOUT_MS)
      ),
    ]);
    return compressed;
  } catch {
    return file;
  }
}

async function convertHeic(file: File): Promise<File> {
  try {
    const heic2any = (await import("heic2any")).default;
    const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
    const result = Array.isArray(blob) ? blob[0] : blob;
    const name = file.name.replace(/\.[^.]+$/, ".jpg");
    return new File([result], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function compressImage(file: File): Promise<File> {
  return new Promise<File>((resolve) => {
    const img = new Image();
    let url: string;
    try {
      url = URL.createObjectURL(file);
    } catch {
      resolve(file);
      return;
    }
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        let scale = 1;
        if (img.width > MAX_WIDTH) scale = MAX_WIDTH / img.width;
        if (img.height * scale > MAX_HEIGHT) scale = MAX_HEIGHT / img.height;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const name = file.name.replace(/\.[^.]+$/, ".webp");
              resolve(new File([blob], name, { type: "image/webp" }));
            } else {
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob && jpegBlob.size < file.size) {
                    const name = file.name.replace(/\.[^.]+$/, ".jpg");
                    resolve(new File([jpegBlob], name, { type: "image/jpeg" }));
                  } else {
                    resolve(file);
                  }
                },
                "image/jpeg",
                0.80
              );
            }
          },
          "image/webp",
          0.75
        );
      } catch {
        resolve(file);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}
