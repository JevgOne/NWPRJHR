# Audit: Admin Product Detail — co je placeholder vs. funkční

**Soubory:** `src/app/(app)/products/[id]/ProductDetailClient.tsx` + `src/components/products/VariantTable.tsx`  
**Datum:** 2026-07-14

---

## FUNGUJE (reálně volá API / mění stav)

### ProductDetailClient.tsx

| Prvek | Co dělá |
|-------|---------|
| **Texture picker** (inline dropdown) | PUT `/api/products/{id}` s `{ texture }`, pak `router.refresh()` |
| **Color tone picker** (inline dropdown) | PUT `/api/products/{id}` s `{ colorTone }`, pak `router.refresh()` |
| **Generovat bio** (button) | `generateProductBio()` lokálně → PUT `/api/products/{id}` s `{ description }` |
| **Regenerovat bio** (link pod textem) | Stejné jako výše |
| **PhotoUpload** (komponenta) | PUT `/api/products/{id}` s `{ photos }` nebo `{ video }` po uploadu |
| **Video upload** | PUT `/api/products/{id}` s `{ video }` |
| **SEO Meta Title** (input) | Editovatelný, ukládá se přes "Uložit SEO" |
| **SEO Meta Description** (textarea) | Editovatelný, ukládá se přes "Uložit SEO" |
| **OG Image URL** (input) | Editovatelný, ukládá se přes "Uložit SEO" |
| **Uložit SEO** (button) | PUT `/api/products/{id}` s `{ metaTitle, metaDescription, ogImage }` |
| **Google preview** (statický náhled) | Reaktivní na vstupy — zobrazuje live preview (autoTitle / manualTitle) |
| **Přidat variantu** (button) | Toggles `showBatchCreate` → zobrazí `VariantBatchCreate` komponentu |
| **Generovat příspěvek** (button) | Otevře `SocialPostModal` |

### VariantTable.tsx

| Prvek | Co dělá |
|-------|---------|
| **Retail cena (BY_GRAM)** — klik na číslo | Inline input → PUT `/api/variants/{id}` s `{ retailPricePerGram }`, sync `wholesalePricePerGram` |
| **Retail cena (BY_PIECE)** — klik na číslo | Inline input → PUT `/api/variants/{id}` s `{ retailPricePerPiece }` |
| **Toggle "Na objednávku"** | PUT `/api/variants/{id}` s `{ availableToOrder: !current }` |
| **Input "dní"** (zobrazí se po zapnutí toggle) | onBlur → PUT `/api/variants/{id}` s `{ orderLeadDays }` |
| **Stock badge** | Načítá `/api/stock?productId=` při mountu — zobrazuje živý stav skladu |

---

## PLACEHOLDER / HARDCODED (statické hodnoty, nefunkční UI)

| Prvek | Problém |
|-------|---------|
| **Nákupní cena (costLabel)** v VariantTable | Zobrazena jako statický `<span>` — **nelze editovat klikem** přes UI (editingCell `cost-{cellKey}` je v kódu podmínka pro `PriceInput`, ale `<span>` nemá `onClick` handler — nikdy se nespustí). `costPricePerGram` tak de facto nelze změnit z product detail. |
| **`revalidateTag("products", "max")`** v `/api/variants/[id]/route.ts` | `revalidateTag` přijímá pouze 1 argument — druhý `"max"` je TypeScript error (ale compiluje se díky loose typing). Pravděpodobně bez efektu. |
| **Marže (+X Kč)** vedle nákupní ceny | Čistě vypočtený display, neklikatelný — OK, není to placeholder ale informace. |
| **"ks" badge** (BY_PIECE) | Pouze vizuální badge, bez akce — OK. |
| **Google SERP preview** | Statický render, nevolá žádné API — správně, je to jen UI preview. |

---

## BROKEN (volá API, ale nefunguje správně)

| Prvek | Problém |
|-------|---------|
| **Toggle "Na objednávku"** — `setSaving` po resolve | Po dokončení toggle: `setSaving(variant.id === saving ? null : saving)` — logika je invertovaná. Pokud `variant.id === saving` (což je vždy true v finally bloku), nastaví `null`. Funguje správně náhodou, ale kód je zmatený. Nízká priorita. |
| **Upload fotek** — task #23 říká nefunguje | `PhotoUpload` komponent volá API správně z kódu, ale task #23 hlásí upload nefunkční. Bug pravděpodobně v `/api/products/{id}/media` endpointu nebo v HEIC konverzi — ne v ProductDetailClient. |
| **`revalidateTag` s 2 argumenty** | `revalidateTag("products", "max")` — Next.js `revalidateTag` bere jen 1 string. Druhý arg je ignorován. Cache invalidace funguje jen pro tag `"products"`, ale `"max"` tag se neinvaliduje. |

---

## Shrnutí

**Funkčních prvků:** 13  
**Placeholder / nefunkční UI:** 1 reálný problém (costPricePerGram nelze editovat přes UI)  
**Broken:** 1 potenciální (revalidateTag 2 args), 1 potvrzený (upload fotek — viz task #23)

### Hlavní finding

**Nákupní cena (costPricePerGram) v VariantTable je zobrazena ale nelze ji editovat.**  
Kód obsahuje podmínku `editingCell === "cost-{cellKey}"` → `PriceInput`, ale `<span>` zobrazující cenu nemá `onClick` — uživatel nemůže aktivovat editaci. Jedinou cestou jak změnit nákupní cenu je nové naskladnění (StockIn).
