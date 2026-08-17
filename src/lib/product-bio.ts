import { originFromGenitive, originFromGenitiveUk, originFromGenitiveRu } from "@/lib/origin-flags";

interface BioProductData {
  name: string;
  category: string;
  processingType: string;
  origin?: string | null;
  texture?: string | null;
  colorTone?: string | null;
  lengths?: number[];
  colorCount?: number;
}

type Locale = "cs" | "uk" | "ru";

export function generateProductBio(data: BioProductData, locale: Locale = "cs"): string {
  const originFn = locale === "uk" ? originFromGenitiveUk : locale === "ru" ? originFromGenitiveRu : originFromGenitive;
  const origin = data.origin ? originFn(data.origin) : "";
  const texture = data.texture ? TEXTURE_MAP[locale][data.texture.toLowerCase()] ?? data.texture.toLowerCase() : "";
  const color = data.colorTone ?? "";
  const lengthStr = formatLengths(data.lengths);

  type TemplateFn = (o: string, t: string, c: string, l: string) => string;
  const allTemplates = TEMPLATES[locale];
  let templates: TemplateFn[];

  if (data.category === "VIRGIN") {
    templates = allTemplates.VIRGIN;
  } else if (data.category === "LUXE") {
    templates = allTemplates.LUXE;
  } else if (data.category === "STANDARD") {
    templates = allTemplates.STANDARD;
  } else if (data.category === "SALE") {
    templates = allTemplates.SALE;
  } else {
    return buildGenericBio(data.name, origin, texture, color, lengthStr, locale);
  }

  const template = templates[Math.floor(Math.random() * templates.length)];
  return template(origin, texture, color, lengthStr).trim();
}

function formatLengths(lengths?: number[]): string {
  if (!lengths || lengths.length === 0) return "";
  const unique = [...new Set(lengths)].sort((a, b) => a - b);
  if (unique.length === 1) return `${unique[0]} cm`;
  return `${unique[0]}\u2013${unique[unique.length - 1]} cm`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Texture translations (keys are lowercase Czech texture names from DB)
const TEXTURE_MAP: Record<Locale, Record<string, string>> = {
  cs: {
    "rovné": "rovné",
    "vlnité": "vlnité",
    "kudrnaté": "kudrnaté",
    "afro": "afro",
  },
  uk: {
    "rovné": "рівне",
    "vlnité": "хвилясте",
    "kudrnaté": "кучеряве",
    "afro": "афро",
  },
  ru: {
    "rovné": "прямые",
    "vlnité": "волнистые",
    "kudrnaté": "кудрявые",
    "afro": "афро",
  },
};

type TemplateFn = (o: string, t: string, c: string, l: string) => string;

interface CategoryTemplates {
  VIRGIN: TemplateFn[];
  LUXE: TemplateFn[];
  STANDARD: TemplateFn[];
  SALE: TemplateFn[];
}

// =========================================================================
// CZECH TEMPLATES
// =========================================================================

const CS_TEMPLATES: CategoryTemplates = {
  VIRGIN: [
    (o, t, c, l) => {
      const parts = [
        `${o ? `${capitalize(o)} p` : "P"}anenské ${t} vlasy k prodloužení${c ? ` v odstínu ${c}` : ""}.`,
        "Neošetřené, z jedné dárkyně \u2014 rovnoměrná struktura od kořínků ke konečkům.",
        l ? `Délka ${l}, zpracování na zakázku do 7 pracovních dnů.` : "Zpracování na zakázku do 7 pracovních dnů.",
        "Při správné péči vydrží rok i déle.",
      ];
      return parts.join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `Prémiové ${t} vlasy${o ? ` ${o}` : ""}${c ? `, ${c}` : ""} \u2014 100 % panenský vlas bez chemie.`,
        "Každý culík pochází od jedné dárkyně, takže textura je po celé délce stejnoměrná.",
        l ? `K dispozici v délce ${l}.` : "",
        "Vhodné k barvení, kadeření i žehlení. Osobní ukázka v Praze zdarma.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `100% panenské ${t} vlasy${o ? ` ${o}` : ""}${c ? ` (${c})` : ""} pro náročné klientky.`,
        "Nikdy nebarvené, nikdy chemicky ošetřené. Hedvábný lesk a přirozený pohyb.",
        l ? `Délka ${l}.` : "",
        "Zpracujeme clip-in, tape-in, keratin nebo micro ring \u2014 přesně podle vašeho přání.",
      ];
      return parts.filter(Boolean).join(" ");
    },
  ],
  LUXE: [
    (o, t, c, l) => {
      const parts = [
        `Luxusní ${t} vlasy${o ? ` ${o}` : ""}${c ? ` v odstínu ${c}` : ""}.`,
        "Šetrně ošetřené tak, aby si zachovaly přirozenou strukturu a hedvábný lesk. Kvalitou se blíží panenskému vlasu za příznivější cenu.",
        l ? `Délka ${l}.` : "",
        "Zpracování na zakázku, osobní odběr v Praze zdarma.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `${capitalize(t || "Vlasy")} vlasy luxe kvality${o ? ` ${o}` : ""}${c ? `, ${c}` : ""} \u2014 prémiový výsledek bez kompromisů na vzhledu.`,
        "Pečlivě vybrané a šetrně ošetřené pro maximální přirozenost.",
        l ? `Délka ${l}.` : "",
        "Připravíme clip-in, tape-in nebo keratin do 7 pracovních dnů.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `${o ? `${capitalize(o)} ${t}` : capitalize(t || "Vlasy")} vlasy v luxe kvalitě${c ? `, ${c}` : ""}.`,
        "Zachovaná přirozená struktura, hedvábný omak a zdravý lesk.",
        l ? `Délka ${l}.` : "",
        "Ideální pro klientky, které chtějí nejlepší poměr kvality a ceny. Osobní ukázka po Praze zdarma.",
      ];
      return parts.filter(Boolean).join(" ");
    },
  ],
  STANDARD: [
    (o, t, c, l) => {
      const parts = [
        `Kvalitní ${t} vlasy${o ? ` ${o}` : ""}${c ? ` v odstínu ${c}` : ""} \u2014 spolehlivá volba pro první prodloužení nebo doplnění objemu.`,
        "Ošetřené moderními postupy pro přirozený vzhled.",
        l ? `Délka ${l}.` : "",
        "Zpracujeme na zakázku, doručení do 7 dnů.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `${capitalize(t || "Vlasy")} vlasy${o ? ` ${o}` : ""}${c ? `, ${c}` : ""} v osvědčené kvalitě za dostupnou cenu.`,
        "Přirozený vzhled a spolehlivá trvanlivost.",
        l ? `Délka ${l}.` : "",
        "Zpracování clip-in, tape-in nebo keratin. Osobní odběr v Praze zdarma.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `${o ? `${capitalize(o)} ${t}` : capitalize(t || "Vlasy")} vlasy${c ? ` (${c})` : ""} pro každodenní nošení.`,
        "Moderní zpracování zajišťuje přirozený vzhled a snadnou údržbu.",
        l ? `Délka ${l}.` : "",
        "Skvělá volba pro objem i délku. Do 7 pracovních dnů připravené k vyzvednutí.",
      ];
      return parts.filter(Boolean).join(" ");
    },
  ],
  SALE: [
    (o, t, c, l) => {
      const parts = [
        `${capitalize(t || "Vlasy")}${c ? ` ${c}` : ""} za výprodejovou cenu.`,
        "Pečlivě zastřižené, vyčesané a umyté \u2014 připravené k okamžitému zpracování.",
        l ? `Délka ${l}.` : "",
        "Na výprodejové vlasy neposkytujeme záruku.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `Zvýhodněné ${t} vlasy${c ? `, ${c}` : ""}.`,
        "Ideální příležitost vyzkoušet prodloužení za zlomek běžné ceny.",
        l ? `Délka ${l}.` : "",
        "Omezená dostupnost \u2014 pouze do vyprodání zásob.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `${capitalize(t || "Vlasy")} vlasy${c ? ` ${c}` : ""} v akci.`,
        "Kusy, které nesplnily naše nejvyšší standardy kvality \u2014 stále plně použitelné pro prodloužení.",
        l ? `Délka ${l}.` : "",
        "Bez záruky.",
      ];
      return parts.filter(Boolean).join(" ");
    },
  ],
};

// =========================================================================
// UKRAINIAN TEMPLATES
// =========================================================================

const UK_TEMPLATES: CategoryTemplates = {
  VIRGIN: [
    (o, t, c, l) => {
      const parts = [
        `${o ? `${capitalize(o)} н` : "Н"}атуральне ${t} волосся для нарощування${c ? ` у відтінку ${c}` : ""}.`,
        "Необроблене, від однієї донорки \u2014 рівномірна структура від коренів до кінчиків.",
        l ? `Довжина ${l}, виготовлення на замовлення протягом 7 робочих днів.` : "Виготовлення на замовлення протягом 7 робочих днів.",
        "При правильному догляді тримається рік і довше.",
      ];
      return parts.join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `Преміальне ${t} волосся${o ? ` ${o}` : ""}${c ? `, ${c}` : ""} \u2014 100% натуральне волосся без хімії.`,
        "Кожен хвіст від однієї донорки, тому текстура рівномірна по всій довжині.",
        l ? `Доступна довжина ${l}.` : "",
        "Підходить для фарбування, завивки та вирівнювання. Особистий огляд у Празі безкоштовно.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `100% натуральне ${t} волосся${o ? ` ${o}` : ""}${c ? ` (${c})` : ""} для вибагливих клієнток.`,
        "Ніколи не фарбоване, ніколи не оброблене хімічно. Шовковий блиск і природний рух.",
        l ? `Довжина ${l}.` : "",
        "Виготовимо clip-in, tape-in, кератин або micro ring \u2014 точно за вашим бажанням.",
      ];
      return parts.filter(Boolean).join(" ");
    },
  ],
  LUXE: [
    (o, t, c, l) => {
      const parts = [
        `Люкс ${t} волосся${o ? ` ${o}` : ""}${c ? ` у відтінку ${c}` : ""}.`,
        "Делікатно оброблене, щоб зберегти природну структуру та шовковий блиск. За якістю наближається до натурального волосся за вигіднішою ціною.",
        l ? `Довжина ${l}.` : "",
        "Виготовлення на замовлення, особистий забір у Празі безкоштовно.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `${capitalize(t || "Волосся")} волосся люкс якості${o ? ` ${o}` : ""}${c ? `, ${c}` : ""} \u2014 преміальний результат без компромісів у зовнішньому вигляді.`,
        "Ретельно відібране та делікатно оброблене для максимальної природності.",
        l ? `Довжина ${l}.` : "",
        "Підготуємо clip-in, tape-in або кератин протягом 7 робочих днів.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `${o ? `${capitalize(o)} ${t}` : capitalize(t || "Волосся")} волосся люкс якості${c ? `, ${c}` : ""}.`,
        "Збережена природна структура, шовковий дотик та здоровий блиск.",
        l ? `Довжина ${l}.` : "",
        "Ідеально для клієнток, які хочуть найкраще співвідношення якості та ціни. Особистий огляд у Празі безкоштовно.",
      ];
      return parts.filter(Boolean).join(" ");
    },
  ],
  STANDARD: [
    (o, t, c, l) => {
      const parts = [
        `Якісне ${t} волосся${o ? ` ${o}` : ""}${c ? ` у відтінку ${c}` : ""} \u2014 надійний вибір для першого нарощування або додання об'єму.`,
        "Оброблене сучасними методами для природного вигляду.",
        l ? `Довжина ${l}.` : "",
        "Виготовимо на замовлення, доставка протягом 7 днів.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `${capitalize(t || "Волосся")} волосся${o ? ` ${o}` : ""}${c ? `, ${c}` : ""} перевіреної якості за доступною ціною.`,
        "Природний вигляд та надійна довговічність.",
        l ? `Довжина ${l}.` : "",
        "Виготовлення clip-in, tape-in або кератин. Особистий забір у Празі безкоштовно.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `${o ? `${capitalize(o)} ${t}` : capitalize(t || "Волосся")} волосся${c ? ` (${c})` : ""} для щоденного носіння.`,
        "Сучасна обробка забезпечує природний вигляд та легкий догляд.",
        l ? `Довжина ${l}.` : "",
        "Чудовий вибір для об'єму та довжини. Протягом 7 робочих днів готове до забору.",
      ];
      return parts.filter(Boolean).join(" ");
    },
  ],
  SALE: [
    (o, t, c, l) => {
      const parts = [
        `${capitalize(t || "Волосся")}${c ? ` ${c}` : ""} за розпродажною ціною.`,
        "Ретельно підстрижене, вичесане та вимите \u2014 готове до негайної обробки.",
        l ? `Довжина ${l}.` : "",
        "На розпродажне волосся гарантія не надається.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `Вигідне ${t} волосся${c ? `, ${c}` : ""}.`,
        "Ідеальна можливість спробувати нарощування за частку звичайної ціни.",
        l ? `Довжина ${l}.` : "",
        "Обмежена кількість \u2014 лише до вичерпання запасів.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `${capitalize(t || "Волосся")} волосся${c ? ` ${c}` : ""} в акції.`,
        "Екземпляри, що не відповідали нашим найвищим стандартам якості \u2014 все ще повністю придатні для нарощування.",
        l ? `Довжина ${l}.` : "",
        "Без гарантії.",
      ];
      return parts.filter(Boolean).join(" ");
    },
  ],
};

// =========================================================================
// RUSSIAN TEMPLATES
// =========================================================================

const RU_TEMPLATES: CategoryTemplates = {
  VIRGIN: [
    (o, t, c, l) => {
      const parts = [
        `${o ? `${capitalize(o)} н` : "Н"}атуральные ${t} волосы для наращивания${c ? ` в оттенке ${c}` : ""}.`,
        "Необработанные, от одной донорки \u2014 равномерная структура от корней до кончиков.",
        l ? `Длина ${l}, изготовление на заказ в течение 7 рабочих дней.` : "Изготовление на заказ в течение 7 рабочих дней.",
        "При правильном уходе держатся год и дольше.",
      ];
      return parts.join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `Премиальные ${t} волосы${o ? ` ${o}` : ""}${c ? `, ${c}` : ""} \u2014 100% натуральные волосы без химии.`,
        "Каждый хвост от одной донорки, поэтому текстура равномерная по всей длине.",
        l ? `Доступная длина ${l}.` : "",
        "Подходят для окрашивания, завивки и выпрямления. Личный осмотр в Праге бесплатно.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `100% натуральные ${t} волосы${o ? ` ${o}` : ""}${c ? ` (${c})` : ""} для взыскательных клиенток.`,
        "Никогда не окрашенные, никогда не обработанные химически. Шёлковый блеск и естественное движение.",
        l ? `Длина ${l}.` : "",
        "Изготовим clip-in, tape-in, кератин или micro ring \u2014 точно по вашему желанию.",
      ];
      return parts.filter(Boolean).join(" ");
    },
  ],
  LUXE: [
    (o, t, c, l) => {
      const parts = [
        `Люкс ${t} волосы${o ? ` ${o}` : ""}${c ? ` в оттенке ${c}` : ""}.`,
        "Бережно обработанные, чтобы сохранить естественную структуру и шёлковый блеск. По качеству приближаются к натуральным волосам по более выгодной цене.",
        l ? `Длина ${l}.` : "",
        "Изготовление на заказ, самовывоз в Праге бесплатно.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `${capitalize(t || "Волосы")} волосы люкс качества${o ? ` ${o}` : ""}${c ? `, ${c}` : ""} \u2014 премиальный результат без компромиссов во внешнем виде.`,
        "Тщательно отобранные и бережно обработанные для максимальной естественности.",
        l ? `Длина ${l}.` : "",
        "Подготовим clip-in, tape-in или кератин в течение 7 рабочих дней.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `${o ? `${capitalize(o)} ${t}` : capitalize(t || "Волосы")} волосы люкс качества${c ? `, ${c}` : ""}.`,
        "Сохранённая естественная структура, шёлковое прикосновение и здоровый блеск.",
        l ? `Длина ${l}.` : "",
        "Идеально для клиенток, которые хотят лучшее соотношение качества и цены. Личный осмотр в Праге бесплатно.",
      ];
      return parts.filter(Boolean).join(" ");
    },
  ],
  STANDARD: [
    (o, t, c, l) => {
      const parts = [
        `Качественные ${t} волосы${o ? ` ${o}` : ""}${c ? ` в оттенке ${c}` : ""} \u2014 надёжный выбор для первого наращивания или добавления объёма.`,
        "Обработанные современными методами для естественного вида.",
        l ? `Длина ${l}.` : "",
        "Изготовим на заказ, доставка в течение 7 дней.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `${capitalize(t || "Волосы")} волосы${o ? ` ${o}` : ""}${c ? `, ${c}` : ""} проверенного качества по доступной цене.`,
        "Естественный вид и надёжная долговечность.",
        l ? `Длина ${l}.` : "",
        "Изготовление clip-in, tape-in или кератин. Самовывоз в Праге бесплатно.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `${o ? `${capitalize(o)} ${t}` : capitalize(t || "Волосы")} волосы${c ? ` (${c})` : ""} для ежедневной носки.`,
        "Современная обработка обеспечивает естественный вид и лёгкий уход.",
        l ? `Длина ${l}.` : "",
        "Отличный выбор для объёма и длины. В течение 7 рабочих дней готовы к забору.",
      ];
      return parts.filter(Boolean).join(" ");
    },
  ],
  SALE: [
    (o, t, c, l) => {
      const parts = [
        `${capitalize(t || "Волосы")}${c ? ` ${c}` : ""} по распродажной цене.`,
        "Аккуратно подстриженные, вычесанные и вымытые \u2014 готовы к немедленной обработке.",
        l ? `Длина ${l}.` : "",
        "На распродажные волосы гарантия не предоставляется.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `Выгодные ${t} волосы${c ? `, ${c}` : ""}.`,
        "Идеальная возможность попробовать наращивание за долю обычной цены.",
        l ? `Длина ${l}.` : "",
        "Ограниченное количество \u2014 только до исчерпания запасов.",
      ];
      return parts.filter(Boolean).join(" ");
    },
    (o, t, c, l) => {
      const parts = [
        `${capitalize(t || "Волосы")} волосы${c ? ` ${c}` : ""} по акции.`,
        "Экземпляры, не соответствовавшие нашим высшим стандартам качества \u2014 по-прежнему полностью пригодны для наращивания.",
        l ? `Длина ${l}.` : "",
        "Без гарантии.",
      ];
      return parts.filter(Boolean).join(" ");
    },
  ],
};

const TEMPLATES: Record<Locale, CategoryTemplates> = {
  cs: CS_TEMPLATES,
  uk: UK_TEMPLATES,
  ru: RU_TEMPLATES,
};

function buildGenericBio(name: string, origin: string, texture: string, color: string, lengthStr: string, locale: Locale): string {
  const labels = {
    cs: { origin: "Původ", texture: "Textura", shade: "Odstín", length: "Délka" },
    uk: { origin: "Походження", texture: "Текстура", shade: "Відтінок", length: "Довжина" },
    ru: { origin: "Происхождение", texture: "Текстура", shade: "Оттенок", length: "Длина" },
  };
  const l = labels[locale];
  const parts: string[] = [name + "."];
  if (origin) parts.push(`${l.origin} ${origin}.`);
  if (texture) parts.push(`${l.texture}: ${texture}.`);
  if (color) parts.push(`${l.shade}: ${color}.`);
  if (lengthStr) parts.push(`${l.length} ${lengthStr}.`);
  return parts.join(" ");
}
