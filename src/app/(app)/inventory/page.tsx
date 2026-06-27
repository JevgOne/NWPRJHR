import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getAllStockNumbers } from "@/lib/stock";
import { InventoryClient } from "./InventoryClient";

export default async function InventoryPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const t = await getTranslations();
  const role = session.user.role;

  if (role === "SALON" || role === "HAIRDRESSER") redirect("/dashboard");

  const variants = await prisma.variant.findMany({
    where: { active: true },
    include: {
      product: {
        select: { id: true, name: true, category: true, processingType: true },
      },
    },
    orderBy: [{ product: { name: "asc" } }, { lengthCm: "asc" }, { color: "asc" }],
  });

  const allStock = await getAllStockNumbers();

  const items = variants.map((v) => {
    const stock = allStock.get(v.id);
    return {
      variantId: v.id,
      product: v.product,
      lengthCm: v.lengthCm,
      color: v.color,
      physicalGrams: stock?.physicalGrams ?? 0,
      physicalPieces: stock?.physicalPieces ?? 0,
      reservedGrams: stock?.reservedGrams ?? 0,
      reservedPieces: stock?.reservedPieces ?? 0,
      availableGrams: stock?.availableGrams ?? 0,
      availablePieces: stock?.availablePieces ?? 0,
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">
          {t("stock.overview")}
        </h1>
        <div className="flex gap-2">
          {role === "OWNER" && (
            <a
              href="/inventory/stock-in"
              className="inline-flex items-center px-4 py-2 bg-rose text-white rounded-lg text-sm font-medium hover:bg-rose-deep"
            >
              {t("stock.newDelivery")}
            </a>
          )}
          {role === "OWNER" && (
            <a
              href="/inventory/movements"
              className="inline-flex items-center px-4 py-2 bg-white text-espresso border border-line rounded-lg text-sm font-medium hover:bg-nude-50"
            >
              {t("stock.movements")}
            </a>
          )}
        </div>
      </div>
      <InventoryClient items={items} role={role} />
    </div>
  );
}
