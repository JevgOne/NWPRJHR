// Shared product helpers used by deliveries/route.ts and order-products/route.ts

export function autoColorTone(colorCode: string): string {
  const map: Record<string, string> = {
    "1": "Platinová blond", "2": "Světlá blond", "3": "Zlatá blond", "4": "Medová blond",
    "5": "Karamelová", "6": "Světle hnědá", "7": "Středně hnědá",
    "8": "Tmavě hnědá", "9": "Kaštanová", "10": "Černá",
    "ombre": "Ombre",
  };
  return map[colorCode] ?? "Hnědá";
}

export const CATEGORY_NAMES: Record<string, { cs: string; uk: string; ru: string }> = {
  VIRGIN: { cs: "Panenské Vlasy", uk: "Натуральне Волосся", ru: "Натуральные Волосы" },
  LUXE: { cs: "Luxe Vlasy", uk: "Люкс Волосся", ru: "Люкс Волосы" },
  STANDARD: { cs: "Standard Vlasy", uk: "Стандарт Волосся", ru: "Стандарт Волосы" },
  SALE: { cs: "Výprodej", uk: "Розпродаж", ru: "Распродажа" },
  ACCESSORY: { cs: "Příslušenství", uk: "Аксесуари", ru: "Аксессуары" },
};
