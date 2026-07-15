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
  exclusiveGrams: number;
  exclusivePieces: number;
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
  const [physical, reserved, exclusiveStock] = await Promise.all([
    db.delivery.aggregate({
      where: { variantId },
      _sum: { remainingGrams: true, remainingPieces: true },
    }),
    db.reservation.aggregate({
      where: { variantId, active: true },
      _sum: { grams: true, pieces: true },
    }),
    db.delivery.aggregate({
      where: { variantId, exclusive: true },
      _sum: { remainingGrams: true, remainingPieces: true },
    }),
  ]);

  const physicalGrams = physical._sum.remainingGrams ?? 0;
  const physicalPieces = physical._sum.remainingPieces ?? 0;
  const reservedGrams = reserved._sum.grams ?? 0;
  const reservedPieces = reserved._sum.pieces ?? 0;
  const exclusiveGrams = exclusiveStock._sum.remainingGrams ?? 0;
  const exclusivePieces = exclusiveStock._sum.remainingPieces ?? 0;

  return {
    physicalGrams,
    physicalPieces,
    reservedGrams,
    reservedPieces,
    availableGrams: physicalGrams - reservedGrams,
    availablePieces: physicalPieces - reservedPieces,
    exclusiveGrams,
    exclusivePieces,
  };
}

interface RawStockRow {
  variantId: string;
  physicalGrams: bigint;
  physicalPieces: bigint;
  exclusiveGrams: bigint;
  exclusivePieces: bigint;
}

interface RawReservationRow {
  variantId: string;
  reservedGrams: bigint;
  reservedPieces: bigint;
}

// In-memory cache for bulk stock numbers (30s TTL)
let cachedStock: { data: Map<string, StockNumbers>; timestamp: number } | null = null;
const STOCK_CACHE_TTL = 30_000;

export function invalidateStockCache() {
  cachedStock = null;
}

/**
 * Bulk stock numbers for all variants (stock overview page).
 * Uses raw SQL GROUP BY for efficiency.
 * Cached in-memory with 30s TTL to avoid repeated DB roundtrips.
 */
export async function getAllStockNumbers(): Promise<
  Map<string, StockNumbers>
> {
  if (cachedStock && Date.now() - cachedStock.timestamp < STOCK_CACHE_TTL) {
    return cachedStock.data;
  }
  const physicalRows = await prisma.$queryRawUnsafe<RawStockRow[]>(
    `SELECT variantId,
            COALESCE(SUM(remainingGrams), 0) as physicalGrams,
            COALESCE(SUM(remainingPieces), 0) as physicalPieces,
            COALESCE(SUM(CASE WHEN exclusive = 1 THEN remainingGrams ELSE 0 END), 0) as exclusiveGrams,
            COALESCE(SUM(CASE WHEN exclusive = 1 THEN remainingPieces ELSE 0 END), 0) as exclusivePieces
     FROM deliveries
     GROUP BY variantId`
  );

  const reservedRows = await prisma.$queryRawUnsafe<RawReservationRow[]>(
    `SELECT variantId,
            COALESCE(SUM(grams), 0) as reservedGrams,
            COALESCE(SUM(pieces), 0) as reservedPieces
     FROM reservations
     WHERE active = 1
     GROUP BY variantId`
  );

  const map = new Map<string, StockNumbers>();

  for (const row of physicalRows) {
    map.set(row.variantId, {
      physicalGrams: Number(row.physicalGrams),
      physicalPieces: Number(row.physicalPieces),
      reservedGrams: 0,
      reservedPieces: 0,
      availableGrams: Number(row.physicalGrams),
      availablePieces: Number(row.physicalPieces),
      exclusiveGrams: Number(row.exclusiveGrams),
      exclusivePieces: Number(row.exclusivePieces),
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
        exclusiveGrams: 0,
        exclusivePieces: 0,
      });
    }
  }

  cachedStock = { data: map, timestamp: Date.now() };
  return map;
}
