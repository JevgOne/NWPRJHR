import { prisma } from "./db";

// In-memory cache for B2B settings (5min TTL)
let cachedB2B: {
  data: { hairdresserDiscountPct: number; salonDiscountPct: number };
  timestamp: number;
} | null = null;
const B2B_CACHE_TTL = 300_000; // 5 min

export async function getCachedB2BSettings() {
  if (cachedB2B && Date.now() - cachedB2B.timestamp < B2B_CACHE_TTL)
    return cachedB2B.data;
  const settings = await prisma.b2BSettings.findFirst();
  const data = {
    hairdresserDiscountPct: settings?.hairdresserDiscountPct ?? 2000,
    salonDiscountPct: settings?.salonDiscountPct ?? 3000,
  };
  cachedB2B = { data, timestamp: Date.now() };
  return data;
}

export function invalidateB2BCache() {
  cachedB2B = null;
}
