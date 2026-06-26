import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this automatically)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Inquiries yesterday
  const [newInquiries, unassignedInquiries] = await Promise.all([
    prisma.inquiry.count({
      where: { createdAt: { gte: yesterday, lt: todayStart } },
    }),
    prisma.inquiry.count({
      where: { assignedTo: null, status: "NEW" },
    }),
  ]);

  // Contact messages yesterday
  const [newContacts, unassignedContacts] = await Promise.all([
    prisma.contactMessage.count({
      where: { createdAt: { gte: yesterday, lt: todayStart } },
    }),
    prisma.contactMessage.count({
      where: { assignedTo: null },
    }),
  ]);

  // Sales yesterday
  const salesYesterday = await prisma.sale.findMany({
    where: { completedAt: { gte: yesterday, lt: todayStart } },
    select: { totalAmount: true },
  });
  const salesCount = salesYesterday.length;
  const salesTotal = salesYesterday.reduce((sum, s) => sum + s.totalAmount, 0);

  // Low stock variants (under 200g)
  const variants = await prisma.variant.findMany({
    where: { active: true },
    include: {
      product: { select: { name: true } },
      deliveries: { where: { remainingGrams: { gt: 0 } }, select: { remainingGrams: true } },
    },
  });

  const lowStockItems = variants
    .map((v) => ({
      name: `${v.product.name} · ${v.lengthCm} cm · ${v.color}`,
      grams: v.deliveries.reduce((sum, d) => sum + d.remainingGrams, 0),
    }))
    .filter((i) => i.grams > 0 && i.grams <= 200)
    .sort((a, b) => a.grams - b.grams);

  const outOfStockCount = variants.filter(
    (v) => v.deliveries.reduce((sum, d) => sum + d.remainingGrams, 0) === 0
  ).length;

  // Format message
  const dateStr = `${yesterday.getDate()}.${yesterday.getMonth() + 1}.${yesterday.getFullYear()}`;

  const lines = [
    `📊 <b>DENNÍ SHRNUTÍ / ДНЕВНАЯ СВОДКА</b> — ${dateStr}`,
    ``,
    `<b>Poptávky/Запросы:</b> ${newInquiries} nových/новых${unassignedInquiries > 0 ? ` (⚠️ ${unassignedInquiries} nepřiřazených/неназначенных)` : ""}`,
    `<b>Zprávy/Сообщения:</b> ${newContacts} nových/новых${unassignedContacts > 0 ? ` (⚠️ ${unassignedContacts} nepřiřazených/неназначенных)` : ""}`,
    `<b>Prodeje/Продажи:</b> ${salesCount}x — ${(salesTotal / 100).toLocaleString("cs-CZ")} Kč`,
    ``,
  ];

  if (lowStockItems.length > 0) {
    lines.push(`<b>Nízký stav skladu / Мало на складе (${lowStockItems.length}):</b>`);
    for (const item of lowStockItems.slice(0, 10)) {
      lines.push(`   ${item.name} — ${item.grams}g`);
    }
    if (lowStockItems.length > 10) {
      lines.push(`   ... a dalších/ещё ${lowStockItems.length - 10}`);
    }
  }

  if (outOfStockCount > 0) {
    lines.push(`\n❌ <b>${outOfStockCount} variant vyprodáno / распродано</b>`);
  }

  if (lowStockItems.length === 0 && outOfStockCount === 0) {
    lines.push(`✅ Sklad v pořádku / Склад в порядке`);
  }

  await sendTelegramMessage(lines.join("\n"));

  return NextResponse.json({ ok: true });
}
