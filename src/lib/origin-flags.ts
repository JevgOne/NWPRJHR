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

// Ukrainian genitive forms ("з України", "з Білорусі")
export const ORIGIN_GENITIVE_UK: Record<string, string> = {
  "Ukrajina": "України",
  "Bělorusko": "Білорусі",
  "Moldavsko": "Молдови",
  "Rusko": "Росії",
  "Kazachstán": "Казахстану",
  "Uzbekistán": "Узбекистану",
  "Turecko": "Туреччини",
  "Írán": "Ірану",
  "Indie": "Індії",
  "Vietnam": "В'єтнаму",
  "Sýrie": "Сирії",
  "Čína": "Китаю",
  "Mongolsko": "Монголії",
  "Gruzie": "Грузії",
  "Mix": "суміші походжень",
};

export function originFromGenitiveUk(origin: string): string {
  const gen = ORIGIN_GENITIVE_UK[origin];
  return gen ? `з ${gen}` : `з ${origin}`;
}

// Russian genitive forms ("из Украины", "из Беларуси")
export const ORIGIN_GENITIVE_RU: Record<string, string> = {
  "Ukrajina": "Украины",
  "Bělorusko": "Беларуси",
  "Moldavsko": "Молдовы",
  "Rusko": "России",
  "Kazachstán": "Казахстана",
  "Uzbekistán": "Узбекистана",
  "Turecko": "Турции",
  "Írán": "Ирана",
  "Indie": "Индии",
  "Vietnam": "Вьетнама",
  "Sýrie": "Сирии",
  "Čína": "Китая",
  "Mongolsko": "Монголии",
  "Gruzie": "Грузии",
  "Mix": "смеси происхождений",
};

export function originFromGenitiveRu(origin: string): string {
  const gen = ORIGIN_GENITIVE_RU[origin];
  return gen ? `из ${gen}` : `из ${origin}`;
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
