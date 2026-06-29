# TASK-006: Bio popisky produktu pro web

## Overview

Auto-generate product descriptions ("bio") based on product attributes (category, processing type, texture, origin). These appear on:
1. Product detail page (`/offer/[id]`) — already has fallback to category description
2. Product cards on `/offer` — currently no description shown
3. SEO meta description — already has template-based description
4. JSON-LD schema — uses `description` field

**Approach:** Template-based bio generator utility (no AI API). Generates a rich, unique description per product by combining category quality description, processing type details, texture, and origin info. Pure function, no DB writes needed — computed at render time.

## Current State

- **Product model**: has `description String?`, `descriptionUk String?`, `descriptionRu String?`
- **Product detail page** (`offer/[id]/page.tsx`): Already uses `localizedDesc || catDesc` fallback (line 200). If product has no manual description, shows category-generic text.
- **Product cards** (`ProductsShowcase.tsx`): Do NOT show any description text
- **SEO metadata** (`offer/[id]/page.tsx:98`): Already generates template-based description for `<meta>` tag
- **Category descriptions** exist in translations (`categoryInfo.virginDesc`, etc.)
- **Homepage slider**: No description (too small for text)

## Architecture Decision

**Do NOT store generated bios in DB.** Instead:
- Create a `generateProductBio()` function that computes a description from product attributes
- Use it as fallback when `product.description` is empty (manual descriptions override)
- This keeps data DRY — bio updates automatically when product attributes change

## Implementation Plan

### Step 1: Create product bio generator utility
**New file:** `src/lib/product-bio.ts`

A pure function that builds a natural-language description combining product attributes.

```typescript
interface BioProductData {
  name: string;
  category: string;
  processingType: string;
  origin?: string | null;
  texture?: string | null;
  lengths?: number[];      // sorted unique lengths from variants
  colorCount?: number;     // number of unique colors
}

const CATEGORY_QUALITY: Record<string, string> = {
  VIRGIN: "Nejvyšší kvalita panenských vlasů — 100% neošetřené, s kompletní kutikulou zachovanou ve správném směru",
  PREMIUM: "Prémiová kvalita vlasů s jemným ošetřením, zachovanou strukturou a přirozeným vzhledem",
  STANDARD: "Skvělý poměr cena/kvalita — ošetřené vlasy s přirozeným vzhledem a spolehlivou trvanlivostí",
  SALE: "Vlasy za zvýhodněnou cenu — ideální příležitost nakoupit výhodně",
};

const PROCESSING_DESC: Record<string, string> = {
  CLIP_IN: "Clip-in metoda — snadná aplikace bez poškození vlastních vlasů, ideální pro okamžitou změnu",
  TAPE_IN: "Tape-in metoda — tenké pásky pro plochý a neviditelný spoj, pohodlné celodenní nošení",
  KERATIN: "Keratinové prodloužení — jednotlivé pramínky s keratinovou vazbou pro nejpřirozenější výsledek",
  WEFT: "Tresové prodloužení — rychlá aplikace s maximálním objemem, vhodné pro zkušené kadeřnice",
  MICRO_RING: "Micro ring metoda — šetrná aplikace bez tepla a lepidla, snadno přeaplikovatelné",
  OTHER: "",
};

const TEXTURE_DESC: Record<string, string> = {
  "Rovné": "Rovná struktura pro hladký a elegantní vzhled",
  "Mírně vlnité": "Mírně vlnitá struktura dodá jemný objem a přirozený pohyb",
  "Vlnité": "Vlnitá struktura pro romantický a objemný efekt",
  "Kudrnaté": "Kudrnatá struktura pro výrazný objem a dynamický styl",
};

export function generateProductBio(data: BioProductData): string {
  const parts: string[] = [];

  // 1. Category quality sentence
  const quality = CATEGORY_QUALITY[data.category];
  if (quality) parts.push(`${quality}.`);

  // 2. Processing type
  const processing = PROCESSING_DESC[data.processingType];
  if (processing) parts.push(`${processing}.`);

  // 3. Texture
  if (data.texture) {
    const texDesc = TEXTURE_DESC[data.texture];
    if (texDesc) {
      parts.push(`${texDesc}.`);
    }
  }

  // 4. Origin
  if (data.origin) {
    parts.push(`Původ: ${data.origin}.`);
  }

  // 5. Variants info
  if (data.lengths && data.lengths.length > 0) {
    const lengthRange = data.lengths.length > 1
      ? `${data.lengths[0]}–${data.lengths[data.lengths.length - 1]} cm`
      : `${data.lengths[0]} cm`;
    const colorInfo = data.colorCount && data.colorCount > 1
      ? `, ${data.colorCount} odstínů`
      : "";
    parts.push(`Dostupné délky: ${lengthRange}${colorInfo}. Skladem v Praze.`);
  }

  return parts.join(" ");
}

// Short version for product cards (1 sentence)
export function generateProductBioShort(data: BioProductData): string {
  const parts: string[] = [];

  // Category + processing in one line
  const catLabel: Record<string, string> = {
    VIRGIN: "Panenské",
    PREMIUM: "Prémiové",
    STANDARD: "Kvalitní",
    SALE: "Akční",
  };
  const procLabel: Record<string, string> = {
    CLIP_IN: "clip-in",
    TAPE_IN: "tape-in",
    KERATIN: "keratinové",
    WEFT: "tresové",
    MICRO_RING: "micro ring",
    OTHER: "",
  };

  const cat = catLabel[data.category] ?? "";
  const proc = procLabel[data.processingType] ?? "";
  if (cat && proc) {
    parts.push(`${cat} ${proc} vlasy`);
  } else if (cat) {
    parts.push(`${cat} vlasy`);
  }

  if (data.texture) parts.push(data.texture.toLowerCase());
  if (data.origin) parts.push(data.origin);

  if (data.lengths && data.lengths.length > 1) {
    parts.push(`${data.lengths[0]}–${data.lengths[data.lengths.length - 1]} cm`);
  }

  return parts.join(" | ");
}
```

**Lines:** ~100

---

### Step 2: Use bio on product detail page
**File:** `src/app/(public)/offer/[id]/page.tsx`

The page currently does:
```typescript
const description = localizedDesc || catDesc;
```

Change to use `generateProductBio` as the fallback instead of just the category description:

**Add import:**
```typescript
import { generateProductBio } from "@/lib/product-bio";
```

**Replace line 200:**

**Before:**
```typescript
const description = localizedDesc || catDesc;
```

**After:**
```typescript
const autoBio = generateProductBio({
  name: productName,
  category: product.category,
  processingType: product.processingType,
  origin: product.origin,
  texture: product.texture,
  lengths,
  colorCount: new Set(product.variants.map((v) => v.color)).size,
});
const description = localizedDesc || autoBio;
```

This replaces the generic category description with a richer, product-specific bio that includes processing type, texture, origin, and variant info. Manual descriptions (`localizedDesc`) still take priority.

**Lines changed:** ~10

---

### Step 3: Add short bio to product cards on /offer
**File:** `src/app/(public)/offer/ProductsShowcase.tsx`

Add a one-line bio/tagline under the product name on each card.

**Add import:**
```typescript
import { generateProductBioShort } from "@/lib/product-bio";
```

**Add bio line after product name (after line 500, inside the `<div className="p-2.5">` block):**

After the product name `<h3>` and before the length/color row, add:

```tsx
<p className="text-[10px] text-muted line-clamp-1 mb-1">
  {generateProductBioShort({
    name: localizedName(p),
    category: p.category,
    processingType: p.processingType,
    origin: p.origin,
    texture: p.texture,
  })}
</p>
```

This shows a compact one-liner like: "Panenské clip-in vlasy | rovné | Ukrajina | 40–60 cm"

**Lines changed:** ~12

---

### Step 4: Improve SEO meta description
**File:** `src/app/(public)/offer/[id]/page.tsx`

The current meta description (line 98) is already template-based. Replace it with the auto-generated bio for richer, more unique SEO text.

**Replace line 97-98:**

**Before:**
```typescript
const texturePart = product.texture ? `Struktura: ${product.texture}. ` : "";
const description = `${productName} ${processingLabel} — ${categoryLabel} vlasy k prodloužení. ${originPart}${texturePart}Délky ${minLength}–${maxLength} cm, ${colorCount} odstínů. Skladem v Praze | Hairland`;
```

**After:**
```typescript
const metaBio = generateProductBio({
  name: productName,
  category: product.category,
  processingType: product.processingType,
  origin: product.origin,
  texture: product.texture,
  lengths: [...new Set(product.variants.map((v) => v.lengthCm))].sort((a, b) => a - b),
  colorCount: new Set(product.variants.map((v) => v.color)).size,
});
const metaDescription = (metaBio.length > 155 ? metaBio.slice(0, 152) + "..." : metaBio) + " | Hairland";
```

Then use `metaDescription` instead of `description` in the return object on line 102.

**Lines changed:** ~8

---

### Step 5: Add "Generate bio" button in admin product detail (optional)
**File:** `src/app/(app)/products/[id]/ProductDetailClient.tsx`

For owner convenience, add a button that generates a bio and saves it to the `description` field via PUT API. This allows the owner to review and edit the auto-generated text before saving.

**Add import:**
```typescript
import { generateProductBio } from "@/lib/product-bio";
```

**Add state and handler (after existing state declarations):**
```typescript
const [generatingBio, setGeneratingBio] = useState(false);

const handleGenerateBio = useCallback(async () => {
  const lengths = [...new Set((product.variants ?? []).map((v) => v.lengthCm))].sort((a, b) => a - b);
  const colorCount = new Set((product.variants ?? []).map((v) => v.color)).size;
  const bio = generateProductBio({
    name: product.name,
    category: product.category,
    processingType: product.processingType,
    origin: product.origin,
    texture: product.texture,
    lengths,
    colorCount,
  });
  setGeneratingBio(true);
  await fetch(`/api/products/${product.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description: bio }),
  });
  setGeneratingBio(false);
  router.refresh();
}, [product, router]);
```

**Add button next to the description display (after line 121):**

**Before:**
```tsx
{product.description && (
  <p className="mt-2 text-gray-600">{product.description}</p>
)}
```

**After:**
```tsx
{product.description ? (
  <p className="mt-2 text-gray-600">{product.description}</p>
) : isOwner ? (
  <button
    onClick={handleGenerateBio}
    disabled={generatingBio}
    className="mt-2 text-sm text-rose hover:text-rose-deep transition-colors"
  >
    {generatingBio ? "..." : t("product.generateBio")}
  </button>
) : null}
```

This shows a "Generate bio" link when the product has no description and the user is an owner. Clicking generates and saves the bio.

**Lines changed:** ~25

---

### Step 6: Add translation keys
**Files:** `messages/cs.json`, `messages/uk.json`, `messages/ru.json`

Add to `product` namespace:
```json
{
  "generateBio": "Vygenerovat popis"
}
```

**Lines:** ~3

---

## Summary

| # | File | What | Lines | Type |
|---|------|------|-------|------|
| 1 | `src/lib/product-bio.ts` | Bio generator utility (full + short) | ~100 | NEW |
| 2 | `src/app/(public)/offer/[id]/page.tsx` | Use autoBio as fallback description | ~10 | EDIT |
| 3 | `src/app/(public)/offer/ProductsShowcase.tsx` | Add short bio tagline to product cards | ~12 | EDIT |
| 4 | `src/app/(public)/offer/[id]/page.tsx` | Improve SEO meta description | ~8 | EDIT |
| 5 | `src/app/(app)/products/[id]/ProductDetailClient.tsx` | "Generate bio" button for owners | ~25 | EDIT |
| 6 | Translation files (cs, uk, ru) | `product.generateBio` key | ~3 | EDIT |

**Total files:** 5 (1 new, 4 edits) + translation files
**Total lines:** ~160
**Risk:** Low — additive, computed descriptions, no DB schema changes

## Design Decisions

1. **Computed, not stored**: Auto bios are generated at render time, not saved to DB. This means they auto-update when product attributes change. Manual descriptions always override.

2. **Two versions**: `generateProductBio()` for full descriptions (detail page, SEO) and `generateProductBioShort()` for one-liner taglines (product cards).

3. **Czech only**: Bio templates are in Czech. Uk/Ru translations of the bio utility are a separate future task if needed — the existing `descriptionUk`/`descriptionRu` fields can be manually filled for translated products.

4. **Admin "Generate bio" button**: Optional convenience — saves the computed bio to `description` field so the owner can review/edit. Only shown when description is empty.

## Example Output

**Full bio (detail page):**
> Nejvyšší kvalita panenských vlasů — 100% neošetřené, s kompletní kutikulou zachovanou ve správném směru. Clip-in metoda — snadná aplikace bez poškození vlastních vlasů, ideální pro okamžitou změnu. Rovná struktura pro hladký a elegantní vzhled. Původ: Ukrajina. Dostupné délky: 40–60 cm, 6 odstínů. Skladem v Praze.

**Short bio (product card):**
> Panenské clip-in vlasy | rovné | Ukrajina | 40–60 cm

## Testing

1. Open product detail without manual description — verify auto-generated bio appears
2. Open product detail with manual description — verify manual text takes priority
3. Check product cards on `/offer` — verify short bio tagline under product name
4. View page source — verify SEO meta description is rich and unique per product
5. Admin product detail (OWNER, no description) — click "Generate bio" — verify text saved and displayed
6. Check JSON-LD schema has description
7. Test with product that has no origin/texture — verify graceful output
