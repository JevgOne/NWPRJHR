# QA: TASK-071 P1 — Performance paginace + cache

**Datum:** 2026-07-22
**Kontrolor:** kontrolor
**Status: PASS — vše správně implementováno**

---

## 1. inquiries/route.ts — paginace

**Soubor:** `src/app/api/inquiries/route.ts`

Page/limit parsing (r14-15):
```typescript
const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
const limit = Math.min(100, parseInt(sp.get("limit") ?? "50"));
```
✅ `Math.max(1, ...)` — min strana 1
✅ `Math.min(100, ...)` — max 100 záznamů (ochrana před abuse)
✅ Defaults: page=1, limit=50

Count query v Promise.all (r21-22):
```typescript
const [total, inquiries] = await Promise.all([
  prisma.inquiry.count({ where }),
```
✅ Count a findMany běží paralelně — 1 round-trip

skip/take (r29-30):
```typescript
skip: (page - 1) * limit,
take: limit,
```
✅ Správná offset formula

Response formát (r117-122):
```typescript
return NextResponse.json({
  data: result,
  total,
  page,
  totalPages: Math.ceil(total / limit),
});
```
✅ `{ data, total, page, totalPages }` — konzistentní s orders/sales API
✅ `Math.ceil` pro totalPages — správné zaokrouhlení nahoru

---

## 2. InquiriesClient.tsx — page state, fetch, filter reset, UI

**Soubor:** `src/app/(app)/inquiries/InquiriesClient.tsx`

State (r74-76):
```typescript
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [total, setTotal] = useState(0);
```
✅ Všechny 3 state proměnné přidány

fetchInquiries s page param (r110-124):
```typescript
params.set("page", String(page));
params.set("limit", "50");
// ...
setInquiries(json.data);
setTotalPages(json.totalPages);
setTotal(json.total);
```
✅ `page` param posílán do API
✅ `json.data` použito (ne celý json jako dříve)
✅ `totalPages` a `total` z response uloženy

Filter reset na page 1 (r171):
```typescript
onClick={() => { setFilter(tab.key); setPage(1); }}
```
✅ Při změně filtru se page resetuje na 1

Paginace UI (r506-524):
```typescript
{totalPages > 1 && (
  // ...
  {t("showingOf", { count: inquiries.length, total })}
  onClick={() => setPage(p => Math.max(1, p - 1))}
  disabled={page <= 1}
  {page} / {totalPages}
  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
  disabled={page >= totalPages}
```
✅ UI zobrazeno pouze pokud `totalPages > 1`
✅ "Zobrazeno X z Y" text s i18n
✅ Disabled stavy na krajích (page<=1, page>=totalPages)
✅ Funkční navigace přes `Math.max`/`Math.min`

---

## 3. inventory/page.tsx — force-dynamic smazán, unstable_cache

**Soubor:** `src/app/(app)/inventory/page.tsx`

```typescript
// force-dynamic NEEXISTUJE — ✅ smazán
import { unstable_cache } from "next/cache";  // r7

const getCachedInventoryData = unstable_cache(
  async () => {
    const [variants, allStock, latestBarcodes] = await Promise.all([...]);
    return { variants, allStock: Array.from(allStock.entries()), latestBarcodes };
  },
  ["admin-inventory"],
  { revalidate: 60, tags: ["stock", "products"] }
);
```
✅ `force-dynamic` odstraněn
✅ `unstable_cache` wrapper pro 3 DB queries
✅ `revalidate: 60` — inventory se cachuje 60s
✅ `tags: ["stock", "products"]` — tag-based invalidace zachována

Map→Array serialization (r29, r48):
```typescript
// V cache: allStock: Array.from(allStock.entries())
// V komponentě: const allStock = new Map(stockEntries);
```
✅ `Array.from(allStock.entries())` — Map serializován do JSON-kompatibilního pole
✅ `new Map(stockEntries)` — rekonstrukce zpět na Map
✅ `barcodeMap` stejný pattern (r49-51)

---

## 4. I18n klíče — showingOf

| Soubor | Řádek | Hodnota |
|--------|-------|---------|
| cs.json:2815 | `inquiry.showingOf` | `"Zobrazeno {count} z {total}"` |
| uk.json:2815 | `inquiry.showingOf` | `"Показано {count} з {total}"` |
| ru.json:2815 | `inquiry.showingOf` | `"Показано {count} из {total}"` |

✅ Klíč ve všech 3 locale
✅ Interpolace `{count}` a `{total}` — shoduje se s použitím v komponentě

---

## 5. TypeScript kompilace

```
npx tsc --noEmit → PASS (žádné chyby)
```
✅

---

## SOUHRN

| Kontrola | Výsledek |
|----------|----------|
| route.ts: page/limit parsing s validací | ✅ |
| route.ts: count v Promise.all | ✅ |
| route.ts: skip/take formula | ✅ |
| route.ts: { data, total, page, totalPages } | ✅ |
| InquiriesClient: page/totalPages/total state | ✅ |
| InquiriesClient: page param v fetch | ✅ |
| InquiriesClient: json.data parsing | ✅ |
| InquiriesClient: filter reset → setPage(1) | ✅ |
| InquiriesClient: paginace UI s disabled | ✅ |
| InquiriesClient: showingOf i18n | ✅ |
| inventory: force-dynamic smazán | ✅ |
| inventory: unstable_cache wrapper | ✅ |
| inventory: revalidate: 60 + tags | ✅ |
| inventory: Map→Array serialization | ✅ |
| I18n showingOf CS/UK/RU | ✅ |
| TypeScript kompilace | ✅ PASS |

**Implementace kompletní a správná. Připraveno k deployi.**
