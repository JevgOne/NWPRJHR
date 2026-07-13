"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";

const localeFlags: Record<Locale, { flag: string; label: string }> = {
  cs: { flag: "🇨🇿", label: "Čeština" },
  uk: { flag: "🇺🇦", label: "Українська" },
  ru: { flag: "🇷🇺", label: "Русский" },
};

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function onChange(newLocale: Locale) {
    setOpen(false);
    if (newLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = localeFlags[locale] || localeFlags.cs;

  return (
    <div ref={ref} className={`relative ${isPending ? "opacity-50" : ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-nude-100 transition-colors text-lg"
        disabled={isPending}
        title={current.label}
      >
        {current.flag}
        <svg className={`w-3 h-3 text-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 bottom-full mb-1 bg-white rounded-lg shadow-lg border border-line py-1 min-w-[140px] left-0">
          {(["cs", "uk", "ru"] as const).map((loc) => {
            const { flag, label } = localeFlags[loc];
            return (
              <button
                key={loc}
                onClick={() => onChange(loc)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                  locale === loc
                    ? "bg-rose/10 text-espresso font-medium"
                    : "text-espresso hover:bg-nude-50"
                }`}
              >
                <span className="text-base">{flag}</span>
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
