import type {
  Sale,
  SaleItem,
  Discount,
  DiscountBearer,
  Partner,
  Role,
} from "@prisma/client";

type SaleWithRelations = Sale & {
  items: SaleItem[];
  discounts: (Discount & { bearers: (DiscountBearer & { partner: Partner })[] })[];
  salon?: { id: string; name: string } | null;
  customer?: { id: string; name: string } | null;
  user: { id: string; name: string | null; email: string | null; role: Role };
};

function serializeSaleItemForRole(item: SaleItem, role: Role) {
  const base = {
    id: item.id,
    variantId: item.variantId,
    grams: item.grams,
    pieces: item.pieces,
    pricePerGramUsed: item.pricePerGramUsed,
    lineTotal: item.lineTotal,
  };

  if (role === "OWNER") {
    return {
      ...base,
      deliveryId: item.deliveryId,
      purchasePricePerGramCZK: item.purchasePricePerGramCZK,
      itemMargin:
        item.lineTotal - item.purchasePricePerGramCZK * item.grams,
    };
  }

  return base;
}

export function serializeSaleForRole(
  sale: SaleWithRelations,
  role: Role
) {
  const base = {
    id: sale.id,
    saleNumber: sale.saleNumber,
    customerType: sale.customerType,
    salonName: sale.salon?.name,
    customerName: sale.customer?.name,
    status: sale.status,
    paymentType: sale.paymentType,
    receiptNumber: sale.receiptNumber,
    subtotal: sale.subtotal,
    discountAmount: sale.discountAmount,
    totalBeforeVat: sale.totalBeforeVat,
    vatAmount: sale.vatAmount,
    totalAmount: sale.totalAmount,
    completedAt: sale.completedAt,
    createdAt: sale.createdAt,
    shippingMethod: sale.shippingMethod,
    shippingStatus: sale.shippingStatus,
    shippingTrackingId: sale.shippingTrackingId,
    shippingCost: sale.shippingCost,
    packetaPointId: sale.packetaPointId,
    packetaPointName: sale.packetaPointName,
    packetaPointCity: sale.packetaPointCity,
    items: sale.items.map((item) => serializeSaleItemForRole(item, role)),
    userName: sale.user.name,
  };

  if (role === "OWNER") {
    return {
      ...base,
      totalCostOfGoods: sale.totalCostOfGoods,
      grossMargin: sale.grossMargin,
      discounts: sale.discounts.map((d) => ({
        id: d.id,
        percent: d.percent,
        type: d.type,
        amountHalere: d.amountHalere,
        counterPerformanceNote: d.counterPerformanceNote,
        bearers: d.bearers.map((b) => ({
          partnerId: b.partnerId,
          partnerName: b.partner.name,
          shareAmount: b.shareAmount,
        })),
      })),
      userId: sale.userId,
    };
  }

  if (role === "EMPLOYEE") {
    return base;
  }

  // SALON: minimal
  return {
    id: sale.id,
    totalAmount: sale.totalAmount,
    completedAt: sale.completedAt,
    items: sale.items.map((item) => ({
      variantId: item.variantId,
      grams: item.grams,
      pieces: item.pieces,
      pricePerGramUsed: item.pricePerGramUsed,
      lineTotal: item.lineTotal,
    })),
  };
}
