/**
 * Fixed price tables for suppliers with pre-negotiated pricing.
 *
 * All prices are in CZK per 100 g.
 * Keyed by supplier name (must match the name stored in the DB).
 */

export interface SupplierPriceEntry {
  lengthCm: number;
  purchasePer100g: number;
  retailPer100g: number;
  b2bPer100g: number;
}

export interface SupplierColorCategory {
  key: string;
  label: string;
  /** Product category auto-set when this color category is chosen */
  category: "LUXE" | "STANDARD";
  prices: SupplierPriceEntry[];
}

export interface SupplierPriceTable {
  origin: string; // Czech name matching ORIGIN_OPTIONS
  colorCategories: SupplierColorCategory[];
}

export const SUPPLIER_PRICES: Record<string, SupplierPriceTable> = {
  Nguyen: {
    origin: "Vietnam",
    colorCategories: [
      {
        key: "natural",
        label: "Přírodní",
        category: "LUXE",
        prices: [
          { lengthCm: 40, purchasePer100g: 2200, retailPer100g: 5500, b2bPer100g: 4400 },
          { lengthCm: 45, purchasePer100g: 2400, retailPer100g: 6000, b2bPer100g: 4800 },
          { lengthCm: 50, purchasePer100g: 2600, retailPer100g: 6500, b2bPer100g: 5200 },
          { lengthCm: 55, purchasePer100g: 2800, retailPer100g: 7000, b2bPer100g: 5600 },
          { lengthCm: 60, purchasePer100g: 3000, retailPer100g: 7500, b2bPer100g: 6000 },
          { lengthCm: 65, purchasePer100g: 3200, retailPer100g: 8000, b2bPer100g: 6400 },
          { lengthCm: 70, purchasePer100g: 3400, retailPer100g: 8500, b2bPer100g: 6800 },
        ],
      },
      {
        key: "colored",
        label: "Barvené",
        category: "STANDARD",
        prices: [
          { lengthCm: 40, purchasePer100g: 2450, retailPer100g: 6125, b2bPer100g: 4900 },
          { lengthCm: 45, purchasePer100g: 2650, retailPer100g: 6625, b2bPer100g: 5300 },
          { lengthCm: 50, purchasePer100g: 2850, retailPer100g: 7125, b2bPer100g: 5700 },
          { lengthCm: 55, purchasePer100g: 3050, retailPer100g: 7625, b2bPer100g: 6100 },
          { lengthCm: 60, purchasePer100g: 3250, retailPer100g: 8125, b2bPer100g: 6500 },
          { lengthCm: 65, purchasePer100g: 3450, retailPer100g: 8625, b2bPer100g: 6900 },
          { lengthCm: 70, purchasePer100g: 3650, retailPer100g: 9125, b2bPer100g: 7300 },
        ],
      },
    ],
  },
  "Angel Enterprises": {
    origin: "Írán",
    colorCategories: [
      {
        key: "natural",
        label: "Přírodní",
        category: "LUXE",
        prices: [
          { lengthCm: 40, purchasePer100g: 618, retailPer100g: 1978, b2bPer100g: 1545 },
          { lengthCm: 45, purchasePer100g: 852, retailPer100g: 2726, b2bPer100g: 2130 },
          { lengthCm: 50, purchasePer100g: 1044, retailPer100g: 3341, b2bPer100g: 2610 },
          { lengthCm: 55, purchasePer100g: 1257, retailPer100g: 4022, b2bPer100g: 3143 },
          { lengthCm: 60, purchasePer100g: 1768, retailPer100g: 5658, b2bPer100g: 4420 },
          { lengthCm: 65, purchasePer100g: 1896, retailPer100g: 6067, b2bPer100g: 4740 },
          { lengthCm: 70, purchasePer100g: 2024, retailPer100g: 6477, b2bPer100g: 5060 },
          { lengthCm: 75, purchasePer100g: 2237, retailPer100g: 7158, b2bPer100g: 5593 },
          { lengthCm: 80, purchasePer100g: 2492, retailPer100g: 7974, b2bPer100g: 6230 },
        ],
      },
      {
        key: "blond",
        label: "Blond",
        category: "LUXE",
        prices: [
          { lengthCm: 45, purchasePer100g: 1448, retailPer100g: 4634, b2bPer100g: 3186 },
          { lengthCm: 50, purchasePer100g: 1683, retailPer100g: 5386, b2bPer100g: 3703 },
          { lengthCm: 55, purchasePer100g: 1811, retailPer100g: 5795, b2bPer100g: 3984 },
          { lengthCm: 60, purchasePer100g: 2322, retailPer100g: 7430, b2bPer100g: 5108 },
          { lengthCm: 65, purchasePer100g: 2726, retailPer100g: 8723, b2bPer100g: 5997 },
          { lengthCm: 70, purchasePer100g: 2876, retailPer100g: 9203, b2bPer100g: 6327 },
          { lengthCm: 75, purchasePer100g: 3025, retailPer100g: 9680, b2bPer100g: 6655 },
        ],
      },
    ],
  },
};

/** Look up the price table for a supplier by name. Returns undefined if no fixed pricing. */
export function getSupplierPriceTable(supplierName: string): SupplierPriceTable | undefined {
  return SUPPLIER_PRICES[supplierName];
}

/** Find a specific price entry for supplier + color category + length. */
export function lookupSupplierPrice(
  supplierName: string,
  colorCategoryKey: string,
  lengthCm: number,
): SupplierPriceEntry | undefined {
  const table = SUPPLIER_PRICES[supplierName];
  if (!table) return undefined;
  const cat = table.colorCategories.find((c) => c.key === colorCategoryKey);
  if (!cat) return undefined;
  return cat.prices.find((p) => p.lengthCm === lengthCm);
}
