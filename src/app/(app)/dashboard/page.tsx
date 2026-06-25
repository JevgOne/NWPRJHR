import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";

function formatCZK(halere: number): string {
  return (halere / 100).toLocaleString("cs-CZ") + " Kč";
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const t = await getTranslations("dashboard");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Run all queries in parallel
  const [
    salesThisMonth,
    stockData,
    openInvoices,
    activeSalonsCount,
    recentSales,
    lowStockVariants,
    pendingReturns,
    newOrders,
    unreadNotifications,
  ] = await Promise.all([
    // 1. Sales this month (completed only)
    prisma.sale.aggregate({
      where: {
        status: "COMPLETED",
        completedAt: { gte: monthStart },
      },
      _count: { id: true },
      _sum: { totalAmount: true },
    }),

    // 2. Stock value: sum of remaining grams * purchase price per gram CZK
    prisma.delivery.findMany({
      where: { remainingGrams: { gt: 0 } },
      select: {
        remainingGrams: true,
        purchasePricePerGramCZK: true,
      },
    }),

    // 3. Open invoices (ISSUED or AWAITING or OVERDUE)
    prisma.invoice.aggregate({
      where: {
        type: "INVOICE",
        status: { in: ["ISSUED", "AWAITING", "OVERDUE"] },
      },
      _count: { id: true },
      _sum: { total: true },
    }),

    // 4. Active salons count
    prisma.salon.count({
      where: { archived: false },
    }),

    // 5. Recent sales (last 5)
    prisma.sale.findMany({
      where: { status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: {
        id: true,
        saleNumber: true,
        totalAmount: true,
        completedAt: true,
        customerType: true,
        salon: { select: { name: true } },
        customer: { select: { name: true } },
      },
    }),

    // 6. Low stock variants (< 100g remaining across all deliveries)
    prisma.$queryRawUnsafe<
      Array<{
        variantId: string;
        totalRemaining: number;
        productName: string;
        lengthCm: number;
        color: string;
      }>
    >(
      `SELECT
        v.id as variantId,
        COALESCE(SUM(d.remainingGrams), 0) as totalRemaining,
        p.name as productName,
        v.lengthCm,
        v.color
      FROM variants v
      JOIN products p ON v.productId = p.id
      LEFT JOIN deliveries d ON d.variantId = v.id
      WHERE v.active = 1 AND p.archived = 0
      GROUP BY v.id
      HAVING COALESCE(SUM(d.remainingGrams), 0) < 100 AND COALESCE(SUM(d.remainingGrams), 0) > 0
      ORDER BY totalRemaining ASC
      LIMIT 10`
    ),

    // 7. Pending returns
    prisma.return.count({
      where: { status: "PENDING" },
    }),

    // 8. New orders
    prisma.order.count({
      where: { status: "NEW" },
    }),

    // 9. Unread notifications for this user
    prisma.notification.count({
      where: {
        recipientId: session.user.id,
        read: false,
      },
    }),
  ]);

  // Calculate stock value
  const stockValue = stockData.reduce(
    (acc, d) => acc + d.remainingGrams * d.purchasePricePerGramCZK,
    0
  );
  const totalStockGrams = stockData.reduce(
    (acc, d) => acc + d.remainingGrams,
    0
  );

  const salesCount = salesThisMonth._count.id ?? 0;
  const salesRevenue = salesThisMonth._sum.totalAmount ?? 0;
  const invoiceCount = openInvoices._count.id ?? 0;
  const invoiceTotal = openInvoices._sum.total ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>

      {/* Row 1: Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales this month */}
        <Card>
          <p className="text-sm font-medium text-gray-500">
            {t("salesThisMonth")}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {salesCount}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {formatCZK(salesRevenue)}
          </p>
        </Card>

        {/* Stock value */}
        <Card>
          <p className="text-sm font-medium text-gray-500">
            {t("stockValue")}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatCZK(stockValue)}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {totalStockGrams.toLocaleString("cs-CZ")} g
          </p>
        </Card>

        {/* Open invoices */}
        <Card>
          <p className="text-sm font-medium text-gray-500">
            {t("openInvoices")}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {invoiceCount}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {formatCZK(invoiceTotal)}
          </p>
        </Card>

        {/* Active salons */}
        <Card>
          <p className="text-sm font-medium text-gray-500">
            {t("activeSalons")}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {activeSalonsCount}
          </p>
        </Card>
      </div>

      {/* Row 2: Recent sales + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent sales */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("recentSales")}
          </h2>
          {recentSales.length === 0 ? (
            <p className="text-sm text-gray-500">{t("noRecentSales")}</p>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {sale.customerType === "SALON"
                        ? sale.salon?.name
                        : sale.customer?.name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {sale.saleNumber} &middot;{" "}
                      {sale.completedAt
                        ? new Date(sale.completedAt).toLocaleDateString("cs-CZ")
                        : "—"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCZK(sale.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Low stock alerts */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("lowStock")}
          </h2>
          {lowStockVariants.length === 0 ? (
            <p className="text-sm text-gray-500">{t("noLowStock")}</p>
          ) : (
            <div className="space-y-3">
              {lowStockVariants.map((v) => (
                <div
                  key={v.variantId}
                  className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {v.productName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {v.lengthCm} cm &middot; {v.color}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-orange-600">
                    {Number(v.totalRemaining)} g
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Row 3: Pending items */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending returns */}
        <Card>
          <p className="text-sm font-medium text-gray-500">
            {t("pendingReturns")}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {pendingReturns}
          </p>
        </Card>

        {/* New orders */}
        <Card>
          <p className="text-sm font-medium text-gray-500">
            {t("pendingOrders")}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {newOrders}
          </p>
        </Card>

        {/* Unread notifications */}
        <Card>
          <p className="text-sm font-medium text-gray-500">
            {t("unreadNotifications")}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {unreadNotifications}
          </p>
        </Card>
      </div>
    </div>
  );
}
