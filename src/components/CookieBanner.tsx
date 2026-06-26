"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

const CONSENT_KEY = "hairora_cookie_consent";

export function CookieBanner() {
  const t = useTranslations("public");
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
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-line p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-muted flex-1">
          {t("cookie.message")}{" "}
          <a
            href="/privacy"
            className="text-rose underline hover:text-rose-deep"
          >
            {t("cookie.privacyLink")}
          </a>
          .
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => accept("necessary")}
            className="px-4 py-2 text-sm font-medium text-espresso bg-nude-100 rounded-lg hover:bg-nude-200 transition-colors"
          >
            {t("cookie.necessaryOnly")}
          </button>
          <button
            onClick={() => accept("all")}
            className="px-4 py-2 text-sm font-medium text-white bg-rose rounded-lg hover:bg-rose-deep transition-colors"
          >
            {t("cookie.acceptAll")}
          </button>
        </div>
      </div>
    </div>
  );
}
