"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

/**
 * Client-side watermark: draws tiled "HAIRLAND" text across image using Canvas.
 * Returns a new blob URL after uploading the watermarked version.
 */
async function addClientWatermark(photoUrl: string): Promise<string> {
  // Load image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Nelze načíst obrázek"));
    el.src = photoUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Detect brightness for text color
  const sample = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let sum = 0;
  for (let i = 0; i < sample.data.length; i += 16) {
    sum += (sample.data[i] + sample.data[i + 1] + sample.data[i + 2]) / 3;
  }
  const brightness = sum / (sample.data.length / 16);
  const textColor = brightness > 140 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)";

  // Setup watermark text
  const fontSize = Math.max(24, Math.round(canvas.width * 0.06));
  ctx.font = `bold ${fontSize}px Georgia, serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Tile watermark with -30° rotation
  const text = "HAIRLAND";
  const spacingX = fontSize * 8;
  const spacingY = fontSize * 4;
  const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((-30 * Math.PI) / 180);

  for (let y = -diagonal; y < diagonal; y += spacingY) {
    const row = Math.round(y / spacingY);
    const offsetX = row % 2 === 0 ? 0 : spacingX / 2;
    for (let x = -diagonal; x < diagonal; x += spacingX) {
      ctx.fillText(text, x + offsetX, y);
    }
  }
  ctx.restore();

  // Convert to blob and upload
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))),
      "image/jpeg",
      0.9
    );
  });

  const formData = new FormData();
  formData.append("files", blob, "watermarked.jpg");
  const res = await fetch("/api/upload/photos", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload vodoznaku selhal");
  const data = await res.json();
  const urls = data.photoUrls ?? data.urls ?? [];
  return urls[0] ?? photoUrl;
}

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
  const [watermarking, setWatermarking] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        [...PHOTO_TYPES, ...VIDEO_TYPES].includes(f.type)
      );
      if (fileArray.length === 0) return;

      setUploading(true);
      setUploadError("");
      try {
        const formData = new FormData();
        for (const file of fileArray) {
          formData.append("files", file);
        }

        const res = await fetch("/api/upload/photos", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Upload selhal" }));
          setUploadError(err.error || `Upload selhal (${res.status})`);
          return;
        }

        const data = await res.json();
        const newPhotos = data.photoUrls ?? data.urls ?? [];
        if (newPhotos.length > 0) {
          onChange([...photos, ...newPhotos]);
        }
        if (data.videoUrl && onVideoChange) {
          onVideoChange(data.videoUrl);
        }
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Upload selhal");
      } finally {
        setUploading(false);
      }
    },
    [photos, onChange, onVideoChange]
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
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) uploadFiles(e.target.files);
          e.target.value = "";
        }}
        disabled={disabled || uploading}
      />

      {photos.length > 0 && !disabled && (
        <button
          type="button"
          onClick={async () => {
            setWatermarking(true);
            setUploadError("");
            try {
              const watermarked: string[] = [];
              for (const url of photos) {
                const wmUrl = await addClientWatermark(url);
                watermarked.push(wmUrl);
              }
              onChange(watermarked);
            } catch (e) {
              setUploadError(e instanceof Error ? e.message : "Vodoznak se nepodařilo přidat");
            } finally {
              setWatermarking(false);
            }
          }}
          disabled={watermarking}
          className="mt-2 text-xs text-muted hover:text-espresso transition-colors disabled:opacity-50"
        >
          {watermarking ? t("watermarking") : t("addWatermark")}
        </button>
      )}
    </div>
  );
}
