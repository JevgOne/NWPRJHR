# TASK-004: Struktura vlasů + tóny barev — Implementační plán

**Date:** 2026-06-28
**Status:** Ready for implementation

---

## Stav analýzy

### Co je HOTOVO (texture):
- `texture String?` v Prisma schema (line 134 schema.prisma)
- `src/lib/hair-textures.ts` — TEXTURE_OPTIONS (4 defaults) + getTextureInfo()
- `src/components/TextureSwatch.tsx` — SVG vizuální swatch
- `src/lib/validations/product.ts` — `texture: z.string().max(200).nullable().optional()`
- `src/lib/api/product-serializer.ts` — texture v base objektu
- `src/app/api/products/options/route.ts` — DISTINCT texture z DB
- `src/app/api/public/products/route.ts` — texture v select + filtrování
- `src/app/api/products/route.ts` — texture filtrování
- CreateProductForm — combo-box pro texture (origin pattern)
- ProductDetailClient — zobrazení + editace texture (dropdown)
- ProductListClient — texture badge
- ProductsShowcase — filter panel + badge na kartách
- HeroProductSlider — texture badge
- Product detail page — specs grid + SEO metadata
- StockInForm — texture info
- i18n messages (cs/uk/ru) — texture překlady

### Co CHYBÍ (colorTone):
- **Žádný `colorTone` nebo `tone` v celém kódu.** Neexistuje v schema, v kódu, v i18n.
- Žádný soubor `color-tones.ts` ani `hair-tones.ts`.
- Celá colorTone feature se musí implementovat od nuly.

### Vztah k existujícímu systému barev:
- `Variant.color` (string kódy "1"-"10" z `hair-colors.ts`) = konkrétní odstín per varianta (1=Platinová, 10=Černá) — **beze změny**
- `Product.colorTone` (String?) = hrubá kategorie barvy celého produktu pro filtrování — **NOVÉ**
- Příklad: produkt má `colorTone: "Blond"` a jeho varianty mají `color: "1", "2", "3"` (platinová, světlá blond, zlatá blond)

---

## Implementační kroky

### Phase 1: Schema + Database

#### Step 1.1: Prisma schema — přidat colorTone

**File:** `prisma/schema.prisma`

Na modelu Product přidat za řádek `texture String?` (line 134):

```prisma
model Product {
  // ... existing fields ...
  texture        String?
  colorTone      String?        // <-- NOVÉ
  photos         String          @default("[]")
  // ...
}
```

**STRING, ne enum.** Admin může zadat vlastní hodnotu.

#### Step 1.2: Turso DB migrace

```sql
ALTER TABLE products ADD COLUMN colorTone TEXT;
```

Spustit: `turso db shell hairora-db`

#### Step 1.3: Prisma generate

```bash
npx prisma generate
```

---

### Phase 2: Helper knihovna

#### Step 2.1: Vytvořit `src/lib/color-tones.ts`

**NOVÝ soubor.** Analogie k `src/lib/hair-textures.ts` a `src/lib/origin-flags.ts`.

```ts
export interface ColorToneOption {
  name: string;      // CZ name, ukládá se do DB
  hex: string;       // barva swatche v dropdownu a na kartách
  nameKey: string;   // i18n key pod "colorTone" namespace
}

export const COLOR_TONE_OPTIONS: ColorToneOption[] = [
  { name: "Blond",         hex: "#E8D5A8", nameKey: "blond" },
  { name: "Hnědá",         hex: "#7A5230", nameKey: "brown" },
  { name: "Tmavě hnědá",   hex: "#3E2512", nameKey: "darkBrown" },
  { name: "Zrzavá",        hex: "#B5451B", nameKey: "red" },
];

export function getColorToneInfo(name: string | null | undefined): ColorToneOption {
  if (!name) return { name: "", hex: "#9CA3AF", nameKey: "unknown" };
  return COLOR_TONE_OPTIONS.find(t => t.name === name)
    ?? { name, hex: "#9CA3AF", nameKey: "custom" };
}
```

---

### Phase 3: Validace + API

#### Step 3.1: Validace — přidat colorTone

**File:** `src/lib/validations/product.ts`

V `createProductSchema` přidat za `texture`:

```ts
colorTone: z.string().max(200).nullable().optional(),
```

#### Step 3.2: Product serializer

**File:** `src/lib/api/product-serializer.ts`

V `serializeProductForRole()` přidat do `base` objektu (line ~80):

```ts
const base = {
  // ... existing (id, name, ..., texture) ...
  colorTone: product.colorTone,   // <-- NOVÉ
  photos: product.photos,
  // ...
};
```

#### Step 3.3: Products options API — přidat colorTone DISTINCT

**File:** `src/app/api/products/options/route.ts`

Přidat druhý query pro colorTone (analogie k texture query):

```ts
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    textures: textures.map((p) => p.texture).filter(Boolean),
    colorTones: colorTones.map((p) => p.colorTone).filter(Boolean),
  });
}
```

#### Step 3.4: Public products API — filtrování

**File:** `src/app/api/public/products/route.ts`

Přidat za existující texture filter (line ~23):

```ts
const colorTone = sp.get("colorTone");
if (colorTone) where.colorTone = colorTone;
```

Přidat do `select` (line ~60):

```ts
select: {
  // ... existing ...
  colorTone: true,
}
```

Přidat do parsed response (line ~99):

```ts
colorTone: p.colorTone,
```

#### Step 3.5: Admin products API — filtrování

**File:** `src/app/api/products/route.ts`

Přidat za texture filter (line ~24):

```ts
const colorTone = searchParams.get("colorTone");
if (colorTone) where.colorTone = colorTone;
```

---

### Phase 4: Public Frontend

#### Step 4.1: ProductsShowcase — filtrování + zobrazení

**File:** `src/app/(public)/offer/ProductsShowcase.tsx`

**4.1a: Interface** — přidat do PublicProduct:
```ts
colorTone: string | null;
```

**4.1b: Filter state** — přidat:
```ts
const activeColorTone = searchParams.get("colorTone") ?? "";
```

**4.1c: filterOptions useMemo** — přidat vedle textures:
```ts
const colorTones: Record<string, number> = {};
// ... v forEach:
if (p.colorTone) {
  colorTones[p.colorTone] = (colorTones[p.colorTone] ?? 0) + 1;
}
// ... v return:
colorTones: Object.entries(colorTones).sort((a, b) => b[1] - a[1]),
```

**4.1d: API fetch params** — přidat:
```ts
if (activeColorTone) params.set("colorTone", activeColorTone);
```

**4.1e: useEffect dependency** — přidat `activeColorTone`

**4.1f: Filter panel** — přidat za textures section (NOVÁ SEKCE):
```tsx
{/* Color Tones — color dot swatches */}
{filterOptions.colorTones.length > 0 && (
  <div>
    <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
      {t("offer.colorToneLabel")}
    </div>
    <div className="flex flex-wrap gap-1.5">
      {filterOptions.colorTones.map(([ct, count]) => {
        const info = getColorToneInfo(ct);
        return (
          <button
            key={ct}
            onClick={() => toggleFilter("colorTone", ct)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              activeColorTone === ct
                ? "border-amber-400 bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                : "border-line bg-white text-espresso hover:border-line hover:bg-nude-50"
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full inline-block border border-line/50" style={{ backgroundColor: info.hex }} />
            {ct}
            <span className="text-muted ml-0.5">{count}</span>
          </button>
        );
      })}
    </div>
  </div>
)}
```

**4.1g: Active filter badge** — přidat v active filters section:
```tsx
{activeColorTone && (
  <button
    onClick={() => setFilter("colorTone", "")}
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
  >
    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: getColorToneInfo(activeColorTone).hex }} />
    {activeColorTone}
    <span className="ml-0.5">&times;</span>
  </button>
)}
```

**4.1h: hasActiveFilters** — přidat `|| activeColorTone`

**4.1i: Product card badge** — přidat vedle texture badge:
```tsx
{p.colorTone && (
  <button
    onClick={() => toggleFilter("colorTone", p.colorTone!)}
    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
      activeColorTone === p.colorTone
        ? "bg-amber-200 text-amber-800 ring-1 ring-amber-400"
        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
    }`}
  >
    <span className="w-2.5 h-2.5 rounded-full inline-block border border-amber-300/50" style={{ backgroundColor: getColorToneInfo(p.colorTone).hex }} />
    {p.colorTone}
  </button>
)}
```

**4.1j: Import** — přidat na vrch:
```ts
import { getColorToneInfo } from "@/lib/color-tones";
```

#### Step 4.2: Product detail page — specs + SEO

**File:** `src/app/(public)/offer/[slug]/page.tsx`

**4.2a: productSelect** — přidat `colorTone: true`

**4.2b: generateMetadata** — přidat colorTone do title/description:
```ts
const colorToneLabel = product.colorTone ?? "";
const titleParts = [productName, processingLabel, textureLabel, colorToneLabel, originLabel].filter(Boolean);
```

**4.2c: Specs grid** — přidat za texture block:
```tsx
{product.colorTone && (
  <Link
    href={`/offer?colorTone=${encodeURIComponent(product.colorTone)}`}
    className="flex items-center gap-2.5 hover:bg-nude-100 rounded-lg p-1 -m-1 transition-colors"
  >
    <span className="w-8 h-8 rounded-full border border-line/50 flex-shrink-0" style={{ backgroundColor: getColorToneInfo(product.colorTone).hex }} />
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted font-medium">{t("productDetail.colorToneLabel")}</div>
      <div className="text-sm font-semibold text-ink underline decoration-line underline-offset-2">{product.colorTone}</div>
    </div>
  </Link>
)}
```

**4.2d: JSON-LD** — přidat colorTone do description (already covered by generateProductBio)

**4.2e: Import** — přidat:
```ts
import { getColorToneInfo } from "@/lib/color-tones";
```

**4.2f: Parsed result** — přidat `colorTone` do returned object z getProduct

#### Step 4.3: HeroProductSlider — badge

**File:** `src/components/public/HeroProductSlider.tsx`

**4.3a: SliderProduct interface** — přidat:
```ts
colorTone: string | null;
```

**4.3b: VariantCard** — přidat badge vedle texture:
```tsx
{product.colorTone && (
  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
    <span className="w-2.5 h-2.5 rounded-full inline-block border border-amber-300/50" style={{ backgroundColor: getColorToneInfo(product.colorTone).hex }} />
    {product.colorTone}
  </span>
)}
```

**4.3c: Import** — přidat:
```ts
import { getColorToneInfo } from "@/lib/color-tones";
```

---

### Phase 5: Admin Frontend

#### Step 5.1: CreateProductForm — combo-box pro colorTone

**File:** `src/app/(app)/products/new/CreateProductForm.tsx`

**PATTERN: Přesná kopie texture combo-boxu (lines 199-236 v aktuálním souboru).**

**5.1a: Imports** — přidat:
```ts
import { COLOR_TONE_OPTIONS } from "@/lib/color-tones";
```

**5.1b: State** — přidat za texture state:
```ts
const [colorTone, setColorTone] = useState("");
const [colorToneOpen, setColorToneOpen] = useState(false);
const [dbColorTones, setDbColorTones] = useState<string[]>([]);
const colorToneRef = useRef<HTMLDivElement>(null);
```

**5.1c: filteredColorTones** — pod filteredTextures:
```ts
const allColorToneNames = [...new Set([
  ...COLOR_TONE_OPTIONS.map((t) => t.name),
  ...dbColorTones,
])];
const filteredColorTones = allColorToneNames
  .filter((n) => n.toLowerCase().includes(colorTone.toLowerCase()))
  .map((n) => {
    const opt = COLOR_TONE_OPTIONS.find((t) => t.name === n);
    return { name: n, hex: opt?.hex ?? "#9CA3AF" };
  });
```

**5.1d: useEffect fetch** — rozšířit existující (line ~54-59):
```ts
useEffect(() => {
  fetch("/api/products/options")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data?.textures) setDbTextures(data.textures);
      if (data?.colorTones) setDbColorTones(data.colorTones);
    })
    .catch(() => {});
}, []);
```

**5.1e: Click-outside** — přidat do existujícího useEffect (line ~62-70):
```ts
if (colorToneRef.current && !colorToneRef.current.contains(e.target as Node)) {
  setColorToneOpen(false);
}
```

**5.1f: Combo-box JSX** — přidat za texture combo-box (po line ~236):
```tsx
<div ref={colorToneRef} className="relative">
  <label htmlFor="colorTone" className="block text-sm font-medium text-espresso mb-1">
    {t("product.colorTone")}
  </label>
  <input
    id="colorTone"
    type="text"
    className="block w-full rounded-lg border border-line px-3 py-2 text-ink placeholder-muted focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose sm:text-sm"
    value={colorTone}
    onChange={(e) => {
      setColorTone(e.target.value);
      setColorToneOpen(true);
    }}
    onFocus={() => setColorToneOpen(true)}
    placeholder={t("product.colorTonePlaceholder")}
    autoComplete="off"
  />
  {colorToneOpen && filteredColorTones.length > 0 && (
    <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-line bg-white shadow-lg">
      {filteredColorTones.map((opt) => (
        <li key={opt.name}>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-rose/10 text-left"
            onMouseDown={(e) => {
              e.preventDefault();
              setColorTone(opt.name);
              setColorToneOpen(false);
            }}
          >
            <span className="w-4 h-4 rounded-full inline-block border border-line/50" style={{ backgroundColor: opt.hex }} />
            <span>{opt.name}</span>
          </button>
        </li>
      ))}
    </ul>
  )}
</div>
```

**5.1g: Submit data** — přidat za texture (line ~89):
```ts
colorTone: colorTone || undefined,
```

#### Step 5.2: ProductDetailClient — zobrazení + editace

**File:** `src/app/(app)/products/[id]/ProductDetailClient.tsx`

**5.2a: Interface** — přidat:
```ts
colorTone?: string | null;
```

**5.2b: Import** — přidat:
```ts
import { COLOR_TONE_OPTIONS } from "@/lib/color-tones";
import { getColorToneInfo } from "@/lib/color-tones";
```

**5.2c: State** — přidat (analogie k editingTexture):
```ts
const [editingColorTone, setEditingColorTone] = useState(false);
const [colorToneValue, setColorToneValue] = useState(product.colorTone ?? "");
const colorToneRef = useRef<HTMLDivElement>(null);
```

**5.2d: saveColorTone** — přidat (analogie k saveTexture):
```ts
const saveColorTone = useCallback(async (newColorTone: string) => {
  await fetch(`/api/products/${product.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ colorTone: newColorTone || null }),
  });
  setEditingColorTone(false);
  router.refresh();
}, [product.id, router]);
```

**5.2e: Click-outside** — přidat do editingTexture useEffect:
Rozšířit o colorToneRef.

**5.2f: Badge/dropdown JSX** — přidat za texture badge (line ~173-224). Přesně stejný pattern jako texture, ale:
- Použít `colorToneValue`, `editingColorTone`, `setEditingColorTone`, `saveColorTone`
- Místo TextureSwatch: color dot `<span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: info.hex }} />`
- Barva badge: `bg-amber-100 text-amber-700` místo `bg-violet-100 text-violet-700`
- Dropdown items: COLOR_TONE_OPTIONS místo TEXTURE_OPTIONS

#### Step 5.3: ProductListClient — badge

**File:** `src/app/(app)/products/ProductListClient.tsx`

**5.3a: Import** — přidat:
```ts
import { getColorToneInfo } from "@/lib/color-tones";
```

**5.3b: Badge** — přidat za texture badge (line ~46-51):
```tsx
{typeof product.colorTone === "string" && product.colorTone && (
  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
    <span className="w-2.5 h-2.5 rounded-full inline-block border border-amber-300/50" style={{ backgroundColor: getColorToneInfo(product.colorTone).hex }} />
    {product.colorTone}
  </span>
)}
```

#### Step 5.4: StockInForm — info

**File:** `src/components/inventory/StockInForm.tsx`

**5.4a: ProductOption interface** — přidat:
```ts
colorTone?: string | null;
```

**5.4b: Select option text** — rozšířit (line ~207):
```tsx
{p.name}{p.texture ? ` — ${p.texture}` : ""}{p.colorTone ? ` [${p.colorTone}]` : ""}
```

**5.4c: Info pod select** — rozšířit (line ~211-214):
```tsx
{(selectedProduct?.texture || selectedProduct?.colorTone) && (
  <p className="mt-1 text-xs text-violet-600 font-medium">
    {[selectedProduct.texture, selectedProduct.colorTone].filter(Boolean).join(" | ")}
  </p>
)}
```

---

### Phase 6: i18n Translations

**Files:** `messages/cs.json`, `messages/uk.json`, `messages/ru.json`

#### Step 6.1: Root-level colorTone namespace

**cs.json:**
```json
"colorTone": {
  "blond": "Blond",
  "brown": "Hnědá",
  "darkBrown": "Tmavě hnědá",
  "red": "Zrzavá",
  "unknown": "Nespecifikováno",
  "custom": "Vlastní"
}
```

**uk.json:**
```json
"colorTone": {
  "blond": "Блонд",
  "brown": "Каштанове",
  "darkBrown": "Темно-каштанове",
  "red": "Руде",
  "unknown": "Не вказано",
  "custom": "Власне"
}
```

**ru.json:**
```json
"colorTone": {
  "blond": "Блонд",
  "brown": "Каштановые",
  "darkBrown": "Тёмно-каштановые",
  "red": "Рыжие",
  "unknown": "Не указано",
  "custom": "Своё"
}
```

#### Step 6.2: Product form labels

**cs.json** — přidat do "product" sekce:
```json
"colorTone": "Tón barvy",
"colorTonePlaceholder": "Vyberte nebo zadejte tón..."
```

**uk.json** — přidat do "product" sekce:
```json
"colorTone": "Тон кольору",
"colorTonePlaceholder": "Виберіть або введіть тон..."
```

**ru.json** — přidat do "product" sekce:
```json
"colorTone": "Тон цвета",
"colorTonePlaceholder": "Выберите или введите тон..."
```

#### Step 6.3: Filter labels

**cs.json** — přidat do "public.offer" sekce:
```json
"colorToneLabel": "Tón barvy"
```

**uk.json** — přidat do "public.offer" sekce:
```json
"colorToneLabel": "Тон кольору"
```

**ru.json** — přidat do "public.offer" sekce:
```json
"colorToneLabel": "Тон цвета"
```

#### Step 6.4: Product detail labels

**cs.json** — přidat do "public.productDetail" sekce:
```json
"colorToneLabel": "Tón barvy"
```

**uk.json** — přidat do "public.productDetail" sekce:
```json
"colorToneLabel": "Тон кольору"
```

**ru.json** — přidat do "public.productDetail" sekce:
```json
"colorToneLabel": "Тон цвета"
```

---

### Phase 7: Product bio (SEO)

**File:** `src/lib/product-bio.ts`

#### Step 7.1: BioProductData interface

Přidat:
```ts
colorTone?: string | null;
```

#### Step 7.2: generateProductBio

Přidat za texture desc (line ~43-48):
```ts
if (data.colorTone) {
  parts.push(`Tón: ${data.colorTone}.`);
}
```

#### Step 7.3: generateProductBioShort

Přidat za texture (line ~93):
```ts
if (data.colorTone) parts.push(data.colorTone.toLowerCase());
```

#### Step 7.4: Update all callers

Všechna místa volající generateProductBio/Short musí předat colorTone:

- `src/app/(public)/offer/[slug]/page.tsx` — line ~117 a ~238: přidat `colorTone: product.colorTone`
- `src/app/(public)/offer/ProductsShowcase.tsx` — line ~504: přidat `colorTone: p.colorTone`
- `src/app/(app)/products/[id]/ProductDetailClient.tsx` — line ~88-91: přidat `colorTone: product.colorTone`

---

## Pořadí implementace

```
Phase 1 (Schema + DB)           — PRVNÍ, blokuje vše
  |
Phase 2 (Helper) + Phase 3 (API) + Phase 6 (i18n)  — PARALELNĚ po Phase 1
  |
Phase 4 (Public FE) + Phase 5 (Admin FE) + Phase 7 (Bio/SEO)  — PARALELNĚ po Phase 2+3
```

**Doporučené pořadí pro implementátora:**
1. Phase 1 (schema + DB)
2. Phase 2 (color-tones.ts)
3. Phase 6 (i18n — aby překlady existovaly před UI)
4. Phase 3 (API)
5. Phase 5 (Admin — aby šlo přiřazovat colorTone produktům)
6. Phase 4 (Public — filtrování + zobrazení)
7. Phase 7 (Bio/SEO)

---

## Souhrn souborů

### Nový (1)
| Soubor | Účel |
|--------|------|
| `src/lib/color-tones.ts` | COLOR_TONE_OPTIONS (4 defaults) + getColorToneInfo() lookup |

### Modifikované (15)
| Soubor | Změny |
|--------|-------|
| `prisma/schema.prisma` | `colorTone String?` na Product |
| `src/lib/validations/product.ts` | `colorTone: z.string()...` |
| `src/lib/api/product-serializer.ts` | colorTone v base |
| `src/lib/product-bio.ts` | colorTone v BioProductData + generátory |
| `src/app/api/products/options/route.ts` | DISTINCT colorTone |
| `src/app/api/public/products/route.ts` | select + filtrování |
| `src/app/api/products/route.ts` | filtrování |
| `src/app/(public)/offer/ProductsShowcase.tsx` | filter panel + badge |
| `src/app/(public)/offer/[slug]/page.tsx` | specs + SEO + bio caller |
| `src/components/public/HeroProductSlider.tsx` | badge |
| `src/app/(app)/products/new/CreateProductForm.tsx` | combo-box |
| `src/app/(app)/products/[id]/ProductDetailClient.tsx` | zobrazení + editace |
| `src/app/(app)/products/ProductListClient.tsx` | badge |
| `src/components/inventory/StockInForm.tsx` | info |
| `messages/cs.json` | colorTone překlady |
| `messages/uk.json` | colorTone překlady |
| `messages/ru.json` | colorTone překlady |

---

## Kritická pravidla

1. **STRING, ne enum** — `colorTone` je String? v Prisma, `z.string()` v Zod. Žádný enum.
2. **Combo-box pattern** — NE `<select>`. Stejný autocomplete pattern jako origin a texture.
3. **Hodnoty se ukládají v češtině** — překlady přes i18n lookup.
4. **DB migrace přes Turso CLI** — `prisma db push` nefunguje s libsql://.
5. **Variant.color (1-10) se NEMĚNÍ** — colorTone je na Product úrovni, color na Variant úrovni.
6. **Vizuální styl:** amber barvy pro colorTone (amber-100/amber-700), violet pro texture, emerald pro origin.
