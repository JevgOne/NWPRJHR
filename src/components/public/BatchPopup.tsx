"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface AnnouncementData {
  availableDate: string;
  description: string | null;
}

export function BatchPopup() {
  const t = useTranslations("public");
  const [data, setData] = useState<AnnouncementData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    const key = "batch-popup-dismissed";
    if (sessionStorage.getItem(key)) return;

    fetch("/api/batch-announcement")
      .then((r) => r.json())
      .then((d) => {
        if (d && d.availableDate) {
          setData(d);
          // Slight delay for smooth entrance
          setTimeout(() => setVisible(true), 500);
        }
      })
      .catch(() => {});
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("batch-popup-dismissed", "1");
    setTimeout(() => setDismissed(true), 300);
  };

  if (!data || dismissed) return null;

  const availDate = new Date(data.availableDate);
  const formatted = availDate.toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-sm transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-line/50 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-rose to-gold" />

        <div className="p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0 mt-0.5">📦</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">
                {t("batchPopup.title")}
              </p>
              <p className="text-sm text-espresso mt-1">
                {t("batchPopup.availableFrom")}{" "}
                <span className="font-semibold text-ink">{formatted}</span>
              </p>
              {data.description && (
                <p className="text-xs text-muted mt-1.5">
                  {data.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-muted hover:text-ink transition-colors text-lg leading-none flex-shrink-0 -mt-1 -mr-1 p-1"
              aria-label="Zavřít"
            >
              &times;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
