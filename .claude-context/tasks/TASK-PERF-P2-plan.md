# TASK: Performance P2 — select optimalizace, public page caching

**Status:** Plan ready
**Datum:** 2026-07-06

## Kontext

Navazuje na existující analýzu v `TASK-PERFORMANCE.md`. P1 úkoly (dashboard cache, AppShell badge counts, products props pass) jsou již hotové/popsané. Tento plán se zaměřuje na P2 položky:

1. **Prisma `select` místo `include`** na admin endpointech
2. **`unstable_cache` na public stránkách** (/offer, /kadernice, homepage)
3. **Lazy loading** těžkých komponent

---

## 1. Prisma `select` optimalizace

### A) Admin Products List — `src/app/(app)/products/page.tsx:14-19`

**Problém:** `include: { variants: { where: { active: true } } }` načítá všech 16 sloupců každé varianty.

**Fix:**
```typescript
prisma.product.findMany({
  where: { archived: false },
  select: {
    id: true,
    name: true,
    nameUk: true,
    nameRu: true,
    category: true,
    processingType: true,
    origin: true,
    texture: true,
    colorTone: true,
    photos: true,
    slug: true,
    archived: true,
    createdAt: true,
    _count: { select: { variants: { where: { active: true } } } },
    variants: {
      where: { active: true },
      select: {
        id: true,
        lengthCm: true,
        color: true,
        retailPricePerGram: true,
        wholesalePricePerGram: true,
        costPricePerGram: true, // potřeba pro serializeProductForRole
        sellingMode: true,
        pricePerPiece: true,
        retailPricePerPiece: true,
      },
    },
  },
  orderBy: { createdAt: "desc" },
})
```

**Dopad:** Redukce ~40% přenášených dat z DB (vynechá: updatedAt, active, costPricePerGram pro non-OWNER, createdAt na variantách, barcode-related fields).

**Pozor:** `serializeProductForRole()` musí být kompatibilní — ověřit jaké fieldy potřebuje.

### B) Sales List API — `src/app/api/sales/route.ts:102-117`

**Problém:**
```typescript
include: {
  items: true,                    // ALL fields of ALL sale items
  discounts: { include: { bearers: { include: { partner: true } } } },
  salon: true,                    // ALL salon fields
  customer: true,                 // ALL customer fields
  user: true,                     // ALL user fields (including hashedPassword!)
}
```

**Fix:**
```typescript
select: {
  id: true,
  saleNumber: true,
  customerType: true,
  status: true,
  paymentType: true,
  subtotal: true,
  discountAmount: true,
  totalAmount: true,
  grossMargin: true,
  completedAt: true,
  createdAt: true,
  note: true,
  orderId: true,
  salon: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true } },
  user: { select: { id: true, name: true } },
  _count: { select: { items: true } },
  discounts: {
    select: {
      id: true,
      percent: true,
      type: true,
      amountHalere: true,
    },
  },
}
```

**Dopad:** Eliminace hashedPassword leaku, ~60% méně dat. Detail endpoint (`/api/sales/[id]`) ponechat s `include` — tam se potřebují všechna data.

**Pozor:** `serializeSaleForRole()` musí být kompatibilní — ověřit jaké fieldy potřebuje na listu vs. detailu.

### C) Další API endpoints k optimalizaci

| Endpoint | Soubor | Problém | Fix |
|----------|--------|---------|-----|
| `GET /api/orders` | `orders/route.ts` | `include: { items, salon }` na listu | `select` na listu, `include` na detailu |
| `GET /api/invoices` | `invoices/route.ts` | `include: { company, salon }` | `select` — na listu stačí jméno |
| `GET /api/stock` | `stock/route.ts` | `include: { variant: { include: { product } } }` | `select` — stačí product.name + variant.lengthCm/color |
| `GET /api/deliveries` | `deliveries/route.ts` | `include: { variant: { include: { product } }, supplier }` | `select` |

---

## 2. Public page caching s `unstable_cache`

### A) Homepage — `src/app/(public)/page.tsx:71-81`

**Problém:** `prisma.stylist.findMany(...)` volá DB při každém page load.

**Fix:**
```typescript
import { unstable_cache } from "next/cache";

const getCachedStylists = unstable_cache(
  async () => {
    return prisma.stylist.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      take: 6,
      include: { salon: { select: { name: true } } },
    });
  },
  ["homepage-stylists"],
  { revalidate: 300, tags: ["stylists"] } // 5 min
);

// V komponentě:
const [t, tCategory, stylists] = await Promise.all([
  getTranslations("public"),
  getTranslations("category"),
  getCachedStylists(),
]);
```

### B) Kadeřnice stránka — `src/app/(public)/kadernice/page.tsx:39`

**Problém:** `prisma.stylist.findMany(...)` nekešované.

**Fix:**
```typescript
const getCachedAllStylists = unstable_cache(
  async () => {
    return prisma.stylist.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      include: { salon: { select: { name: true } } },
    });
  },
  ["public-stylists-all"],
  { revalidate: 300, tags: ["stylists"] } // 5 min
);
```

### C) Product Detail — `src/app/(public)/offer/[slug]/page.tsx`

**Problém:** Každý product detail dělá 4-5 DB queries:
1. `getProduct()` — product + variants (react `cache` only, per-request)
2. `getAllStockNumbers()` — 2 SQL queries
3. `prisma.salon.findUnique()` — pro B2B pricing
4. `prisma.review.aggregate()` — pro JSON-LD (řádek 313)
5. `prisma.product.findMany()` — related products (řádek 756)

**Fix — react `cache` je OK pro per-request deduplikace, ale přidat `unstable_cache` pro cross-request:**

```typescript
// Cached review stats per product
const getCachedReviewStats = unstable_cache(
  async (productId: string) => {
    return prisma.review.aggregate({
      where: { productId, active: true },
      _avg: { rating: true },
      _count: true,
    });
  },
  ["product-review-stats"],
  { revalidate: 300, tags: ["reviews"] }
);

// Cached related products
const getCachedRelatedProducts = unstable_cache(
  async (excludeId: string, category: string, origin: string | null, texture: string | null) => {
    return prisma.product.findMany({
      where: {
        archived: false,
        id: { not: excludeId },
        variants: { some: { active: true, retailPricePerGram: { gt: 0 } } },
      },
      select: { ... }, // existing select
      take: 20,
    });
  },
  ["related-products"],
  { revalidate: 120, tags: ["products"] }
);
```

### D) Blog stránka — `src/app/(public)/blog/page.tsx` (pokud existuje)

```typescript
const getCachedBlogPosts = unstable_cache(
  async () => {
    return prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      select: { id: true, slug: true, title: true, excerpt: true, coverImage: true, category: true, publishedAt: true },
    });
  },
  ["public-blog-posts"],
  { revalidate: 300, tags: ["blog"] }
);
```

### E) Cache invalidace

Přidat `revalidateTag()` volání v relevantních admin API endpointech:

| Akce | Tag | Kde přidat |
|------|-----|------------|
| Product create/update/delete | `"products"` | `api/products/[id]/route.ts`, `api/products/route.ts` |
| Variant change | `"products"` | `api/variants/[id]/route.ts` |
| Review create/update | `"reviews"` | `api/reviews/[id]/route.ts`, `api/public/reviews/route.ts` |
| Stylist create/update | `"stylists"` | `api/stylists/[id]/route.ts` |
| Blog publish/update | `"blog"` | `api/blog/[id]/route.ts` |

**Stávající:** `api/products/[id]/route.ts` a `api/variants/[id]/route.ts` UŽ volají `revalidateTag("products")`.

---

## 3. Lazy loading komponent

### Kandidáti

| Komponenta | Kde | Váha | Fix |
|-----------|-----|------|-----|
| `ProductReviews` | Product detail | Střední | Suspense boundary s fallback skeleton |
| `WriteReviewForm` | Product detail | Malá (client) | Už je dynamický import implicitně |
| Related products IIFE | Product detail | Velká (DB + render) | Suspense boundary |

**Fix pro Product Detail:**
```typescript
import { Suspense } from "react";

// Místo přímého volání:
<Suspense fallback={<div className="mt-10 border-t border-line pt-8 h-40 animate-pulse bg-nude-50 rounded-2xl" />}>
  <ProductReviews productId={product.id} />
</Suspense>

// Related products — extrahovat do async server component:
<Suspense fallback={<RelatedProductsSkeleton />}>
  <RelatedProducts productId={product.id} category={product.category} origin={product.origin} texture={product.texture} colorTone={product.colorTone} />
</Suspense>
```

---

## 4. Composite index na Sale

```prisma
model Sale {
  // ... existující
  @@index([completedAt, status]) // pro dashboard aggregate queries
}
```

---

## 5. Soubory k editaci

| Soubor | Akce | Popis |
|--------|------|-------|
| `src/app/(app)/products/page.tsx` | Edit | `select` místo `include` |
| `src/app/api/sales/route.ts` | Edit | `select` pro list endpoint |
| `src/app/(public)/page.tsx` | Edit | `unstable_cache` na stylisty |
| `src/app/(public)/kadernice/page.tsx` | Edit | `unstable_cache` na stylisty |
| `src/app/(public)/offer/[slug]/page.tsx` | Edit | Cache review stats + related, Suspense |
| `src/app/api/reviews/[id]/route.ts` | Edit | `revalidateTag("reviews")` |
| `src/app/api/stylists/*/route.ts` | Edit | `revalidateTag("stylists")` |
| `prisma/schema.prisma` | Edit | Composite index `[completedAt, status]` na Sale |

---

## 6. Implementační priorita

| # | Fix | Dopad | Složitost |
|---|-----|-------|-----------|
| 1 | `select` na products page | Střední | Nízká (15 min) |
| 2 | `select` na sales list API | Střední | Nízká (15 min) |
| 3 | `unstable_cache` homepage + kadernice | Střední | Nízká (15 min) |
| 4 | `unstable_cache` product detail (reviews, related) | Střední | Nízká (20 min) |
| 5 | Suspense boundaries v product detail | Nízký | Nízká (10 min) |
| 6 | Cache invalidation tags | Nízký | Nízká (10 min) |
| 7 | Composite index na Sale | Nízký | Triviální (5 min) |

**Celkový odhadovaný effort:** 1.5 hodiny.
