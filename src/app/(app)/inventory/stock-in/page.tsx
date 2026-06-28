import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { StockInForm } from "@/components/inventory/StockInForm";

export default async function StockInPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const t = await getTranslations();

  const suppliers = await prisma.supplier.findMany({
    where: { archived: false },
    orderBy: { name: "asc" },
  });

  const supplierOptions = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-6">
        {t("stock.newDelivery")}
      </h1>
      <StockInForm suppliers={supplierOptions} />
    </div>
  );
}
