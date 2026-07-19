"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  const hasPhotos = photos.length > 0;
  const hasVideo = !!video;

  const goNext = useCallback(() => {
    if (photos.length > 1) setSelected((p) => (p + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    if (photos.length > 1) setSelected((p) => (p - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Touch swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };
  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    if (Math.abs(distance) > 50) {
      if (distance > 0) goNext();
      else goPrev();
    }
  };

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
      <div className="w-full aspect-[3/4] bg-nude-100 rounded-2xl flex items-center justify-center">
        <svg className="w-16 h-16 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === "photo"
                ? "bg-espresso text-nude-50 shadow-sm"
                : "bg-nude-100 text-muted hover:text-ink"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Foto{photos.length > 1 ? ` (${photos.length})` : ""}
          </button>
          <button
            onClick={() => setTab("video")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === "video"
                ? "bg-espresso text-nude-50 shadow-sm"
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
          {/* Main image */}
          <div
            className="relative w-full aspect-[3/4] bg-nude-50 rounded-2xl overflow-hidden group"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <button
              type="button"
              onClick={() => { setLightboxIndex(selected); setLightboxOpen(true); }}
              className="w-full h-full cursor-zoom-in"
            >
              <img
                src={photos[selected]}
                alt={`${alt} — foto ${selected + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </button>

            {/* Zoom hint */}
            <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white/80 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
              </svg>
            </div>

            {/* Arrows on hover (desktop) */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                  <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                  <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}

            {/* Photo counter badge */}
            {photos.length > 1 && (
              <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                {selected + 1} / {photos.length}
              </div>
            )}
          </div>

          {/* Dot indicators (mobile) */}
          {photos.length > 1 && photos.length <= 6 && (
            <div className="flex justify-center gap-1.5 mt-3 lg:hidden">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`rounded-full transition-all ${
                    i === selected
                      ? "w-6 h-2 bg-rose"
                      : "w-2 h-2 bg-line hover:bg-muted/40"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Thumbnails strip (desktop + if >1 photo) */}
          {photos.length > 1 && (
            <div className="hidden lg:flex gap-2 mt-3">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-all ${
                    i === selected
                      ? "border-rose ring-1 ring-rose/20"
                      : "border-transparent opacity-70 hover:opacity-100 hover:border-line"
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
        <div className="w-full aspect-[9/16] max-h-[75vh] bg-black rounded-2xl overflow-hidden">
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

      {/* Video inline when no tabs (only video, no photos) */}
      {!hasPhotos && hasVideo && (
        <div className="w-full aspect-[9/16] max-h-[75vh] bg-black rounded-2xl overflow-hidden">
          <video
            src={video}
            controls
            playsInline
            className="w-full h-full object-contain"
          >
            <track kind="captions" />
          </video>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white z-10 p-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous arrow */}
          {photos.length > 1 && (
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
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
            className="max-h-[92vh] max-w-[92vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next arrow */}
          {photos.length > 1 && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % photos.length); }}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Counter */}
          {photos.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white/70 text-sm px-4 py-1.5 rounded-full">
              {lightboxIndex + 1} / {photos.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
