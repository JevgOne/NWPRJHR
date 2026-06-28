export interface ColorToneOption {
  name: string;
  hex: string;
  nameKey: string;
}

export const COLOR_TONE_OPTIONS: ColorToneOption[] = [
  { name: "Blond", hex: "#E8D5A8", nameKey: "blond" },
  { name: "Hnědá", hex: "#7A5230", nameKey: "brown" },
  { name: "Tmavě hnědá", hex: "#3E2512", nameKey: "darkBrown" },
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
