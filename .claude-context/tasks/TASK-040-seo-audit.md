# Task #40 — SEO Audit: hairland.cz

## Executive Summary

The site has a solid SEO foundation (meta tags on most pages, canonical URLs, OG image, JSON-LD on key pages, robots.txt, hreflang). However there are significant gaps: **no sitemap.xml**, **no favicon.ico**, **missing OG image file**, **3 pages without any metadata**, **no next/image optimization**, and **missing JSON-LD on most pages**.

---

## 1. META TAGS AUDIT

### Pages WITH metadata (10/15) — OK
| Page | Title | Description | Canonical |
|------|-------|-------------|-----------|
| `/` (homepage) | default template | root layout | `/` |
| `/offer` | Yes | Yes | `/offer` |
| `/offer/[id]` | Dynamic (product name) | Dynamic | `/offer/${id}` |
| `/about` | "O nás" | Yes | `/about` |
| `/contact` | "Kontakt" | Yes | `/contact` |
| `/kadernice` | Static | Static | `/kadernice` |
| `/pro` | Dynamic (i18n) | Dynamic | `/pro` |
| `/registrace` | Dynamic (i18n) | Dynamic | **MISSING** |
| `/poradna` | Dynamic (i18n) | Dynamic | `/poradna` |
| `/poradna/[slug]` | Dynamic | Dynamic | `/poradna/${slug}` |
| `/vykup` | Dynamic | Dynamic | `/vykup` |
| `/obchodni-podminky` | "Obchodní podmínky" | **MISSING** | **MISSING** |

### Pages WITHOUT metadata (3/15) — CRITICAL
| Page | Issue |
|------|-------|
| `/privacy` | **NO metadata at all** — no title, description, or canonical |
| `/inquiry-cart` | **NO metadata at all** — no title, description, or canonical |
| `/kadernice/[slug]` | **NO metadata at all** — no dynamic title/description for individual stylist profiles |

### Fixes needed:

**`src/app/(public)/privacy/page.tsx`** — Add:
```typescript
export const metadata: Metadata = {
  title: "Ochrana osobních údajů",
  description: "Zásady ochrany osobních údajů — Hairland.cz",
  alternates: { canonical: "/privacy" },
};
```

**`src/app/(public)/inquiry-cart/page.tsx`** — Add:
```typescript
export const metadata: Metadata = {
  title: "Poptávkový košík",
  description: "Váš poptávkový košík — nezávazná poptávka prémiových vlasů k prodloužení.",
  alternates: { canonical: "/inquiry-cart" },
  robots: { index: false },  // Cart page should not be indexed
};
```

**`src/app/(public)/kadernice/[slug]/page.tsx`** — Add dynamic metadata:
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const stylist = await prisma.stylist.findUnique({ where: { slug } });
  if (!stylist) return {};
  return {
    title: `${stylist.name} — Kadeřnice`,
    description: stylist.bio?.slice(0, 155) || `${stylist.name} — spolupracující kadeřnice Hairland`,
    alternates: { canonical: `/kadernice/${slug}` },
  };
}
```

**`src/app/(public)/obchodni-podminky/page.tsx`** — Add missing fields:
```typescript
export const metadata: Metadata = {
  title: "Obchodní podmínky",
  description: "Obchodní podmínky e-shopu Hairland.cz — prodej prémiových vlasů k prodloužení.",
  alternates: { canonical: "/obchodni-podminky" },
};
```

**`src/app/(public)/registrace/page.tsx`** — Add missing canonical:
```typescript
alternates: { canonical: "/registrace" },
```

---

## 2. SITEMAP — MISSING (CRITICAL)

**`robots.txt` line 25** references `https://www.hairland.cz/sitemap.xml` but **no sitemap exists** — neither as a static file nor as a Next.js `sitemap.ts` route.

**Fix: Create `src/app/sitemap.ts`**

```typescript
import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.hairland.cz";

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${baseUrl}/offer`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/kadernice`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/pro`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/vykup`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/registrace`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/poradna`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/obchodni-podminky`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  // Dynamic: products
  const products = await prisma.product.findMany({
    where: { archived: false },
    select: { id: true, updatedAt: true },
  });
  const productPages = products.map((p) => ({
    url: `${baseUrl}/offer/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamic: stylists
  const stylists = await prisma.stylist.findMany({
    where: { active: true },
    select: { slug: true, updatedAt: true },
  });
  const stylistPages = stylists.map((s) => ({
    url: `${baseUrl}/kadernice/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Dynamic: poradna articles (static data, but still good for sitemap)
  // These use generateStaticParams from articles array — import and map

  return [...staticPages, ...productPages, ...stylistPages];
}
```

---

## 3. FAVICON — MISSING (CRITICAL)

Layout references `favicon.ico` and `icon.svg`:
```typescript
icons: {
  icon: [
    { url: "/favicon.ico", sizes: "32x32" },
    { url: "/icon.svg", type: "image/svg+xml" },
  ],
```

But **neither `/public/favicon.ico` nor `/public/icon.svg` exists**. Only `/public/icons/icon-192x192.png` and `/public/icons/icon-512x512.png` exist.

**Fix:**
1. Generate `favicon.ico` from the 192px icon: `convert /public/icons/icon-192x192.png -resize 32x32 /public/favicon.ico`
2. Copy SVG: `cp /public/icons/icon-192x192.svg /public/icon.svg`
3. Or update layout.tsx icon references to point to existing files

---

## 4. OG IMAGE — MISSING (CRITICAL)

Layout references `/og-image.jpg` for OpenGraph:
```typescript
openGraph: {
  images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
}
```

But **`/public/og-image.jpg` does NOT exist**. Social media shares will show no preview image.

**Fix:** Create a 1200x630px OG image and save as `/public/og-image.jpg`. Should include:
- Hairland logo
- "Prémiové vlasy k prodloužení"
- Brand colors (rose, espresso, nude background)

---

## 5. STRUCTURED DATA (JSON-LD) AUDIT

### Pages WITH JSON-LD (3/15) — Good start
| Page | Schema Type | Status |
|------|-------------|--------|
| `/` (homepage) | `Store` | OK — has name, url, description, address, email, sameAs |
| `/offer/[id]` | `Product` | OK — has name, description, image, offers with price/currency/availability |
| `/vykup` | `FAQPage` | OK — has FAQ structured data |

### Pages MISSING JSON-LD (should have)
| Page | Recommended Schema | Priority |
|------|-------------------|----------|
| `/kadernice` | `ItemList` of `Person` entries | HIGH |
| `/kadernice/[slug]` | `Person` with `jobTitle: "Kadeřnice"` | HIGH |
| `/poradna` | `ItemList` of `Article` | MEDIUM |
| `/poradna/[slug]` | `Article` with `headline`, `author`, `datePublished` | MEDIUM |
| `/contact` | `LocalBusiness` with `ContactPoint` | MEDIUM |
| `/about` | `Organization` | LOW |

### Existing JSON-LD Issues:

**Homepage Store schema** (`page.tsx:14-28`):
- Missing `telephone` field
- Missing `priceRange` (e.g., "Kč Kč Kč")
- Missing `image` (logo URL)
- Missing `openingHours`

**Product schema** (`offer/[id]/page.tsx:191-207`):
- Hardcodes `availability: "https://schema.org/InStock"` for ALL products — should be dynamic based on actual stock
- Missing `brand` field
- Missing `sku` field

---

## 6. NEXT/IMAGE OPTIMIZATION — NOT USED (MEDIUM)

The entire public site uses raw `<img>` tags instead of Next.js `<Image>`. Found 0 uses of `next/image` in public pages.

**Impact:** No automatic lazy loading, no WebP/AVIF conversion, no responsive srcset, no blur placeholder. Affects Core Web Vitals (LCP, CLS).

**Key areas using `<img>`:**
- Product photos in `/offer/` showcase
- Stylist photos in `/kadernice/`
- Color swatches everywhere (these are small — acceptable as `<img>`)
- Hero slider on homepage

**Fix priority:** HIGH for product photos and hero images (large LCP elements). LOW for small swatches.

**Note:** External images (Vercel Blob storage) need `remotePatterns` in `next.config.ts` to work with `next/image`.

---

## 7. HREFLANG TAGS — PARTIALLY CORRECT

`HreflangTags.tsx` correctly adds `<link rel="alternate" hrefLang="cs|uk|ru|x-default">` on all pages. However:

**Issue:** All hreflang URLs point to the SAME URL for all languages. This is technically correct IF the site serves content in the user's language based on cookie/accept-language (which it does via next-intl). Google may find this confusing since there are no separate `/cs/`, `/uk/`, `/ru/` URL paths.

**Recommendation:** Keep as-is — single URL with language detection is valid. The hreflang signals are correct for this setup.

---

## 8. HEADING HIERARCHY — MOSTLY OK

Spot-checked pages:
- Homepage: H1 per section (multiple H1s — not ideal but common in modern sites)
- `/offer`: H1 "Nabídka"
- `/offer/[id]`: H1 product name
- `/kadernice`: H1 title
- `/about`: H1 title
- `/contact`: H1 title

No major heading hierarchy issues detected.

---

## 9. ROBOTS.TXT — OK

`public/robots.txt` correctly:
- Allows `/` for all crawlers
- Blocks admin routes (`/dashboard`, `/login`, `/salon/`, `/settings/`, etc.)
- References sitemap (but sitemap doesn't exist yet — see #2)

---

## 10. MOBILE RESPONSIVENESS — OK

All public pages use responsive Tailwind classes (`max-w-*`, `sm:`, `lg:`, grid/flex layouts). The viewport meta tag is set correctly in root layout.

---

## PRIORITY FIX LIST

| # | Issue | Priority | Effort |
|---|-------|----------|--------|
| 1 | **Create sitemap.ts** — referenced in robots.txt but doesn't exist | CRITICAL | Medium |
| 2 | **Create/fix favicon.ico** — layout references it but file missing | CRITICAL | Low |
| 3 | **Create og-image.jpg** — OG image referenced but doesn't exist | CRITICAL | Low (needs design) |
| 4 | **Add metadata to /privacy** | HIGH | Low |
| 5 | **Add metadata to /inquiry-cart** (with noindex) | HIGH | Low |
| 6 | **Add generateMetadata to /kadernice/[slug]** | HIGH | Low |
| 7 | **Add description+canonical to /obchodni-podminky** | MEDIUM | Low |
| 8 | **Add canonical to /registrace** | MEDIUM | Low |
| 9 | **Add JSON-LD to /kadernice/[slug]** (Person schema) | MEDIUM | Low |
| 10 | **Add JSON-LD to /contact** (LocalBusiness) | MEDIUM | Low |
| 11 | **Fix Product JSON-LD** — dynamic availability instead of hardcoded InStock | MEDIUM | Low |
| 12 | **Enhance Store JSON-LD** — add telephone, image, priceRange | LOW | Low |
| 13 | **Migrate key images to next/image** — product photos, hero slider | LOW | High |
| 14 | **Add JSON-LD to /poradna articles** | LOW | Medium |

---

## FILES TO CREATE

| File | Purpose |
|------|---------|
| `src/app/sitemap.ts` | Dynamic sitemap with products + stylists |
| `public/favicon.ico` | Favicon (generate from existing icon) |
| `public/icon.svg` | SVG icon (copy from /icons/) |
| `public/og-image.jpg` | OpenGraph social preview image (1200x630) |

## FILES TO MODIFY

| File | Changes |
|------|---------|
| `src/app/(public)/privacy/page.tsx` | Add metadata export |
| `src/app/(public)/inquiry-cart/page.tsx` | Add metadata export with noindex |
| `src/app/(public)/kadernice/[slug]/page.tsx` | Add generateMetadata + JSON-LD |
| `src/app/(public)/obchodni-podminky/page.tsx` | Add description + canonical |
| `src/app/(public)/registrace/page.tsx` | Add canonical |
| `src/app/(public)/offer/[id]/page.tsx` | Fix hardcoded InStock in JSON-LD |
| `src/app/(public)/page.tsx` | Enhance Store JSON-LD |
| `src/app/(public)/contact/page.tsx` | Add LocalBusiness JSON-LD |
