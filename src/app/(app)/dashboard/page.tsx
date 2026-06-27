import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

function fmtCZK(halere: number): string {
  const czk = halere / 100;
  if (czk >= 1000) return (czk / 1000).toFixed(1).replace(".", ",") + " tis. Kč";
  return czk.toLocaleString("cs-CZ") + " Kč";
}

function fmtGrams(g: number): string {
  return g.toLocaleString("cs-CZ") + " g";
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("cs-CZ");
}

const categoryColors: Record<string, { bg: string; text: string; bar: string }> = {
  VIRGIN: { bg: "bg-amber-100", text: "text-amber-800", bar: "bg-amber-500" },
  PREMIUM: { bg: "bg-indigo-100", text: "text-indigo-800", bar: "bg-indigo-500" },
  STANDARD: { bg: "bg-emerald-100", text: "text-emerald-800", bar: "bg-emerald-500" },
  SALE: { bg: "bg-rose-100", text: "text-rose-800", bar: "bg-rose-500" },
};

const categoryLabels: Record<string, string> = {
  VIRGIN: "Panenské",
  PREMIUM: "Premium",
  STANDARD: "Standard",
  SALE: "Výprodej",
};

const movementTypeColors: Record<string, { bg: string; text: string; label: string }> = {
  RECEIPT: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Příjem" },
  SALE: { bg: "bg-blue-100", text: "text-blue-700", label: "Prodej" },
  RETURN: { bg: "bg-amber-100", text: "text-amber-700", label: "Vrácení" },
  ADJUSTMENT: { bg: "bg-gray-100", text: "text-gray-700", label: "Úprava" },
  COMPLAINT: { bg: "bg-rose-100", text: "text-rose-700", label: "Reklamace" },
  SAMPLE: { bg: "bg-purple-100", text: "text-purple-700", label: "Vzorek" },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") redirect("/salon/catalog");

  const t = await getTranslations("dashboard");
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    salesThisMonth,
    deliveriesWithProduct,
    openInvoices,
    activeSalonsCount,
    totalSalesEver,
    lowStockVariants,
    recentMovements,
    pendingReturns,
    newOrders,
    unreadNotifications,
    pendingRegistrations,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { status: "COMPLETED", completedAt: { gte: monthStart } },
      _count: { id: true },
      _sum: { totalAmount: true },
    }),

    prisma.delivery.findMany({
      where: { remainingGrams: { gt: 0 } },
      select: {
        remainingGrams: true,
        purchasePricePerGramCZK: true,
        variant: {
          select: {
            retailPricePerGram: true,
            product: { select: { category: true } },
          },
        },
      },
    }),

    prisma.invoice.aggregate({
      where: { type: "INVOICE", status: { in: ["ISSUED", "AWAITING", "OVERDUE"] } },
      _count: { id: true },
      _sum: { total: true },
    }),

    prisma.salon.count({ where: { archived: false } }),

    prisma.sale.aggregate({
      where: { status: "COMPLETED" },
      _count: { id: true },
      _sum: { totalAmount: true, totalCostOfGoods: true },
    }),

    prisma.$queryRawUnsafe<
      Array<{ variantId: string; totalRemaining: number; productName: string; lengthCm: number; color: string; category: string }>
    >(
      `SELECT v.id as variantId, COALESCE(SUM(d.remainingGrams), 0) as totalRemaining,
        p.name as productName, v.lengthCm, v.color, p.category
      FROM variants v JOIN products p ON v.productId = p.id
      LEFT JOIN deliveries d ON d.variantId = v.id
      WHERE v.active = 1 AND p.archived = 0
      GROUP BY v.id HAVING COALESCE(SUM(d.remainingGrams), 0) < 200 AND COALESCE(SUM(d.remainingGrams), 0) > 0
      ORDER BY totalRemaining ASC LIMIT 8`
    ),

    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true, type: true, grams: true, pieces: true, createdAt: true, note: true,
        variant: { select: { lengthCm: true, color: true, product: { select: { name: true } } } },
      },
    }),

    prisma.return.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.notification.count({ where: { recipientId: session.user.id, read: false } }),
    prisma.salon.count({ where: { approved: false, archived: false } }),
  ]);

  // Compute stats
  const totalStockGrams = deliveriesWithProduct.reduce((a, d) => a + d.remainingGrams, 0);
  const stockValuePurchase = deliveriesWithProduct.reduce((a, d) => a + d.remainingGrams * d.purchasePricePerGramCZK, 0);
  const stockValueRetail = deliveriesWithProduct.reduce((a, d) => a + d.remainingGrams * d.variant.retailPricePerGram, 0);

  // Stock by category
  const catMap: Record<string, { grams: number; value: number }> = {};
  for (const d of deliveriesWithProduct) {
    const cat = d.variant.product.category;
    if (!catMap[cat]) catMap[cat] = { grams: 0, value: 0 };
    catMap[cat].grams += d.remainingGrams;
    catMap[cat].value += d.remainingGrams * d.variant.retailPricePerGram;
  }
  const maxCatGrams = Math.max(...Object.values(catMap).map((c) => c.grams), 1);

  const salesCount = salesThisMonth._count.id ?? 0;
  const salesRevenue = salesThisMonth._sum.totalAmount ?? 0;
  const invoiceCount = openInvoices._count.id ?? 0;
  const invoiceTotal = openInvoices._sum.total ?? 0;
  const totalSold = totalSalesEver._sum.totalAmount ?? 0;
  const totalSoldCount = totalSalesEver._count.id ?? 0;
  const totalCOGS = totalSalesEver._sum.totalCostOfGoods ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* ── ROW 1: Key stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("stockValue")}
          value={fmtGrams(totalStockGrams)}
          sub1={`${fmtCZK(stockValuePurchase)}`}
          sub2={`Prodejní: ${fmtCZK(stockValueRetail)}`}
        />
        <StatCard
          label={t("salesThisMonth")}
          value={`${salesCount}`}
          sub1={fmtCZK(salesRevenue)}
          sub2={`Tento měsíc`}
        />
        <StatCard
          label="Prodáno celkem"
          value={fmtCZK(totalSold)}
          sub1={`${fmtGrams(0)} · ${totalSoldCount} prodejů`}
          sub2={`Marže: ${fmtCZK(totalSold - totalCOGS)}`}
        />
        <StatCard
          label={t("openInvoices")}
          value={fmtCZK(invoiceTotal)}
          sub1={`${invoiceCount} faktur k úhradě`}
        />
      </div>

      {/* ── ROW 2: Categories + Stock alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock by category */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Skladem podle kategorie</h2>
          <div className="space-y-4">
            {(["VIRGIN", "PREMIUM", "STANDARD", "SALE"] as const).map((cat) => {
              const data = catMap[cat];
              if (!data) return null;
              const colors = categoryColors[cat];
              const pct = (data.grams / maxCatGrams) * 100;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {categoryLabels[cat]}
                    </span>
                    <span className="text-sm text-gray-700">
                      {fmtGrams(data.grams)} · {fmtCZK(data.value)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${colors.bar} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stock alerts */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">{t("lowStock")}</h2>
          {lowStockVariants.length === 0 ? (
            <p className="text-sm text-gray-500">{t("noLowStock")}</p>
          ) : (
            <div className="space-y-3">
              {lowStockVariants.map((v) => {
                const remaining = Number(v.totalRemaining);
                const alertColor = remaining < 50 ? "bg-red-100 text-red-700" : remaining < 100 ? "bg-amber-100 text-amber-700" : "bg-yellow-100 text-yellow-700";
                return (
                  <div key={v.variantId} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 truncate">
                        {v.productName} · {v.color}
                      </p>
                      <p className="text-xs text-gray-500">#{v.lengthCm}cm</p>
                    </div>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${alertColor}`}>
                      {remaining} g
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 3: Recent movements ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Poslední pohyby</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Datum</th>
                <th className="pb-3 pr-4">Typ</th>
                <th className="pb-3 pr-4">Produkt</th>
                <th className="pb-3 pr-4 text-right">Množství</th>
                <th className="pb-3">Poznámka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentMovements.map((m) => {
                const mt = movementTypeColors[m.type] ?? { bg: "bg-gray-100", text: "text-gray-700", label: m.type };
                const sign = m.type === "RECEIPT" || m.type === "RETURN" ? "+" : "-";
                return (
                  <tr key={m.id}>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{fmtDate(m.createdAt)}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${mt.bg} ${mt.text}`}>
                        {mt.label}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-900">
                      {m.variant.product.name} · {m.variant.color} #{m.variant.lengthCm}cm
                    </td>
                    <td className="py-2.5 pr-4 text-right font-medium text-gray-900 whitespace-nowrap">
                      {sign}{m.grams} g
                    </td>
                    <td className="py-2.5 text-gray-500 truncate max-w-[200px]">{m.note || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ROW 4: Quick info badges ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <a href="/salons"><QuickBadge label={t("activeSalons")} value={activeSalonsCount} color="indigo" /></a>
        <a href="/salons"><QuickBadge label="Čekající registrace" value={pendingRegistrations} color={pendingRegistrations > 0 ? "amber" : "gray"} /></a>
        <a href="/orders"><QuickBadge label={t("pendingOrders")} value={newOrders} color={newOrders > 0 ? "blue" : "gray"} /></a>
        <a href="/notifications"><QuickBadge label={t("unreadNotifications")} value={unreadNotifications} color={unreadNotifications > 0 ? "rose" : "gray"} /></a>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub1, sub2 }: { label: string; value: string; sub1?: string; sub2?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {sub1 && <p className="mt-1 text-sm text-gray-600">{sub1}</p>}
      {sub2 && <p className="text-xs text-gray-400">{sub2}</p>}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  gray: "bg-gray-50 text-gray-600 border-gray-200",
};

function QuickBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border p-4 ${badgeColors[color] ?? badgeColors.gray}`}>
      <p className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
