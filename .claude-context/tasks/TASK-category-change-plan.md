# TASK: Změna kategorií produktů — VIRGIN/PREMIUM/STANDARD/SALE → VIRGIN/LUXE/STANDARD/SALE

**Status:** Plan ready
**Datum:** 2026-07-14

## Shrnutí změny

Stávající enum `ProductCategory`:
```
VIRGIN    → Panenské Vlasy (zůstává)
PREMIUM   → Premium Vlasy  (→ přejmenovat na LUXE)
STANDARD  → Standard Vlasy (zůstává)
SALE      → Výprodej       (zůstává)
```

Nové kategorie:
```
VIRGIN    — Panenské (nejdražší, nejprémiovější)
LUXE      — Luxe (nahrazuje PREMIUM)
STANDARD  — Standard
SALE      — Výprodej
```

**KLÍČOVÉ ROZHODNUTÍ:** `VIRGIN`, `STANDARD` a `SALE` se NEMĚNÍ — mění se pouze `PREMIUM` → `LUXE`. To je minimální změna s maximálním efektem.

---

## 1. Dopad na Prisma Schema + DB

### `prisma/schema.prisma` — enum ProductCategory

```prisma
// STÁVAJÍCÍ:
enum ProductCategory {
  VIRGIN
  PREMIUM
  STANDARD
  SALE
}

// NOVÉ:
enum ProductCategory {
  VIRGIN
  LUXE
  STANDARD
  SALE
}
```

### DB migrace (Turso/SQLite)

SQLite nepodporuje ALTER ENUM. Prisma s SQLite ukládá enumy jako TEXT. Potřeba:

1. **Prisma schema:** Změnit `PREMIUM` → `LUXE`
2. **DB data:** Aktualizovat existující řádky:
   ```sql
   UPDATE products SET category = 'LUXE' WHERE category = 'PREMIUM';
   ```
3. **PriceSettings:** Má `category ProductCategory @unique` — musí se aktualizovat:
   ```sql
   UPDATE price_settings SET category = 'LUXE' WHERE category = 'PREMIUM';
   ```
4. **Migrace:** `npx prisma db push` (Turso SQLite) + ruční SQL update existujících dat

**POZOR:** Model `PriceSettings` má `@@unique([category])` — takže stačí UPDATE, nemusí se mazat a znovu vytvářet.

---

## 2. Kompletní seznam souborů k editaci

### 2.1 Schema + Validace (CRITICAL — musí být první)

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `prisma/schema.prisma` | `PREMIUM` → `LUXE` v enum ProductCategory |
| 2 | `src/lib/validations/product.ts` | L10: `z.enum(["VIRGIN", "PREMIUM", ...]` → `"LUXE"` |
| 3 | `src/lib/validations/product.ts` | L67: totéž v `updatePriceSettingsSchema` |
| 4 | `src/lib/validations/delivery.ts` | L35: `z.enum(["VIRGIN", "PREMIUM", ...]` → `"LUXE"` |

### 2.2 Překlady — 3 locale soubory

| # | Soubor | Sekce | Změna |
|---|--------|-------|-------|
| 5 | `messages/cs.json` | `category.premium` | `"Premium Vlasy"` → `"Luxe Vlasy"` |
| 6 | `messages/cs.json` | `categoryInfo.premiumDesc` | Přepsat popis pro LUXE |
| 7 | `messages/cs.json` | `categoryInfo.premiumFeature1-4` | Přepsat features pro LUXE |
| 8 | `messages/uk.json` | `category.premium` | `"Преміум Волосся"` → `"Люкс Волосся"` |
| 9 | `messages/uk.json` | `categoryInfo.premiumDesc/Feature1-4` | Přepsat pro LUXE (UK) |
| 10 | `messages/ru.json` | `category.premium` | `"Премиум Волосы"` → `"Люкс Волосы"` |
| 11 | `messages/ru.json` | `categoryInfo.premiumDesc/Feature1-4` | Přepsat pro LUXE (RU) |

**POZOR na klíče:** Translation klíče zůstanou `premium` (v JSON) — protože je to key v překladu, ne DB hodnota. Můžeme buď:
- **A) Zachovat klíč `premium`** — méně práce, ale matoucí název
- **B) Přejmenovat klíč na `luxe`** — konzistentnější, ale více souborů

**Doporučení: Varianta B** — přejmenovat klíč na `luxe`. Je čistší a klíč `premium` by mátl budoucí vývojáře.

Pokud volíme B, pak je potřeba přidat VŠUDE kde se volá `t("category.premium")` nebo `tCategory("premium")` přejmenování na `t("category.luxe")` / `tCategory("luxe")`.

Místa kde se volá `tCategory(product.category.toLowerCase())`:
- To funguje automaticky! Protože `"LUXE".toLowerCase()` = `"luxe"` → bude hledat klíč `category.luxe`

Takže: **přejmenovat klíč z `premium` na `luxe` ve všech 3 locale souborech.**

### 2.3 Hardcoded category arrays a maps v komponentách

| # | Soubor | Řádek | Změna |
|---|--------|-------|-------|
| 12 | `src/components/products/CategoryBadge.tsx` | L6-18 | `PREMIUM` → `LUXE` v `categoryStyles` a `categoryKeys` |
| 13 | `src/components/public/ProductGridCard.tsx` | L100-109 | `PREMIUM` → `LUXE` v badge/hover colors |
| 14 | `src/components/inventory/StockInForm.tsx` | L27, L422 | `"PREMIUM"` → `"LUXE"` v type a array |
| 15 | `src/app/(app)/dashboard/page.tsx` | L24-28, L227 | `PREMIUM` → `LUXE` v categoryColors + render array |
| 16 | `src/app/(app)/products/new/CreateProductForm.tsx` | L15 | `"PREMIUM"` → `"LUXE"` |
| 17 | `src/app/(app)/products/ProductListClient.tsx` | L36, L190 | `"PREMIUM"` → `"LUXE"` |
| 18 | `src/app/(app)/products/[id]/ProductDetailClient.tsx` | L225 | type cast `"PREMIUM"` → `"LUXE"` |
| 19 | `src/app/(app)/settings/pricing/PricingSettingsClient.tsx` | L9 | `"PREMIUM"` → `"LUXE"` |
| 20 | `src/app/(app)/inventory/InventoryClient.tsx` | L25, L269-270 | `"PREMIUM"` → `"LUXE"` |
| 21 | `src/app/(app)/inventory/deliveries/[id]/DeliveryDetailClient.tsx` | L93 | `PREMIUM` → `LUXE` |
| 22 | `src/app/(salon)/salon/catalog/CatalogClient.tsx` | L52 | `PREMIUM` → `LUXE` |
| 23 | `src/app/[locale]/(public)/offer/ProductsShowcase.tsx` | L72 | `"PREMIUM"` → `"LUXE"` |
| 24 | `src/app/(app)/sales/new/NewSaleWizard.tsx` | Grep pro PREMIUM | Ověřit a nahradit |
| 25 | `src/app/(app)/sales/[id]/SaleDetailClient.tsx` | Grep pro PREMIUM | Ověřit a nahradit |
| 26 | `src/app/(app)/discounts/DiscountsClient.tsx` | Grep pro PREMIUM | Ověřit — pravděpodobně DiscountType, NE ProductCategory |
| 27 | `src/app/(app)/finance/discounts/DiscountHistoryClient.tsx` | Grep pro PREMIUM | Totéž |

### 2.4 Lib soubory

| # | Soubor | Změna |
|---|--------|-------|
| 28 | `src/lib/product-bio.ts` | L13-61: Všechny `PREMIUM` → `LUXE` v `CAT_LABEL`, `CATEGORY_STORY`, `CATEGORY_BENEFITS` + přepsat texty |
| 29 | `src/lib/social-post-generator.ts` | L18-56, L162: `PREMIUM` → `LUXE` v emoji, label, benefits, tags |
| 30 | `src/lib/attribute-slugs.ts` | L26: `"premium": "PREMIUM"` → `"luxe": "LUXE"` v `CATEGORY_SLUG_MAP_SEO` |

### 2.5 API routes

| # | Soubor | Změna |
|---|--------|-------|
| 31 | `src/app/api/deliveries/route.ts` | L60-63: `PREMIUM` → `LUXE` v `CATEGORY_NAMES` |

### 2.6 Product detail FAQs (hardcoded)

| # | Soubor | Řádek | Změna |
|---|--------|-------|-------|
| 32 | `src/app/[locale]/(public)/offer/[...slug]/page.tsx` | L426-442 | `PREMIUM` → `LUXE` v `faqByCategory` klíči + přepsat FAQ texty pro LUXE |

### 2.7 Poradna (article CTAs)

| # | Soubor | Změna |
|---|--------|-------|
| 33 | `src/app/[locale]/(public)/poradna/[slug]/page.tsx` | L319: URL `?category=VIRGIN` — OK (nezměněno). Ověřit zda nikde není `?category=PREMIUM` |

---

## 3. Překlady — navrhované texty

### CS (čeština)

```json
"category": {
  "virgin": "Panenské Vlasy",
  "luxe": "Luxe Vlasy",
  "standard": "Standard Vlasy",
  "sale": "Výprodej"
}
```

```json
"categoryInfo": {
  "virginDesc": "(beze změny)",
  "virginFeature1-4": "(beze změny)",
  "luxeDesc": "Luxusní vlasy s jemným šetrným ošetřením. Zachovaná přirozená struktura a hedvábný lesk. Prémiová volba pro náročné zákaznice, které chtějí maximální kvalitu.",
  "luxeFeature1": "Šetrně ošetřené, zachovaná struktura",
  "luxeFeature2": "Hedvábný lesk a přirozený vzhled",
  "luxeFeature3": "Vydrží 1–2 roky při správné péči",
  "luxeFeature4": "Široká nabídka odstínů a délek",
  "standardDesc": "(beze změny)",
  "standardFeature1-4": "(beze změny)",
  "saleDesc": "(beze změny)",
  "saleFeature1-4": "(beze změny)"
}
```

### UK (ukrajinština)

```json
"category": {
  "virgin": "Натуральне Волосся",
  "luxe": "Люкс Волосся",
  "standard": "Стандарт Волосся",
  "sale": "Розпродаж"
}
```

```json
"categoryInfo": {
  "luxeDesc": "Розкішне волосся з делікатною обробкою. Збережена природна структура та шовковистий блиск. Преміальний вибір для вимогливих клієнток.",
  "luxeFeature1": "Делікатна обробка, структура збережена",
  "luxeFeature2": "Шовковистий блиск та природний вигляд",
  "luxeFeature3": "Тримається 1–2 роки при правильному догляді",
  "luxeFeature4": "Широкий вибір відтінків та довжин"
}
```

### RU (ruština)

```json
"category": {
  "virgin": "Натуральные Волосы",
  "luxe": "Люкс Волосы",
  "standard": "Стандарт Волосы",
  "sale": "Распродажа"
}
```

```json
"categoryInfo": {
  "luxeDesc": "Роскошные волосы с деликатной обработкой. Сохранённая естественная структура и шелковистый блеск. Премиальный выбор для требовательных клиенток.",
  "luxeFeature1": "Деликатная обработка, структура сохранена",
  "luxeFeature2": "Шелковистый блеск и естественный вид",
  "luxeFeature3": "Служат 1–2 года при правильном уходе",
  "luxeFeature4": "Широкий выбор оттенков и длин"
}
```

---

## 4. Lib texty k přepsání

### `src/lib/product-bio.ts`

```typescript
const CAT_LABEL: Record<string, string> = {
  VIRGIN: "panenské",
  LUXE: "luxusní",      // was "prémiové"
  STANDARD: "kvalitní",
  SALE: "akční",
};

const CATEGORY_STORY: Record<string, string> = {
  VIRGIN: "...",  // beze změny
  LUXE: "Luxusní vlasy s jemným šetrným ošetřením, které zachovává přirozenou strukturu a hedvábný vzhled. Ideální volba pro klientky, které chtějí luxusní výsledek za rozumnou cenu. Kvalitou se blíží panenskému vlasu, přitom nabízejí výborný poměr kvality a ceny.",
  STANDARD: "...",  // beze změny
  SALE: "...",  // beze změny
};

// CATEGORY_BENEFITS — totéž, PREMIUM klíč → LUXE
```

### `src/lib/social-post-generator.ts`

```typescript
const CATEGORY_EMOJI: Record<string, string> = {
  VIRGIN: "👑", LUXE: "💎", STANDARD: "✨", SALE: "🔥",
};
const CATEGORY_LABEL: Record<string, string> = {
  VIRGIN: "Panenské vlasy", LUXE: "Luxe vlasy", STANDARD: "Standard vlasy", SALE: "Výprodej",
};
// L162: "PREMIUM" → "LUXE", tags → "#luxehair", "#luxevlasy"
```

### `src/lib/attribute-slugs.ts`

```typescript
export const CATEGORY_SLUG_MAP_SEO: Record<string, string> = {
  "virgin": "VIRGIN",
  "luxe": "LUXE",        // was "premium": "PREMIUM"
  "standard": "STANDARD",
};
```

**SEO DOPAD:** URL `/offer/kategorie/premium` přestane fungovat → potřeba redirect:
```typescript
// V next.config.ts redirects:
{ source: "/offer/kategorie/premium", destination: "/offer/kategorie/luxe", permanent: true },
// Nebo: zachovat "premium" slug mapující na LUXE DB hodnotu (méně čisté)
```

### `src/app/api/deliveries/route.ts`

```typescript
const CATEGORY_NAMES = {
  VIRGIN: { cs: "Panenské Vlasy", uk: "Натуральне Волосся", ru: "Натуральные Волосы" },
  LUXE: { cs: "Luxe Vlasy", uk: "Люкс Волосся", ru: "Люкс Волосы" },
  STANDARD: { cs: "Standard Vlasy", uk: "Стандарт Волосся", ru: "Стандарт Волосы" },
  SALE: { cs: "Výprodej", uk: "Розпродаж", ru: "Распродажа" },
};
```

---

## 5. Barvy pro LUXE

Stávající PREMIUM barvy v UI:

| Kontext | PREMIUM barva | Navrhovaná LUXE barva |
|---------|---------------|----------------------|
| CategoryBadge | `bg-amber-100 text-amber-800` | `bg-violet-100 text-violet-800` (luxusní fialová) |
| ProductGridCard badge | `bg-rose-deep text-white` | `bg-violet-600 text-white` |
| ProductGridCard hover | `hover:bg-rose-deep/90` | `hover:bg-violet-700` |
| Dashboard bar | `bg-rose` | `bg-violet-500` |
| Dashboard label | `bg-nude-100 text-espresso` | `bg-violet-100 text-violet-800` |
| Salon catalog | `bg-amber-100 text-amber-800` | `bg-violet-100 text-violet-800` |
| Inventory | `bg-mauve/10 text-mauve` | `bg-violet-100 text-violet-700` |
| DeliveryDetail | `bg-amber-100 text-amber-800` | `bg-violet-100 text-violet-800` |

**Alternativa:** Zachovat `amber` barvy pokud uživatel preferuje. LUXE evokuje fialovou/zlatou. Zeptat se uživatele.

---

## 6. DB migrace — přesný postup

### Krok 1: Prisma schema
```prisma
enum ProductCategory {
  VIRGIN
  LUXE
  STANDARD
  SALE
}
```

### Krok 2: SQL migrace (po prisma generate)
```sql
-- Aktualizovat existující produkty
UPDATE products SET category = 'LUXE' WHERE category = 'PREMIUM';

-- Aktualizovat PriceSettings
UPDATE price_settings SET category = 'LUXE' WHERE category = 'PREMIUM';
```

### Krok 3: Deploy
```bash
npx prisma db push   # schema change
# Pak ruční SQL přes Turso CLI/dashboard
```

**ALTERNATIVA (bezpečnější):** Použít Prisma migration:
```bash
npx prisma migrate dev --name rename-premium-to-luxe
```
Ale Turso/SQLite s Prisma migrate může být problematické. Doporučuji `db push` + ruční SQL.

---

## 7. Implementační pořadí

| # | Krok | Soubory | Čas |
|---|------|---------|-----|
| 1 | Prisma schema — enum change | `prisma/schema.prisma` | 2 min |
| 2 | Validace — zod schemas | 2 soubory | 5 min |
| 3 | Překlady — 3 locale | `messages/{cs,uk,ru}.json` | 15 min |
| 4 | Lib soubory — product-bio, social, attribute-slugs | 3 soubory | 10 min |
| 5 | Komponenty — search & replace PREMIUM→LUXE | ~15 souborů | 20 min |
| 6 | API routes — deliveries | 1 soubor | 3 min |
| 7 | Product detail FAQs | 1 soubor | 10 min |
| 8 | SEO redirect | `next.config.ts` | 3 min |
| 9 | DB migrace | Turso SQL | 5 min |
| 10 | Build & test | | 10 min |

**Celkový effort:** ~1.5 hodiny

---

## 8. POZOR — soubory kde PREMIUM NEZNAMENÁ ProductCategory

Tyto soubory obsahují "PREMIUM" nebo "STANDARD" ale v kontextu `DiscountType`, NE `ProductCategory`:

- `src/lib/validations/sale.ts` — `DiscountType: STANDARD | MARKETING | PERSONAL` — **NECHAT**
- `src/lib/validations/finance.ts` — totéž — **NECHAT**
- `src/app/api/discounts/summary/route.ts` — totéž — **NECHAT**
- `src/app/(app)/discounts/DiscountsClient.tsx` — ověřit, pravděpodobně DiscountType — **NECHAT**
- `src/app/(app)/finance/discounts/DiscountHistoryClient.tsx` — totéž — **NECHAT**
- `src/components/sales/DiscountForm.tsx` — totéž — **NECHAT**

---

## 9. Rizika

| Riziko | Mitigace |
|--------|----------|
| Existující produkty s `PREMIUM` v DB | SQL UPDATE migrace |
| SEO — starý URL `/kategorie/premium` | 301 redirect v next.config.ts |
| Cached data s `PREMIUM` | `revalidateTag("products")` po migraci |
| PriceSettings s `PREMIUM` category | SQL UPDATE |
| TypeScript type errors | Prisma generate → nový typ |
| Plná textová search v DB (audit logs) | Audit logs obsahují historická data — OK, nechat |
