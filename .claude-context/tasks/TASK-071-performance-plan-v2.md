# TASK-071: Performance analýza a optimalizace — Plán v2

**Status:** Plan ready
**Datum:** 2026-07-14
**Kontakt:** Uživatel hlásí: "produkty se načítají hrooozne pomalu" + "admin panel hrozne dlouho se to načíta"

---

## Shrnutí předchozích optimalizací (co UŽ je hotové)

Z předchozích TASK-071 a TASK-PERF-P2 bylo implementováno:

1. **In-memory cache `getAllStockNumbers()`** — 30s TTL, `src/lib/stock.ts`
2. **In-memory cache loyalty settings** — 5min TTL, `src/lib/loyalty.ts`
3. **Dashboard SQL optimization** — raw SQL GROUP BY místo JS agregace
4. **Dashboard `unstable_cache`** — 30s revalidate, `src/app/(app)/dashboard/page.tsx`
5. **AppShell badge counts** — server-side `unstable_cache` v `src/app/(app)/layout.tsx`
6. **Public products** — `getCachedAllProducts()` předány jako `initialProducts` props
7. **Product detail caching** — `getCachedProductBySlug/ById` + `getCachedReviewData`
8. **Homepage stylists** — `unstable_cache` s 300s revalidate
9. **Blog/kadernice/recenze** — vše za `unstable_cache`
10. **Turso embedded replicas** — kód v `src/lib/db.ts` připraven (env flag `TURSO_EMBEDDED_REPLICA`)
11. **Notification polling** — sníženo z 30s na 60s

---

## Co STÁLE způsobuje pomalost (zbývající problémy)

### PROBLÉM A: Related products query — UNCACHED, inline IIFE (VYSOKÁ priorita)

**Soubor:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx:954-1017`

Uvnitř `ProductDetailView` je inline async IIFE, která při KAŽDÉM product detail requestu:
1. `prisma.product.findMany()` — načte až 20 produktů s variantami (UNCACHED, mimo unstable_cache)
2. `getAllStockNumbers()` — další 2 SQL queries (cache hit jen pokud < 30s)

Tato query NENÍ zabalená do `unstable_cache` — jde mimo produkt cache! Každý návštěvník product detailu triggeruje minimálně 1-3 DB roundtripy navíc.

**Fix:**
```typescript
const getCachedRelatedCandidates = unstable_cache(
  async (excludeId: string) => {
    return prisma.product.findMany({
      where: {
        archived: false,
        id: { not: excludeId },
        variants: { some: { active: true, OR: [...] } },
      },
      select: { /* existing select */ },
      take: 20,
    });
  },
  ["related-products"],
  { revalidate: 120, tags: ["products"] }
);
```

Nebo lépe: vyextrahovat do Suspense-wrapped async server componenty `RelatedProducts`, aby neblokovala hlavní render.

---

### PROBLÉM B: B2B settings — nekešované na product detail (STŘEDNÍ priorita)

**Soubor:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx:313-319`

```typescript
if (role === "HAIRDRESSER" || role === "SALON") {
  const b2bSettings = await prisma.b2BSettings.findFirst();  // UNCACHED!
  ...
}
```

Stejný problém na `src/app/[locale]/(public)/offer/page.tsx:97-99`.

A na `src/app/api/salon-portal/catalog/route.ts:24` — salon catalog API taky volá `prisma.b2BSettings.findFirst()` bez cache.

**Fix:** Přidat in-memory cache s 5min TTL (analogicky k loyalty cache):
```typescript
// src/lib/b2b-pricing.ts
let cachedB2B: { data: B2BSettings; timestamp: number } | null = null;
const B2B_CACHE_TTL = 300_000; // 5 min

export async function getCachedB2BSettings() {
  if (cachedB2B && Date.now() - cachedB2B.timestamp < B2B_CACHE_TTL) return cachedB2B.data;
  const settings = await prisma.b2BSettings.findFirst();
  if (settings) cachedB2B = { data: settings, timestamp: Date.now() };
  return settings;
}
```

---

### PROBLÉM C: Sales API — `include` everything na listu (STŘEDNÍ priorita)

**Soubor:** `src/app/api/sales/route.ts:103-116`

```typescript
include: {
  items: true,                    // ALL fields of ALL sale items
  discounts: { include: { bearers: { include: { partner: true } } } },
  salon: true,                    // ALL salon fields
  customer: true,                 // ALL customer fields  
  user: true,                     // ALL user fields (INCLUDING hashedPassword!)
}
```

Na listu 50 prodejů načítá kompletní relační stromy. Navíc user `include` zahrnuje `hashedPassword` — bezpečnostní problém!

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
  totalCostOfGoods: true,
  completedAt: true,
  createdAt: true,
  note: true,
  orderId: true,
  salon: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true } },
  user: { select: { id: true, name: true } },
  _count: { select: { items: true } },
  discounts: {
    select: { id: true, percent: true, type: true, amountHalere: true },
  },
}
```

**Pozor:** Ověřit kompatibilitu s `serializeSaleForRole()`. Detail endpoint (`/api/sales/[id]`) ponechat s `include`.

---

### PROBLÉM D: Admin products page — select vs include (STŘEDNÍ priorita)

**Soubor:** `src/app/(app)/products/page.tsx:15-63`

Již vylepšen (používá `select` místo `include`) — ale stále nemá `unstable_cache`. Každý load admin products = 2 DB calls (products + stock). Dashboard je kešovaný, products page ne.

**Fix:** Přidat `unstable_cache` s 15-30s revalidate:
```typescript
const getCachedAdminProducts = unstable_cache(
  async () => {
    const [products, allStock] = await Promise.all([
      prisma.product.findMany({ where: { archived: false }, select: { ... }, orderBy: { createdAt: "desc" } }),
      getAllStockNumbers(),
    ]);
    return { products, allStock };
  },
  ["admin-products"],
  { revalidate: 15, tags: ["products"] }
);
```

---

### PROBLÉM E: Salon portal catalog — include all fields (STŘEDNÍ priorita)

**Soubor:** `src/app/api/salon-portal/catalog/route.ts:26-36`

```typescript
prisma.product.findMany({
  where: { archived: false },
  include: {
    variants: {
      where: { active: true },
      orderBy: [{ lengthCm: "asc" }, { color: "asc" }],
    },
  },
  orderBy: { name: "asc" },
})
```

Používá `include` místo `select` — načítá všechny variant fields (costPricePerGram, retailManualOverride atd.) i když je nepotřebuje.

**Fix:** Změnit na `select` s jen potřebnými fieldy:
```typescript
prisma.product.findMany({
  where: { archived: false },
  select: {
    id: true, name: true, nameUk: true, nameRu: true,
    category: true, processingType: true, origin: true, texture: true, photos: true,
    variants: {
      where: { active: true },
      select: {
        id: true, lengthCm: true, color: true,
        retailPricePerGram: true, retailPricePerPiece: true, pricePerPiece: true,
        sellingMode: true,
      },
      orderBy: [{ lengthCm: "asc" }, { color: "asc" }],
    },
  },
  orderBy: { name: "asc" },
})
```

---

### PROBLÉM F: Admin product detail — include ALL variants (NÍZKÁ priorita)

**Soubor:** `src/app/(app)/products/[id]/page.tsx:16-19`

```typescript
prisma.product.findUnique({
  where: { id },
  include: {
    variants: { orderBy: [{ lengthCm: "asc" }, { color: "asc" }] },
  },
})
```

Načítá VŠECHNY varianty (i neaktivní) se VŠEMI sloupci. Pro admin detail je to potřeba (editace), takže to je OK — ale chybí cache.

---

### PROBLÉM G: Turso embedded replicas — možná neaktivní v produkci (VYSOKÁ priorita)

**Soubor:** `src/lib/db.ts`

Kód pro embedded replicas je připraven, ale aktivuje se jen při `TURSO_EMBEDDED_REPLICA=true`. Je potřeba ověřit, zda je tento env var nastaven na Vercelu.

**Dopad pokud NE:** Každý DB dotaz = HTTP roundtrip na Turso (50-200ms). S embedded replikami = ~0ms pro čtení.

**Akce:** Ověřit Vercel env vars. Pokud `TURSO_EMBEDDED_REPLICA` není nastaven → nastavit na `true`.

---

### PROBLÉM H: Product detail — 3x volání `getAllStockNumbers()` (STŘEDNÍ priorita)

Na product detail page se `getAllStockNumbers()` volá:
1. Uvnitř `getCachedProductBySlug()` (řádek 123) — za cache, OK
2. V related products IIFE (řádek 993) — mimo cache, zbytečné pokud <30s od #1
3. `b2BSettings.findFirst()` — extra DB call pro B2B uživatele

S 30s in-memory cache na stock je #2 obvykle cache hit. Ale na cold start / po invalidaci to jsou 2+2 SQL queries navíc.

---

### PROBLÉM I: Žádné loading.tsx soubory v admin panelu (STŘEDNÍ priorita)

V celém projektu NEEXISTUJE ani jeden `loading.tsx` soubor. To znamená, že při navigaci mezi admin stránkami uživatel nevidí žádný loading state — stránka prostě "zamrzne" dokud se nenačtou všechna server-side data.

**Dopad:** Uživatel vnímá admin jako "hrozně pomalý" i když data trvají jen 200-500ms, protože není žádná vizuální indikace načítání.

**Fix:** Přidat `loading.tsx` do klíčových admin route segmentů:

```
src/app/(app)/loading.tsx              — hlavní admin skeleton
src/app/(app)/dashboard/loading.tsx    — dashboard skeleton
src/app/(app)/products/loading.tsx     — products list skeleton
src/app/(app)/sales/loading.tsx        — sales list skeleton
src/app/(app)/invoices/loading.tsx     — invoices skeleton
src/app/(app)/inventory/loading.tsx    — inventory skeleton
src/app/(app)/orders/loading.tsx       — orders skeleton
src/app/(app)/salons/loading.tsx       — salons skeleton
src/app/(salon)/salon/loading.tsx      — salon portal skeleton
```

Minimální implementace:
```tsx
// src/app/(app)/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-nude-100 rounded-lg w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-nude-100 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-nude-100 rounded-xl" />
    </div>
  );
}
```

Toto je čistě UX improvement — nezrychlí skutečné načítání dat, ale dramaticky zlepší vnímanou rychlost (perceived performance).

---

### PROBLÉM J: Admin komponenty — dynamic imports (NÍZKÁ priorita)

Některé admin client komponenty jsou velké a mohly by být lazy-loaded:

| Komponenta | Soubor | Důvod |
|-----------|--------|-------|
| `NewSaleWizard` | `src/app/(app)/sales/new/NewSaleWizard.tsx` | Komplexní wizard, není potřeba na listu |
| `ExportClient` | `src/app/(app)/export/ExportClient.tsx` | Exporty se používají zřídka |
| `StylistForm` | `src/app/(app)/stylists/StylistForm.tsx` | Formulář jen pro vytváření/editaci |

```typescript
import dynamic from "next/dynamic";
const NewSaleWizard = dynamic(() => import("./NewSaleWizard").then(m => ({ default: m.NewSaleWizard })));
```

Reálný dopad je nízký — tyto komponenty se načítají jen na svých stránkách. Větší benefit má `loading.tsx`.

---

## Implementační plán — prioritizovaný

### Fáze 1: Quick wins (nejvyšší dopad, minimální riziko)

| # | Fix | Soubor | Dopad | Čas |
|---|-----|--------|-------|-----|
| 1.1 | Cache related products query | `offer/[...slug]/page.tsx` | Vysoký — eliminace 1-3 DB calls na každý product detail | 20 min |
| 1.2 | Cache B2B settings (in-memory 5min TTL) | nový `src/lib/b2b-pricing.ts` + update volajících | Střední — eliminace DB call pro B2B uživatele | 15 min |
| 1.3 | Ověřit `TURSO_EMBEDDED_REPLICA=true` na Vercelu | Vercel Dashboard | Potenciálně OBROVSKÝ — 99% redukce read latence | 5 min |

### Fáze 2: API optimalizace (security + performance)

| # | Fix | Soubor | Dopad | Čas |
|---|-----|--------|-------|-----|
| 2.1 | Sales list: `select` místo `include` | `api/sales/route.ts` | Střední + security (hashedPassword leak) | 20 min |
| 2.2 | Salon catalog: `select` místo `include` | `api/salon-portal/catalog/route.ts` | Střední — méně dat z DB | 10 min |
| 2.3 | Admin products cache | `(app)/products/page.tsx` | Střední — cache hit po 1. loadu | 15 min |

### Fáze 3: UX & Architectural improvements

| # | Fix | Soubor | Dopad | Čas |
|---|-----|--------|-------|-----|
| 3.1 | Přidat loading.tsx do admin route segmentů | 8-9 nových souborů | Vysoký UX — okamžitý loading feedback | 30 min |
| 3.2 | Related products → Suspense component | `offer/[...slug]/page.tsx` | UX — neblokuje hlavní render | 20 min |
| 3.3 | Composite index `[completedAt, status]` na Sale | `prisma/schema.prisma` | Nízký — zrychlí dashboard aggregate | 5 min |

---

## Detailní implementační instrukce

### 1.1 — Cache related products

**Soubor:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx`

Vyextrahovat related products do `unstable_cache`:

```typescript
const getCachedRelatedCandidates = unstable_cache(
  async (excludeId: string) => {
    return prisma.product.findMany({
      where: {
        archived: false,
        id: { not: excludeId },
        variants: { some: { active: true, OR: [{ retailPricePerGram: { gt: 0 } }, { retailPricePerPiece: { gt: 0 } }] } },
      },
      select: {
        id: true, slug: true, name: true, nameUk: true, nameRu: true,
        category: true, origin: true, texture: true, colorTone: true, photos: true,
        variants: {
          where: { active: true },
          select: { id: true, lengthCm: true, color: true, retailPricePerGram: true, sellingMode: true, retailPricePerPiece: true },
        },
      },
      take: 20,
    });
  },
  ["related-product-candidates"],
  { revalidate: 120, tags: ["products"] }
);
```

Pak v inline IIFE použít `getCachedRelatedCandidates(product.id)` místo přímého `prisma.product.findMany()`.

Stock numbers pro related products nepotřebují přesná čísla — zobrazují se jen jako karty. Ale aktuální kód je volá, takže ponechat s existujícím in-memory cache (30s TTL).

### 1.2 — Cache B2B settings

**Nový soubor:** `src/lib/b2b-pricing.ts`

```typescript
import { prisma } from "./db";

let cachedB2B: { data: { hairdresserDiscountPct: number; salonDiscountPct: number }; timestamp: number } | null = null;
const B2B_CACHE_TTL = 300_000; // 5 min

export async function getCachedB2BSettings() {
  if (cachedB2B && Date.now() - cachedB2B.timestamp < B2B_CACHE_TTL) return cachedB2B.data;
  const settings = await prisma.b2BSettings.findFirst();
  const data = {
    hairdresserDiscountPct: settings?.hairdresserDiscountPct ?? 2000,
    salonDiscountPct: settings?.salonDiscountPct ?? 3000,
  };
  cachedB2B = { data, timestamp: Date.now() };
  return data;
}

export function invalidateB2BCache() {
  cachedB2B = null;
}
```

**Aktualizovat volající:**
- `src/app/[locale]/(public)/offer/[...slug]/page.tsx:313` — nahradit `prisma.b2BSettings.findFirst()` za `getCachedB2BSettings()`
- `src/app/[locale]/(public)/offer/page.tsx:97` — totéž
- `src/app/api/salon-portal/catalog/route.ts:24` — totéž
- `src/app/api/b2b-settings/route.ts` (PUT) — přidat `invalidateB2BCache()` volání

### 1.3 — Ověřit Turso embedded replicas na Vercelu

**Akce:** Zkontrolovat Vercel env vars → `TURSO_EMBEDDED_REPLICA` musí být `true`.

Pokud není nastaveno, celý `db.ts` fallback větev se použije → všechny reads jdou přes HTTP na remote Turso. To je s největší pravděpodobností HLAVNÍ příčina pomalosti.

### 2.1 — Sales list select

**Soubor:** `src/app/api/sales/route.ts` — GET handler (řádek 102-117)

Změnit `include` na `select`:
```typescript
const sales = await prisma.sale.findMany({
  where,
  select: {
    id: true,
    saleNumber: true,
    customerType: true,
    status: true,
    paymentType: true,
    subtotal: true,
    discountAmount: true,
    totalBeforeVat: true,
    vatAmount: true,
    totalAmount: true,
    totalCostOfGoods: true,
    grossMargin: true,
    completedAt: true,
    createdAt: true,
    note: true,
    orderId: true,
    receiptNumber: true,
    salon: { select: { id: true, name: true } },
    customer: { select: { id: true, name: true } },
    user: { select: { id: true, name: true, email: true } },
    _count: { select: { items: true } },
    discounts: {
      select: { id: true, percent: true, type: true, amountHalere: true },
    },
  },
  orderBy: { completedAt: "desc" },
  skip: (page - 1) * limit,
  take: limit,
});
```

**POZOR:** `serializeSaleForRole()` může potřebovat úpravu. Ověřit `src/lib/api/sale-serializer.ts` jaké fieldy používá pro list vs. detail. Pokud serializer padá na chybějící fieldy, buď přidat do select, nebo vytvořit light verzi serializeru pro list endpoint.

### 2.2 — Salon catalog select

**Soubor:** `src/app/api/salon-portal/catalog/route.ts` (řádek 26-36)

Změnit:
```typescript
// FROM:
include: {
  variants: {
    where: { active: true },
    orderBy: [{ lengthCm: "asc" }, { color: "asc" }],
  },
}

// TO:
select: {
  id: true, name: true, nameUk: true, nameRu: true,
  category: true, processingType: true, origin: true, texture: true, photos: true,
  variants: {
    where: { active: true },
    select: {
      id: true, lengthCm: true, color: true,
      retailPricePerGram: true, retailPricePerPiece: true, pricePerPiece: true,
      sellingMode: true,
    },
    orderBy: [{ lengthCm: "asc" }, { color: "asc" }],
  },
}
```

### 2.3 — Admin products cache

**Soubor:** `src/app/(app)/products/page.tsx`

Zabalit DB queries do `unstable_cache`:
```typescript
import { unstable_cache } from "next/cache";

const getCachedAdminProducts = unstable_cache(
  async () => {
    const [products, allStock] = await Promise.all([
      prisma.product.findMany({ /* existing select */ }),
      getAllStockNumbers(),
    ]);
    return { products, stockMap: Object.fromEntries(allStock) };
  },
  ["admin-products"],
  { revalidate: 15, tags: ["products"] }
);
```

### 3.1 — Related products Suspense

**Soubor:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx`

Vyextrahovat inline IIFE do samostatné async server componenty:

```typescript
// V hlavním renderu:
<Suspense fallback={<div className="mt-12 pt-8 border-t border-line h-40 animate-pulse bg-nude-50 rounded-2xl" />}>
  <RelatedProducts
    productId={product.id}
    category={product.category}
    origin={product.origin}
    texture={product.texture}
    colorTone={product.colorTone}
  />
</Suspense>

// Nová async server komponenta (ve stejném souboru nebo nový soubor):
async function RelatedProducts({ productId, category, origin, texture, colorTone }: { ... }) {
  const candidates = await getCachedRelatedCandidates(productId);
  // ... scoring logic ...
  // ... render ...
}
```

### 3.2 — Composite index

**Soubor:** `prisma/schema.prisma` — model Sale

Přidat:
```prisma
@@index([status, completedAt])
```

Pak `npx prisma db push` nebo migrace.

---

## Očekávaný dopad

| Oblast | Před | Po | Zlepšení |
|--------|------|-----|---------|
| Product detail (public) | 3-5 DB calls, ~300-1000ms | 0-1 DB calls (cache hit), ~50-100ms | **80-90%** |
| Admin products page | 2 DB calls, ~200-400ms | Cache hit ~20ms | **90%** |
| Salon catalog | 3 DB calls (incl. include all), ~300-600ms | 2 DB calls (select only), ~150-300ms | **50%** |
| Sales list | Heavy include, ~300-500ms | Light select, ~100-200ms | **60%** |
| S embedded replikami | Všechny reads 50-200ms/query | Reads ~0ms (lokální SQLite) | **95-99%** |

**Nejdůležitější single fix:** Ověřit a aktivovat `TURSO_EMBEDDED_REPLICA=true` na Vercelu. Pokud toto chybí, je to s 99% pravděpodobností hlavní příčina "hrooozne pomalého" načítání.

---

## Soubory k editaci (kompletní seznam)

| Soubor | Akce | Fáze |
|--------|------|------|
| `src/app/[locale]/(public)/offer/[...slug]/page.tsx` | Cache related products + Suspense + use cached B2B | 1.1, 1.2, 3.1 |
| `src/lib/b2b-pricing.ts` | **NOVÝ** — in-memory cache pro B2B settings | 1.2 |
| `src/app/[locale]/(public)/offer/page.tsx` | Use cached B2B settings | 1.2 |
| `src/app/api/salon-portal/catalog/route.ts` | Use cached B2B + select místo include | 1.2, 2.2 |
| `src/app/api/b2b-settings/route.ts` | Invalidate B2B cache on update | 1.2 |
| Vercel Dashboard | Set `TURSO_EMBEDDED_REPLICA=true` | 1.3 |
| `src/app/api/sales/route.ts` | Select místo include na list endpoint | 2.1 |
| `src/app/(app)/products/page.tsx` | Wrap in unstable_cache | 2.3 |
| `src/app/(app)/loading.tsx` + 7 dalších | **NOVÉ** — loading skeletons pro admin stránky | 3.1 |
| `prisma/schema.prisma` | Composite index `[status, completedAt]` na Sale | 3.3 |

---

## Rizika

| Riziko | Mitigace |
|--------|----------|
| `serializeSaleForRole()` padá po select change | Ověřit fieldy v serializeru před implementací. V nejhorším přidat chybějící fieldy do select. |
| Embedded replicas na Vercelu nefungují | Fallback je automatický v `db.ts`. Stačí smazat env var. |
| Cache invalidace chybí na některém místě | Krátké TTL (15-30s) zajistí, že data budou max 30s stará. |
| `unstable_cache` API se změní v Next.js 16 | Přečíst `node_modules/next/dist/docs/` pro aktuální API. Pokud se liší, adaptovat. |
