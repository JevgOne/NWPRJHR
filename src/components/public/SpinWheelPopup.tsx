"use client";

import { useState, useEffect } from "react";
import { SpinWheel } from "./SpinWheel";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function SpinWheelPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already played
    if (localStorage.getItem("spin-played")) return;

    // Don't show if dismissed within 7 days
    const dismissedAt = parseInt(localStorage.getItem("spin-dismissed") ?? "0");
    if (dismissedAt && Date.now() - dismissedAt < SEVEN_DAYS) return;

    const timer = setTimeout(() => setVisible(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem("spin-dismissed", String(Date.now()));
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-[calc(100%-2rem)] mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-nude-100 text-muted hover:text-ink hover:bg-nude-200 transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <SpinWheel onClose={handleClose} />
      </div>
    </div>
  );
}
