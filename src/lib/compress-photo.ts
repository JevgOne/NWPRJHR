const MAX_WIDTH = 2400;
const VIDEO_EXTS = ["mp4", "mov", "webm"];

/**
 * Client-side photo compression: resize to max 2400px, convert to WebP.
 * Reduces 10-15MB HEIC/JPEG from phone to <1MB WebP before upload.
 * Falls through unchanged for videos or if browser can't decode the format.
 */
export async function compressPhoto(file: File): Promise<File> {
  try {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (VIDEO_EXTS.includes(ext) || file.type.startsWith("video/")) return file;
    if (file.size < 3 * 1024 * 1024 && file.type === "image/webp") return file;

    return await new Promise<File>((resolve) => {
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
          // Safari may not support WebP canvas export — try WebP, fallback to JPEG
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const name = file.name.replace(/\.[^.]+$/, ".webp");
                resolve(new File([blob], name, { type: "image/webp" }));
              } else {
                // WebP didn't reduce size or isn't supported — try JPEG
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
  } catch {
    return file;
  }
}
