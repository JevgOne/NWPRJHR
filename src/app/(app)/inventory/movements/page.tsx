import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { MovementsClient } from "./MovementsClient";

export const dynamic = "force-dynamic";

export default async function MovementsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const t = await getTranslations();

  const movements = await prisma.stockMovement.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      delivery: { select: { id: true, barcode: true } },
      variant: {
        select: {
          id: true,
          lengthCm: true,
          color: true,
          product: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const serialized = movements.map((m) => ({
    id: m.id,
    type: m.type,
    grams: m.grams,
    pieces: m.pieces,
    note: m.note,
    createdAt: m.createdAt.toISOString(),
    user: m.user,
    deliveryBarcode: m.delivery.barcode,
    deliveryId: m.delivery.id,
    variant: {
      lengthCm: m.variant.lengthCm,
      color: m.variant.color,
      productName: m.variant.product.name,
    },
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">
          {t("stock.movements")}
        </h1>
        <a
          href="/inventory"
          className="inline-flex items-center px-4 py-2 bg-white text-espresso border border-line rounded-lg text-sm font-medium hover:bg-nude-50"
        >
          {t("common.back")}
        </a>
      </div>
      <MovementsClient movements={serialized} />
    </div>
  );
}
