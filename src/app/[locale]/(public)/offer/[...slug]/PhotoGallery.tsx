"use client";

import { useState, useEffect } from "react";

interface PhotoGalleryProps {
  photos: string[];
  video?: string | null;
  alt: string;
}

export function PhotoGallery({ photos, video, alt }: PhotoGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState<"photo" | "video">("photo");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const hasPhotos = photos.length > 0;
  const hasVideo = !!video;

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
      if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev + 1) % photos.length);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, photos.length]);

  // Body scroll lock
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxOpen]);

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
            <button
              type="button"
              onClick={() => { setLightboxIndex(selected); setLightboxOpen(true); }}
              className="w-full h-full cursor-zoom-in"
            >
              <img
                src={photos[selected]}
                alt={`${alt} — foto ${selected + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
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

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10 p-2"
            onClick={() => setLightboxOpen(false)}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous arrow */}
          {photos.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length); }}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <img
            src={photos[lightboxIndex]}
            alt={`${alt} — foto ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next arrow */}
          {photos.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % photos.length); }}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Counter */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 text-white/50 text-sm">
              {lightboxIndex + 1} / {photos.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
