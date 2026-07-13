import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const token = req.nextUrl.searchParams.get("token");

  if (!email || !token) {
    return new NextResponse(page("Neplatný odkaz.", false), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!verifyUnsubscribeToken(email, token)) {
    return new NextResponse(page("Neplatný odkaz.", false), {
      status: 403,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Delete all pending stock subscriptions for this email
  await prisma.stockSubscription.deleteMany({
    where: { email, notified: false },
  });

  return new NextResponse(
    page("Byli jste úspěšně odhlášeni z notifikací o dostupnosti.", true),
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

function page(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${success ? "Odhlášeno" : "Chyba"} — Hairland</title>
<style>body{margin:0;padding:40px 20px;background:#fdfaf7;font-family:system-ui,sans-serif;display:flex;justify-content:center}
.card{max-width:440px;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(58,44,42,.08);text-align:center}
h1{font-size:20px;color:#3a2c2a;margin:0 0 12px}p{color:#9c8682;font-size:14px;line-height:1.6}
a{color:#a96d6c;text-decoration:none}</style></head>
<body><div class="card">
<h1>${success ? "Odhlášeno" : "Chyba"}</h1>
<p>${message}</p>
<p style="margin-top:20px"><a href="https://www.hairland.cz">← Zpět na Hairland.cz</a></p>
</div></body></html>`;
}
