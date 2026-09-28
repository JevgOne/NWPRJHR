// Shared product helpers used by deliveries/route.ts and order-products/route.ts

/** Map industry-standard color code to Czech color tone name */
export function autoColorTone(colorCode: string): string {
  const map: Record<string, string> = {
    "1": "Černá", "1B": "Černá",
    "2": "Tmavě hnědá", "3": "Tmavě hnědá", "4": "Hnědá",
    "5": "Středně hnědá", "6": "Světle hnědá", "7": "Světle hnědá",
    "8": "Karamelová", "10": "Karamelová", "12": "Karamelová",
    "14": "Tmavá blond", "16": "Medová blond", "18": "Popelavá blond",
    "24": "Zlatá blond", "27": "Karamelová blond", "613": "Platinová blond",
    "BL22": "Světlá blond", "BL60": "Platinová blond",
    "30": "Měděná", "33": "Mahagonová", "35": "Červená", "99J": "Burgundská",
    "ombre": "Ombre", "grey": "Šedá",
  };
  return map[colorCode] ?? "Hnědá";
}

/** Short Czech color label for product names (not the full tone) */
export function colorLabel(colorCode: string): string {
  const map: Record<string, string> = {
    "1": "černá", "1B": "off black",
    "3": "tmavě hnědá", "5": "středně hnědá", "6": "světle hnědá",
    "10": "karamel", "14": "tmavá blond", "16": "medová blond",
    "24": "zlatá blond", "613": "platinová blond",
    "ombre": "ombre", "grey": "šedá",
  };
  return map[colorCode] ?? colorCode;
}

export const CATEGORY_NAMES: Record<string, { cs: string; uk: string; ru: string }> = {
  VIRGIN: { cs: "Panenské Vlasy", uk: "Натуральне Волосся", ru: "Натуральные Волосы" },
  LUXE: { cs: "Luxe Vlasy", uk: "Люкс Волосся", ru: "Люкс Волосы" },
  STANDARD: { cs: "Standard Vlasy", uk: "Стандарт Волосся", ru: "Стандарт Волосы" },
  SALE: { cs: "Výprodej", uk: "Розпродаж", ru: "Распродажа" },
  ACCESSORY: { cs: "Příslušenství", uk: "Аксесуари", ru: "Аксессуары" },
};
