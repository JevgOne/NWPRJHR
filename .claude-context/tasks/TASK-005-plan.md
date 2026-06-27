# TASK-005: SEO Automation for New Products

## Implementation Plan

**Date:** 2026-06-27
**Status:** Ready for implementation
**Depends on:** TASK-004 (texture + tone fields must exist on Product)

---

## Overview

The product detail page (`src/app/(public)/offer/[id]/page.tsx`) already has a `generateMetadata()` function that builds SEO title, description, OG image, and canonical URL. The sitemap (`src/app/sitemap.ts`) already includes all non-archived products. This task extends and improves the existing SEO infrastructure to:

1. Include texture and tone in title and description
2. Add Product JSON-LD structured data
3. Ensure OG image is set from first product photo
4. Verify sitemap coverage
5. Make SEO generation fully automatic — zero manual work when adding products

### Current State

**Already working:**
- `generateMetadata()` on `/offer/[id]/page.tsx` — builds title from name + processingType + origin, description with lengths/colors
- `sitemap.ts` — includes all non-archived products dynamically
- `robots.txt` — allows crawling of public pages
- `HreflangTags` — adds alternate language links
- OG image from first product photo
- Canonical URL per product

**Missing / Needs improvement:**
- Texture not included in title or description
- HairTone not included in description
- No Product JSON-LD structured data (schema.org)
- Title template could be richer
- Description could include texture for better keyword matching

---

## Phase 1: Enhanced generateMetadata

### Step 1.1: Update getProduct() to include texture + tone

**File:** `src/app/(public)/offer/[id]/page.tsx`

In the `getProduct()` function, add to the `select`:
```ts
select: {
  // ... existing ...
  texture: true,
  tone: true,
}
```

### Step 1.2: Update generateMetadata() title

**File:** `src/app/(public)/offer/[id]/page.tsx`

Current title: `"Panenske vlasy — Clip-in — Ukrajina"`

New title format: `"Panenske vlasy Clip-in Rovne — Ukrajina"`

```ts
// Add texture label lookup
const TEXTURE_LABELS: Record<string, Record<string, string>> = {
  cs: { STRAIGHT: "Rovne", SLIGHTLY_WAVY: "Mirne vlnite", WAVY: "Vlnite", CURLY: "Kudrnate" },
  uk: { STRAIGHT: "Pivne", SLIGHTLY_WAVY: "Zlehka khviliaste", WAVY: "Khviliaste", CURLY: "Kucheriave" },
  ru: { STRAIGHT: "Priamye", SLIGHTLY_WAVY: "Slehka volnistye", WAVY: "Volnistye", CURLY: "Kudriavye" },
};

const textureLabel = product.texture
  ? (TEXTURE_LABELS[locale]?.[product.texture] ?? TEXTURE_LABELS.cs[product.texture] ?? "")
  : "";

// Updated title construction
const titleParts = [productName, processingLabel, textureLabel, originLabel].filter(Boolean);
const title = titleParts.join(" — ");
```

This produces titles like:
- CS: "Premium Clip-in Rovne — Ukrajina | Hairland"
- UK: "Premium Clip-in Рівне — Україна | Hairland"
- RU: "Premium Clip-in Прямые — Украина | Hairland"

### Step 1.3: Update generateMetadata() description

**File:** `src/app/(public)/offer/[id]/page.tsx`

Current description: `"Premium Clip-in — Premium vlasy k prodlouzeni. Puvod: Ukrajina. Delky 30-60 cm, 5 odstinu. Skladem v Praze | Hairland"`

Enhanced description — add texture and tone:

```ts
const texturePart = textureLabel ? `Struktura: ${textureLabel}. ` : "";

const TONE_LABELS: Record<string, Record<string, string>> = {
  cs: { BLONDE: "Blond", BROWN: "Hneda", DARK_BROWN: "Tmave hneda", RED: "Zrzava" },
  uk: { BLONDE: "Блонд", BROWN: "Каштанове", DARK_BROWN: "Темно-каштанове", RED: "Руде" },
  ru: { BLONDE: "Блонд", BROWN: "Каштановые", DARK_BROWN: "Тёмно-каштановые", RED: "Рыжие" },
};

const tonePart = product.tone
  ? `Ton: ${TONE_LABELS[locale]?.[product.tone] ?? product.tone}. `
  : "";

const description = `${productName} ${processingLabel} — ${categoryLabel} vlasy k prodlouzeni. ${texturePart}${tonePart}${originPart}Delky ${minLength}-${maxLength} cm, ${colorCount} odstinu. Skladem v Praze | Hairland`;
```

Result: "Premium Clip-in — Premium vlasy k prodlouzeni. Struktura: Rovne. Ton: Blond. Puvod: Ukrajina. Delky 30-60 cm, 5 odstinu. Skladem v Praze | Hairland"

### Step 1.4: Verify OG image

**File:** `src/app/(public)/offer/[id]/page.tsx`

Already implemented — `firstPhoto` is used for OG image. Verify it works:
```ts
const firstPhoto = product.photos[0];
openGraph: firstPhoto ? {
  images: [{ url: firstPhoto, alt: title }],
  type: "website",
} : undefined,
```

No changes needed here. The OG image is automatically set from the first product photo.

---

## Phase 2: Product JSON-LD Structured Data

### Step 2.1: Add JSON-LD component

**File:** `src/app/(public)/offer/[id]/page.tsx` (in the page component, not metadata)

Add Product structured data (schema.org/Product) as a `<script type="application/ld+json">` in the page component:

```tsx
// Inside ProductDetailPage component, after getting product data:
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: productName,
  description: localizedDesc || description,
  image: product.photos,
  brand: {
    "@type": "Brand",
    name: "Hairland",
  },
  category: categoryLabel,
  // Additional properties from texture
  ...(product.texture && {
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Hair Texture",
        value: textureLabel,
      },
      ...(product.tone ? [{
        "@type": "PropertyValue",
        name: "Color Tone",
        value: toneName,
      }] : []),
      {
        "@type": "PropertyValue",
        name: "Processing Type",
        value: processingLabel,
      },
      ...(product.origin ? [{
        "@type": "PropertyValue",
        name: "Origin",
        value: product.origin,
      }] : []),
    ],
  }),
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "CZK",
    availability: "https://schema.org/InStock",
    // Only show price range if retail prices are available
    ...(product.variants.length > 0 && {
      lowPrice: Math.min(...product.variants.map(v => v.retailPricePerGram)) / 100,
      highPrice: Math.max(...product.variants.map(v => v.retailPricePerGram)) / 100,
      offerCount: product.variants.length,
    }),
  },
  url: `https://www.hairland.cz/offer/${product.id}`,
};
```

Render in the component:
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

**Note:** Place this at the top of the returned JSX, before the visual content.

### Step 2.2: Add Organization JSON-LD to root layout (optional enhancement)

**File:** `src/app/layout.tsx`

Add site-wide Organization schema (if not already present):
```tsx
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Hairland",
  url: "https://www.hairland.cz",
  logo: "https://www.hairland.cz/logo.png",
  contactPoint: {
    "@type": "ContactPoint",
    email: "info@hairland.cz",
    contactType: "customer service",
    availableLanguage: ["Czech", "Ukrainian", "Russian"],
  },
};
```

---

## Phase 3: Sitemap Enhancement

### Step 3.1: Add slug-based URLs to sitemap

**File:** `src/app/sitemap.ts`

Current: uses product ID (`/offer/${product.id}`).

Enhanced: prefer slug if available, fall back to ID:
```ts
const products = await prisma.product.findMany({
  where: { archived: false },
  select: { id: true, slug: true, updatedAt: true },
});

const productPages: MetadataRoute.Sitemap = products.map((product) => ({
  url: `${BASE_URL}/offer/${product.slug || product.id}`,
  lastModified: product.updatedAt,
  changeFrequency: "weekly",
  priority: 0.8,
}));
```

### Step 3.2: Add stylists to sitemap

**File:** `src/app/sitemap.ts`

The `/kadernice` page exists with `[slug]` subpages. Add them:
```ts
const stylists = await prisma.stylist.findMany({
  where: { active: true },
  select: { slug: true, updatedAt: true },
});

const stylistPages: MetadataRoute.Sitemap = stylists.map((s) => ({
  url: `${BASE_URL}/kadernice/${s.slug}`,
  lastModified: s.updatedAt,
  changeFrequency: "monthly",
  priority: 0.6,
}));

return [...staticPages, ...productPages, ...stylistPages];
```

---

## Phase 4: Canonical URLs

### Step 4.1: Verify canonical URLs

**File:** `src/app/(public)/offer/[id]/page.tsx`

Already implemented in `generateMetadata()`:
```ts
alternates: { canonical: `/offer/${id}` },
```

If we support slug-based URLs in the future, update to:
```ts
alternates: { canonical: `/offer/${product.slug || id}` },
```

No changes needed now since the page route uses `[id]`.

---

## Implementation Order

```
Phase 1 (Enhanced Metadata) — can start immediately after TASK-004
  ├── Step 1.1: getProduct select update
  ├── Step 1.2: Title with texture
  ├── Step 1.3: Description with texture + tone
  └── Step 1.4: OG image verification (no-op)

Phase 2 (JSON-LD) — independent, can be parallel with Phase 1
  ├── Step 2.1: Product JSON-LD on detail page
  └── Step 2.2: Organization JSON-LD on root layout

Phase 3 (Sitemap) — independent, can be parallel
  ├── Step 3.1: Slug-based URLs
  └── Step 3.2: Stylist pages

Phase 4 (Canonical) — verification only
  └── Step 4.1: Already implemented
```

**All phases can run in parallel.**

---

## Files Summary

### New Files (0)

No new files needed — all changes go into existing files.

### Modified Files (3)

| File | Changes |
|------|---------|
| `src/app/(public)/offer/[id]/page.tsx` | Add texture/tone to getProduct select, enhance title + description with texture/tone, add Product JSON-LD script |
| `src/app/sitemap.ts` | Add slug preference for product URLs, add stylist pages |
| `src/app/layout.tsx` | Add Organization JSON-LD (optional) |

---

## SEO Automation Flow (End State)

When a new product is added via admin:

1. **Sitemap:** Automatically included via `sitemap.ts` query (no manual step)
2. **Title:** Auto-generated from: `{name} — {processingType} — {texture} — {origin} | Hairland`
3. **Description:** Auto-generated from: name, category, texture, tone, origin, length range, color count
4. **OG Image:** First photo from product photos array
5. **Canonical URL:** `/offer/{id}` (or slug when available)
6. **JSON-LD:** Full Product schema with texture, tone, origin, price range
7. **Hreflang:** Already handled by HreflangTags component

**Zero manual SEO work required when adding products.**

---

## Risks & Considerations

1. **Title length:** Google typically displays 50-60 characters. The title with all parts (name + processing + texture + origin) could exceed this. Keep product names concise, and consider truncation logic if needed. Current approach: just concatenate all non-empty parts with " — " separator.

2. **Description length:** Google shows ~155-160 characters. Current description with all parts is approximately 150-180 chars. Acceptable — Google will truncate gracefully.

3. **JSON-LD price:** The `retailPricePerGram` is in halere and per gram. For JSON-LD `AggregateOffer`, we divide by 100 for CZK. However, prices per gram may confuse Google (very low numbers). Consider whether to show total price for a typical quantity (e.g., 100g) instead. The implementor should decide based on the actual price range.

4. **Locale-specific metadata:** The `generateMetadata()` function already uses `getLocale()` to select the right product name. The texture/tone labels should follow the same pattern using the `TEXTURE_LABELS` and `TONE_LABELS` lookup maps defined locally (not via i18n, since `generateMetadata` is a server function and should avoid async t() calls where possible — though the current code already uses `getTranslations`).

5. **No duplicate content:** Since the site serves all 3 locales on the same URL (locale is cookie/header-based, not URL-based), there's no duplicate content risk. The hreflang tags handle this correctly.
