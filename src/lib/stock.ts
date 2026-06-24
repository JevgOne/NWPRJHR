import type { PrismaClient } from "@prisma/client";
import { prisma } from "./db";

type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export interface StockNumbers {
  physicalGrams: number;
  physicalPieces: number;
  reservedGrams: number;
  reservedPieces: number;
  availableGrams: number;
  availablePieces: number;
}

/**
 * Calculate three stock numbers for a single variant:
 * - Physical = SUM of remainingGrams across all deliveries
 * - Reserved = SUM of active reservations
 * - Available = physical - reserved
 *
 * Accepts optional tx client for use inside transactions.
 */
export async function getStockNumbers(
  variantId: string,
  db: TransactionClient | typeof prisma = prisma
): Promise<StockNumbers> {
  const physical = await db.delivery.aggregate({
    where: { variantId },
    _sum: {
      remainingGrams: true,
      remainingPieces: true,
    },
  });

  const reserved = await db.reservation.aggregate({
    where: { variantId, active: true },
    _sum: {
      grams: true,
      pieces: true,
    },
  });

  const physicalGrams = physical._sum.remainingGrams ?? 0;
  const physicalPieces = physical._sum.remainingPieces ?? 0;
  const reservedGrams = reserved._sum.grams ?? 0;
  const reservedPieces = reserved._sum.pieces ?? 0;

  return {
    physicalGrams,
    physicalPieces,
    reservedGrams,
    reservedPieces,
    availableGrams: physicalGrams - reservedGrams,
    availablePieces: physicalPieces - reservedPieces,
  };
}

interface RawStockRow {
  variantId: string;
  physicalGrams: bigint;
  physicalPieces: bigint;
}

interface RawReservationRow {
  variantId: string;
  reservedGrams: bigint;
  reservedPieces: bigint;
}

/**
 * Bulk stock numbers for all variants (stock overview page).
 * Uses raw SQL GROUP BY for efficiency.
 */
export async function getAllStockNumbers(): Promise<
  Map<string, StockNumbers>
> {
  const physicalRows = await prisma.$queryRaw<RawStockRow[]>`
    SELECT "variantId",
           COALESCE(SUM("remainingGrams"), 0)::bigint as "physicalGrams",
           COALESCE(SUM("remainingPieces"), 0)::bigint as "physicalPieces"
    FROM "deliveries"
    GROUP BY "variantId"
  `;

  const reservedRows = await prisma.$queryRaw<RawReservationRow[]>`
    SELECT "variantId",
           COALESCE(SUM("grams"), 0)::bigint as "reservedGrams",
           COALESCE(SUM("pieces"), 0)::bigint as "reservedPieces"
    FROM "reservations"
    WHERE "active" = true
    GROUP BY "variantId"
  `;

  const map = new Map<string, StockNumbers>();

  for (const row of physicalRows) {
    map.set(row.variantId, {
      physicalGrams: Number(row.physicalGrams),
      physicalPieces: Number(row.physicalPieces),
      reservedGrams: 0,
      reservedPieces: 0,
      availableGrams: Number(row.physicalGrams),
      availablePieces: Number(row.physicalPieces),
    });
  }

  for (const row of reservedRows) {
    const existing = map.get(row.variantId);
    const rg = Number(row.reservedGrams);
    const rp = Number(row.reservedPieces);
    if (existing) {
      existing.reservedGrams = rg;
      existing.reservedPieces = rp;
      existing.availableGrams = existing.physicalGrams - rg;
      existing.availablePieces = existing.physicalPieces - rp;
    } else {
      map.set(row.variantId, {
        physicalGrams: 0,
        physicalPieces: 0,
        reservedGrams: rg,
        reservedPieces: rp,
        availableGrams: -rg,
        availablePieces: -rp,
      });
    }
  }

  return map;
}
