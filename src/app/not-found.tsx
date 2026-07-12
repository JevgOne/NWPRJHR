"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const translations = {
  cs: {
    title: "Stránka nenalezena",
    description: "Omlouváme se, ale tato stránka neexistuje nebo byla přesunuta.",
    home: "Zpět na hlavní stránku",
    offer: "Nabídka vlasů",
    contact: "Kontakt",
  },
  uk: {
    title: "Сторінку не знайдено",
    description: "Вибачте, але ця сторінка не існує або була переміщена.",
    home: "На головну",
    offer: "Каталог волосся",
    contact: "Контакт",
  },
  ru: {
    title: "Страница не найдена",
    description: "Извините, но эта страница не существует или была перемещена.",
    home: "На главную",
    offer: "Каталог волос",
    contact: "Контакт",
  },
} as const;

type Locale = keyof typeof translations;

export default function NotFound() {
  const pathname = usePathname();
  const locale: Locale = pathname?.startsWith("/uk")
    ? "uk"
    : pathname?.startsWith("/ru")
      ? "ru"
      : "cs";
  const t = translations[locale];

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-rose mb-4">404</p>
        <h1 className="text-2xl font-bold text-ink mb-2">
          {t.title}
        </h1>
        <p className="text-muted mb-8">
          {t.description}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/${locale === "cs" ? "" : locale}`}
            className="px-5 py-2.5 bg-rose text-white rounded-lg font-medium hover:bg-rose-deep transition-colors"
          >
            {t.home}
          </Link>
          <Link
            href={`/${locale === "cs" ? "" : locale + "/"}offer`}
            className="px-5 py-2.5 bg-nude-100 text-espresso rounded-lg font-medium hover:bg-nude-200 transition-colors"
          >
            {t.offer}
          </Link>
          <Link
            href={`/${locale === "cs" ? "" : locale + "/"}contact`}
            className="px-5 py-2.5 text-muted hover:text-ink transition-colors font-medium"
          >
            {t.contact}
          </Link>
        </div>
      </div>
    </div>
  );
}
