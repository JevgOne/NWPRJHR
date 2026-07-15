"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-quicktime", "video/webm"];
const PHOTO_EXTS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
const VIDEO_EXTS = ["mp4", "mov", "webm"];

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  video?: string | null;
  onVideoChange?: (videoUrl: string | null) => void;
  disabled?: boolean;
  productId?: string;
}

export function PhotoUpload({ photos, onChange, video, onVideoChange, disabled, productId }: PhotoUploadProps) {
  const t = useTranslations("photos");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => {
        if ([...PHOTO_TYPES, ...VIDEO_TYPES].includes(f.type)) return true;
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
        return PHOTO_EXTS.includes(ext) || VIDEO_EXTS.includes(ext);
      });
      if (fileArray.length === 0) return;

      setUploading(true);
      setUploadError("");
      try {
        const formData = new FormData();
        for (const file of fileArray) {
          formData.append("files", file);
        }

        // Use product-specific media endpoint when productId is available
        // This saves photos directly to the product (single round-trip)
        const endpoint = productId
          ? `/api/products/${productId}/media`
          : "/api/upload/photos";

        const res = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Upload selhal" }));
          setUploadError(err.error || `Upload selhal (${res.status})`);
          return;
        }

        const data = await res.json();

        if (productId) {
          // Media endpoint returns full photos array already saved to DB
          const allPhotos: string[] = data.photos ?? [];
          onChange(allPhotos);
          if (data.video !== undefined && onVideoChange) {
            onVideoChange(data.video);
          }
        } else {
          // Generic upload endpoint returns new URLs only
          const newPhotos = data.photoUrls ?? data.urls ?? [];
          if (newPhotos.length > 0) {
            onChange([...photos, ...newPhotos]);
          }
          if (data.videoUrl && onVideoChange) {
            onVideoChange(data.videoUrl);
          }
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
    onChange(photos.filter((_, i) => i !== index));
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
              <img
                src={url}
                alt={`${t("photo")} ${i + 1}`}
                className="w-32 h-32 object-cover rounded-lg border border-line"
              />
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
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/x-quicktime,video/webm"
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
