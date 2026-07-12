"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const translations = {
  cs: {
    title: "Něco se pokazilo",
    description: "Omlouváme se za potíže. Zkuste to prosím znovu.",
    retry: "Zkusit znovu",
  },
  uk: {
    title: "Щось пішло не так",
    description: "Вибачте за незручності. Спробуйте ще раз.",
    retry: "Спробувати знову",
  },
  ru: {
    title: "Что-то пошло не так",
    description: "Извините за неудобства. Попробуйте ещё раз.",
    retry: "Попробовать снова",
  },
} as const;

type Locale = keyof typeof translations;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const locale: Locale = pathname?.startsWith("/uk")
    ? "uk"
    : pathname?.startsWith("/ru")
      ? "ru"
      : "cs";
  const t = translations[locale];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-rose mb-4">!</p>
        <h2 className="text-2xl font-bold text-ink mb-2">
          {t.title}
        </h2>
        <p className="text-muted mb-8">
          {t.description}
        </p>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-rose text-white rounded-lg font-medium hover:bg-rose-deep transition-colors"
        >
          {t.retry}
        </button>
      </div>
    </div>
  );
}
