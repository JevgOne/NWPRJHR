"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  disabled?: boolean;
}

export function PhotoUpload({ photos, onChange, disabled }: PhotoUploadProps) {
  const t = useTranslations("photos");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        ["image/jpeg", "image/png", "image/webp"].includes(f.type)
      );
      if (fileArray.length === 0) return;

      setUploading(true);
      try {
        const formData = new FormData();
        for (const file of fileArray) {
          formData.append("files", file);
        }

        const res = await fetch("/api/upload/photos", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) return;

        const data = await res.json();
        onChange([...photos, ...data.urls]);
      } finally {
        setUploading(false);
      }
    },
    [photos, onChange]
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

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {photos.map((url, i) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt={`${t("photo")} ${i + 1}`}
                className="w-20 h-20 object-cover rounded-lg border border-line"
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
        accept="image/jpeg,image/png,image/webp"
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
