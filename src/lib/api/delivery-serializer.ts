import type { Delivery, Supplier, Role } from "@prisma/client";

type DeliveryWithSupplier = Delivery & { supplier: Supplier };

export function serializeDeliveryForRole(
  delivery: DeliveryWithSupplier,
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
