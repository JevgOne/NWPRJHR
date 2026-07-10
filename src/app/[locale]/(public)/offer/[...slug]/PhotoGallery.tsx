"use client";

import { useState } from "react";

interface PhotoGalleryProps {
  photos: string[];
  video?: string | null;
  alt: string;
}

export function PhotoGallery({ photos, video, alt }: PhotoGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState<"photo" | "video">("photo");

  const hasPhotos = photos.length > 0;
  const hasVideo = !!video;

  if (!hasPhotos && !hasVideo) {
    return (
      <div className="w-full aspect-[4/3] bg-nude-100 rounded-xl flex items-center justify-center">
        <svg
          className="w-16 h-16 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs — only show if both photo and video exist */}
      {hasPhotos && hasVideo && (
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setTab("photo")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "photo"
                ? "bg-espresso text-nude-50"
                : "bg-nude-100 text-muted hover:text-ink"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Foto
          </button>
          <button
            onClick={() => setTab("video")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "video"
                ? "bg-espresso text-nude-50"
                : "bg-nude-100 text-muted hover:text-ink"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>
            Video
          </button>
        </div>
      )}

      {/* Photo view */}
      {(tab === "photo" || !hasVideo) && hasPhotos && (
        <>
          <div className="w-full aspect-[4/3] bg-nude-100 rounded-xl overflow-hidden">
            <img
              src={photos[selected]}
              alt={`${alt} — foto ${selected + 1}`}
              className="w-full h-full object-cover"
            />
          </div>

          {photos.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === selected
                      ? "border-rose"
                      : "border-transparent hover:border-line"
                  }`}
                >
                  <img
                    src={photo}
                    alt={`${alt} — náhled ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Video view */}
      {tab === "video" && hasVideo && (
        <div className="w-full aspect-[4/3] bg-black rounded-xl overflow-hidden">
          <video
            src={video}
            controls
            playsInline
            className="w-full h-full object-contain"
            poster={photos[0]}
          >
            <track kind="captions" />
          </video>
        </div>
      )}
    </div>
  );
}
