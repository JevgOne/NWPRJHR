# TASK-094: Deep SEO Audit — Product Detail Page

**Date:** 2026-07-19  
**File:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx`

---

## 1. PRODUCT JSON-LD SCHEMA AUDIT

### What EXISTS (lines 605-700):

| Field | Present | Value |
|-------|---------|-------|
| @type | Product | OK |
| name | productName (localized) | OK |
| description | schemaDesc (160 chars max) | OK |
| image | product.photos array or OG fallback | OK |
| brand | { Brand, "Hairland" } | OK |
| sku | generateSku() | OK |
| mpn | generateSku() (same as sku) | OK |
| material | "100% lidske vlasy" | OK |
| countryOfOrigin | ORIGIN_ISO map | OK (conditional) |
| additionalProperty | texture, color, length | OK |
| offers.@type | Offer | OK |
| offers.price | calculated | OK |
| offers.priceCurrency | CZK | OK |
| offers.availability | InStock/Discontinued | OK |
| offers.url | product URL | OK |
| offers.seller | Organization "Hairland" | OK |
| offers.priceSpecification | UnitPriceSpecification (per gram) | OK |
| offers.shippingDetails | CZ, free, 0-1 handling + 0-3 transit | OK |
| offers.hasMerchantReturnPolicy | 14 days, free return by mail | OK |
| aggregateRating | from reviews | OK (conditional) |
| review | up to 5 reviews | OK (conditional) |

### What is MISSING (Google recommended fields):

| Missing Field | Priority | Impact | Fix Location |
|---------------|----------|--------|-------------|
| **itemCondition** | HIGH | Google recommends for merchant listings — "NewCondition" is standard for new products | Line ~630, add to `offers` |
| **priceValidUntil** | MEDIUM | Google recommends for Offer — helps Google understand price freshness | Line ~630, add to `offers` |
| **gtin** / **gtin13** | LOW | Not applicable — custom/handmade products don't have EAN/UPC | Skip |
| **color** | MEDIUM | Have it in `additionalProperty` but Google specifically recommends `color` as a top-level Product field | Line ~618 area |
| **size** (length) | LOW | Already in additionalProperty as "Delka" | Acceptable |
| **weight** | LOW | Not tracked per product | Skip for now |
| **category** | MEDIUM | Google Product.category should use Google's product taxonomy string | Line ~618 area |

### Issues Found:

**ISSUE 1: `offers.availability` misses nuance (line 630-632)**
```typescript
availability: product.archived
  ? "https://schema.org/Discontinued"
  : "https://schema.org/InStock",
```
Always shows "InStock" even when stock is 0 and product is only "available to order" or truly out of stock. Should check actual stock levels.

**ISSUE 2: OG type is "website" not "product" (line 331)**
```typescript
openGraph: {
  type: "website",  // Should be "product" for product pages
```
Product pages should use `og:type = "product"` for proper social sharing and Facebook/Pinterest product recognition.

**ISSUE 3: `offers.price` uses minimum price without variant context (lines 626-628)**
When no variant is focused, price shows minimum across all variants. This is OK for schema (lowPrice pattern) but could confuse Google if the product has very different prices across variants. Consider using `AggregateOffer` with `lowPrice`/`highPrice` when multiple price points exist.

**ISSUE 4: Description truncation may cut mid-word (line 582)**
```typescript
description.replace(/\n+/g, " ").slice(0, 160).replace(/\s\S*$/, "...")
```
The regex `\s\S*$` removes the last partial word but might cut too aggressively. If the description is exactly 160 chars with no spaces near the end, it could remove too much.

**ISSUE 5: SKU uses only first variant (lines 612-614)**
```typescript
sku: product.variants.length > 0
  ? generateSku(product.category, product.texture, product.variants[0].color, product.variants[0].lengthCm)
  : product.id,
```
SKU is tied to the first variant only. If a product has variants with different colors/lengths, the SKU may not represent the viewed variant. Same issue for `mpn`.

---

## 2. META TITLE & DESCRIPTION AUDIT

### Title Generation (lines 293-313):

**Pattern:** `"{name} {lengthCm} {color}" | Hairland` (via layout template `%s | Hairland`)

**Analysis:**
- Auto-generated from product name + lengths + colors
- Length limit: 60 chars total (49 chars + " | Hairland" = 11)
- Falls back to `product.metaTitle` if set manually
- Colors included only if <= 2 and fits in limit

**Issues:**
- Title does NOT include processing type (clip-in, tape-in, keratin) — this is a key search keyword
- Title does NOT include origin (Ukrajina, Indie) — high-value differentiator
- Example auto-title: "Luxe Vlasy — Rovne 55cm" — lacks "vlasy k prodlouzeni" keyword

**Recommendation:** For auto-generated titles, consider pattern:  
`"{name} {processing} {lengthCm} | Hairland"` — e.g. "Luxe Vlasy Clip-in 55cm | Hairland"

### Description Generation (lines 315-322):

**Pattern:** `"{name}. Puvod {origin}. {colors}. {texture}. {lengths}. {suffix}"`

**Analysis:**
- Good — includes origin, colors, texture, lengths
- Limited to 155 chars
- Falls back to `product.metaDescription` if set manually
- Suffix comes from translation key `landing.metaSuffix`

**Issues:**
- No mention of processing type in auto-description
- No call-to-action or USP (e.g. "doprava Praha zdarma", "zpracovani do 7 dni")
- Missing price indicator (even a range would help CTR)

---

## 3. OPEN GRAPH TAGS AUDIT

### Current (lines 326-348):

```typescript
openGraph: {
  type: "website",           // BUG: should be "product"
  title,
  description,
  url: `https://www.hairland.cz/offer/${productSlug}`,
  siteName: "Hairland",
  locale: OG_LOCALES[locale],
  images: [{ url: ogImg, alt: product.name, width: 1200, height: 630 }],
},
twitter: {
  card: "summary_large_image",
  title,
  description,
  images: [ogImg],
},
```

**Issues:**
1. `og:type` is "website" instead of "product" — Facebook/Pinterest won't recognize as product
2. Missing `product:price:amount` and `product:price:currency` OG tags — needed for Facebook product recognition
3. OG image uses `product.ogImage || product.photos[0]` — product photos are typically square/portrait, not 1200x630. If no `ogImage` is set, the first photo may render poorly as OG image
4. Missing `og:image:width` and `og:image:height` for product photos (only set for explicit ogImage)

---

## 4. CANONICAL URL AUDIT

### Current (line 329):

```typescript
alternates: getAlternates(`/offer/${productSlug}`),
```

`getAlternates()` returns (from `src/lib/seo.ts:15-25`):
```typescript
{
  canonical: path || "/",   // Returns "/offer/{slug}" — RELATIVE path
  languages: {
    cs: "https://www.hairland.cz/offer/{slug}",
    uk: "https://www.hairland.cz/ua/offer/{slug}",
    ru: "https://www.hairland.cz/rus/offer/{slug}",
    "x-default": "https://www.hairland.cz/offer/{slug}",
  }
}
```

**Issues:**
1. Canonical is a relative path (`/offer/{slug}`) — Next.js should resolve it with `metadataBase`, but it's better practice to use absolute URLs
2. Hreflang is correct — has cs, uk, ru, and x-default
3. Canonical does NOT include locale prefix — this is CORRECT (canonical should point to default/cs version regardless of current locale)

**Verdict:** Canonical implementation is acceptable. Next.js resolves the relative canonical against `metadataBase: new URL("https://www.hairland.cz")` from root layout.

---

## 5. HEADING HIERARCHY AUDIT

### Current page structure:

```
H1: productName (line 765-767)
  H2: "Pece o vlasy" (care section, line 1090)
  H2: "Related products" (line 252)
  H2: "FAQ" (line 1130)
  H3: noRetouchTitle (line 1058)
  H3: careTip1Title, careTip2Title, careTip3Title (lines 1096)
```

**Analysis:**
- Single H1 — correct
- Good heading hierarchy (H1 > H2 > H3)
- H2s are semantic sections (care, related, FAQ)
- No heading for the product description section — could add H2 for "O produktu" (about product) for better semantic structure
- Category features section has no heading tag (uses `<div>` with small text)

**Verdict:** Good heading structure. Minor improvement: add H2 for description section.

---

## 6. IMAGE ALT TEXTS AUDIT

### PhotoGallery Component (PhotoGallery.tsx):

The `alt` prop is generated at line 757:
```typescript
alt={[productName, product.texture, product.origin && originName(product.origin), 
      lengths.length > 0 && lengths.map(l => `${l}cm`).join("/")
].filter(Boolean).join(" — ")}
```

**Example output:** `"Luxe Vlasy — Rovne — Ukrajina — 55cm/60cm"`

**Analysis:**
- Descriptive and keyword-rich
- Includes product name, texture, origin, lengths
- All photos share the same alt text — ideally each photo should have unique alt (e.g. "front view", "detail", "texture closeup")
- But for a JS gallery component, single alt is acceptable

**Verdict:** Good alt text implementation.

---

## 7. INTERNAL LINKING AUDIT

### Present on product page:

| Link Type | Target | Line |
|-----------|--------|------|
| Breadcrumb Home | / | 747 |
| Breadcrumb Offer | /offer | 749 |
| Origin link | /offer?origin={origin} | 858 |
| Texture link | /offer?texture={texture} | 870 |
| Blog link (care) | /blog/pece-o-prodlouzene-vlasy... | 1102 |
| CTA inquiry | /inquiry-cart | 1063 |
| WhatsApp | External | 1070 |
| Photo inquiry | /inquiry-cart | 1077 |
| Related products | /offer/{slug} (up to 8 cards) | 255 |
| Recently viewed | dynamic | 1125 |

**Analysis:**
- Strong internal linking structure
- Origin and texture links filter the product catalog
- Blog link provides content hub connection
- Related products with relevance scoring
- Recently viewed for user engagement

**Missing:**
- No link to category landing page (e.g. /offer/kategorie/virgin, /clip-in)
- No link to length landing page (e.g. /offer/delka/55cm)
- No link to color tone landing page (e.g. /offer/barva/blond)
- Processing type not linked

---

## 8. RICH RESULTS PREVIEW

### What Google would show with current schema:

**Product Rich Result:**
- Product name
- Price (per 100g or per piece)
- Availability: InStock (even if actually out of stock — BUG)
- Brand: Hairland
- Rating: X.X stars (N reviews) — if reviews exist
- Free shipping badge
- Free returns badge
- Seller: Hairland

**Breadcrumb Rich Result:**
- Home > Nabidka > {Product Name}

**FAQ Rich Result:**
- 4-7 FAQ items with expandable answers

**Missing Rich Results:**
- No Product variant rich results (Google supports showing color/size variants)
- No Pros/Cons snippet
- No Price drop badge (no `priceValidUntil`)

---

## 9. SPECIFIC RECOMMENDATIONS & CODE CHANGES

### FIX 1: Add `itemCondition` to Offer (HIGH PRIORITY)
**File:** `page.tsx` line ~630, inside `offers` object
```typescript
// Add after availability line:
itemCondition: "https://schema.org/NewCondition",
```

### FIX 2: Fix `availability` to reflect actual stock (HIGH PRIORITY)
**File:** `page.tsx` lines 630-632
```typescript
// CURRENT (wrong):
availability: product.archived
  ? "https://schema.org/Discontinued"
  : "https://schema.org/InStock",

// SHOULD BE:
availability: product.archived
  ? "https://schema.org/Discontinued"
  : (pickerVariants.some(v => v.availableGrams > 0 || v.availablePieces > 0))
    ? "https://schema.org/InStock"
    : pickerVariants.some(v => v.availableToOrder)
      ? "https://schema.org/PreOrder"
      : "https://schema.org/OutOfStock",
```

### FIX 3: Change OG type from "website" to "product" (HIGH PRIORITY)
**File:** `page.tsx` line 331
```typescript
// CURRENT:
type: "website",
// SHOULD BE:
type: "product",   // Not a Next.js built-in type but valid for OG
```
**Note:** Next.js Metadata type for openGraph only allows specific types. If "product" isn't supported by the Next.js type system, this may need a workaround with `other` metadata or manual meta tag.

### FIX 4: Add `priceValidUntil` to Offer (MEDIUM)
**File:** `page.tsx` inside `offers` object, after price
```typescript
priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
```

### FIX 5: Add `color` as top-level Product property (MEDIUM)
**File:** `page.tsx` after `material` line (~618)
```typescript
...(product.colorTone && { color: product.colorTone }),
```

### FIX 6: Add Google product category (MEDIUM)
**File:** `page.tsx` after `brand` line (~611)
```typescript
category: "Hair Extensions",
```
Or better, use Google's product taxonomy:
```typescript
"google_product_category": "Health & Beauty > Personal Care > Hair Care > Hair Extensions",
```
(Note: This is for Google Merchant, not schema.org — for schema.org, use a plain `category` string.)

### FIX 7: Include processing type in meta title (MEDIUM)
**File:** `page.tsx` lines 309-312, modify title generation
```typescript
// CURRENT:
const baseTitle = [product.name, lengthStr].filter(Boolean).join(" ");

// BETTER — include processing type abbreviation:
const procLabel = PROCESSING_LABELS[locale]?.[product.processingType] ?? "";
const baseTitle = [product.name, procLabel, lengthStr].filter(Boolean).join(" ");
```
This would produce: "Luxe Vlasy Clip-in 55cm | Hairland" instead of "Luxe Vlasy 55cm | Hairland".

### FIX 8: Add category/processing links to internal linking (LOW)
**File:** `page.tsx` around line 775 (sub-heading area)
Add processing type as a linked badge that goes to the processing type landing page (e.g. `/clip-in`).

---

## 10. REVIEW DATA CONCERN

### Lines 33-63: Review fallback logic

```typescript
if (stats._count === 0) {
  stats = await prisma.review.aggregate({
    where: { active: true },  // Falls back to ALL reviews site-wide
    _avg: { rating: true },
    _count: true,
  });
}
```

**ISSUE:** When a product has 0 reviews, the schema uses the SITE-WIDE aggregate rating. This means:
- Google sees "aggregateRating" with, say, 4.8 stars and 50 reviews on a product that has ZERO reviews
- This is **technically misleading** — the reviews don't belong to this product
- Google may consider this spam/manipulation if detected

**Recommendation:** Either:
1. Only show aggregateRating when the product actually has reviews (remove fallback)
2. Or clearly note in the schema that it's a site-wide rating (use Organization aggregateRating instead)

---

## 11. SUMMARY SCORECARD

| Aspect | Score | Notes |
|--------|-------|-------|
| Product schema completeness | 8/10 | Missing itemCondition, wrong availability |
| Meta title quality | 6/10 | Missing processing type, no CTA keyword |
| Meta description quality | 7/10 | Good structure, missing USP/CTA |
| OG tags | 5/10 | Wrong type, missing product-specific OG |
| Canonical/hreflang | 9/10 | Correct implementation |
| Heading hierarchy | 8/10 | Good, minor improvements possible |
| Image alts | 8/10 | Descriptive, keyword-rich |
| Internal linking | 7/10 | Good but missing category/length links |
| BreadcrumbList schema | 10/10 | Perfect |
| FAQPage schema | 9/10 | Complete, well-structured |
| Review schema | 6/10 | Fallback to site-wide is problematic |
| Shipping/return schema | 10/10 | Excellent detail |
| **OVERALL** | **7.6/10** | |

### Priority Fix List:
1. **HIGH:** Fix availability to reflect actual stock (line 630)
2. **HIGH:** Add itemCondition: NewCondition (line ~630)
3. **HIGH:** Change og:type to "product" (line 331)
4. **HIGH:** Fix review fallback — don't show site-wide reviews as product reviews (lines 41-47)
5. **MEDIUM:** Add priceValidUntil (offers object)
6. **MEDIUM:** Add color as top-level field (line ~618)
7. **MEDIUM:** Include processing type in meta title (line 309)
8. **LOW:** Add category landing page links to internal linking
