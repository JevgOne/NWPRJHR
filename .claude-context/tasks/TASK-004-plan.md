# TASK-004: Hair Texture + Color Tones System

## Implementation Plan

**Date:** 2026-06-27 (v4 — FINAL — colorTone naming, dynamické combo-boxy, STRING ne enum)
**Status:** Ready for implementation

---

## Overview

Přidat dvě nové vlastnosti produktu do celého systému:

1. **texture** (`String?` na Product) — struktura vlasu (rovné, mírně vlnité, vlnité, kudrnaté)
2. **colorTone** (`String?` na Product) — tón barvy (blond, hnědá, tmavě hnědá, zrzavá)

### KRITICKÁ PRAVIDLA

- **Obě pole jsou STRING, NE enum.** Žádný Prisma enum. Žádný `z.enum()`.
- **Admin formulář: COMBO-BOX** (autocomplete text input + dropdown), NE `<select>`.
- **Výchozí options hardcoded** v kódu (TEXTURE_OPTIONS, COLOR_TONE_OPTIONS) — analogie k ORIGIN_OPTIONS.
- **Dynamické DISTINCT hodnoty** z DB se načítají přes API a mergují s hardcoded defaults.
- **Admin může zadat vlastní hodnotu** — uloží se na produkt, příště se nabídne v dropdownu.

**Vztah k existujícímu systému barev:**
- `Variant.color` (string kódy 1-10 z `hair-colors.ts`) = konkrétní odstín per varianta — **beze změny**
- `Product.colorTone` (String) = hrubá kategorie barvy pro filtrování — **NOVÉ**

**Business kontext:** Hairland prodává SUROVÉ vlasy. `processingType` zůstává ale je sekundární. Textura a tón jsou primární klasifikátory.

### Výchozí hodnoty (hardcoded defaults)

**Textury:**
| Hodnota | CS | UK | RU |
|---|---|---|---|
| Rovné | Rovné | Рівне | Прямые |
| Mírně vlnité | Mírně vlnité | Злегка хвилясте | Слегка волнистые |
| Vlnité | Vlnité | Хвилясте | Волнистые |
| Kudrnaté | Kudrnaté | Кучеряве | Кудрявые |

**Tóny:**
| Hodnota | CS | UK | RU |
|---|---|---|---|
| Blond | Blond | Блонд | Блонд |
| Hnědá | Hnědá | Каштанове | Каштановые |
| Tmavě hnědá | Tmavě hnědá | Темно-каштанове | Тёмно-каштановые |
| Zrzavá | Zrzavá | Руде | Рыжие |

**POZOR:** Hodnoty v DB se ukládají česky (CZ). Překlady do UK/RU se řeší přes i18n lookup — viz Phase 2.

---

## Phase 1: Schema & Database

### Step 1.1: Prisma schema — STRING pole, NE enum

**File:** `prisma/schema.prisma`

Přidat na Product model (žádné nové enumy!):
```prisma
model Product {
  // ... existing fields after origin ...
  texture    String?
  colorTone  String?
  // ... photos, archived, slug, etc ...
}
```

**POZOR:** Pokud implementátor již přidal `tone` místo `colorTone`, přejmenovat na `colorTone`.

### Step 1.2: Turso DB migrace

**CRITICAL:** `prisma db push` nefunguje s libsql://. Ruční ALTER TABLE:

```sql
ALTER TABLE products ADD COLUMN texture TEXT;
ALTER TABLE products ADD COLUMN colorTone TEXT;
```

Pokud `tone` již existuje:
```sql
ALTER TABLE products RENAME COLUMN tone TO colorTone;
```

Spustit přes Turso CLI: `turso db shell hairora-db`

### Step 1.3: Validace — z.string(), NE z.enum()

**File:** `src/lib/validations/product.ts`

```ts
export const createProductSchema = z.object({
  // ... existing ...
  texture: z.string().max(200).optional(),
  colorTone: z.string().max(200).optional(),
});
```

**NIKDY `z.enum()`!** Validace je jen string s max délkou.

---

## Phase 2: Helper knihovny

### Step 2.1: hair-textures.ts (NOVÝ)

**File:** `src/lib/hair-textures.ts`

**Vzor: analogie k `origin-flags.ts` (ORIGIN_OPTIONS + getOriginFlag)**

```ts
export interface TextureOption {
  name: string;      // CZ name, ukládá se do DB
  icon: string;      // pro zobrazení v dropdownu a na kartách
  nameKey: string;   // i18n key pro překlad
}

// Hardcoded defaults — vždy v dropdownu, analogie k ORIGIN_OPTIONS
export const TEXTURE_OPTIONS: TextureOption[] = [
  { name: "Rovné",         icon: "—",  nameKey: "straight" },
  { name: "Mírně vlnité",  icon: "~",  nameKey: "slightlyWavy" },
  { name: "Vlnité",        icon: "〰", nameKey: "wavy" },
  { name: "Kudrnaté",      icon: "∿",  nameKey: "curly" },
];

// Lookup: najdi option podle name, nebo vrať fallback pro custom hodnotu
export function getTextureInfo(name: string | null | undefined): TextureOption {
  if (!name) return { name: "", icon: "?", nameKey: "unknown" };
  return TEXTURE_OPTIONS.find(t => t.name === name)
    ?? { name, icon: "?", nameKey: "custom" };
}
```

### Step 2.2: color-tones.ts (NOVÝ)

**File:** `src/lib/color-tones.ts`

**Vzor: analogie k `origin-flags.ts` (ORIGIN_OPTIONS + getOriginFlag)**

```ts
export interface ColorToneOption {
  name: string;      // CZ name, ukládá se do DB
  hex: string;       // barva swatche v dropdownu a na kartách
  nameKey: string;   // i18n key pro překlad
}

// Hardcoded defaults — vždy v dropdownu, analogie k ORIGIN_OPTIONS
export const COLOR_TONE_OPTIONS: ColorToneOption[] = [
  { name: "Blond",         hex: "#E8D5A8", nameKey: "blond" },
  { name: "Hnědá",         hex: "#7A5230", nameKey: "brown" },
  { name: "Tmavě hnědá",   hex: "#3E2512", nameKey: "darkBrown" },
  { name: "Zrzavá",        hex: "#B5451B", nameKey: "red" },
];

// Lookup: najdi option podle name, nebo vrať fallback pro custom hodnotu
export function getColorToneInfo(name: string | null | undefined): ColorToneOption {
  if (!name) return { name: "", hex: "#9CA3AF", nameKey: "unknown" };
  return COLOR_TONE_OPTIONS.find(t => t.name === name)
    ?? { name, hex: "#9CA3AF", nameKey: "custom" };
}
```

---

## Phase 3: API

### Step 3.1: Product serializer

**File:** `src/lib/api/product-serializer.ts`

Přidat `texture` a `colorTone` do `base` objektu v `serializeProductForRole()`:
```ts
const base = {
  // ... existing ...
  texture: product.texture,
  colorTone: product.colorTone,
};
```

### Step 3.2: Public products API

**File:** `src/app/api/public/products/route.ts`

Přidat do select + filtrování:
```ts
select: {
  // ... existing ...
  texture: true,
  colorTone: true,
}

// Filtrování
const texture = sp.get("texture");
const colorTone = sp.get("colorTone");
if (texture) where.texture = texture;
if (colorTone) where.colorTone = colorTone;
```

### Step 3.3: Nový API endpoint pro DISTINCT hodnoty (pro combo-box)

**File:** `src/app/api/products/options/route.ts` (NOVÝ)

Vrací unikátní hodnoty texture a colorTone z existujících produktů v DB.
Combo-box v admin formuláři volá tento endpoint při mountu a merguje výsledky s hardcoded defaults.

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [textures, colorTones] = await Promise.all([
    prisma.product.findMany({
      where: { texture: { not: null }, archived: false },
      select: { texture: true },
      distinct: ["texture"],
    }),
    prisma.product.findMany({
      where: { colorTone: { not: null }, archived: false },
      select: { colorTone: true },
      distinct: ["colorTone"],
    }),
  ]);
  return NextResponse.json({
    textures: textures.map(p => p.texture).filter(Boolean),
    colorTones: colorTones.map(p => p.colorTone).filter(Boolean),
  });
}
```

---

## Phase 4: Public Frontend

### Step 4.1: ProductsShowcase — zobrazení + filtrování

**File:** `src/app/(public)/offer/ProductsShowcase.tsx`

Interface: přidat `texture: string | null; colorTone: string | null;`

Filtrování: přidat `activeTexture` a `activeColorTone` z URL params + filter panely:
- Textura: řada 4 tlačítek s ikonami (z TEXTURE_OPTIONS)
- Tón: řada 4 color swatchů (z COLOR_TONE_OPTIONS)

Product card: přidat texture badge pod category/origin:
```tsx
{p.texture && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700">
    {getTextureInfo(p.texture).icon} {p.texture}
  </span>
)}
{p.colorTone && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
        style={{ backgroundColor: getColorToneInfo(p.colorTone).hex + "20", color: getColorToneInfo(p.colorTone).hex }}>
    {p.colorTone}
  </span>
)}
```

### Step 4.2: Product detail — specs + SEO

**File:** `src/app/(public)/offer/[id]/page.tsx`

Přidat texture a colorTone do:
- `getProduct()` select
- Specs grid (ikona + label)
- `generateMetadata()` — texture v title, colorTone v description

### Step 4.3: HeroProductSlider

**File:** `src/components/public/HeroProductSlider.tsx`

Interface: přidat `texture: string | null;`
ProductCard: přidat texture badge

---

## Phase 5: Admin Frontend

### Step 5.1: CreateProductForm — COMBO-BOX (NE select!)

**File:** `src/app/(app)/products/new/CreateProductForm.tsx`

**KRITICKÉ: Použít PŘESNĚ STEJNÝ pattern jako origin (řádky 134-171 v CreateProductForm.tsx):**

Pattern z origin:
- `useState` pro hodnotu (`origin` / `texture` / `colorTone`)
- `useState` pro dropdown open/close (`originOpen` / `textureOpen` / `colorToneOpen`)
- `useRef` pro click-outside handling (`originRef` / `textureRef` / `colorToneRef`)
- `filteredX` computed z hardcoded options + dynamicky načtených DISTINCT hodnot
- Text `<input>` s `onChange` + `onFocus`
- `<ul>` dropdown s `onMouseDown` pro výběr

**Postup:**

1. State:
```ts
const [texture, setTexture] = useState("");
const [textureOpen, setTextureOpen] = useState(false);
const textureRef = useRef<HTMLDivElement>(null);

const [colorTone, setColorTone] = useState("");
const [colorToneOpen, setColorToneOpen] = useState(false);
const colorToneRef = useRef<HTMLDivElement>(null);
```

2. Fetch DISTINCT hodnoty z `/api/products/options` při mountu:
```ts
const [dbTextures, setDbTextures] = useState<string[]>([]);
const [dbColorTones, setDbColorTones] = useState<string[]>([]);

useEffect(() => {
  fetch("/api/products/options")
    .then(r => r.json())
    .then(data => {
      setDbTextures(data.textures ?? []);
      setDbColorTones(data.colorTones ?? []);
    });
}, []);
```

3. Merge hardcoded + DB values, deduplicate, filter:
```ts
const allTextures = useMemo(() => {
  const names = new Set(TEXTURE_OPTIONS.map(t => t.name));
  const extras = dbTextures.filter(t => !names.has(t)).map(t => getTextureInfo(t));
  return [...TEXTURE_OPTIONS, ...extras];
}, [dbTextures]);

const filteredTextures = allTextures.filter(t =>
  t.name.toLowerCase().includes(texture.toLowerCase())
);
```

4. Combo-box JSX (PŘESNÁ KOPIE origin patternu):
```tsx
<div ref={textureRef} className="relative">
  <label htmlFor="texture" className="block text-sm font-medium text-gray-700 mb-1">
    {t("product.texture")}
  </label>
  <input
    id="texture"
    type="text"
    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
    value={texture}
    onChange={(e) => { setTexture(e.target.value); setTextureOpen(true); }}
    onFocus={() => setTextureOpen(true)}
    placeholder={t("product.texturePlaceholder")}
    autoComplete="off"
  />
  {textureOpen && filteredTextures.length > 0 && (
    <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
      {filteredTextures.map((opt) => (
        <li key={opt.name}>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-indigo-50 text-left"
            onMouseDown={(e) => {
              e.preventDefault();
              setTexture(opt.name);
              setTextureOpen(false);
            }}
          >
            <span>{opt.icon}</span>
            <span>{opt.name}</span>
          </button>
        </li>
      ))}
    </ul>
  )}
</div>
```

5. Stejný pattern pro colorTone (s hex color swatch místo textové ikony):
```tsx
<div ref={colorToneRef} className="relative">
  <label htmlFor="colorTone" className="block text-sm font-medium text-gray-700 mb-1">
    {t("product.colorTone")}
  </label>
  <input
    id="colorTone"
    type="text"
    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
    value={colorTone}
    onChange={(e) => { setColorTone(e.target.value); setColorToneOpen(true); }}
    onFocus={() => setColorToneOpen(true)}
    placeholder={t("product.colorTonePlaceholder")}
    autoComplete="off"
  />
  {colorToneOpen && filteredColorTones.length > 0 && (
    <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
      {filteredColorTones.map((opt) => (
        <li key={opt.name}>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-indigo-50 text-left"
            onMouseDown={(e) => {
              e.preventDefault();
              setColorTone(opt.name);
              setColorToneOpen(false);
            }}
          >
            <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: opt.hex }} />
            <span>{opt.name}</span>
          </button>
        </li>
      ))}
    </ul>
  )}
</div>
```

6. Click-outside handling — přidat do existujícího useEffect:
```ts
useEffect(() => {
  function handleClick(e: MouseEvent) {
    // ... existing origin click-outside ...
    if (textureRef.current && !textureRef.current.contains(e.target as Node)) setTextureOpen(false);
    if (colorToneRef.current && !colorToneRef.current.contains(e.target as Node)) setColorToneOpen(false);
  }
  document.addEventListener("mousedown", handleClick);
  return () => document.removeEventListener("mousedown", handleClick);
}, []);
```

7. Submit — přidat texture a colorTone do FormData / request body.

### Step 5.2: ProductDetailClient — zobrazit

**File:** `src/app/(app)/products/[id]/ProductDetailClient.tsx`

Interface + zobrazení badge vedle category a processingType.

### Step 5.3: ProductListClient — zobrazit

**File:** `src/app/(app)/products/ProductListClient.tsx`

Interface + badge pod processingType.

### Step 5.4: StockInForm — info při výběru produktu

**File:** `src/components/inventory/StockInForm.tsx`

Rozšířit ProductOption interface o `texture?: string | null; colorTone?: string | null;`
Při výběru produktu zobrazit texture + colorTone jako info text.

---

## Phase 6: Translations

**Files:** `messages/cs.json`, `messages/uk.json`, `messages/ru.json`

```json
// cs.json — přidat do root levelu
"texture": {
  "straight": "Rovné",
  "slightlyWavy": "Mírně vlnité",
  "wavy": "Vlnité",
  "curly": "Kudrnaté",
  "unknown": "Nespecifikováno",
  "custom": "Vlastní"
},
"colorTone": {
  "blond": "Blond",
  "brown": "Hnědá",
  "darkBrown": "Tmavě hnědá",
  "red": "Zrzavá",
  "unknown": "Nespecifikováno",
  "custom": "Vlastní"
}
```

```json
// cs.json — přidat do "product" sekce
"texture": "Struktura vlasu",
"texturePlaceholder": "Vyberte nebo zadejte strukturu...",
"colorTone": "Tón barvy",
"colorTonePlaceholder": "Vyberte nebo zadejte tón..."
```

**UK překlady:**
```json
"texture": {
  "straight": "Рівне",
  "slightlyWavy": "Злегка хвилясте",
  "wavy": "Хвилясте",
  "curly": "Кучеряве",
  "unknown": "Не вказано",
  "custom": "Власне"
},
"colorTone": {
  "blond": "Блонд",
  "brown": "Каштанове",
  "darkBrown": "Темно-каштанове",
  "red": "Руде",
  "unknown": "Не вказано",
  "custom": "Власне"
}
```

**RU překlady:**
```json
"texture": {
  "straight": "Прямые",
  "slightlyWavy": "Слегка волнистые",
  "wavy": "Волнистые",
  "curly": "Кудрявые",
  "unknown": "Не указано",
  "custom": "Своё"
},
"colorTone": {
  "blond": "Блонд",
  "brown": "Каштановые",
  "darkBrown": "Тёмно-каштановые",
  "red": "Рыжие",
  "unknown": "Не указано",
  "custom": "Своё"
}
```

---

## Pořadí implementace

```
Phase 1 (Schema + DB) — PRVNÍ
  ↓
Phase 2 (Helpers) + Phase 3 (API) + Phase 6 (Překlady) — PARALELNĚ
  ↓
Phase 4 (Public frontend) + Phase 5 (Admin frontend) — PARALELNĚ
```

## Soubory

### Nové (3)
| Soubor | Účel |
|--------|------|
| `src/lib/hair-textures.ts` | TEXTURE_OPTIONS (hardcoded defaults) + getTextureInfo() lookup |
| `src/lib/color-tones.ts` | COLOR_TONE_OPTIONS (hardcoded defaults) + getColorToneInfo() lookup |
| `src/app/api/products/options/route.ts` | DISTINCT texture/colorTone z DB pro combo-box merge |

### Modifikované (14)
| Soubor | Změny |
|--------|-------|
| `prisma/schema.prisma` | `texture String?` + `colorTone String?` na Product (NE enum) |
| `src/lib/validations/product.ts` | `texture: z.string().max(200).optional()` + `colorTone: z.string().max(200).optional()` (NE z.enum) |
| `src/lib/api/product-serializer.ts` | Přidat texture + colorTone do base |
| `src/app/api/public/products/route.ts` | Select + filtrování |
| `src/app/api/products/route.ts` | Filtrování |
| `src/app/(public)/offer/ProductsShowcase.tsx` | Zobrazení + filtr panely |
| `src/app/(public)/offer/[id]/page.tsx` | Specs + SEO metadata |
| `src/components/public/HeroProductSlider.tsx` | Texture badge |
| `src/app/(app)/products/new/CreateProductForm.tsx` | COMBO-BOX pro texture + colorTone (pattern jako origin!) |
| `src/app/(app)/products/[id]/ProductDetailClient.tsx` | Zobrazení |
| `src/app/(app)/products/ProductListClient.tsx` | Zobrazení |
| `src/components/inventory/StockInForm.tsx` | Info při výběru produktu |
| `messages/cs.json` | Překlady texture + colorTone |
| `messages/uk.json` | Překlady texture + colorTone |
| `messages/ru.json` | Překlady texture + colorTone |

---

## POZNÁMKA K IMPLEMENTACI

Implementátor již mohl přidat pole `tone` místo `colorTone`. Pokud ano:
1. Přejmenovat v Prisma schema: `tone` → `colorTone`
2. Přejmenovat v DB: `ALTER TABLE products RENAME COLUMN tone TO colorTone;`
3. Přejmenovat v kódu: všechny reference `tone` → `colorTone`
4. Helper soubor: `hair-tones.ts` → `color-tones.ts`, `TONE_OPTIONS` → `COLOR_TONE_OPTIONS`, `getToneInfo` → `getColorToneInfo`
