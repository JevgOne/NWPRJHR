/** User color map — name (lowercase) → tailwind color config + emoji */
export const USER_COLORS: Record<string, { bg: string; text: string; ring: string; emoji: string }> = {
  inna:     { bg: "bg-pink-500",  text: "text-pink-700",  ring: "ring-pink-300",  emoji: "🐀" },
  inga:     { bg: "bg-pink-500",  text: "text-pink-700",  ring: "ring-pink-300",  emoji: "🐀" },
  jevgenij: { bg: "bg-red-500",   text: "text-red-700",   ring: "ring-red-300",   emoji: "👑" },
  martin:   { bg: "bg-blue-500",  text: "text-blue-700",  ring: "ring-blue-300",  emoji: "🐻" },
};

export const TEAM_MEMBERS = Object.keys(USER_COLORS).map(
  (key) => key.charAt(0).toUpperCase() + key.slice(1)
);

export const USER_ALIASES: Record<string, string> = {
  "інна": "inna",
  "інга": "inga",
  "євгеній": "jevgenij",
  "евгений": "jevgenij",
  "мартін": "martin",
  "мартин": "martin",
};

const FALLBACK = { bg: "bg-gray-400", text: "text-gray-600", ring: "ring-gray-200", emoji: "" };

export function getUserColor(name: string | null | undefined) {
  if (!name) return FALLBACK;
  const key = name.trim().toLowerCase();
  for (const [userName, colors] of Object.entries(USER_COLORS)) {
    if (key === userName || key.startsWith(userName + " ")) {
      return colors;
    }
  }
  for (const [alias, target] of Object.entries(USER_ALIASES)) {
    if (key === alias || key.startsWith(alias + " ")) {
      return USER_COLORS[target] ?? FALLBACK;
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
