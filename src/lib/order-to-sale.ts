import { prisma } from "./db";
import { completeSale } from "./sales";
import { createInvoiceFromSale } from "./invoicing";
import { invalidateStockCache } from "./stock";
import type { Sale } from "@prisma/client";

/**
 * Convert a PAID Order into a Sale.
 * 2-step pattern: release reservations in tx → completeSale (has its own tx) → link.
 * Same proven pattern as orders/[id]/route.ts "complete" action.
 */
export async function createSaleFromOrder(
  orderId: string,
  userId: string
): Promise<Sale> {
  // STEP 1: Verify state + deactivate reservations
  const orderData = await prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { items: true, customer: true, salon: true },
      });

      if (order.saleId) throw new Error("Order already has a Sale");
      if (order.status !== "PAID")
        throw new Error(`Order status must be PAID, is ${order.status}`);

      await tx.reservation.updateMany({
        where: { orderId, active: true },
        data: { active: false },
      });

      return order;
    },
    { timeout: 15000 }
  );

  // STEP 2: completeSale (has its own transaction for FIFO)
  let sale: Sale;
  try {
    const customerType = orderData.salonId
      ? ("SALON" as const)
      : ("RETAIL" as const);
    sale = await completeSale(
      {
        customerType,
        salonId: orderData.salonId ?? undefined,
        customerId: orderData.customerId ?? undefined,
        items: orderData.items.map((item) => ({
          variantId: item.variantId,
          grams: item.grams,
          pieces: item.pieces,
        })),
        paymentType:
          orderData.paymentMethod === "CARD" ? "CARD" : "TRANSFER",
        orderId,
        note: orderData.note ?? undefined,
      },
      userId
    );
  } catch (e) {
    // FIFO failed — re-activate reservations so stock stays reserved
    await prisma.reservation.updateMany({
      where: { orderId },
      data: { active: true },
    });
    throw e;
  }

  // STEP 3: Link Order → Sale + status update
  await prisma.order.update({
    where: { id: orderId },
    data: {
      saleId: sale.id,
      status: "PROCESSING",
    },
  });

  // STEP 4: Create invoice
  const invoice = await createInvoiceFromSale(sale.id);

  // STEP 5: Send invoice email (fire-and-forget)
  import("./invoice-email")
    .then(({ sendInvoiceEmail }) =>
      sendInvoiceEmail(invoice.id).catch((e: unknown) =>
        console.error("[order-to-sale] Invoice email failed:", e)
      )
    )
    .catch(() => {});

  invalidateStockCache();
  return sale;
}

/**
 * Generate an order number: E{YYYY}{NNNN}
 * NOTE: race condition possible under high concurrency — acceptable for MVP.
 * orderNumber has @unique constraint so DB will reject duplicates.
 */
export async function generateOrderNumber(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  prefix: string = "E"
): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.order.count({
    where: {
      orderNumber: { startsWith: `${prefix}${year}` },
    },
  });
  return `${prefix}${year}${String(count + 1).padStart(4, "0")}`;
}
