# TASK-093: SEO Code Fixes Plan

**Date:** 2026-07-19  
**Status:** READY FOR IMPLEMENTATION

---

## Fix 1: ItemList schema on /offer page — ALREADY DONE

**File:** `src/app/[locale]/(public)/offer/page.tsx`

**Current state (lines 75-88):** The ItemList JSON-LD already includes `url`, `name`, and conditional `image` for each ListItem:

```typescript
itemListElement: allProducts.slice(0, 50).map((p, i) => ({
  "@type": "ListItem",
  position: i + 1,
  url: `https://www.hairland.cz/offer/${p.slug ?? p.id}`,
  name: p.name,
  ...(p.photos.length > 0 ? { image: p.photos[0] } : {}),
})),
```

**Verdict: NO CHANGE NEEDED.** The `url`, `name`, and `image` fields are already present. This was likely fixed in a previous commit.

---

## Fix 2: Add `mpn` field to Product schema

**File:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx`

**Current state (lines 605-614):**
```typescript
const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: productName,
  description: schemaDesc,
  image: schemaImage,
  brand: { "@type": "Brand", name: "Hairland" },
  sku: product.variants.length > 0
    ? generateSku(product.category, product.texture, product.variants[0].color, product.variants[0].lengthCm)
    : product.id,
  material: "100% lidske vlasy",
```

The `sku` field exists and uses `generateSku()`. The `mpn` (Manufacturer Part Number) field is missing.

**Change:** Add `mpn` field right after `sku`, using the same value:

**Location:** Line 614, after the `sku` line, before `material`.

**Exact edit:**
```
OLD (line 614):
    material: "100% lidske vlasy",

NEW (line 614):
    mpn: product.variants.length > 0
      ? generateSku(product.category, product.texture, product.variants[0].color, product.variants[0].lengthCm)
      : product.id,
    material: "100% lidske vlasy",
```

**Why:** Google's Product structured data recommends including `mpn` for merchant listings. Since Hairland manufactures/processes its own products, using the SKU as MPN is appropriate (same value, different semantic meaning).

---

## Fix 3: Real lastModified in sitemap — ALREADY PARTIALLY DONE

**File:** `src/app/sitemap.ts`

**Current state analysis:**
- Lines 12: `const STATIC_DATE = "2026-06-01";` used for static pages
- Lines 68-78: Blog posts already use `post.updatedAt` (line 76)
- Lines 80-93: Products already use `product.updatedAt` (line 92)
- Lines 95-97: Stylists already use `s.updatedAt` (line 97)
- Lines 36-52: Static pages use `STATIC_DATE` — this is CORRECT for pages that rarely change
- Lines 54-62: Category pages use `STATIC_DATE` — acceptable (template pages)
- Lines 64-66: Article pages use `STATIC_DATE` — could be improved but articles are static .ts files without updatedAt
- Lines 100-140: Attribute landing pages use `STATIC_DATE` — acceptable

**Verdict: ALREADY DONE for dynamic content (products, blog, stylists).** The only remaining `STATIC_DATE` usage is for genuinely static pages (homepage, about, T&C, etc.) and template-driven pages (categories, attribute landing pages) which don't have a database `updatedAt` — using a static date is the correct approach here.

**NO CHANGE NEEDED.**

---

## Fix 4: HowTo schema on /pruvodce-gramazi — ALREADY DONE

**File:** `src/app/[locale]/(public)/pruvodce-gramazi/page.tsx`

**Current state (lines 43-70):** The HowTo JSON-LD schema already exists:

```typescript
const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: t("title"),
  description: t("subtitle"),
  step: [
    { "@type": "HowToStep", name: t("hairTypeTitle"), text: t("hairTypeIntro") },
    { "@type": "HowToStep", name: t("guideTitle"), text: t("guideIntro") },
    { "@type": "HowToStep", name: t("processingTitle"), text: t("processingIntro") },
    { "@type": "HowToStep", name: t("ctaOffer"), text: t("ctaText") },
  ],
};
```

It also includes:
- FAQPage schema (lines 72-83)
- BreadcrumbList schema (lines 85-102)

**Verdict: NO CHANGE NEEDED.** HowTo, FAQ, and Breadcrumb schemas are all present.

---

## SUMMARY

| Fix | Description | Status | Action |
|-----|-------------|--------|--------|
| 1 | ItemList schema url/image on /offer | ALREADY DONE | None |
| 2 | mpn field in Product schema | NEEDS FIX | Add 3 lines |
| 3 | Real lastModified in sitemap | ALREADY DONE | None |
| 4 | HowTo schema on /pruvodce-gramazi | ALREADY DONE | None |

**Only Fix 2 requires code changes** — adding `mpn` to the Product JSON-LD in the product detail page. This is a 3-line addition.

### Implementation for Fix 2:

In `src/app/[locale]/(public)/offer/[...slug]/page.tsx`, at line ~614, add `mpn` field after `sku`:

```diff
     sku: product.variants.length > 0
       ? generateSku(product.category, product.texture, product.variants[0].color, product.variants[0].lengthCm)
       : product.id,
+    mpn: product.variants.length > 0
+      ? generateSku(product.category, product.texture, product.variants[0].color, product.variants[0].lengthCm)
+      : product.id,
     material: "100% lidske vlasy",
```

No new imports needed. No schema changes. No tests to update.
