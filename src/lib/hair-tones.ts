export interface ToneOption {
  name: string;
  hex: string;
  nameKey: string;
}

export const TONE_OPTIONS: ToneOption[] = [
  { name: "Blond", hex: "#E8D5A8", nameKey: "blond" },
  { name: "Hnědá", hex: "#7A5230", nameKey: "brown" },
  { name: "Tmavě hnědá", hex: "#3E2512", nameKey: "darkBrown" },
  { name: "Zrzavá", hex: "#B5451B", nameKey: "red" },
];

export function getToneInfo(name: string | null | undefined): ToneOption {
  if (!name) return { name: "", hex: "#9CA3AF", nameKey: "unknown" };
  return (
    TONE_OPTIONS.find((t) => t.name === name) ?? {
      name,
      hex: "#9CA3AF",
      nameKey: "custom",
    }
  );
}
