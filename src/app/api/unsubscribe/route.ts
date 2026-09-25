import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

const pageTranslations = {
  cs: {
    success: "Odhlášeno",
    error: "Chyba",
    invalidLink: "Neplatný odkaz.",
    unsubscribed: "Byli jste úspěšně odhlášeni z notifikací o dostupnosti.",
    back: "← Zpět na Hairland.cz",
  },
  uk: {
    success: "Відписано",
    error: "Помилка",
    invalidLink: "Недійсне посилання.",
    unsubscribed: "Вас успішно відписано від сповіщень про наявність.",
    back: "← Повернутися на Hairland.cz",
  },
  ru: {
    success: "Отписано",
    error: "Ошибка",
    invalidLink: "Недействительная ссылка.",
    unsubscribed: "Вы успешно отписались от уведомлений о наличии.",
    back: "← Вернуться на Hairland.cz",
  },
} as const;

type Lang = keyof typeof pageTranslations;

function resolveLang(lang: string | null): Lang {
  if (lang === "uk" || lang === "ru") return lang;
  return "cs";
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const token = req.nextUrl.searchParams.get("token");
  const lang = resolveLang(req.nextUrl.searchParams.get("lang"));
  const t = pageTranslations[lang];

  if (!email || !token) {
    return new NextResponse(page(t.invalidLink, false, t), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!verifyUnsubscribeToken(email, token)) {
    return new NextResponse(page(t.invalidLink, false, t), {
      status: 403,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Delete all pending stock subscriptions for this email
  await prisma.stockSubscription.deleteMany({
    where: { email, notified: false },
  });

  return new NextResponse(
    page(t.unsubscribed, true, t),
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

function page(message: string, success: boolean, t: typeof pageTranslations[Lang]): string {
  const langAttr = t === pageTranslations.uk ? "uk" : t === pageTranslations.ru ? "ru" : "cs";
  return `<!DOCTYPE html>
<html lang="${langAttr}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${success ? t.success : t.error} — Hairland</title>
<style>body{margin:0;padding:40px 20px;background:#fdfaf7;font-family:system-ui,sans-serif;display:flex;justify-content:center}
.card{max-width:440px;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(58,44,42,.08);text-align:center}
h1{font-size:20px;color:#3a2c2a;margin:0 0 12px}p{color:#9c8682;font-size:14px;line-height:1.6}
a{color:#a96d6c;text-decoration:none}</style></head>
<body><div class="card">
<h1>${success ? t.success : t.error}</h1>
<p>${message}</p>
<p style="margin-top:20px"><a href="https://www.hairland.cz">${t.back}</a></p>
</div></body></html>`;
}
