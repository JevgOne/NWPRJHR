# TASK-071 P1: Performance střední změny — Implementační plán

## Přehled

Dva P1 problémy z TASK-071-plan-v3.md:
1. **Inquiries API bez paginace** — načítá VŠECHNY záznamy + 2 follow-up queries
2. **Inventory page force-dynamic** — 3 queries bez cache při každém loadu

---

## Problém 1: Inquiries API paginace

### Soubor: `src/app/api/inquiries/route.ts`

**Aktuální stav (řádky 19-25):**
```ts
const inquiries = await prisma.inquiry.findMany({
  where,
  include: { items: true },
  orderBy: { createdAt: "desc" },
  // NO take/skip!
});
```
Poté 2 follow-up queries (promoCode lookup řádky 28-40, variant prices řádky 42-66) operují na VŠECH inquiries najednou.

**Změny v `src/app/api/inquiries/route.ts`:**

1. Přidat parsování `page` a `limit` z query parametrů (řádek ~12, za `const status = sp.get("status");`):
```ts
const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
const limit = Math.min(100, parseInt(sp.get("limit") ?? "50"));
```

2. Přidat `count` query a `skip/take` na `findMany` (řádky 19-25):
```ts
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

3. Změnit response formát (řádek 110) — aktuálně vrací plain array, nově objekt:
```ts
// BYLO:
return NextResponse.json(result);

// NOVĚ (konzistentní s orders/sales API):
return NextResponse.json({
  data: result,
  total,
  page,
  totalPages: Math.ceil(total / limit),
});
```

**POZOR:** Promo code a variant price lookup queries (řádky 28-66) operují POUZE na aktuální stránce inquiries — to je správné chování, neměnit.

### Soubor: `src/app/(app)/inquiries/InquiriesClient.tsx`

**Aktuální stav:**
- `fetchInquiries` (řádek 107-115) — volá `/api/inquiries`, dostane plain array, nastaví do `setInquiries`
- Žádná paginace UI

**Změny:**

1. Přidat state pro paginaci (za řádek 79):
```ts
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [total, setTotal] = useState(0);
```

2. Upravit `fetchInquiries` (řádky 107-115):
```ts
const fetchInquiries = useCallback(async () => {
  setLoading(true);
  const params = new URLSearchParams();
  if (filter !== "ALL") params.set("status", filter);
  params.set("page", String(page));
  params.set("limit", "50");
  const res = await fetch(`/api/inquiries?${params}`);
  if (res.ok) {
    const json = await res.json();
    setInquiries(json.data);
    setTotalPages(json.totalPages);
    setTotal(json.total);
  }
  setLoading(false);
}, [filter, page]);
```

3. Resetovat page při změně filtru — přidat do stávající logiky nebo jako useEffect:
```ts
// Při změně filtru resetovat na stránku 1
// Upravit filter onChange handler — přidat setPage(1)
```

4. Přidat paginaci UI na konec seznamu (před uzavírací `</div>` komponenty). Použít stejný pattern jako OrdersClient/SalesClient:
```tsx
{totalPages > 1 && (
  <div className="flex items-center justify-between mt-4 px-2">
    <span className="text-sm text-muted">
      {t("showingOf", { count: inquiries.length, total })}
    </span>
    <div className="flex gap-1">
      <button
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-lg border border-line text-sm disabled:opacity-30 hover:bg-nude-50"
      >
        &lt;
      </button>
      <span className="px-3 py-1.5 text-sm text-muted">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        disabled={page >= totalPages}
        className="px-3 py-1.5 rounded-lg border border-line text-sm disabled:opacity-30 hover:bg-nude-50"
      >
        &gt;
      </button>
    </div>
  </div>
)}
```

5. Přidat i18n klíč `showingOf` do `inquiry` namespace (messages/cs.json, uk.json, ru.json):
```json
"showingOf": "Zobrazeno {count} z {total}"
```

---

## Problém 2: Inventory page cache

### Soubor: `src/app/(app)/inventory/page.tsx`

**Aktuální stav:**
- Řádek 8: `export const dynamic = "force-dynamic";`
- Řádky 18-36: 3 queries v Promise.all (variants, stock, barcodes) — BEZ cache
- `getAllStockNumbers()` (řádek 29) už interně používá `unstable_cache` s 60s revalidate

**Změny:**

1. Smazat řádek 8:
```ts
// SMAZAT:
export const dynamic = "force-dynamic";
```

2. Zabalit queries do `unstable_cache` (před funkci `InventoryPage`):
```ts
import { unstable_cache } from "next/cache";

const getCachedInventoryData = unstable_cache(
  async () => {
    const [variants, allStock, latestBarcodes] = await Promise.all([
      prisma.variant.findMany({
        where: { active: true },
        include: {
          product: {
            select: { id: true, name: true, category: true, origin: true, texture: true },
          },
        },
        orderBy: [{ product: { name: "asc" } }, { lengthCm: "asc" }, { color: "asc" }],
      }),
      getAllStockNumbers(),
      prisma.delivery.findMany({
        where: { variant: { active: true }, barcode: { not: null } },
        orderBy: { stockedAt: "desc" },
        distinct: ["variantId"],
        select: { variantId: true, barcode: true },
      }),
    ]);
    return { variants, allStock: Array.from(allStock.entries()), latestBarcodes };
  },
  ["admin-inventory"],
  { revalidate: 60, tags: ["stock", "products"] }
);
```

**POZOR:** `allStock` je `Map` — `unstable_cache` serializuje do JSON, takže Map musí být převedena na array entries a zpět:
```ts
// V getCachedInventoryData:
return { variants, allStock: Array.from(allStock.entries()), latestBarcodes };

// V InventoryPage:
const { variants, allStock: stockEntries, latestBarcodes } = await getCachedInventoryData();
const allStock = new Map(stockEntries);
```

3. Upravit `InventoryPage` — nahradit 3 queries voláním cache wrapperu:
```ts
export default async function InventoryPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role === "SALON" || role === "HAIRDRESSER") redirect("/dashboard");

  const [t, { variants, allStock: stockEntries, latestBarcodes }] = await Promise.all([
    getTranslations(),
    getCachedInventoryData(),
  ]);

  const allStock = new Map(stockEntries);
  const barcodeMap = new Map(latestBarcodes.map((d) => [d.variantId, d.barcode]));
  // ... zbytek beze změny
}
```

4. Ověřit že `revalidateTag("stock")` se volá v relevantních API routes (deliveries POST, sales POST, reservations) — **už se volá** (ověřeno v P0 analýze).

---

## Soubory k úpravě

| # | Soubor | Změna | Řádky |
|---|--------|-------|-------|
| 1 | `src/app/api/inquiries/route.ts` | Přidat page/limit parsing, count query, skip/take, response objekt | ~15 řádků změn |
| 2 | `src/app/(app)/inquiries/InquiriesClient.tsx` | Přidat page/totalPages state, upravit fetch, přidat paginace UI, resetovat page při filter změně | ~30 řádků nových |
| 3 | `src/app/(app)/inventory/page.tsx` | Smazat force-dynamic, přidat unstable_cache wrapper, Map serialization | ~20 řádků změn |
| 4 | `messages/cs.json` | Přidat `inquiry.showingOf` | 1 řádek |
| 5 | `messages/uk.json` | Přidat `inquiry.showingOf` | 1 řádek |
| 6 | `messages/ru.json` | Přidat `inquiry.showingOf` | 1 řádek |

## Rozsah
- 6 souborů
- ~70 řádků změn celkem
- Žádné nové závislosti
- Žádná DB migrace

## Implementační pořadí
1. Inventory cache wrapper (jednodušší, nižší riziko)
2. Inquiries API paginace
3. InquiriesClient paginace UI
4. I18n klíče

## Testování
1. Inventory page: první load = DB query, druhý load (do 60s) = z cache. Ověřit `curl -w "%{time_total}" /inventory`
2. Inquiries: ověřit že výchozí stav zobrazuje max 50 záznamů + paginaci
3. Inquiries filter: přepnout status → page se resetuje na 1
4. Inquiries paginace: kliknout next/prev → správná data
5. Po naskladnění: inventory se aktualizuje (revalidateTag("stock") invaliduje cache)

## Rizika
- **Nízké:** Inventory cache 60s = data mohou být 60s stará — ale `revalidateTag("stock")` invaliduje při změně
- **Nízké:** Inquiries response format change — z plain array na `{ data, total, page, totalPages }` — **breaking change pro InquiriesClient** — musí se deployovat společně
- **Žádné:** Calendar API route (`/api/reservations?view=calendar`) NEPOUŽÍVÁ inquiries endpoint — žádný side effect
