"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { upload } from "@vercel/blob/client";
import { compressPhoto } from "@/lib/compress-photo";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-quicktime", "video/webm"];
const PHOTO_EXTS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
const VIDEO_EXTS = ["mp4", "mov", "webm"];

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  onDelete?: (photos: string[]) => void;
  video?: string | null;
  onVideoChange?: (videoUrl: string | null) => void;
  disabled?: boolean;
  productId?: string;
}

export function PhotoUpload({ photos, onChange, onDelete, video, onVideoChange, disabled, productId }: PhotoUploadProps) {
  const t = useTranslations("photos");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => {
        if (f.type.startsWith("image/") || f.type.startsWith("video/")) return true;
        if ([...PHOTO_TYPES, ...VIDEO_TYPES].includes(f.type)) return true;
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
        return PHOTO_EXTS.includes(ext) || VIDEO_EXTS.includes(ext);
      });
      if (fileArray.length === 0) {
        setUploadError("Nepodporovaný formát souboru");
        return;
      }

      setUploading(true);
      setUploadError("");
      try {
        // Compress photos client-side (HEIC → WebP, resize)
        const compressed = await Promise.all(fileArray.map(compressPhoto));

        // Upload each file directly to Vercel Blob (bypasses 4.5MB serverless limit)
        const newPhotoUrls: string[] = [];
        let newVideoUrl: string | null = null;

        for (const file of compressed) {
          const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
          const isVideo = VIDEO_EXTS.includes(ext) || file.type.startsWith("video/");
          const folder = isVideo ? "videos" : "products";
          const prefix = productId ? `${folder}/${productId}` : folder;
          const pathname = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext || "webp"}`;

          const blob = await upload(pathname, file, {
            access: "public",
            handleUploadUrl: "/api/upload/blob-token",
          });

          if (isVideo) {
            newVideoUrl = blob.url;
          } else {
            newPhotoUrls.push(blob.url);
          }
        }

        if (productId && newPhotoUrls.length > 0) {
          // Save photo URLs to product in DB
          const allPhotos = [...photos, ...newPhotoUrls];
          const res = await fetch(`/api/products/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              photos: JSON.stringify(allPhotos),
              ...(newVideoUrl ? { video: newVideoUrl } : {}),
            }),
          });
          if (res.ok) {
            onChange(allPhotos);
            if (newVideoUrl && onVideoChange) onVideoChange(newVideoUrl);
          } else {
            setUploadError("Nepodařilo se uložit fotky do produktu");
          }
        } else if (productId && newVideoUrl) {
          const res = await fetch(`/api/products/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ video: newVideoUrl }),
          });
          if (res.ok && onVideoChange) onVideoChange(newVideoUrl);
        } else {
          // No productId — just return URLs
          if (newPhotoUrls.length > 0) onChange([...photos, ...newPhotoUrls]);
          if (newVideoUrl && onVideoChange) onVideoChange(newVideoUrl);
        }
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload selhal");
      } finally {
        setUploading(false);
      }
    },
    [photos, onChange, onVideoChange, productId]
  );

  function handleRemove(index: number) {
    const updated = photos.filter((_, i) => i !== index);
    (onDelete ?? onChange)(updated);
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const reordered = [...photos];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    (onDelete ?? onChange)(reordered);
  }

  function handleMoveDown(index: number) {
    if (index === photos.length - 1) return;
    const reordered = [...photos];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    (onDelete ?? onChange)(reordered);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    uploadFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-espresso mb-1">
        {t("title")}
      </label>

      {/* Video display */}
      {video && (
        <div className="relative group mb-3">
          <video
            src={video}
            controls
            className="w-full max-w-md rounded-lg border border-line"
          />
          {!disabled && onVideoChange && (
            <button
              type="button"
              onClick={() => onVideoChange(null)}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              x
            </button>
          )}
        </div>
      )}

      {/* Photo thumbnails */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {photos.map((url, i) => (
            <div key={url} className="relative group">
              {i === 0 && (
                <span className="absolute top-1 left-1 z-10 bg-rose text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                  {t("main")}
                </span>
              )}
              <img
                src={url}
                alt={`${t("photo")} ${i + 1}`}
                className="w-32 h-32 object-cover rounded-lg border border-line"
              />
              {!disabled && (
                <div className="absolute bottom-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMoveUp(i)}
                      className="w-5 h-5 bg-black/60 text-white rounded text-xs flex items-center justify-center hover:bg-black/80"
                      title={t("moveLeft")}
                    >
                      &larr;
                    </button>
                  )}
                  {i < photos.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMoveDown(i)}
                      className="w-5 h-5 bg-black/60 text-white rounded text-xs flex items-center justify-center hover:bg-black/80"
                      title={t("moveRight")}
                    >
                      &rarr;
                    </button>
                  )}
                </div>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-red-600 mb-2">{uploadError}</p>
      )}

      {/* Upload area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-rose bg-rose/10"
            : "border-line hover:border-gray-400"
        } ${disabled || uploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {uploading ? (
          <p className="text-sm text-muted">{t("uploading")}</p>
        ) : (
          <p className="text-sm text-muted">{t("dragOrClick")}</p>
        )}
        <p className="text-xs text-muted mt-1">{t("formats")}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.mov,.webm,image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) uploadFiles(e.target.files);
          e.target.value = "";
        }}
        disabled={disabled || uploading}
      />

    </div>
  );
}
