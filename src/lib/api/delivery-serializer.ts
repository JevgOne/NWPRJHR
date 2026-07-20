import type { Delivery, Supplier, Role } from "@prisma/client";

type DeliveryWithRelations = Delivery & {
  supplier: Supplier;
  variant?: { color: string; lengthCm: number; product: { name: string } } | null;
};

export function serializeDeliveryForRole(
  delivery: DeliveryWithRelations,
  role: Role
) {
  const base = {
    id: delivery.id,
    variantId: delivery.variantId,
    barcode: delivery.barcode,
    remainingGrams: delivery.remainingGrams,
    remainingPieces: delivery.remainingPieces,
    exclusive: delivery.exclusive,
    stockedAt: delivery.stockedAt,
    ...(delivery.variant ? {
      variant: {
        color: delivery.variant.color,
        lengthCm: delivery.variant.lengthCm,
        product: { name: delivery.variant.product.name },
      },
    } : {}),
  };

  if (role === "OWNER") {
    return {
      ...base,
      supplierId: delivery.supplierId,
      supplierName: delivery.supplier.name,
      purchasePricePerGramRaw: delivery.purchasePricePerGramRaw,
      currency: delivery.currency,
      exchangeRate: delivery.exchangeRate,
      purchasePricePerGramCZK: delivery.purchasePricePerGramCZK,
      initialGrams: delivery.initialGrams,
      initialPieces: delivery.initialPieces,
      pieceWeightGrams: delivery.pieceWeightGrams,
      batchCode: delivery.batchCode,
      receivedInvoiceFile: delivery.receivedInvoiceFile,
      note: delivery.note,
      createdAt: delivery.createdAt,
    };
  }

  if (role === "EMPLOYEE") {
    return {
      ...base,
      initialGrams: delivery.initialGrams,
      initialPieces: delivery.initialPieces,
    };
  }

  // SALON should not access deliveries
  return null;
}
