import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { DeliveryDetailClient } from "./DeliveryDetailClient";

export default async function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/dashboard");

  const { id } = await params;
  const t = await getTranslations();

  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: {
      supplier: true,
      variant: {
        include: {
          product: { select: { id: true, name: true, category: true, processingType: true, origin: true, texture: true } },
        },
      },
      stockMovements: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!delivery) redirect("/inventory");

  const data = {
    id: delivery.id,
    variant: {
      lengthCm: delivery.variant.lengthCm,
      color: delivery.variant.color,
      sellingMode: delivery.variant.sellingMode,
      product: delivery.variant.product,
    },
    supplier: { name: delivery.supplier.name },
    purchasePricePerGramRaw: delivery.purchasePricePerGramRaw,
    currency: delivery.currency,
    exchangeRate: delivery.exchangeRate,
    purchasePricePerGramCZK: delivery.purchasePricePerGramCZK,
    initialGrams: delivery.initialGrams,
    initialPieces: delivery.initialPieces,
    pieceWeightGrams: delivery.pieceWeightGrams,
    remainingGrams: delivery.remainingGrams,
    remainingPieces: delivery.remainingPieces,
    barcode: delivery.barcode,
    batchCode: delivery.batchCode,
    stockedAt: delivery.stockedAt.toISOString(),
    note: delivery.note,
    movements: delivery.stockMovements.map((m) => ({
      id: m.id,
      type: m.type,
      grams: m.grams,
      pieces: m.pieces,
      note: m.note,
      createdAt: m.createdAt.toISOString(),
      user: m.user,
    })),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">
          {t("stock.deliveryDetail")}
        </h1>
        <a
          href="/inventory"
          className="inline-flex items-center px-4 py-2 bg-white text-espresso border border-line rounded-lg text-sm font-medium hover:bg-nude-50"
        >
          {t("common.back")}
        </a>
      </div>
      <DeliveryDetailClient delivery={data} />
    </div>
  );
}
