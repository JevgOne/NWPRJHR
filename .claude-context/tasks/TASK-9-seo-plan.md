# TASK-9: SEO — Lepší auto-generované meta popisy produktů

## Požadavek
Auto-generované meta descriptions produktů jsou nekvalitní — čtou se jako výčet klíčových slov, ne jako přesvědčivý popis. Přepracovat šablonu pro lepší kvalitu.

## Analýza

### Aktuální stav

**Soubor:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx`, řádky 304-334

#### Aktuální meta title generátor (řádky 310-325):
```
Pattern: "{name} {processingType} {lengths}" | Hairland
Příklad: "Luxe Vlasy — Rovné Clip-in 55cm | Hairland"
```
- Limit 60 znaků (49 + " | Hairland")
- Barvy přidány jen pokud <= 2 a vejdou se do limitu
- Fallback na `product.metaTitle` pokud je vyplněno ručně

#### Aktuální meta description generátor (řádky 327-334):
```typescript
const descParts: string[] = [product.name];
if (product.origin) descParts.push(`${t("landing.metaOrigin")} ${product.origin}`);
if (colorNames.length > 0) descParts.push(colorNames.length <= 4 ? colorNames.join(", ") : `${colorNames.length} ${t("landing.metaColors")}`);
if (product.texture) descParts.push(product.texture.toLowerCase());
if (lengthStr) descParts.push(lengthStr);
descParts.push(t("landing.metaSuffix"));
const autoDescription = descParts.join(". ").slice(0, 155);
```

#### Příklad aktuálního výstupu:
```
Title: "Luxe Vlasy — Rovné Clip-in 55cm | Hairland"
Description: "Luxe Vlasy — Rovné. původ Ukrajina. Platinová blond, Světlá blond. rovné. 55cm, 60cm. Osobní odběr Praha zdarma, zpracování na zakázku."
```

### Problémy

1. **Description je výčet fragmentů oddělených tečkami** — nečte se jako věta, spíš jako CSV
2. **Redundance v description** — `product.name` už obsahuje texturu ("Rovné"), ale textura se přidá znovu (`rovné`)
3. **"původ Ukrajina"** — divná formulace, mělo by být "z Ukrajiny" nebo "slovanské vlasy z Ukrajiny"
4. **Chybí USP/CTA** — žádná výhoda, žádná výzva k akci
5. **Chybí cena** — ani rozsah, přitom cena v description zvyšuje CTR o ~15%
6. **Suffix je statický** — "Osobní odběr Praha zdarma, zpracování na zakázku" nereflektuje produkt
7. **Title je v pořádku** — stručný, obsahuje klíčová slova, vejde se do limitu

### Existující SEO audit (TASK-094)
V `.claude-context/tasks/TASK-094-seo-product-audit.md` existuje detailní audit, který potvrzuje stejné problémy. Skóre meta description: 7/10.

### Dostupná data pro generování

Z `productSelect` (řádky 92-127):
- `name` / `nameUk` / `nameRu` — název produktu
- `category` — VIRGIN / LUXE / STANDARD / SALE
- `processingType` — CLIP_IN / TAPE_IN / KERATIN / WEFT / MICRO_RING / OTHER
- `origin` — země původu (Ukrajina, Indie, ...)
- `texture` — textura (Rovné, Vlnité, ...)
- `colorTone` — tón barvy
- `variants[].color` — kódy barev 1-10
- `variants[].lengthCm` — délky
- `variants[].retailPricePerGram` — cena/gram
- `variants[].retailPricePerPiece` — cena/kus
- `variants[].sellingMode` — BY_GRAM / BY_PIECE

## Plán implementace

### Krok 1: Nová šablona meta description

**Soubor:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx`, řádky 327-334

**Nahradit** stávající description generátor za template-based přístup s přirozeným jazykem:

```typescript
// --- NEW: Template-based meta description ---
function buildAutoDescription(
  product: { name: string; category: string; processingType: string; origin?: string | null; texture?: string | null },
  colorNames: string[],
  lengths: number[],
  variants: Array<{ retailPricePerGram: number; sellingMode: string; retailPricePerPiece?: number | null }>,
  t: Awaited<ReturnType<typeof getTranslations<"public">>>,
): string {
  const parts: string[] = [];

  // 1. Opening: "100% přírodní {category} vlasy {processing} z {origin}" 
  const catLabel = t(`meta.catLabel.${product.category}`) || product.name;
  const procLabel = product.processingType !== "OTHER" ? t(`meta.procLabel.${product.processingType}`) : "";
  const originStr = product.origin ? t("meta.fromOrigin", { origin: product.origin }) : "";
  
  parts.push([catLabel, procLabel, originStr].filter(Boolean).join(" "));

  // 2. Specs: "{texture}, {délky}, {barvy}"
  const specs: string[] = [];
  if (product.texture) specs.push(product.texture.toLowerCase());
  if (lengths.length > 0) {
    specs.push(lengths.length <= 3 
      ? lengths.map(l => `${l} cm`).join(", ")
      : `${lengths[0]}–${lengths[lengths.length - 1]} cm`
    );
  }
  if (colorNames.length > 0) {
    specs.push(colorNames.length <= 3 
      ? colorNames.join(", ") 
      : `${colorNames.length} ${t("landing.metaColors")}`
    );
  }
  if (specs.length > 0) parts.push(specs.join(", "));

  // 3. Price indicator
  const prices = variants
    .filter(v => v.retailPricePerGram > 0 || (v.retailPricePerPiece ?? 0) > 0)
    .map(v => v.sellingMode === "BY_PIECE" 
      ? (v.retailPricePerPiece ?? 0) 
      : v.retailPricePerGram * 100  // per 100g
    )
    .filter(p => p > 0);
  
  if (prices.length > 0) {
    const minPrice = Math.min(...prices);
    parts.push(t("meta.priceFrom", { price: Math.round(minPrice / 100) }));
  }

  // 4. CTA suffix
  parts.push(t("meta.ctaSuffix"));

  return parts.join(". ").slice(0, 155);
}
```

**V `generateProductMetadataFromProduct`** (řádky 327-334) nahradit:
```typescript
// OLD:
const descParts: string[] = [product.name];
if (product.origin) descParts.push(`${t("landing.metaOrigin")} ${product.origin}`);
// ... atd

// NEW:
const autoDescription = buildAutoDescription(product, colorNames, lengths, product.variants, t);
const description = product.metaDescription || autoDescription;
```

### Krok 2: Nové překladové klíče

**Soubor:** `messages/cs.json` — přidat do sekce `"public"` nový blok `"meta"`:

```json
"meta": {
  "catLabel": {
    "VIRGIN": "100% panenské RAW vlasy",
    "LUXE": "Prémiové luxe vlasy",
    "STANDARD": "Kvalitní vlasy k prodloužení",
    "SALE": "Vlasy za akční cenu",
    "ACCESSORY": "Příslušenství pro vlasy"
  },
  "procLabel": {
    "CLIP_IN": "clip-in",
    "TAPE_IN": "tape-in",
    "KERATIN": "s keratinem",
    "WEFT": "tresové",
    "MICRO_RING": "micro ring"
  },
  "fromOrigin": "z {origin}",
  "priceFrom": "od {price} Kč",
  "ctaSuffix": "Doručení do 7 dnů, osobní odběr Praha zdarma"
}
```

**`messages/uk.json`:**
```json
"meta": {
  "catLabel": {
    "VIRGIN": "100% натуральне RAW волосся",
    "LUXE": "Преміальне люкс волосся",
    "STANDARD": "Якісне волосся для нарощування",
    "SALE": "Волосся за акційною ціною",
    "ACCESSORY": "Аксесуари для волосся"
  },
  "procLabel": {
    "CLIP_IN": "clip-in",
    "TAPE_IN": "tape-in",
    "KERATIN": "з кератином",
    "WEFT": "тресове",
    "MICRO_RING": "micro ring"
  },
  "fromOrigin": "з {origin}",
  "priceFrom": "від {price} Kč",
  "ctaSuffix": "Доставка до 7 днів, самовивіз Прага безкоштовно"
}
```

**`messages/ru.json`:**
```json
"meta": {
  "catLabel": {
    "VIRGIN": "100% натуральные RAW волосы",
    "LUXE": "Премиальные люкс волосы",
    "STANDARD": "Качественные волосы для наращивания",
    "SALE": "Волосы по акционной цене",
    "ACCESSORY": "Аксессуары для волос"
  },
  "procLabel": {
    "CLIP_IN": "clip-in",
    "TAPE_IN": "tape-in",
    "KERATIN": "с кератином",
    "WEFT": "трессовые",
    "MICRO_RING": "micro ring"
  },
  "fromOrigin": "из {origin}",
  "priceFrom": "от {price} Kč",
  "ctaSuffix": "Доставка до 7 дней, самовывоз Прага бесплатно"
}
```

### Krok 3: Příklady výsledků (PŘED → PO)

#### Produkt: VIRGIN Clip-in, Rovné, Ukrajina, barvy 1-3, délky 50cm, 55cm

**PŘED:**
```
Title: "Panenské Vlasy — Rovné Clip-in 50cm, 55cm | Hairland"
Desc: "Panenské Vlasy — Rovné. původ Ukrajina. Platinová blond, Světlá blond, Zlatá blond. rovné. 50cm, 55cm. Osobní odběr Praha zdarma, zpracování na zakázku."
```

**PO:**
```
Title: "Panenské Vlasy — Rovné Clip-in 50cm, 55cm | Hairland"  (beze změny)
Desc: "100% panenské RAW vlasy clip-in z Ukrajiny. rovné, 50, 55 cm, Platinová blond, Světlá blond, Zlatá blond. od 890 Kč. Doručení do 7 dnů, osobní odběr Praha zdarma"
```

#### Produkt: LUXE, OTHER (surové), Uzbekistán, 4 barvy, délky 40-65cm

**PŘED:**
```
Desc: "Luxe Vlasy — Rovné. původ Uzbekistán. 4 barev. rovné. 40cm, 45cm, 50cm, 55cm, 60cm, 65cm. Osobní odběr Praha zdarma, zpracování na zakázku."
```

**PO:**
```
Desc: "Prémiové luxe vlasy z Uzbekistánu. rovné, 40–65 cm, 4 barev. od 650 Kč. Doručení do 7 dnů, osobní odběr Praha zdarma"
```

### Krok 4: Také opravit JSON-LD schema description (řádky 622-630)

Stejný problém existuje v JSON-LD schema description generátoru (řádky 622-630). Použít stejnou funkci `buildAutoDescription` i tam:

```typescript
// Line 622-630 — replace descParts logic with:
const schemaDesc = description
  ? description.replace(/\n+/g, " ").slice(0, 160).replace(/\s\S*$/, "…")
  : buildAutoDescription(product, colorNames, lengths, product.variants, t).slice(0, 160);
```

**Poznámka:** Proměnná `colorNames` v kontextu JSON-LD sekce neexistuje — je třeba ji buď předat z renderovací funkce, nebo duplikovat logiku. Doporučuji extrahovat `colorNames` do sdílené utility.

### Krok 5 (volitelné, nízká priorita): Title improvement

Title je v pořádku, ale audit TASK-094 doporučuje:
- Přidat origin do title pokud se vejde (např. "Panenské Vlasy Clip-in Ukrajina 55cm | Hairland")
- Neměnit pokud se nevejde do 60 znaků

Toto je volitelné a má nižší prioritu.

## Soubory k editaci

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `src/app/[locale]/(public)/offer/[...slug]/page.tsx` | Nový `buildAutoDescription()`, nahradit řádky 327-334 + řádky 622-630 |
| 2 | `messages/cs.json` | Nový blok `"meta"` v sekci `"public"` (~8 klíčů) |
| 3 | `messages/uk.json` | Ekvivalent `"meta"` bloku |
| 4 | `messages/ru.json` | Ekvivalent `"meta"` bloku |

## Co se NEMĚNÍ

- **Meta title** — aktuální generátor je kvalitní (stručný, s klíčovými slovy, vejde se do limitu)
- **`product.metaTitle`/`product.metaDescription`** — manuální override stále funguje jako fallback
- **OG tags** — mimo scope tohoto tasku (řešeno v TASK-094)
- **JSON-LD schema** — mimo scope kromě description textu
- **Offer listing page** (`/offer`) — její metadata jsou v pořádku (statický text z překladů)

## Priorita
Střední — zlepšení SEO, ne bug.
