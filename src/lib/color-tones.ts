export interface ColorToneOption {
  name: string;
  hex: string;
  nameKey: string;
}

export const COLOR_TONE_OPTIONS: ColorToneOption[] = [
  // Specific tones — hex values match HAIR_COLORS palette (hair-colors.ts)
  { name: "Platinová blond", hex: "#F5E6C8", nameKey: "c1" },
  { name: "Světlá blond", hex: "#E6C47C", nameKey: "c2" },
  { name: "Zlatá blond", hex: "#D4A84B", nameKey: "c3" },
  { name: "Medová blond", hex: "#C08A3E", nameKey: "c4" },
  { name: "Karamelová", hex: "#A0673A", nameKey: "c5" },
  { name: "Světle hnědá", hex: "#8B5E3C", nameKey: "c6" },
  { name: "Středně hnědá", hex: "#6B4226", nameKey: "c7" },
  { name: "Tmavě hnědá", hex: "#4A2912", nameKey: "c8" },
  { name: "Kaštanová", hex: "#2C1608", nameKey: "c9" },
  { name: "Černá", hex: "#1A0E05", nameKey: "c10" },
  { name: "Ombre", hex: "#C8A87C", nameKey: "combre" },
  // Legacy generic names (older products)
  { name: "Blond", hex: "#E8D5A8", nameKey: "blond" },
  { name: "Hnědá", hex: "#7A5230", nameKey: "brown" },
  { name: "Zrzavá", hex: "#B5451B", nameKey: "red" },
];

export function getColorToneInfo(name: string | null | undefined): ColorToneOption {
  if (!name) return { name: "", hex: "#9CA3AF", nameKey: "unknown" };
  return (
    COLOR_TONE_OPTIONS.find((t) => t.name === name) ?? {
      name,
      hex: "#9CA3AF",
      nameKey: "custom",
    }
  );
}
