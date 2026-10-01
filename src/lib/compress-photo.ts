const MAX_WIDTH = 2400;
const VIDEO_EXTS = ["mp4", "mov", "webm"];

/**
 * Client-side photo compression: resize to max 2400px, convert to WebP.
 * Reduces 10-15MB HEIC/JPEG from phone to <1MB WebP before upload.
 * Falls through unchanged for videos or if browser can't decode the format.
 */
export async function compressPhoto(file: File): Promise<File> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (VIDEO_EXTS.includes(ext) || file.type.startsWith("video/")) return file;
  if (file.size < 3 * 1024 * 1024 && file.type === "image/webp") return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            const name = file.name.replace(/\.[^.]+$/, ".webp");
            resolve(new File([blob], name, { type: "image/webp" }));
          } else {
            resolve(file);
          }
        },
        "image/webp",
        0.82
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}
