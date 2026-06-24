import type { Complaint } from "@prisma/client";
import { prisma } from "./db";
import { createCreditNoteInTx } from "./credit-note";

/**
 * Create a quality complaint. Defective goods tracked separately.
 * NOT returned to sellable stock.
 * Side effects: stock movement (COMPLAINT) + auto credit note for salon.
 */
export async function createComplaint(
  input: {
    saleId?: string;
    salonId?: string;
    deliveryId: string;
    grams: number;
    pieces: number;
    description: string;
  },
  userId: string
): Promise<Complaint> {
  return prisma.$transaction(
    async (tx) => {
      const delivery = await tx.delivery.findUniqueOrThrow({
        where: { id: input.deliveryId },
      });

      // Record stock movement: COMPLAINT (negative, goods are defective)
      await tx.stockMovement.create({
        data: {
          deliveryId: input.deliveryId,
          variantId: delivery.variantId,
          type: "COMPLAINT",
          grams: -input.grams,
          pieces: -input.pieces,
          userId,
          note: `Reklamace: ${input.description}`,
        },
      });

      // Update delivery remaining (deduct defective goods)
      await tx.delivery.update({
        where: { id: input.deliveryId },
        data: {
          remainingGrams: { decrement: input.grams },
          remainingPieces: { decrement: input.pieces },
        },
      });

      // Auto credit note for salon (if salon sale)
      let creditNoteId: string | undefined;
      if (input.saleId && input.salonId) {
        const sale = await tx.sale.findUniqueOrThrow({
          where: { id: input.saleId },
          include: { invoice: true },
        });

        if (sale.invoice) {
          const saleItem = await tx.saleItem.findFirst({
            where: {
              saleId: input.saleId,
              deliveryId: input.deliveryId,
            },
          });

          if (saleItem) {
            const refundAmount = saleItem.pricePerGramUsed * input.grams;
            const creditNote = await createCreditNoteInTx(
              sale.invoice.id,
              [
                {
                  description: `Reklamace: ${input.description}`,
                  quantity: input.grams,
                  unit: "g",
                  pricePerUnit: saleItem.pricePerGramUsed,
                  lineTotal: refundAmount,
                },
              ],
              `Reklamace kvality k fakture ${sale.invoice.number}`,
              tx
            );
            creditNoteId = creditNote.id;
          }
        }
      }

      return tx.complaint.create({
        data: {
          saleId: input.saleId,
          salonId: input.salonId,
          deliveryId: input.deliveryId,
          grams: input.grams,
          pieces: input.pieces,
          description: input.description,
          status: creditNoteId ? "RESOLVED" : "OPEN",
          creditNoteId,
          createdByUserId: userId,
          resolvedAt: creditNoteId ? new Date() : undefined,
        },
      });
    },
    { timeout: 15000 }
  );
}

/**
 * Record supplier refund for a complaint.
 */
export async function recordSupplierRefund(
  complaintId: string,
  refundHalere: number,
  note: string
): Promise<Complaint> {
  return prisma.complaint.update({
    where: { id: complaintId },
    data: {
      status: "RESOLVED",
      supplierRefundHalere: refundHalere,
      supplierRefundDate: new Date(),
      supplierNote: note,
      resolvedAt: new Date(),
    },
  });
}

/**
 * Get complaint statistics per delivery for detecting problematic suppliers.
 */
export async function getComplaintsByDelivery(params?: {
  supplierId?: string;
  from?: Date;
  to?: Date;
}) {
  const complaints = await prisma.complaint.findMany({
    where: {
      ...(params?.from && { createdAt: { gte: params.from } }),
      ...(params?.to && { createdAt: { lte: params.to } }),
      delivery: {
        ...(params?.supplierId && { supplierId: params.supplierId }),
      },
    },
    include: {
      delivery: {
        include: {
          supplier: { select: { name: true } },
        },
      },
    },
  });

  const byDelivery = new Map<
    string,
    {
      deliveryId: string;
      deliveryBarcode: string;
      supplierName: string;
      complaintCount: number;
      totalDefectiveGrams: number;
      totalDefectivePieces: number;
    }
  >();

  for (const c of complaints) {
    const key = c.deliveryId;
    if (!byDelivery.has(key)) {
      byDelivery.set(key, {
        deliveryId: key,
        deliveryBarcode: c.delivery.barcode ?? "",
        supplierName: c.delivery.supplier?.name ?? "",
        complaintCount: 0,
        totalDefectiveGrams: 0,
        totalDefectivePieces: 0,
      });
    }
    const entry = byDelivery.get(key)!;
    entry.complaintCount++;
    entry.totalDefectiveGrams += c.grams;
    entry.totalDefectivePieces += c.pieces;
  }

  return Array.from(byDelivery.values()).sort(
    (a, b) => b.complaintCount - a.complaintCount
  );
}

