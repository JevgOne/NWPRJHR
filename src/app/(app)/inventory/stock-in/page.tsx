import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { StockInForm } from "@/components/inventory/StockInForm";

export const dynamic = "force-dynamic";

export default async function StockInPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const [t, suppliers, openBatches] = await Promise.all([
    getTranslations(),
    prisma.supplier.findMany({
      where: { archived: false },
      orderBy: { name: "asc" },
    }),
    prisma.stockBatch.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
    }),
  ]);

  const supplierOptions = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-6">
        {t("stock.newDelivery")}
      </h1>
      <StockInForm suppliers={supplierOptions} openBatches={openBatches} />
    </div>
  );
}
