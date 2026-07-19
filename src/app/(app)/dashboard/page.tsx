import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { unstable_cache } from "next/cache";
import { BatchAnnouncementCard } from "@/components/admin/BatchAnnouncementCard";

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
  LUXE: { bg: "bg-violet-100", text: "text-violet-800", bar: "bg-violet-500" },
  STANDARD: { bg: "bg-emerald-100", text: "text-emerald-800", bar: "bg-emerald-500" },
  SALE: { bg: "bg-rose-100", text: "text-rose-800", bar: "bg-rose-500" },
};

const movementTypeStyles: Record<string, { bg: string; text: string }> = {
  RECEIPT: { bg: "bg-emerald-100", text: "text-emerald-700" },
  SALE: { bg: "bg-nude-100", text: "text-espresso" },
  RETURN: { bg: "bg-amber-100", text: "text-amber-700" },
  ADJUSTMENT: { bg: "bg-nude-100", text: "text-espresso" },
  COMPLAINT: { bg: "bg-rose-100", text: "text-rose-700" },
  SAMPLE: { bg: "bg-purple-100", text: "text-purple-700" },
};

const getCachedDashboardData = unstable_cache(
  async (userId: string) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      salesThisMonth,
      stockByCategory,
      openInvoices,
      activeSalonsCount,
      totalSalesEver,
      totalGramsSoldAgg,
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

      prisma.$queryRawUnsafe<
        Array<{ category: string; totalGrams: number; purchaseValue: number; retailValue: number }>
      >(
        `SELECT p.category,
                COALESCE(SUM(d.remainingGrams), 0) as totalGrams,
                COALESCE(SUM(d.remainingGrams * d.purchasePricePerGramCZK), 0) as purchaseValue,
                COALESCE(SUM(d.remainingGrams * v.retailPricePerGram), 0) as retailValue
         FROM deliveries d
         JOIN variants v ON d.variantId = v.id
         JOIN products p ON v.productId = p.id
         WHERE d.remainingGrams > 0
         GROUP BY p.category`
      ),

      prisma.sale.aggregate({
        where: { status: "COMPLETED", paymentType: "TRANSFER", invoice: { is: null } },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),

      prisma.salon.count({ where: { approved: true, archived: false } }),

      prisma.sale.aggregate({
        where: { status: "COMPLETED" },
        _count: { id: true },
        _sum: { totalAmount: true, totalCostOfGoods: true },
      }),

      prisma.saleItem.aggregate({
        where: { sale: { status: "COMPLETED" } },
        _sum: { grams: true },
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
      prisma.notification.count({ where: { recipientId: userId, read: false } }),
      prisma.salon.count({ where: { approved: false, archived: false } }),
    ]);

    return {
      salesThisMonth,
      stockByCategory,
      openInvoices,
      activeSalonsCount,
      totalSalesEver,
      totalGramsSoldAgg,
      lowStockVariants,
      recentMovements,
      pendingReturns,
      newOrders,
      unreadNotifications,
      pendingRegistrations,
    };
  },
  ["dashboard-data"],
  { revalidate: 60, tags: ["dashboard"] }
);

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") redirect("/salon/catalog");

  const [t, tCat, tStock] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("category"),
    getTranslations("stock"),
  ]);

  const {
    salesThisMonth,
    stockByCategory,
    openInvoices,
    activeSalonsCount,
    totalSalesEver,
    totalGramsSoldAgg,
    lowStockVariants,
    recentMovements,
    pendingReturns,
    newOrders,
    unreadNotifications,
    pendingRegistrations,
  } = await getCachedDashboardData(session.user.id);

  // Compute stats from pre-aggregated SQL results
  const totalStockGrams = stockByCategory.reduce((a, r) => a + Number(r.totalGrams), 0);
  const stockValuePurchase = stockByCategory.reduce((a, r) => a + Number(r.purchaseValue), 0);
  const stockValueRetail = stockByCategory.reduce((a, r) => a + Number(r.retailValue), 0);

  // Stock by category
  const catMap: Record<string, { grams: number; value: number }> = {};
  for (const r of stockByCategory) {
    catMap[r.category] = { grams: Number(r.totalGrams), value: Number(r.retailValue) };
  }
  const maxCatGrams = Math.max(...Object.values(catMap).map((c) => c.grams), 1);

  const salesCount = salesThisMonth._count.id ?? 0;
  const salesRevenue = salesThisMonth._sum.totalAmount ?? 0;
  const awaitingPaymentCount = openInvoices._count.id ?? 0;
  const awaitingPaymentTotal = openInvoices._sum.totalAmount ?? 0;
  const totalSold = totalSalesEver._sum.totalAmount ?? 0;
  const totalSoldCount = totalSalesEver._count.id ?? 0;
  const totalCOGS = totalSalesEver._sum.totalCostOfGoods ?? 0;
  const totalGramsSold = totalGramsSoldAgg._sum.grams ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>

      {/* ── ROW 1: Key stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("stockValue")}
          value={fmtGrams(totalStockGrams)}
          sub1={`${fmtCZK(stockValuePurchase)}`}
          sub2={`${t("retailValue")}: ${fmtCZK(stockValueRetail)}`}
        />
        <StatCard
          label={t("salesThisMonth")}
          value={`${salesCount}`}
          sub1={fmtCZK(salesRevenue)}
          sub2={t("thisMonth")}
        />
        <StatCard
          label={t("totalSold")}
          value={fmtCZK(totalSold)}
          sub1={`${fmtGrams(totalGramsSold)} · ${totalSoldCount} ${t("salesCount")}`}
          sub2={`${t("margin")}: ${fmtCZK(totalSold - totalCOGS)}`}
        />
        <StatCard
          label={t("awaitingPayment")}
          value={fmtCZK(awaitingPaymentTotal)}
          sub1={`${awaitingPaymentCount} ${t("transfersPending")}`}
        />
      </div>

      {/* ── ROW 2: Categories + Stock alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock by category */}
        <div className="bg-white rounded-xl border border-line shadow-sm p-6">
          <h2 className="text-base font-semibold text-ink mb-4">{t("stockByCategory")}</h2>
          <div className="space-y-4">
            {(["VIRGIN", "LUXE", "STANDARD", "SALE"] as const).map((cat) => {
              const data = catMap[cat];
              if (!data) return null;
              const colors = categoryColors[cat];
              const pct = (data.grams / maxCatGrams) * 100;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {tCat(cat.toLowerCase())}
                    </span>
                    <span className="text-sm text-espresso">
                      {fmtGrams(data.grams)} · {fmtCZK(data.value)}
                    </span>
                  </div>
                  <div className="w-full bg-nude-100 rounded-full h-2">
                    <div className={`${colors.bar} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stock alerts */}
        <div className="bg-white rounded-xl border border-line shadow-sm p-6">
          <h2 className="text-base font-semibold text-ink mb-4">{t("lowStock")}</h2>
          {lowStockVariants.length === 0 ? (
            <p className="text-sm text-muted">{t("noLowStock")}</p>
          ) : (
            <div className="space-y-3">
              {lowStockVariants.map((v) => {
                const remaining = Number(v.totalRemaining);
                const alertColor = remaining < 50 ? "bg-red-100 text-red-700" : remaining < 100 ? "bg-amber-100 text-amber-700" : "bg-yellow-100 text-yellow-700";
                return (
                  <div key={v.variantId} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink truncate">
                        {v.productName} · {v.color}
                      </p>
                      <p className="text-xs text-muted">#{v.lengthCm}cm</p>
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
      <div className="bg-white rounded-xl border border-line shadow-sm p-6">
        <h2 className="text-base font-semibold text-ink mb-4">{t("recentMovements")}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-muted uppercase tracking-wider">
                <th className="pb-3 pr-4">{t("date")}</th>
                <th className="pb-3 pr-4">{t("type")}</th>
                <th className="pb-3 pr-4">{t("product")}</th>
                <th className="pb-3 pr-4 text-right">{t("quantity")}</th>
                <th className="pb-3">{t("note")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentMovements.map((m) => {
                const mtStyle = movementTypeStyles[m.type] ?? { bg: "bg-nude-100", text: "text-espresso" };
                const mtLabel = tStock(m.type.toLowerCase());
                const sign = m.type === "RECEIPT" || m.type === "RETURN" ? "+" : "-";
                return (
                  <tr key={m.id}>
                    <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{fmtDate(m.createdAt)}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${mtStyle.bg} ${mtStyle.text}`}>
                        {mtLabel}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-ink">
                      {m.variant.product.name} · {m.variant.color} #{m.variant.lengthCm}cm
                    </td>
                    <td className="py-2.5 pr-4 text-right font-medium text-ink whitespace-nowrap">
                      {sign}{m.grams} g
                    </td>
                    <td className="py-2.5 text-muted truncate max-w-[200px]">{m.note || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ROW 3.5: Batch announcement ── */}
      <BatchAnnouncementCard />

      {/* ── ROW 4: Quick info badges ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <a href="/salons"><QuickBadge label={t("activeSalons")} value={activeSalonsCount} color="rose" /></a>
        <a href="/registrations"><QuickBadge label={t("pendingRegistrations")} value={pendingRegistrations} color={pendingRegistrations > 0 ? "amber" : "gray"} /></a>
        <a href="/orders"><QuickBadge label={t("pendingOrders")} value={newOrders} color={newOrders > 0 ? "blue" : "gray"} /></a>
        <a href="/returns"><QuickBadge label={t("pendingReturns")} value={pendingReturns} color={pendingReturns > 0 ? "orange" : "gray"} /></a>
        <a href="/notifications"><QuickBadge label={t("unreadNotifications")} value={unreadNotifications} color={unreadNotifications > 0 ? "rose" : "gray"} /></a>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub1, sub2 }: { label: string; value: string; sub1?: string; sub2?: string }) {
  return (
    <div className="bg-white rounded-xl border border-line shadow-sm p-5">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
      {sub1 && <p className="mt-1 text-sm text-gray-600">{sub1}</p>}
      {sub2 && <p className="text-xs text-muted">{sub2}</p>}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  blue: "bg-nude-50 text-espresso border-nude-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  gray: "bg-nude-50 text-gray-600 border-line",
};

function QuickBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border p-4 ${badgeColors[color] ?? badgeColors.gray}`}>
      <p className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
