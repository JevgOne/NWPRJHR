# QA Report: Reviews/Ratings Implementation (Task #6)

**Datum:** 2026-07-06
**QA provedl:** Kontrolor
**Build status:** PASS (npx next build — compiled successfully, TypeScript 0 errors)

---

## 1. Admin moderace — Tabs (pending/active/all)

**Status: PASS**

- `FilterType = "pending" | "active" | "all"` definovaný na line 71
- Výchozí stav `filter = "pending"` — admin vidí nejprve neschválené
- Tabs render s badge počítadlem pro "Ke schválení" (amber badge, line 274–278)
- `fetchReviews` používá `?filter=pending/active` (line 122)
- `fetchPendingCount` dělá samostatný fetch na `/api/reviews?filter=pending` (line 128)
- API route správně filtruje: `where.active = false` pro pending, `where.active = true` pro active (route.ts line 46–47)

**Problém (minor):** `fetchReviews` má `filter` v dependency array useCallback (line 126), ale je volán s explicitním argumentem v `handleFilterChange`. Funguje, ale `useCallback` se zbytečně recompiluje při každé změně filtru. Nefunkčnost to nezpůsobuje.

---

## 2. Pending banner + Approve/Reject tlačítka

**Status: PASS**

- Amber banner `"Čeká na schválení"` zobrazován pro `!r.active && filter !== "active"` (line 456)
- `handleApprove` volá PUT `{ active: true }` (line 224–232)
- `handleDelete` použit jako "Zamítnout" (line 469) — smaže recenzi, což odpovídá plánu
- Po approve/delete se volá `fetchPendingCount()` pro aktualizaci badge

---

## 3. Product binding v admin formuláři

**Status: PASS**

- `ProductOption` interface definovaný (line 29–32)
- Products se fetchují z `/api/products?archived=false` (line 142–150)
- Select dropdown s "Obecná recenze (bez produktu)" jako výchozí (line 305–315)
- `productId` v `FormState` jako `string` (line 98), odesílán do API
- API schema má `productId: z.string().optional()` (route.ts line 23)
- V review kartách zobrazena `r.product.name` s blue badge (line 503–507)
- `handleEdit` správně mapuje `r.productId ?? ""` (line 171)

---

## 4. Public stránka `/recenze`

**Status: PASS**

- Soubor existuje: `src/app/(public)/recenze/page.tsx`
- Renderuje jako `ƒ /recenze` (dynamic) v buildu
- `unstable_cache` s `tags: ["reviews"]` a `revalidate: 60` (line 38–40)
- SEO metadata: `title`, `description`, `canonical`, `openGraph` kompletní
- AggregateRating JSON-LD pro Organization (line 136–149) — podmíněně jen pokud `totalCount > 0`
- RatingBar komponenty pro kvalitu, komunikaci, rychlost
- SourceBadge pro Google (inline SVG) a Instagram (line 77–113)
- CTA link na `/offer` (line 257–263)

**Překlad keys:** Všechny klíče (`title`, `subtitle`, `reviewCount`, `qualityLabel`, `communicationLabel`, `speedLabel`, `writeReview`, `noReviews`) existují v `messages/cs.json`.

---

## 5. AggregateRating SEO v product detail

**Status: PASS**

- Fallback logika implementována (page.tsx line 312–325): product-specific → global
- `reviewsForSchema` fetchuje max 5 recenzí s `OR: [{productId}, {productId: null}]` (line 328–339)
- Product JSON-LD obsahuje `aggregateRating` (line 478–484) i `review[]` array (line 485–492)
- `reviewBody` oříznut na 200 znaků (line 490)
- Podmíněné: `aggregateRating` jen pokud `reviewStats._count > 0`, `review[]` jen pokud `reviewsForSchema.length > 0`

---

## 6. Cache invalidation

**Status: PASS s poznámkou**

- `revalidateTag` importován z `next/cache` v `[id]/route.ts` (line 7)
- Voláno po PUT (approve/edit) na line 78: `revalidateTag("reviews", "max")`
- Voláno po DELETE na line 101: `revalidateTag("reviews", "max")`
- `/recenze` page používá `tags: ["reviews"]` — cache bude invalidována
- `profile` argument `"max"` je validní v Next.js 16 API

**Poznámka:** POST route (`/api/reviews/route.ts`) neobsahuje `revalidateTag` — ale to je správně, protože nové recenze od admina jsou `active: true` ihned, a `/recenze` cache se aktualizuje do 60s automaticky (revalidate: 60).

---

## 7. Build výsledky

```
▲ Next.js 16.2.9 (Turbopack)
✓ Compiled successfully in 5.0s
TypeScript: 0 errors
/recenze: ƒ (Dynamic)
/reviews: ƒ (Dynamic)
```

---

## Souhrn

| Oblast | Status | Poznámka |
|--------|--------|----------|
| Admin tabs pending/active/all | PASS | |
| Pending banner + approve/reject | PASS | |
| Product binding dropdown | PASS | |
| Badge počet pending v tabu | PASS | |
| Public /recenze stránka | PASS | |
| SEO metadata /recenze | PASS | |
| AggregateRating JSON-LD /recenze | PASS | |
| AggregateRating + fallback product | PASS | |
| Individual Review JSON-LD snippets | PASS | |
| Cache invalidation (revalidateTag) | PASS | |
| i18n překlady | PASS | |
| TypeScript build | PASS | 0 errors |

**Celkový verdikt: SCHVÁLENO** — Implementace odpovídá plánu, build prochází, žádné kritické problémy.
