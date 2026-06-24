"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { setUserLocale } from "@/i18n/locale";
import type { Locale } from "@/i18n/config";

export function LocaleSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function onChange(newLocale: Locale) {
    startTransition(() => {
      setUserLocale(newLocale);
    });
  }

  return (
    <div className={`flex gap-1 ${isPending ? "opacity-50" : ""}`}>
      {(["cs", "uk", "ru"] as const).map((loc) => (
        <button
          key={loc}
          onClick={() => onChange(loc)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            locale === loc
              ? "bg-indigo-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          disabled={isPending}
        >
          {t(loc)}
        </button>
      ))}
    </div>
  );
}
