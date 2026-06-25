"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { setUserLocale } from "@/i18n/locale";
import type { Locale } from "@/i18n/config";

const localeFlags: Record<Locale, { flag: string; label: string }> = {
  cs: { flag: "🇨🇿", label: "Čeština" },
  uk: { flag: "🇺🇦", label: "Українська" },
  ru: { flag: "🇷🇺", label: "Русский" },
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function onChange(newLocale: Locale) {
    startTransition(() => {
      setUserLocale(newLocale);
    });
  }

  return (
    <div className={`flex gap-1 ${isPending ? "opacity-50" : ""}`}>
      {(["cs", "uk", "ru"] as const).map((loc) => {
        const { flag, label } = localeFlags[loc];
        return (
          <button
            key={loc}
            onClick={() => onChange(loc)}
            className={`px-1.5 py-1 text-lg rounded transition-colors ${
              locale === loc
                ? "bg-indigo-100 ring-2 ring-indigo-500"
                : "hover:bg-gray-100 opacity-60 hover:opacity-100"
            }`}
            disabled={isPending}
            title={label}
          >
            {flag}
          </button>
        );
      })}
    </div>
  );
}
