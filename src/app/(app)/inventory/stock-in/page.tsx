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

  const [products, suppliers] = await Promise.all([
    prisma.product.findMany({
      where: { archived: false },
      include: { variants: { where: { active: true }, orderBy: [{ lengthCm: "asc" }, { color: "asc" }] } },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({
      where: { archived: false },
      orderBy: { name: "asc" },
    }),
  ]);

  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    variants: p.variants.map((v) => ({
      id: v.id,
      lengthCm: v.lengthCm,
      color: v.color,
    })),
  }));

  const supplierOptions = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-6">
        {t("stock.newDelivery")}
      </h1>
      <StockInForm products={productOptions} suppliers={supplierOptions} />
    </div>
  );
}
