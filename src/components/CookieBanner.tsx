"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "hairora_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function accept(level: "all" | "necessary") {
    localStorage.setItem(CONSENT_KEY, level);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-600 flex-1">
          Tento web používá cookies pro zajištění správné funkčnosti. Více
          informací naleznete v{" "}
          <a
            href="/privacy"
            className="text-indigo-600 underline hover:text-indigo-700"
          >
            zásadách ochrany osobních údajů
          </a>
          .
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => accept("necessary")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Pouze nezbytné
          </button>
          <button
            onClick={() => accept("all")}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Souhlasím
          </button>
        </div>
      </div>
    </div>
  );
}
