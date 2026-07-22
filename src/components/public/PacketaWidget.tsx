"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";

declare global {
  interface Window {
    Packeta?: {
      Widget: {
        pick: (
          apiKey: string,
          callback: (point: PacketaPoint | null) => void,
          options?: PacketaWidgetOptions
        ) => void;
      };
    };
  }
}

export interface PacketaPoint {
  id: number;
  name: string;
  city: string;
  zip: string;
  street: string;
  place: string;
  country: string;
  currency: string;
  url: string;
  photo: string;
  openingHours: object;
  formatedValue: string;
}

interface PacketaWidgetOptions {
  country?: string;
  language?: string;
}

interface Props {
  onSelect: (point: PacketaPoint) => void;
  selectedPoint?: { id: string; name: string; city: string } | null;
  language?: string;
}

export function PacketaWidget({ onSelect, selectedPoint, language = "cs" }: Props) {
  const t = useTranslations("public.inquiry");
  const apiKey = process.env.NEXT_PUBLIC_PACKETA_API_KEY;

  const openWidget = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.Packeta) {
      // Try loading the script manually if it hasn't loaded yet
      const script = document.querySelector('script[src*="packeta"]');
      if (!script) {
        const s = document.createElement("script");
        s.src = "https://widget.packeta.com/www/js/library.js";
        s.onload = () => {
          if (window.Packeta && apiKey) {
            window.Packeta.Widget.pick(apiKey, (point) => { if (point) onSelect(point); }, { country: "cz", language });
          }
        };
        document.head.appendChild(s);
      }
      console.error("Packeta Widget library not loaded yet");
      return;
    }
    if (!apiKey) {
      console.error("NEXT_PUBLIC_PACKETA_API_KEY not configured");
      return;
    }

    window.Packeta.Widget.pick(
      apiKey,
      (point) => {
        if (point) {
          onSelect(point);
        }
      },
      { country: "cz", language }
    );
  }, [apiKey, onSelect, language]);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={openWidget}
        className="w-full px-4 py-3 border-2 border-dashed border-line rounded-lg
                   text-sm text-ink hover:border-rose hover:bg-rose/5
                   transition-colors flex items-center justify-center gap-2"
      >
        {selectedPoint ? (
          <span>
            <span className="font-medium">{selectedPoint.name}</span>
            <span className="text-muted ml-1">({selectedPoint.city})</span>
            <span className="text-xs text-rose ml-2">{t("packetaChange")}</span>
          </span>
        ) : (
          <span>{t("packetaSelect")}</span>
        )}
      </button>
    </div>
  );
}
