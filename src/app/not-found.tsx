"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const translations = {
  cs: {
    title: "Stránka nenalezena",
    description: "Omlouváme se, tato stránka neexistuje.",
    cta: "Přejít na hlavní stránku",
  },
  uk: {
    title: "Сторінку не знайдено",
    description: "Вибачте, ця сторінка не існує.",
    cta: "Перейти на головну",
  },
  ru: {
    title: "Страница не найдена",
    description: "Извините, эта страница не существует.",
    cta: "Перейти на главную",
  },
} as const;

type Locale = keyof typeof translations;

export default function RootNotFound() {
  const pathname = usePathname();
  const locale: Locale = pathname?.startsWith("/ua")
    ? "uk"
    : pathname?.startsWith("/rus")
      ? "ru"
      : "cs";
  const t = translations[locale];

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-20 min-h-screen bg-nude-50 font-[family-name:var(--font-geist)]">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-rose mb-4">404</p>
        <h1 className="text-2xl font-semibold text-ink mb-3">
          {t.title}
        </h1>
        <p className="text-muted mb-8">
          {t.description}
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-espresso text-white rounded-lg hover:bg-espresso/90 transition-colors"
        >
          {t.cta}
        </Link>
      </div>
    </div>
  );
}
