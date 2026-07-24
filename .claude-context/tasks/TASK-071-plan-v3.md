# PLAN: TASK-071 — Performance admin panel — optimalizace

## Architektura prehled

- **DB:** SQLite/Turso s embedded replikou na Vercel (`syncInterval: 60s`, `readYourWrites: true`)
- **ORM:** Prisma s `@prisma/adapter-libsql`
- **Cache:** `unstable_cache` s tag-based invalidation via `revalidateTag`
- **Rendering:** Mix server components (dashboard, products, inventory) + client components fetching z API routes (orders, sales, customers, invoices, salons, inquiries, reservations)

---

## NALEZENE PROBLEMY

### PROBLEM 1: Layout badge polling — 4 DB queries kazdych 5s (CRITICAL)

**Soubor:** `src/app/(app)/layout.tsx:7-28`

```typescript
const getCachedBadgeCounts = unstable_cache(
  async (userId: string, role: string) => {
    const [pendingRegCount, newInquiryCount, unreadCount, pendingReviewCount] = await Promise.all([
      prisma.salon.count({ where: { approved: false, archived: false } }),
      prisma.inquiry.count({ where: { status: "NEW" } }),
      prisma.notification.count({ where: { recipientId: userId, read: false } }),
      prisma.review.count({ where: { active: false } }),
    ]);
    return { pendingRegCount, newInquiryCount, unreadCount, pendingReviewCount };
  },
  ["app-shell-badges"],
  { revalidate: 5, tags: ["badges"] }  // <— PROBLEM: 5 sekundovy revalidate!
);
```

**Dopad:** Kazdy page load (a kazdych 5s cache expiry) spousti 4 COUNT queries. Na Turso embedded replica je to akceptabilni, ale `revalidate: 5` je zbytecne agresivni pro badge counts ktere se meni zridka.

**FIX:** Zvysit revalidate na 30-60 sekund. Badges se meni vzacne (nova registrace, nova poptavka) a aktualizace pres `revalidateTag("badges")` uz existuje pri zmene dat.

```typescript
{ revalidate: 30, tags: ["badges"] }
```

**Obtiznost:** Jednoducha — 1 cislo

---

### PROBLEM 2: Duplicitni polling notifikaci (MEDIUM)

**Soubory:**
- `src/components/AppShell.tsx:37-48` — polluje `/api/notifications?unread=true&limit=1` kazdych 60s
- `src/components/NotificationBell.tsx:91` — polluje `fetchCount` kazdych 60s (= dalsi request na `/api/notifications`)

**Dopad:** Dva nezavisle intervaly volaji stejna API data. To znamena 2× `/api/notifications` kazdou minutu z kazdeho admin tabu/okna.

Navic NotificationBell:
```typescript
const fetchCount = async () => {
  const r = await fetch("/api/notifications?unread=true&limit=1");
  // ...
};
// ...
const interval = setInterval(fetchCount, 60000);
```

A AppShell:
```typescript
const poll = () => {
  fetch("/api/notifications?unread=true&limit=1")
    .then(r => r.ok ? r.json() : null)
    .then(data => { if (active && data) setLiveUnread(data.unreadCount); })
    .catch(() => {});
};
const id = setInterval(poll, 60000);
```

**FIX:** Sjednotit polling — NotificationBell uz polluje a drzi stav. AppShell by mel pouzit callback z NotificationBell misto vlastniho pollingu. Nebo lepe: vytvorit sdileny hook `useNotificationCount()` ktery pouziji oba komponenty.

```typescript
// Varianta A — jednodussi: AppShell prestane pollit, pouzije jen SSR badgeCounts
// (staci smazat useEffect na radcich 37-48 v AppShell.tsx)

// Varianta B — slozitejsi: sdileny hook s React context
// useNotificationCount() → NotificationProvider v layout
```

**DOPORUCENI:** Varianta A — smazat polling v AppShell, nechat NotificationBell jako jediny poller. Sidebar badge se aktualizuje pri page navigation (SSR revalidate).

**Obtiznost:** Jednoducha — smazat ~12 radku

---

### PROBLEM 3: Inquiries API nacita VSECHNY bez paginace (HIGH)

**Soubor:** `src/app/api/inquiries/route.ts:19-25`

```typescript
const inquiries = await prisma.inquiry.findMany({
  where,
  include: { items: true },
  orderBy: { createdAt: "desc" },
  // NO take/skip!
});
```

Po nacitani vsech inquiries nasleduji 2 dalsi dotazy:
1. `prisma.promoCode.findMany(...)` — pro vsechny promo kody
2. `prisma.variant.findMany(...)` — pro vsechny produkty z polozek

**Dopad:** Kdyz naruste pocet poptavek (100+), toto bude nacitat stovky zaznamu se vsemi polozkami + dva dalsi JOINy. Uz nyni je to N+2 pattern (1 query + 2 lookup queries).

**FIX:** Pridat paginaci jako ostatni API routes.

```typescript
const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
const limit = Math.min(100, parseInt(sp.get("limit") ?? "50"));

const [total, inquiries] = await Promise.all([
  prisma.inquiry.count({ where }),
  prisma.inquiry.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  }),
]);
```

A na klientu (`InquiriesClient.tsx`) pridat paginaci jako je u orders/sales/invoices.

**Obtiznost:** Stredni — API route + klientsky komponent

---

### PROBLEM 4: Inventory page force-dynamic bez cache (MEDIUM)

**Soubor:** `src/app/(app)/inventory/page.tsx:8`

```typescript
export const dynamic = "force-dynamic";
```

Tato stranka spousti 3 queries pri kazdem loadu:
1. `prisma.variant.findMany({ include: { product }, orderBy: ... })` — vsechny aktivni varianty s produkty
2. `getAllStockNumbers()` — uz cachovano 60s via unstable_cache
3. `prisma.delivery.findMany({ distinct: ["variantId"] })` — posledni barcody

Queries 1 a 3 NEJSOU cachovane a bezi pri kazdem requestu.

**FIX:** Zabalit do `unstable_cache` jako products page:

```typescript
const getCachedInventoryData = unstable_cache(
  async () => {
    const [variants, allStock, latestBarcodes] = await Promise.all([
      prisma.variant.findMany({...}),
      getAllStockNumbers(),
      prisma.delivery.findMany({...}),
    ]);
    return { variants, stockEntries: Array.from(allStock.entries()), latestBarcodes };
  },
  ["admin-inventory"],
  { revalidate: 60, tags: ["stock", "products"] }
);
```

A odebrat `export const dynamic = "force-dynamic"`.

**Obtiznost:** Stredni — refactor do cache wrapperu

---

### PROBLEM 5: Sales GET API — zbytecne deep includes (LOW-MEDIUM)

**Soubor:** `src/app/api/sales/route.ts:214-229`

```typescript
prisma.sale.findMany({
  where,
  include: {
    items: true,                    // vsechny polozky prodeje
    discounts: {
      include: {
        bearers: {                  // discount bearers
          include: { partner: true } // s partnery — 3-urovnovy JOIN
        }
      }
    },
    salon: { select: { id: true, name: true } },
    customer: { select: { id: true, name: true } },
    user: { select: { id: true, name: true, email: true, role: true } },
  },
  orderBy: { completedAt: "desc" },
  skip: ...,
  take: limit,
});
```

**Dopad:** `discounts → bearers → partner` je 3-urovnovy nested include. Na SQLite to generuje vice queries (Prisma nema JOINy, pouziva vicenasobne SELECT). Pro list view v historii prodeju je toto zbytecne — detail partnera neni videt v seznamu.

**FIX:** Pro list view pouzit `select` misto `include` a nacitat jen co seznam zobrazuje. Discount detail nacitat lazy pri otevreni detailu.

```typescript
// List view — jen zakladni data
include: {
  items: { select: { id: true, grams: true, pieces: true, pricePerGramUsed: true } },
  discounts: { select: { id: true, type: true, value: true } },
  salon: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true } },
  user: { select: { id: true, name: true } },
},
```

**POZOR:** Overit ze `serializeSaleForRole()` nepotrebuje bearer/partner data pro list view.

**Obtiznost:** Stredni — je treba overit co serializer pouziva

---

### PROBLEM 6: Orders API — include items s variantou pro kazdy radek (LOW)

**Soubor:** `src/app/api/orders/route.ts:50-65`

```typescript
include: {
  salon: { select: { name: true } },
  customer: { select: { name: true, email: true } },
  items: {
    include: {
      variant: {
        select: { lengthCm: true, color: true, product: { select: { name: true } } },
      },
    },
  },
  _count: { select: { items: true } },
},
```

**Dopad:** Nacita vsechny order items + varianty + produkty i pro list view kde se zobrazuje jen pocet polozek a celkova cena. Na SQLite Prisma generuje zvlastni SELECT pro items, varianty, a produkty.

**FIX:** Pro list view by stacilo:
```typescript
include: {
  salon: { select: { name: true } },
  customer: { select: { name: true, email: true } },
  _count: { select: { items: true } },
},
```
A items + variant data nacitat az pri otevreni detailu.

**POZOR:** Overit ze OrdersClient nepouziva items data v list view (tabulce). Pokud ano, nelze zmensit.

**Obtiznost:** Jednoducha pokud klient nepouziva items v seznamu — 1 zmena

---

### PROBLEM 7: Dashboard 14 parallelnich queries (INFO — uz optimalizovano)

**Soubor:** `src/app/(app)/dashboard/page.tsx:39-172`

Dashboard pouziva `unstable_cache` s `revalidate: 10` a `tags: ["dashboard"]`. To je rozumne. 14 queries bezi paralelne v `Promise.all` a vysledek je cachovany 10 sekund.

**Poznamky:**
- 2 z 14 queries pouzivaji `$queryRawUnsafe` (stock by category, low stock) — to je OK pro performance, raw SQL je rychlejsi nez Prisma
- `revalidate: 10` je agresivni ale pro dashboard akceptabilni
- **Jedine riziko:** cache miss = 14 simultannich queries naraz = zatez DB na ~1s

**DOPORUCENI:** Zvazit zvyseni `revalidate` na 30s. Dashboard data se meni zridka a manualni refresh existuje pres `revalidateTag("dashboard")`.

**Obtiznost:** Trivialni — 1 cislo

---

### PROBLEM 8: Customer search pouziva `mode: "insensitive"` na SQLite (LOW)

**Soubor:** `src/app/api/customers/route.ts:16-24`

```typescript
const where = search
  ? {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ],
    }
  : {};
```

**Dopad:** SQLite `LIKE` je case-insensitive pro ASCII defaultne, ale `mode: "insensitive"` Prisma prelozi na `LOWER()` wrapper coz preventi pouziti indexu na `name` a `email`. S 100 zakazniky to neni problem, ale s 1000+ by mohl byt.

**FIX:** Zatim neni kriticke. Pokud se databaze rozroste, zvazit full-text search (FTS5 na SQLite) nebo client-side filtering.

**Obtiznost:** N/A — zatim neni treba

---

### PROBLEM 9: Chybi index na `invoice.saleId` pro sale→invoice lookup (LOW)

**Schema:** Invoice model nema `@@index([saleId])`.

Dashboard query: `prisma.sale.aggregate({ where: { status: "COMPLETED", paymentType: "TRANSFER", invoice: { is: null } } })` vyuziva relaci `sale → invoice`. Bez indexu na `invoice.saleId` Prisma musi skenovat celou tabulku invoices pro kazdy sale.

**POZOR:** `sale.invoice` je `@relation` pres implicitni FK `Invoice.saleId` (radek 764: `saleId String? @unique`). Protoze je `@unique`, SQLite automaticky vytvari index. **Tento problem NENI realny** — `@unique` generuje index.

**Dopad:** Zadny — uz indexovano pres `@unique`.

---

## CHYBEJICI INDEXY

Po analyze schema.prisma a pouzitych queries:

| Tabulka | Sloupec/Combo | Pouziti | Chybi? |
|---------|---------------|---------|--------|
| notifications | recipientId, read | badge counts, polling | @@index([recipientId, read]) — JIZ EXISTUJE :white_check_mark: |
| notifications | recipientId, createdAt | list sorted | @@index([recipientId, createdAt]) — JIZ EXISTUJE :white_check_mark: |
| inquiries | status | count/filter | @@index([status]) — JIZ EXISTUJE :white_check_mark: |
| reviews | active | count | **CHYBI** — `prisma.review.count({ where: { active: false } })` |
| salons | approved, archived | badge count | Existuji oddelene indexy na `archived` — composite by pomohl |
| sales | status, paymentType | dashboard aggregate | Existuje index na `status` — composite by pomohl |
| deliveries | variantId, exclusive | exclusive stock calc | Existuje index na `variantId, stockedAt` ale ne `variantId, exclusive` |

### DOPORUCENE NOVE INDEXY

```prisma
// Review model — pro badge count query
model Review {
  // ...existujici fields...
  @@index([active])  // PRIDAT — pouziva se v layout badge count
}

// Salon model — composite pro badge query
// (uz ma oddelene @@index([archived]) a @@index([name]))
// Composite @@index([approved, archived]) by pomohl badge count
// ALE: s malym poctem salonu (desitky) to neni kriticke

// Sale model — composite pro dashboard
// @@index([status, paymentType]) by pomohl dashboard query
// ALE: uz existuje @@index([status]) a data jsou cachovana
```

**Jediny realne chybejici index:** `@@index([active])` na Review modelu.

---

## SHRNUTY — PRIORITIZOVANE OPRAVY

| # | Problem | Dopad | Obtiznost | Priorita |
|---|---------|-------|-----------|----------|
| 1 | Layout badge `revalidate: 5` → 30 | Snizi DB load 6× | Trivialni | P0 |
| 2 | Duplicitni notification polling | -50% API calls | Jednoducha | P0 |
| 3 | Inquiries bez paginace | Preventi timeout s rustem dat | Stredni | P1 |
| 4 | Inventory force-dynamic | Cache = -90% DB queries | Stredni | P1 |
| 5 | Sales deep includes | Mensi payloady, mene queries | Stredni | P2 |
| 6 | Orders items v list view | Mensi payloady | Jednoducha/Stredni | P2 |
| 7 | Dashboard revalidate 10→30 | Mene cache misses | Trivialni | P2 |
| 8 | Review @@index([active]) | Rychlejsi badge count | Trivialni | P2 |

---

## SOUBORY K UPRAVE

| # | Soubor | Zmena |
|---|--------|-------|
| 1 | `src/app/(app)/layout.tsx:27` | `revalidate: 5` → `revalidate: 30` |
| 2 | `src/components/AppShell.tsx:37-48` | Smazat duplicitni polling useEffect |
| 3 | `src/app/api/inquiries/route.ts:19-25` | Pridat paginaci (page/limit/skip/take) |
| 4 | `src/app/(app)/inquiries/InquiriesClient.tsx` | Pridat paginaci UI |
| 5 | `src/app/(app)/inventory/page.tsx` | Zabalit do unstable_cache, odebrat force-dynamic |
| 6 | `src/app/api/sales/route.ts:217-223` | Zmensit includes pro list view |
| 7 | `src/app/api/orders/route.ts:50-65` | Odebrat items include z list view (overit klienta) |
| 8 | `src/app/(app)/dashboard/page.tsx:172` | `revalidate: 10` → `revalidate: 30` |
| 9 | `prisma/schema.prisma` (Review model) | Pridat `@@index([active])` |

---

## PORADI IMPLEMENTACE

### Faze 1 — Quick wins (5 minut, nulove riziko)
1. `layout.tsx:27` — revalidate 5 → 30
2. `dashboard/page.tsx:172` — revalidate 10 → 30
3. `AppShell.tsx:37-48` — smazat polling useEffect

### Faze 2 — Stredni zmeny (30 minut)
4. `inventory/page.tsx` — cache wrapper
5. `inquiries/route.ts` + `InquiriesClient.tsx` — paginace

### Faze 3 — Optimalizace queries (15 minut, overit klienty)
6. `sales/route.ts` — zmensit includes
7. `orders/route.ts` — overit a zmensit includes
8. `schema.prisma` — pridat `@@index([active])` na Review + migrace

---

## CO JE UZ DOBRE UDELANO

- **Dashboard:** `unstable_cache` + `Promise.all` pro 14 queries = spravne
- **Stock:** `getAllStockNumbers()` pouziva raw SQL GROUP BY + cache 60s = optimalni
- **Products page:** `unstable_cache` + `revalidate: 60` = spravne
- **Vsechny list API routes** (krome inquiries): Paginace s `skip/take` + `limit: 100` = spravne
- **Prisma schema:** Rozsahla indexace — 80+ indexu, covering indexes na hlavnich tabulkach
- **Turso embedded replica:** `readYourWrites: true` + `syncInterval: 60` = read queries jdou na local SQLite file = rychle

---

## VERIFIKACE

Po implementaci:
1. Otevrit admin dashboard — overit ze se nacte pod 2s
2. Kliknout na Inventory — overit ze druhy load je z cache
3. Otevrit Inquiries — overit ze se zobrazi paginace
4. Otevrit DevTools Network tab — overit ze bezi jen 1 notification polling (ne 2)
5. Pockat 30s — overit ze badges se aktualizuji po navigaci na novou stranku

---

## RIZIKA

- **Nizke:** Zvyseni revalidate intervalu = data jsou 30s stara misto 5s — akceptabilni pro badge counts
- **Nizke:** Smazani AppShell pollingu = sidebar badge se neaktualizuje real-time — aktualizuje se pri kazde navigaci (SSR revalidate)
- **Stredni:** Paginace inquiries = zmena UI flow — klienti kteri filtrovali vsechny inquiries musi paginovat
- **Nizke:** Zmenseni sales/orders includes = overit ze klient nepouziva data v list view pred implementaci
