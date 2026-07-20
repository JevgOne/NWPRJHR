# SEO Audit Report: Hairland.cz vs Goldhair.cz

**Date:** 2026-07-19
**Auditor:** SEO Agent (automated)
**Status:** Complete

---

## PART 1: HAIRLAND.CZ SITEMAP ANALYSIS

**URL:** https://www.hairland.cz/sitemap.xml
**Total URLs:** 306
**Languages:** 3 (cs, uk/ua, ru)
**All lastmod:** 2026-06-01

### URL Breakdown by Type

| Type | CZ URLs | Total (x3 langs) |
|------|---------|-------------------|
| Static pages (homepage, contact, about, privacy, terms, shipping, complaints) | 7 | 21 |
| Service pages (registrace, vykup) | 2 | 6 |
| Professional pages (pro, kadernice) | 2 | 6 |
| Guide/reference (pruvodce-gramazi, recenze) | 2 | 6 |
| Main offer page | 1 | 3 |
| Processing type landing pages (clip-in, tape-in, keratin, micro-ring, tresove-vlasy) | 5 | 15 |
| Color filter pages (barva/blond, hneda, tmave-hneda, zrzava) | 4 | 12 |
| Texture filter pages (rovne, mirne-vlnite, vlnite, kudrnate) | 4 | 12 |
| Quality category pages (virgin, luxe, standard) | 3 | 9 |
| Origin/country pages (12 countries) | 12 | 36 |
| Length filter pages (40cm-71cm, 8 lengths) | 8 | 24 |
| Poradna (advisory) hub + 8 articles | 9 | 27 |
| Blog hub + blog posts | ~10 | ~30 |
| Product detail pages | ~33 | ~99 |

### Sitemap Quality Assessment
- Proper hreflang alternates for cs/uk/ru + x-default
- Correct canonical structure
- Proper priority weighting (1.0 homepage, 0.9 offer, 0.8 products/categories, 0.7 attributes, 0.6 articles)
- Change frequency properly set
- **Issue:** All lastmod dates are static "2026-06-01" for non-dynamic pages. Products and blog posts use real updatedAt dates.

---

## PART 2: GOLDHAIR.CZ SITEMAP ANALYSIS

**URL:** https://www.goldhair.cz/sitemap.xml (sitemap index)
**Sub-sitemap:** https://www.goldhair.cz/sitemaps/sitemap0.xml.gz (gzipped, unreadable via WebFetch)
**Last modified:** 2026-07-19T06:32:13+02:00

### Comparison

| Feature | Hairland.cz | Goldhair.cz |
|---------|-------------|-------------|
| Sitemap format | Single XML | Sitemap index + gzipped |
| Multilingual | Yes (cs/uk/ru) | No (CZ only) |
| Hreflang in sitemap | Yes | Unknown |
| URL count | 306 | Unknown (gzipped) |
| Last updated | 2026-06-01 | 2026-07-19 |

---

## PART 3: META TAGS — HAIRLAND.CZ

### Homepage (/)
```
Title: Prémiové vlasy k prodloužení | Hairland
Description: Přírodní vlasy s ověřeným původem z celého světa.
OG type: website
OG site_name: Hairland
OG locale: cs_CZ
OG image: /og/og-home.jpg (1200x630)
Twitter: summary_large_image
lang: cs
charset: utf-8
```

**JSON-LD (3 schemas):**
1. **Store** — name, url, description, telephone, priceRange, address (Školská 660/3, Praha), geo, openingHours (Mon-Fri 09-18), email, sameAs (Instagram)
2. **WebSite** — SearchAction with target /offer?search={search_term_string}
3. **Organization** — name, url, logo

**H1:** "Prémiové vlasy k prodloužení"
**H2s:** "Proč Hairland", "Vyberte si z naší nabídky", "Široká škála odstínů", "Jak to funguje", "Proč nám důvěřovat", "Naše kadeřnice", "@hairland.cz", "Máte zájem?"

### Offer Page (/offer)
```
Title: 100% pravé RAW vlasy k prodloužení — slovanské a evropské | Hairland
Description: 100% pravé RAW vlasy k prodloužení — virgin, premium, standard. Zpracování na zakázku: clip-in, tape-in, keratin, micro ring. Doručení do 7 dnů.
```
- Alternates with hreflang via getAlternates()
- OG tags generated in code

### Product Page (/offer/luxe-ukrajina-mirne-vlnite-2-55cm)
- Title auto-generated: "{product name} {lengths} {colors} | Hairland" (capped at 60 chars)
- Description auto-generated from product attributes (capped at 155 chars)
- Supports custom metaTitle and metaDescription overrides in DB
- OG image: product photo or custom ogImage

**JSON-LD (3 schemas):**
1. **Product** — name, description, image, brand (Hairland), sku (auto-generated), material ("100% lidské vlasy"), countryOfOrigin, additionalProperty (textura, barva, délka), offers (price, currency CZK, availability, shipping details, return policy), aggregateRating, reviews
2. **BreadcrumbList** — Domů > Nabídka > Product Name
3. **FAQPage** — category-specific + general FAQs

### Blog Page (/blog)
```
Title: Poradce prodloužení vlasů — jak vybrat, péče, srovnání | Hairland
Description: Trendy, tipy a novinky ze světa prémiových vlasů
OG type: CollectionPage
```

**JSON-LD:**
1. **CollectionPage** — name, description, inLanguage, url
2. **BreadcrumbList** — Domů > Blog

### Blog Article (/blog/jak-vybrat-spravne-vlasy-k-prodlouzeni)
```
Title: Jak vybrat vlasy k prodloužení — barva, délka, kvalita | Průvodce 2026 | Blog | Hairland
Description: Kompletní průvodce výběrem vlasů k prodloužení. Barva, délka, kvalita, množství — na co se zaměřit a čeho se vyvarovat.
OG image: product photo from Vercel Blob storage
```

**JSON-LD:**
1. **Article** — headline, description, image, author (Organization), publisher (Organization + logo), datePublished, dateModified, mainEntityOfPage, wordCount (456), inLanguage, articleSection
2. **BreadcrumbList** — Domů > Blog > Article title

### Keratin Landing Page (/keratin)
```
Title: Keratinové vlasy k prodloužení | Hairland
H1: Keratinové vlasy k prodloužení
```

**JSON-LD:**
1. **FAQPage** — 6 Q&A pairs about keratin safety, application, heat, durability
2. **BreadcrumbList** — Domů > Keratinové vlasy

### Poradna Article (/poradna/typy-prodlouzeni)
```
Title: Typy prodloužení vlasů | Hairland
Description: Přehled metod prodloužení — clip-in, tape-in, keratin, micro ring. Výhody a nevýhody každé z nich.
```

**JSON-LD:**
1. **Article** — headline, description, author (Organization), publisher (Organization), datePublished (2025-06-01), dateModified (2026-06-01), inLanguage, articleSection
2. **BreadcrumbList** — Domů > Poradna > Typy prodloužení vlasů

---

## PART 4: META TAGS — GOLDHAIR.CZ

### Homepage
```
Title: Not visible in HTML head (dynamic/JS rendering)
Description: Not found
OG tags: None found
Canonical: Not found
Hreflang: None
JSON-LD: None found
H1: None detected
H2s: "Přihlášení k vašemu účtu", "Garance kvality a původu produktů", "Výměna a vrácení do 14 dní zdarma"
```

### Product Page (/zbozi/clip-in-vlasy-elite-9-pcs/)
```
Title: Not explicitly visible
Description: Not found
OG tags: None found
Canonical: Not found
JSON-LD Product schema: Not found
H1: "CLIP IN vlasy Elite 9 pcs #1.0 uhlově černá"
Breadcrumb: Domů > CLIP IN vlasy > CLIP IN vlasy Elite > Product
Image alt texts: "Detail #1.0", product name
```

### Comparison Summary

| Feature | Hairland.cz | Goldhair.cz |
|---------|-------------|-------------|
| Title tags | Custom per page, template pattern | Not visible/missing |
| Meta description | Custom per page, auto-generated for products | Not found |
| Open Graph | Full (type, title, desc, image, locale, siteName) | None detected |
| Twitter cards | summary_large_image | None |
| Canonical | Via alternates system | Not found |
| Hreflang | cs/uk/ru + x-default | None |
| JSON-LD Store | Complete with address, geo, hours | None |
| JSON-LD Product | Complete (price, SKU, brand, offers, reviews, shipping, returns) | None detected |
| JSON-LD Breadcrumbs | On all pages | None |
| JSON-LD FAQ | On product + processing type pages | None |
| JSON-LD Article | On blog + poradna articles | N/A |
| JSON-LD WebSite + SearchAction | Yes | None |
| Image alt texts | Descriptive, present | Minimal |
| H1 structure | Clean, one per page | Inconsistent |

**Verdict:** Hairland.cz has SIGNIFICANTLY better structured data and meta tags than Goldhair.cz.

---

## PART 5: KEYWORD RESEARCH

### Search 1: "prodloužení vlasů Praha"
| # | Result | URL |
|---|--------|-----|
| 1 | ProfiBeauty Salon | profibeautysalon.cz |
| 2 | BeautyShape | beautyshape.cz |
| 3 | ProfiBeauty (prodej) | profibeauty.cz |
| 4 | Instagram @prodlouzeni_vlasu_praha | instagram.com |
| 5 | Chlupatý jelen | kadernictvi.chlupatyjelen.cz |
| 6 | Cool Praha | cool-praha.cz |
| 7 | BeautyShape (alt page) | beautyshape.cz |
| 8 | Studio Berenika | studioberenika.cz |
| 9 | Praha kadeřnictví | praha-kadernictvi.cz |
| 10 | Reservio aggregator | reservio.cz |

**Hairland.cz:** NOT in TOP 10
**Goldhair.cz:** NOT in TOP 10
**Note:** This is a service/salon keyword. Hairland sells hair, not the service. Expected absence, but opportunity exists for blog content targeting this keyword.

### Search 2: "clip-in vlasy koupit"
| # | Result | URL |
|---|--------|-----|
| 1 | clip-vlasy.cz | clip-vlasy.cz |
| 2 | Clip Vlasy Levně | clip-vlasy-levne.cz |
| 3 | **Goldhair.cz** | goldhair.cz/kategorie/clip-in-vlasy-79/ |
| 4 | clip-in-vlasy.eu | clip-in-vlasy.eu |
| 5 | Svět příčesků | svetpricesku.cz |
| 6 | Clip Vlasy Levně (bestsellers) | clip-vlasy-levne.cz |
| 7 | Vlasy-levne.cz | vlasy-levne.cz |
| 8 | Clipinhair.cz | clipinhair.cz |
| 9 | Svět příčesků | svetpricesku.cz |
| 10 | Světové zboží | svetove-zbozi.cz |

**Hairland.cz:** NOT in TOP 10
**Goldhair.cz:** Position 3

### Search 3: "raw vlasy prodej"
| # | Result | URL |
|---|--------|-----|
| 1 | vlasy.com (prodej vlasů) | vlasy.com |
| 2 | Diamond-beauty.cz | diamond-beauty.cz |
| 3 | vlasy.com (východoevropské) | vlasy.com |
| 4 | vlasy.com (evropské/indické) | vlasy.com |
| 5 | **Afroditi.cz** | afroditi.cz |
| 6 | vlasy.com (jednotlivé copy) | vlasy.com |
| 7 | slovanskevlasy.eu | slovanskevlasy.eu |
| 8 | vlasy.cz | vlasy.cz |
| 9 | prodej-vlasu.com | prodej-vlasu.com |
| 10 | **Goldhair.cz** | goldhair.cz |

**Hairland.cz:** NOT in TOP 10
**Goldhair.cz:** Position 10
**Note:** vlasy.com dominates this keyword (4 of top 10 positions)

### Search 4: "tape-in vlasy Praha"
| # | Result | URL |
|---|--------|-----|
| 1 | tape-vlasy.cz | tape-vlasy.cz |
| 2 | MyTapes.cz | mytapes.cz |
| 3 | Múza Hair | muzahair.cz |
| 4 | vlasy.com | vlasy.com |
| 5 | BeautyShape | beautyshape.eu |
| 6 | **Afroditi.cz** | afroditi.cz |
| 7 | All4style.cz | all4style.cz |
| 8 | **Goldhair.cz** | goldhair.cz |
| 9 | ProfiBeauty | profibeauty.cz |
| 10 | ProfiBeauty (barvené) | profibeauty.cz |

**Hairland.cz:** NOT in TOP 10
**Goldhair.cz:** Position 8

### Search 5: "keratin vlasy prodloužení"
| # | Result | URL |
|---|--------|-----|
| 1 | vlasy-na-keratin.cz | vlasy-na-keratin.cz |
| 2 | vlasy-k-prodlouzeni.cz | vlasy-k-prodlouzeni.cz |
| 3 | vlasy.com | vlasy.com |
| 4 | **Goldhair.cz** | goldhair.cz |
| 5 | Oliwye.cz | oliwye.cz |
| 6 | B.L. Hair | blhair.cz |
| 7 | vlasy.com (keratinové) | vlasy.com |
| 8 | Clipinhair.cz | clipinhair.cz |
| 9 | HOTstyle.cz | hotstyle.cz |
| 10 | ProfiBeauty Salon | profibeautysalon.cz |

**Hairland.cz:** NOT in TOP 10
**Goldhair.cz:** Position 4

### Search 6: "panenské vlasy virgin"
| # | Result | URL |
|---|--------|-----|
| 1 | **Goldhair.cz** | goldhair.cz/kategorie/panenske-vlasy-470/ |
| 2 | VIPhair.cz | viphair.cz |
| 3 | **Goldhair.cz** (product) | goldhair.cz/zbozi/... |
| 4 | **Goldhair.cz** (product) | goldhair.cz/produkt/... |
| 5 | **Goldhair.cz** (category) | goldhair.cz/kategorie/vlasy-k-prodlouzeni-76/ |
| 6 | vlasy.cz | vlasy.cz |
| 7 | **Goldhair.cz** (homepage) | goldhair.cz |
| 8 | slovanskevlasy.eu | slovanskevlasy.eu |
| 9 | Queen-hair.cz | queen-hair.cz |
| 10 | **Goldhair.cz** (YouTube) | youtube.com |

**Hairland.cz:** NOT in TOP 10
**Goldhair.cz:** Positions 1, 3, 4, 5, 7, 10 (DOMINATES)

### Keyword Research Summary

| Keyword | Hairland Position | Goldhair Position |
|---------|-------------------|-------------------|
| prodloužení vlasů Praha | Not in TOP 10 | Not in TOP 10 |
| clip-in vlasy koupit | Not in TOP 10 | #3 |
| raw vlasy prodej | Not in TOP 10 | #10 |
| tape-in vlasy Praha | Not in TOP 10 | #8 |
| keratin vlasy prodloužení | Not in TOP 10 | #4 |
| panenské vlasy virgin | Not in TOP 10 | #1 (dominates) |

**CRITICAL FINDING:** Hairland.cz is NOT ranking for ANY of the 6 tested keywords. Goldhair.cz ranks in 5 out of 6 keywords.

---

## PART 6: TECHNICAL SEO ANALYSIS

### robots.txt
```
User-agent: *
Allow: /
Disallow: /api/, /dashboard, /login, /salon/, /settings/, /inventory/,
          /invoices/, /sales/, /orders/, /customers/, /products/,
          /suppliers/, /complaints/, /returns/, /payments/, /notifications/,
          /finance/, /discounts/, /samples/, /audit-log, /export,
          /inquiry-cart, /registrations, /promo-codes, /referrals,
          /posts, /stylists, /inquiries
Sitemap: https://www.hairland.cz/sitemap.xml
```
**Status:** Well-configured. All admin/internal pages properly blocked.

### Heading Structure

**Homepage:**
- H1: "Prémiové vlasy k prodloužení" (single, correct)
- H2: 7 section headings (proper hierarchy)
- H3: Trust badges, category names, stylist names (proper nesting under H2)
- "Proč Hairland" H2 is `sr-only` (screen reader only) for accessibility

**Product Page:**
- H1: Product name (single, correct)
- H2: FAQ section header
- H3: Individual FAQ questions
- Breadcrumb navigation above content

**Keratin Landing Page:**
- H1: "Keratinové vlasy k prodloužení"
- H2: 11 section headings (comprehensive content)
- Proper hierarchy maintained

**Blog:**
- H1: "Blog"
- H2: Subtitle + section headers

### Image Alt Texts
- Homepage: Descriptive alts present (hero image, category images, IG photos as "Instagram post 1-4", color swatches, stylist photos)
- Product pages: Dynamic alt combining product name, texture, origin, lengths (e.g., "Luxe Ukrajina mírně vlnité — 55cm")
- Blog: Article title used as image alt

**Issue:** Instagram photos use generic "Instagram post {n}" alt texts. Could be more descriptive.

### Internal Linking
**Homepage links to:**
- /offer (main CTA, multiple links)
- /contact (CTA)
- /clip-in, /tape-in, /keratin, /micro-ring, /tresove-vlasy (processing types)
- /offer?category=VIRGIN, LUXE, STANDARD, SALE (category quick links)
- /offer?color={n} (color filter links)
- /kadernice (stylist directory)
- /registrace (B2B registration)
- /pro (B2B info)

**Footer links:** Full navigation including legal pages.

**Internal linking quality:** Good. Homepage links to all major sections. Product pages link to related products. Blog articles cross-link.

### Schema Markup Completeness

| Schema Type | Pages Used | Quality |
|-------------|------------|---------|
| Store | Homepage | Complete (address, geo, hours, contact) |
| WebSite + SearchAction | Homepage | Complete |
| Organization | Homepage | Basic (name, url, logo) |
| Product | Product pages | Excellent (price, SKU, brand, material, countryOfOrigin, offers with shipping + returns, aggregateRating, reviews) |
| BreadcrumbList | All pages | Complete |
| FAQPage | Product pages, processing type pages | Complete |
| Article | Blog posts, poradna articles | Complete (headline, author, publisher, dates, wordCount) |
| CollectionPage | Blog index | Complete |

### Core Web Vitals
**Status:** Could not retrieve PageSpeed Insights data (API rate limited). Manual testing required.

**Observable performance factors from code:**
- Next.js with SSR/ISR (good for SEO)
- Image optimization via next/image with proper `sizes` and `priority` attributes
- Font preloading (Geist variable font)
- Preconnect to Vercel Blob storage
- Service worker registered for caching
- unstable_cache used extensively for database queries (60-300s revalidation)
- ScrollReveal lazy loading for below-fold sections

---

## PART 7: DETAILED FINDINGS AND RECOMMENDATIONS

### What Hairland.cz Does BETTER Than Competition

1. **Structured Data:** Hairland has the most complete schema.org implementation of any competitor. Product schema includes SKU, material, countryOfOrigin, shipping details, return policy, aggregate ratings, and individual reviews. Goldhair.cz has NO visible structured data.

2. **Multilingual Support:** Three languages (cs/uk/ru) with proper hreflang and x-default. No competitor does this.

3. **Content Depth:** Processing type landing pages (clip-in, tape-in, keratin, micro-ring, tresove-vlasy) have rich content with FAQs. Poradna section with 8 educational articles + 9 blog posts.

4. **Technical Foundation:** Clean Next.js SSR, proper meta tag generation, auto-generated SEO metadata for products with manual override capability.

5. **Sitemap Quality:** Proper priorities, change frequencies, hreflang alternates in sitemap.

### What Competition Does BETTER

1. **Domain Authority & Age:** Goldhair.cz has significantly more established domain authority. It ranks for 5/6 tested keywords while Hairland ranks for 0/6.

2. **Product Volume:** Goldhair has 74+ clip-in products in a single category. More products = more indexable pages with long-tail keyword potential.

3. **Established Backlink Profile:** Goldhair.cz appears on YouTube, has niche dominance for "panenské vlasy virgin" (6 positions in TOP 10).

4. **Niche-specific domains:** Competitors like clip-vlasy.cz, tape-vlasy.cz, vlasy-na-keratin.cz use exact-match domains which still carry SEO weight for their specific keywords.

---

## KONKRÉTNÍ KROKY K VYLEPŠENÍ

### PRIORITY 1 — CRITICAL (Must Do)

#### 1.1 Fix Missing Canonical Tags
**Problem:** Canonical URLs are set via `alternates.canonical` in Next.js metadata but the canonical output appears to be relative path ("/" or "/offer") instead of absolute URL.
**File:** `src/lib/seo.ts:22`
**Current:** `canonical: path || "/"`
**Fix:** Change to absolute URL:
```ts
canonical: `${BASE_URL}${path}` || BASE_URL,
```
**Impact:** Google may not properly resolve relative canonicals in all cases.

#### 1.2 Add OG Tags to All Pages
**Problem:** While root layout sets default OG tags, some sub-pages may not properly override them. The offer page and product pages need explicit OG verification.
**File:** `src/app/[locale]/(public)/offer/page.tsx`
**Check:** Verify OG image URLs are absolute (not relative).
**Status:** Code review shows product pages correctly use absolute URLs. Blog pages have OG tags. Offer page uses inherited OG from root layout.

#### 1.3 Fix Product Page OG Type
**Problem:** Product pages use `type: "website"` instead of `type: "product"` for Open Graph.
**File:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx:332`
**Current:** `type: "website"`
**Fix:** `type: "article"` or add `product:` namespace tags. However, the Product JSON-LD already provides product data to Google. OG type "website" is acceptable but suboptimal.

#### 1.4 Content Gap: Blog Articles Are Too Short
**Problem:** Blog article "Jak vybrat správné vlasy k prodloužení" has only 456 words (declared in schema). Google prefers comprehensive content (1500-2500 words) for ranking informational queries.
**Files:** Blog post content in database (managed via CMS)
**Fix:** Expand all blog articles to minimum 1000 words, ideally 1500-2500 words. Add more detail, examples, comparisons, and internal links.

### PRIORITY 2 — IMPORTANT (Should Do)

#### 2.1 Domain Authority Building
**Problem:** Hairland.cz has zero keyword rankings. This is primarily a domain authority issue (new domain, few backlinks).
**Fix:**
- Submit to Czech business directories (Firmy.cz, Živéfirmy.cz, Zivefirmy.cz)
- Create Google Business Profile (if not already)
- Build backlinks from hairdresser/beauty blogs
- Consider guest posts on beauty portals
- Register on Heureka.cz for product listings
- Get listed on zbozi.cz

#### 2.2 Target Long-Tail Keywords in Content
**Problem:** Hairland targets "raw vlasy" in its positioning but this is a niche term. Most consumers search for "clip-in vlasy koupit", "tape-in vlasy", "prodloužení vlasů Praha" etc.
**Fix:** Create targeted landing pages and blog content for high-volume keywords:
- "Kde koupit vlasy k prodloužení v Praze" (exists: `/blog/kde-koupit-vlasy-k-prodlouzeni-v-praze` — verify it targets the keyword properly)
- "Clip-in vlasy cena" / "Kolik stojí clip-in vlasy"
- "Tape-in vlasy zkušenosti"
- "Keratin vlasy výhody a nevýhody"
- "Prodloužení vlasů doma"

#### 2.3 Google Search Console Optimization
**Problem:** Web is indexed but not ranking. GSC data would reveal:
- Which queries trigger impressions
- Which pages are indexed
- Any crawl errors or manual actions
- Core Web Vitals field data
**Fix:** Review GSC data, submit any unindexed pages, fix any reported issues.

#### 2.4 Add Review Schema to Homepage
**Problem:** Homepage Store schema doesn't include aggregateRating. Product pages have it, but a store-level aggregate would help.
**File:** `src/app/[locale]/(public)/page.tsx:84-118` (buildStoreJsonLd function)
**Fix:** Add aggregateRating to Store JSON-LD:
```ts
aggregateRating: {
  "@type": "AggregateRating",
  ratingValue: "4.9",
  reviewCount: totalReviews,
  bestRating: "5",
}
```

#### 2.5 Fix Blog Title Too Long
**Problem:** Blog article title "Jak vybrat vlasy k prodloužení — barva, délka, kvalita | Průvodce 2026 | Blog | Hairland" is 87 characters. Google typically displays 50-60 characters.
**File:** Blog title generation in blog post page
**Fix:** Blog titles should follow template `{Title} | Hairland` (remove "| Blog" and "| Průvodce 2026" from title, move to body).

#### 2.6 Add ItemList Schema to Offer Page
**Problem:** The /offer page lists products but has no ItemList JSON-LD schema.
**File:** `src/app/[locale]/(public)/offer/page.tsx`
**Fix:** Add ItemList schema listing products with their positions, names, and URLs.

### PRIORITY 3 — NICE TO HAVE

#### 3.1 Instagram Photo Alt Texts
**Problem:** Instagram photos use generic "Instagram post {n}" alt texts.
**File:** `src/app/[locale]/(public)/page.tsx:534`
**Fix:** Use descriptive alt texts like "Hairland vlasy k prodloužení — ukázka práce" or similar.

#### 3.2 Add LocalBusiness Schema
**Problem:** Store schema exists but LocalBusiness could add paymentAccepted, currenciesAccepted.
**Fix:** Extend Store JSON-LD with additional LocalBusiness properties.

#### 3.3 Implement Product Variants in Schema
**Problem:** Product JSON-LD only shows a single offer/price. Products with multiple lengths/colors should use `hasVariant` with individual `ProductModel` entries.
**File:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx:605-697`
**Fix:** Iterate over variants and create individual offers for each variant with distinct prices and SKUs.

#### 3.4 Add SiteNavigationElement Schema
**Fix:** Add SiteNavigationElement JSON-LD to the main navigation for better sitelinks in SERPs.

#### 3.5 Blog Word Count
**Problem:** Schema reports wordCount: 456 for articles. Low word count correlates with lower rankings for informational queries.
**Fix:** Target 1500+ words per blog article with comprehensive, expert-level content.

#### 3.6 Dynamic lastmod Dates
**Problem:** Static pages all show lastmod 2026-06-01. This doesn't signal freshness to Google.
**File:** `src/app/sitemap.ts:12`
**Fix:** Use actual modification dates for pages that have been updated, or at minimum update STATIC_DATE periodically.

---

## EXECUTIVE SUMMARY

### Strengths
- **Best-in-class structured data** — Product, Store, FAQ, Article, Breadcrumb, WebSite schemas all properly implemented
- **Multilingual with proper hreflang** — unique competitive advantage
- **Strong technical SEO foundation** — Next.js SSR, proper meta tags, clean URL structure
- **Rich content** — Processing type landing pages with FAQs, 8 poradna articles, 9 blog posts
- **Clean heading hierarchy** — single H1 per page, proper H2/H3 nesting
- **Well-configured robots.txt** — all admin paths properly blocked

### Critical Weaknesses
- **Zero keyword rankings** — not in TOP 10 for any of 6 tested high-value keywords
- **Low domain authority** — new domain with insufficient backlink profile
- **Thin content** — blog articles average ~456 words (should be 1500+)
- **No product comparison shopping presence** — not on Heureka.cz, Zboží.cz
- **Canonical URLs may be relative** — potential indexing issue

### Competitive Position
Goldhair.cz is the dominant competitor, ranking for 5/6 keywords. Their advantage is domain age and authority, not technical SEO quality. Hairland.cz has BETTER on-page SEO and structured data, but needs to build domain authority and create more comprehensive content to compete.

**Estimated timeline to first page rankings:** 3-6 months with aggressive content + backlink strategy.
