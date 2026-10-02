const MAX_WIDTH = 2400;
const VIDEO_EXTS = ["mp4", "mov", "webm"];
const HEIC_EXTS = ["heic", "heif"];
const COMPRESS_TIMEOUT_MS = 15_000; // 15 seconds max

/**
 * Client-side photo compression: resize to max 2400px, convert to WebP.
 * HEIC files are first converted to JPEG via heic2any.
 * Falls through unchanged for videos or on any error.
 * Times out after 15 seconds and uploads original.
 */
export async function compressPhoto(file: File): Promise<File> {
  try {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (VIDEO_EXTS.includes(ext) || file.type.startsWith("video/")) return file;
    if (file.size < 3 * 1024 * 1024 && file.type === "image/webp") return file;

    const compressed = await Promise.race([
      processImage(file),
      new Promise<File>((resolve) =>
        setTimeout(() => resolve(file), COMPRESS_TIMEOUT_MS)
      ),
    ]);
    return compressed;
  } catch {
    return file;
  }
}

async function processImage(file: File): Promise<File> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isHeic = HEIC_EXTS.includes(ext) || file.type === "image/heic" || file.type === "image/heif";

  // Convert HEIC → JPEG first (browsers can't decode HEIC in canvas)
  let processableFile = file;
  if (isHeic) {
    try {
      const heic2any = (await import("heic2any")).default;
      const blob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.9,
      });
      const jpegBlob = Array.isArray(blob) ? blob[0] : blob;
      const name = file.name.replace(/\.[^.]+$/, ".jpg");
      processableFile = new File([jpegBlob], name, { type: "image/jpeg" });
    } catch {
      // heic2any failed — try uploading original
      return file;
    }
  }

  return compressImage(processableFile);
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
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
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
                0.85
              );
            }
          },
          "image/webp",
          0.82
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
