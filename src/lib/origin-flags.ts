const FLAGS: Record<string, string> = {
  // Czech names
  "Ukrajina": "🇺🇦",
  "Bělorusko": "🇧🇾",
  "Moldavsko": "🇲🇩",
  "Rusko": "🇷🇺",
  "Kazachstán": "🇰🇿",
  "Uzbekistán": "🇺🇿",
  "Turecko": "🇹🇷",
  "Írán": "🇮🇷",
  "Indie": "🇮🇳",
  "Vietnam": "🇻🇳",
  "Sýrie": "🇸🇾",
  "Čína": "🇨🇳",
  "Mongolsko": "🇲🇳",
  "Gruzie": "🇬🇪",
  "Mix": "🌍",
  // Ukrainian names
  "Україна": "🇺🇦",
  "Білорусь": "🇧🇾",
  "Молдова": "🇲🇩",
  "Росія": "🇷🇺",
  "Казахстан": "🇰🇿",
  "Узбекистан": "🇺🇿",
  "Туреччина": "🇹🇷",
  "Іран": "🇮🇷",
  "Індія": "🇮🇳",
  "В'єтнам": "🇻🇳",
  "Сирія": "🇸🇾",
  "Китай": "🇨🇳",
  "Монголія": "🇲🇳",
  "Грузія": "🇬🇪",
  "Мікс": "🌍",
  // Russian names
  "Украина": "🇺🇦",
  "Беларусь": "🇧🇾",
  "Молдавия": "🇲🇩",
  "Россия": "🇷🇺",
  "Турция": "🇹🇷",
  "Иран": "🇮🇷",
  "Индия": "🇮🇳",
  "Вьетнам": "🇻🇳",
  "Сирия": "🇸🇾",
  "Монголия": "🇲🇳",
  "Грузия": "🇬🇪",
  "Микс": "🌍",
};

export function getOriginFlag(origin: string): string {
  return FLAGS[origin] ?? "🌍";
}

export const ORIGIN_GENITIVE: Record<string, string> = {
  "Ukrajina": "Ukrajiny",
  "Bělorusko": "Běloruska",
  "Moldavsko": "Moldavska",
  "Rusko": "Ruska",
  "Kazachstán": "Kazachstánu",
  "Uzbekistán": "Uzbekistánu",
  "Turecko": "Turecka",
  "Írán": "Íránu",
  "Indie": "Indie",
  "Vietnam": "Vietnamu",
  "Sýrie": "Sýrie",
  "Čína": "Číny",
  "Mongolsko": "Mongolska",
  "Gruzie": "Gruzie",
  "Mix": "směsi původů",
};

export function originGenitive(origin: string): string {
  return ORIGIN_GENITIVE[origin] ?? origin;
}

export function originFromGenitive(origin: string): string {
  const gen = ORIGIN_GENITIVE[origin];
  return gen ? `z ${gen}` : `z ${origin}`;
}

export const ORIGIN_OPTIONS = [
  { name: "Ukrajina", flag: "🇺🇦" },
  { name: "Bělorusko", flag: "🇧🇾" },
  { name: "Moldavsko", flag: "🇲🇩" },
  { name: "Rusko", flag: "🇷🇺" },
  { name: "Kazachstán", flag: "🇰🇿" },
  { name: "Uzbekistán", flag: "🇺🇿" },
  { name: "Turecko", flag: "🇹🇷" },
  { name: "Írán", flag: "🇮🇷" },
  { name: "Indie", flag: "🇮🇳" },
  { name: "Vietnam", flag: "🇻🇳" },
  { name: "Sýrie", flag: "🇸🇾" },
  { name: "Čína", flag: "🇨🇳" },
  { name: "Mongolsko", flag: "🇲🇳" },
  { name: "Gruzie", flag: "🇬🇪" },
  { name: "Mix", flag: "🌍" },
];
