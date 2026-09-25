"use client";

const translations = {
  cs: {
    title: "Něco se pokazilo",
    description: "Omlouváme se, došlo k neočekávané chybě.",
    retry: "Zkusit znovu",
  },
  uk: {
    title: "Щось пішло не так",
    description: "Вибачте, сталася несподівана помилка.",
    retry: "Спробувати знову",
  },
  ru: {
    title: "Что-то пошло не так",
    description: "Извините, произошла непредвиденная ошибка.",
    retry: "Попробовать снова",
  },
} as const;

type Locale = keyof typeof translations;

function detectLocale(): Locale {
  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    if (path.startsWith("/ua")) return "uk";
    if (path.startsWith("/rus")) return "ru";
  }
  return "cs";
}

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const locale = detectLocale();
  const t = translations[locale];
  const lang = locale === "uk" ? "uk" : locale === "ru" ? "ru" : "cs";

  return (
    <html lang={lang}>
      <body style={{ margin: 0, padding: "40px 20px", background: "#fdfaf7", fontFamily: "system-ui, sans-serif", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div style={{ maxWidth: 440, background: "#fff", borderRadius: 12, padding: 32, boxShadow: "0 2px 8px rgba(58,44,42,.08)", textAlign: "center" }}>
          <h1 style={{ fontSize: 20, color: "#3a2c2a", margin: "0 0 12px" }}>{t.title}</h1>
          <p style={{ color: "#9c8682", fontSize: 14, lineHeight: 1.6 }}>{t.description}</p>
          <button
            onClick={() => unstable_retry()}
            style={{ marginTop: 20, padding: "10px 24px", background: "#a96d6c", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
          >
            {t.retry}
          </button>
        </div>
      </body>
    </html>
  );
}
