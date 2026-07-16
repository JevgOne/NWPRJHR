/** User color map — name (lowercase) → tailwind color config */
export const USER_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  inna:     { bg: "bg-pink-500",  text: "text-pink-700",  ring: "ring-pink-300" },
  inga:     { bg: "bg-pink-500",  text: "text-pink-700",  ring: "ring-pink-300" },
  jevgenij: { bg: "bg-red-500",   text: "text-red-700",   ring: "ring-red-300" },
  martin:   { bg: "bg-blue-500",  text: "text-blue-700",  ring: "ring-blue-300" },
};

const FALLBACK = { bg: "bg-gray-400", text: "text-gray-600", ring: "ring-gray-200" };

export function getUserColor(name: string | null | undefined) {
  if (!name) return FALLBACK;
  const key = name.trim().toLowerCase();
  for (const [userName, colors] of Object.entries(USER_COLORS)) {
    if (key === userName || key.startsWith(userName + " ")) {
      return colors;
    }
  }
  return FALLBACK;
}

export function getUserInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
