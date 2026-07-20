# TASK-092: SEO Audit — hairland.cz vs goldhair.cz, afroditi.cz

**Status:** Audit complete
**Author:** Planner
**Date:** 2026-07-19

---

## Executive Summary

Hairland.cz has **significantly better technical SEO** than goldhair.cz. The main competitor (goldhair.cz) is built on Shoptet (Czech e-shop platform) with minimal structured data and no JSON-LD. Afroditi.cz appears to be offline or non-functional.

Hairland already has: comprehensive JSON-LD (Product, Store, WebSite, Organization, BreadcrumbList, FAQPage, AggregateRating), hreflang alternates, sitemap with all pages, robots.txt, OG images for every page, proper heading hierarchy, and canonical URLs.

**However, there are actionable improvements that can push hairland.cz ahead further.**

---

## What hairland.cz does WELL (keep doing)

| Feature | Implementation |
|---------|---------------|
| JSON-LD Product schema | Full: name, description, image, brand, SKU, price, availability, shipping, return policy, reviews |
| JSON-LD Store schema | Address, geo, opening hours, phone, email, priceRange |
| JSON-LD WebSite with SearchAction | Enables Google sitelinks search box |
| JSON-LD FAQPage | Category-specific FAQ on product pages |
| JSON-LD BreadcrumbList | On product pages + reusable Breadcrumbs component |
| JSON-LD AggregateRating | When reviews exist |
| Hreflang alternates | cs/uk/ru + x-default on all pages |
| Canonical URLs | Via `getAlternates()` on all pages |
| Sitemap | Dynamic: products, blog, stylists, attribute pages, static pages |
| robots.txt | Proper disallow for admin/API routes |
| OG images | Dedicated image for every page type |
| Meta title/description | Auto-generated from product data, respects 60/155 char limits |
| Heading hierarchy | h1 on homepage + product pages |
| Google Analytics | With cookie consent |
| Image optimization | Next.js Image with sizes, priority for hero |
| Font optimization | Geist with latin-ext subset |
| Preconnect | To Vercel Blob storage |

## What goldhair.cz does that hairland.cz doesn't

| Feature | goldhair.cz | hairland.cz | Impact |
|---------|-------------|-------------|--------|
| Top info bar with trust badges | 4 trust badges (quality, returns, shipping, support hours) | None (TASK-091 will add contacts only) | HIGH |
| Extensive category taxonomy | 21+ categories linked from homepage | ~5 categories | MEDIUM |
| Product count on homepage | 20-25 products shown | Variable (slider) | LOW |
| CZ/SK language versions | .cz and .sk domains | Only .cz (cs/uk/ru) | LOW (different target) |
| Blog with keyword-targeted articles | "Clip-in Seamless", "TAPE IN vlasy" | Blog exists but needs keyword focus | MEDIUM |

---

## Actionable Improvements

### Priority 1: CRITICAL (High SEO impact)

#### 1.1 Missing robots.txt meta tag in `<head>`

The `<head>` does not include `<meta name="robots" content="index, follow">` explicitly. While search engines default to indexing, being explicit is best practice.

**File:** `src/app/layout.tsx` — add to `generateMetadata`:
```typescript
robots: {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
},
```

This enables Google's maximum rich result features (large image previews, video previews, snippets).

#### 1.2 Missing `ItemList` schema on category/offer page

The offer page has `ItemList` JSON-LD (line 76-83 of offer/page.tsx) but it's a basic list. Enhance with `ListItem` containing product URLs and images for better SERP presentation.

**Current** (offer/page.tsx:81-83):
```typescript
itemListElement: allProducts.slice(0, 50).map((p, i) => ({
  "@type": "ListItem",
  position: i + 1,
```

Add `url` and `image` fields to each ListItem.

#### 1.3 Add trust signals to top bar (TASK-091 enhancement)

TASK-091 adds a contact bar. Enhance it with trust badges similar to goldhair.cz:
- "100% pravé vlasy" (quality guarantee)
- "Doprava zdarma Praha" (free Prague delivery)
- "Vrácení do 14 dnů" (14-day returns)
- "+420 608 553 103" (phone)

This doubles as both UX trust signal AND SEO signal (Google values prominent contact info).

#### 1.4 Missing `sameAs` in Organization schema

Homepage Organization JSON-LD (line 132-138) is missing `sameAs` with social profiles. The Store schema has it but only lists Instagram.

**Fix:** Add to Organization schema:
```typescript
sameAs: [
  "https://www.instagram.com/hairland.cz/",
  "https://www.facebook.com/profile.php?id=61591480246246",
  "https://wa.me/420608553103",
],
```

### Priority 2: IMPORTANT (Medium SEO impact)

#### 2.1 Homepage needs more keyword-rich content

The homepage has good structure but could benefit from:
- A short SEO text paragraph at the bottom (before footer) with target keywords
- "Prodloužení vlasů Praha", "clip-in vlasy", "tape-in vlasy", "RAW vlasy" etc.
- Not a wall of text — 100-200 words max, styled subtly

#### 2.2 Blog articles need keyword optimization

Current blog exists but should target high-value Czech hair extension keywords:
- "Jak vybrat správné vlasy k prodloužení" (buying guide)
- "Clip-in vs tape-in — porovnání" (comparison)
- "Péče o prodloužené vlasy" (care guide)
- "Kolik gramů vlasů potřebuji" (already have /pruvodce-gramazi but needs blog version)

These create internal linking opportunities and capture informational search intent.

#### 2.3 Product pages: Add `gtin` or `mpn` to Product schema

Google recommends `gtin` or `mpn` for Product schema. Since products have SKU generation (`generateSku`), add `mpn` field:

```typescript
mpn: generateSku(product.category, product.texture, product.variants[0].color, product.variants[0].lengthCm),
```

(Already have `sku` — `mpn` is an additional signal)

#### 2.4 Add `Review` individual schema to product pages

Product pages already include `aggregateRating` and `review` array in JSON-LD (lines 675-696). This is good. Verify it renders correctly with Google's Rich Results Test.

#### 2.5 Attribute landing pages need unique OG images

All attribute landing pages (`/offer/barva/...`, `/offer/textura/...`, etc.) share the same `og-offer.jpg`. Generating unique OG images per attribute would improve social sharing CTR.

### Priority 3: NICE TO HAVE (Low but cumulative impact)

#### 3.1 Add `WebPage` schema with `speakable` for voice search

```typescript
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  speakable: {
    "@type": "SpeakableSpecification",
    cssSelector: ["h1", ".product-description"],
  },
}
```

#### 3.2 Sitemap: use actual `lastModified` dates

Currently `STATIC_DATE = "2026-06-01"` is used for most pages. Use actual last-modified dates from DB where possible (product.updatedAt is already used).

#### 3.3 Add `HowTo` schema on guide pages

`/pruvodce-gramazi` (weight guide) could benefit from `HowTo` schema for rich snippets.

#### 3.4 Image alt text audit

Verify all product images have descriptive alt text including keywords. Current implementation in PhotoGallery uses `alt` prop but needs to include product name + variant details.

#### 3.5 Internal linking improvements

- Add "related products" section to product detail pages (cross-linking)
- Add category breadcrumb links on product pages (already have breadcrumbs)
- Link blog articles to relevant products and vice versa

---

## Comparison Summary

| SEO Feature | hairland.cz | goldhair.cz | Winner |
|-------------|-------------|-------------|--------|
| JSON-LD structured data | Product, Store, WebSite, Organization, FAQ, Breadcrumb, AggregateRating | None | **hairland** |
| Sitemap | Dynamic, comprehensive | Shoptet auto-generated | **hairland** |
| Hreflang | cs/uk/ru + x-default | cs/sk (domain-based) | **hairland** |
| Canonical URLs | All pages | Unknown | **hairland** |
| OG images | Dedicated per page | Unknown | **hairland** |
| robots.txt | Proper | Shoptet default | **tie** |
| Meta titles | Auto-generated, keyword-rich | Unknown/basic | **hairland** |
| Meta descriptions | Auto-generated with product details | Unknown/basic | **hairland** |
| Top info/trust bar | Missing (TASK-091 planned) | 4 trust badges | **goldhair** |
| Category depth | ~5 categories | 21+ categories | **goldhair** |
| Blog content | Exists, needs keyword focus | 3 articles | **tie** |
| Page speed | Next.js SSR + Vercel | Shoptet (typically slower) | **hairland** |
| Mobile UX | Responsive, modern | Standard Shoptet | **hairland** |
| Google My Business | Not checked | Not checked | **unknown** |
| Review display | On product pages | Not visible | **hairland** |

**Overall: hairland.cz has significantly better technical SEO. The gap is in content volume and trust signals, not technical implementation.**

---

## Implementation Priority

| # | Task | Impact | Effort | Files |
|---|------|--------|--------|-------|
| 1 | Add robots meta with max-image-preview | HIGH | 5 min | `src/app/layout.tsx` |
| 2 | Add sameAs to Organization schema | HIGH | 5 min | `src/app/[locale]/(public)/page.tsx` |
| 3 | Trust badges in top bar (extend TASK-091) | HIGH | 30 min | `src/components/public/TopInfoBar.tsx` |
| 4 | Add mpn to Product schema | MEDIUM | 5 min | `src/app/[locale]/(public)/offer/[...slug]/page.tsx` |
| 5 | Enhance ItemList with URLs/images | MEDIUM | 15 min | `src/app/[locale]/(public)/offer/page.tsx` |
| 6 | Homepage SEO text section | MEDIUM | 20 min | `src/app/[locale]/(public)/page.tsx` + messages |
| 7 | Use real lastModified in sitemap | LOW | 10 min | `src/app/sitemap.ts` |
| 8 | Blog keyword strategy | MEDIUM | Content work | N/A (content planning) |

---

## Note on afroditi.cz

The domain `afroditi.cz` appears to be offline or non-functional (DNS resolution failed for www.afroditi.cz, and the bare domain returned minimal/empty content). This competitor may have shut down or moved to a different domain. Not a relevant benchmark for comparison.
