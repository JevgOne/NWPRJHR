export const SHIPPING_COSTS = {
  PACKETA: 8900,
  CZECH_POST: 11900,
  PERSONAL_DELIVERY: 0,
  PICKUP: 0,
} as const;

export const FREE_SHIPPING_THRESHOLD = 200000; // 2000 CZK in halere

export function getShippingCost(method: string, orderTotal: number): number {
  if (orderTotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_COSTS[method as keyof typeof SHIPPING_COSTS] ?? 0;
}
