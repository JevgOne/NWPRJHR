"use client";

import { useState } from "react";

interface PhotoGalleryProps {
  photos: string[];
  alt: string;
}

export function PhotoGallery({ photos, alt }: PhotoGalleryProps) {
  const [selected, setSelected] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl flex items-center justify-center">
        <svg
          className="w-16 h-16 text-gray-300"
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
      {/* Main image */}
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
        <img
          src={photos[selected]}
          alt={`${alt} - ${selected + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === selected
                  ? "border-indigo-500"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <img
                src={photo}
                alt={`${alt} - ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
