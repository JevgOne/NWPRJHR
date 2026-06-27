export interface TextureOption {
  name: string;
  icon: string;
  nameKey: string;
}

export const TEXTURE_OPTIONS: TextureOption[] = [
  { name: "Rovné", icon: "—", nameKey: "straight" },
  { name: "Mírně vlnité", icon: "~", nameKey: "slightlyWavy" },
  { name: "Vlnité", icon: "〰", nameKey: "wavy" },
  { name: "Kudrnaté", icon: "∿", nameKey: "curly" },
];

export function getTextureInfo(name: string | null | undefined): TextureOption {
  if (!name) return { name: "", icon: "?", nameKey: "unknown" };
  return (
    TEXTURE_OPTIONS.find((t) => t.name === name) ?? {
      name,
      icon: "?",
      nameKey: "custom",
    }
  );
}
