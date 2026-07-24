"use client";

import { useState, useCallback } from "react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openWidget = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");

    if (!apiKey) {
      setError("Widget není nakonfigurován");
      return;
    }

    const pickPoint = () => {
      setLoading(false);
      if (window.Packeta) {
        window.Packeta.Widget.pick(
          apiKey,
          (point) => { if (point) onSelect(point); },
          { country: "cz", language }
        );
      } else {
        setError("Widget se nepodařilo načíst. Zkuste to znovu.");
      }
    };

    if (window.Packeta) {
      pickPoint();
      return;
    }

    // Script not loaded yet — wait for it
    setLoading(true);
    let script = document.querySelector('script[src*="packeta"]') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.src = "https://widget.packeta.com/www/js/library.js";
      document.head.appendChild(script);
    }

    const onLoad = () => { pickPoint(); };
    const onError = () => {
      setLoading(false);
      setError("Nepodařilo se načíst Zásilkovna widget");
    };
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });

    // If script already loaded (e.g. cached), check after microtask
    setTimeout(() => {
      if (window.Packeta) {
        script?.removeEventListener("load", onLoad);
        pickPoint();
      }
    }, 100);
  }, [apiKey, onSelect, language]);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={openWidget}
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-dashed border-line rounded-lg
                   text-sm text-ink hover:border-rose hover:bg-rose/5
                   transition-colors flex items-center justify-center gap-2
                   disabled:opacity-50 disabled:cursor-wait"
      >
        {loading ? (
          <span className="text-muted">Načítání...</span>
        ) : selectedPoint ? (
          <span>
            <span className="font-medium">{selectedPoint.name}</span>
            <span className="text-muted ml-1">({selectedPoint.city})</span>
            <span className="text-xs text-rose ml-2">{t("packetaChange")}</span>
          </span>
        ) : (
          <span>{t("packetaSelect")}</span>
        )}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
