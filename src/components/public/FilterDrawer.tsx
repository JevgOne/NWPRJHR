"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  resultCount: number;
  onClearAll: () => void;
  children: React.ReactNode;
}

export function FilterDrawer({ open, onClose, resultCount, onClearAll, children }: FilterDrawerProps) {
  const t = useTranslations("public");

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, handleEsc]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed bottom-0 inset-x-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-line rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-line">
          <h2 className="text-lg font-bold text-ink">{t("offer.filtersTitle")}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-nude-50 text-muted"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4">
          {children}
        </div>
        {/* Footer */}
        <div className="sticky bottom-0 border-t border-line bg-white px-4 py-3 flex gap-3">
          <button
            onClick={() => { onClearAll(); onClose(); }}
            className="flex-1 px-4 py-2.5 rounded-xl border border-line text-sm font-medium text-espresso hover:bg-nude-50 transition-colors"
          >
            {t("offer.clearAllFilters")}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose text-white text-sm font-medium hover:bg-rose-deep transition-colors"
          >
            {t("offer.showResults", { count: resultCount })}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
