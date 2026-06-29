# TASK #18 — Analýza přesunu length + color z Variant na Product

**Datum:** 2026-06-28
**Agent:** planovac
**Verze:** 2 (finální)

---

## 1. ROZSAH — SOUBORY S "Variant" / "variant"

**89 souborů, 514 výskytů** v `src/`

### Rozdělení podle domény:

| Doména | Souborů | Popis |
|--------|---------|-------|
| **Business logika (`src/lib/`)** | 20 | FIFO, stock, sale-pricing, sales, stock-in, order-workflow, invoicing, complaints, loyalty, telegram, export-excel |
| **API routes (`src/app/api/`)** | 19 | deliveries, sales, orders, stock, products, variants, returns, price-settings, cron, salon-portal |
| **Admin UI (`src/app/(app)/`)** | 28 | dashboard, products, inventory, sales, orders, invoices, returns, suppliers, customers, salons, samples, settings, finance |
| **Public UI (`src/app/(public)/`)** | 4 | offer/ProductsShowcase, offer/[slug]/page, offer/[slug]/AddToInquiryForm, salon catalog |
| **Shared components (`src/components/`)** | 12 | ProductCard, HeroProductSlider, ProductGridCard, StockInForm, VariantTable, VariantBatchCreate, SaleItemRow, SaleSummary, CustomerSelect, SocialPostModal, BarcodeScanner, Button |
| **Serializers/Validations** | 6 | product-serializer, delivery-serializer, sale-serializer, product validations, delivery validations, sale validations |

---

## 2. MODEL VARIANT — SCHEMA A RELACE

### Variant model (`prisma/schema.prisma` line 157-180):

```
model Variant {
  id                    String   @id
  productId             String
  product               Product  @relation(...)
  lengthCm              Int          ← PŘESUNOUT NA PRODUCT
  color                 String       ← PŘESUNOUT NA PRODUCT
  costPricePerGram      Int          ← PŘESUNOUT NA PRODUCT
  wholesalePricePerGram Int          ← PŘESUNOUT NA PRODUCT
  retailPricePerGram    Int          ← PŘESUNOUT NA PRODUCT
  retailManualOverride  Boolean      ← PŘESUNOUT NA PRODUCT
  active                Boolean      ← NEPOTŘEBA (Product má archived)
  
  // RELACE — 5 modelů odkazuje na Variant:
  deliveries     Delivery[]
  stockMovements StockMovement[]
  reservations   Reservation[]
  saleItems      SaleItem[]
  orderItems     OrderItem[]
  
  @@unique([productId, lengthCm, color])
}
```

### Kdo odkazuje na Variant (variantId) — 5 modelů:

| Model | Schema řádek | FK pole | Účel |
|-------|-------------|---------|------|
| **Delivery** | 261-262 | `variantId → Variant` | FIFO zásobování, stock-in |
| **StockMovement** | 310-311 | `variantId → Variant` | Audit trail pohybů |
| **Reservation** | 344-345 | `variantId → Variant` | Rezervace pro objednávky |
| **SaleItem** | 485-486 | `variantId → Variant` | Prodejní položka + FIFO |
| **OrderItem** | 826-827 | `variantId → Variant` | Objednávková položka |

**Product → Variant** je `onDelete: Cascade` (line 160).

---

## 3. DELIVERY — AKTUÁLNÍ STAV A NUTNÁ ZMĚNA

### Nyní: Delivery → Variant → Product

```
StockInForm: vyber Product → vyber Color → vyber Length → resolve variantId
            ↓
POST /api/deliveries: body.variantId
            ↓
stockIn({ variantId }) → tx.delivery.create({ variantId })
            ↓
Telegram: variant.product.name + variant.lengthCm + variant.color
```

**Kód:**
- `src/components/inventory/StockInForm.tsx` (373 řádků) — UI flow
- `src/lib/stock-in.ts` (94 řádků) — `stockIn({ variantId, ... })`
- `src/app/api/deliveries/route.ts` — POST handler

### Po změně: Delivery → Product přímo

```
StockInForm: vyber Product → hotovo (length+color jsou na Productu)
            ↓
POST /api/deliveries: body.productId
            ↓
stockIn({ productId }) → tx.delivery.create({ productId })
```

---

## 4. API ROUTES, KOMPONENTY, BUSINESS LOGIKA

### API routes (19 souborů):

**SMAZAT (2):**
- `api/variants/[id]/route.ts` — PUT/DELETE variant (nepotřeba)
- `api/products/[id]/variants/route.ts` — GET/POST variants per product (nepotřeba)

**PŘEPSAT variantId → productId (13):**
- `api/deliveries/route.ts` — body.variantId
- `api/deliveries/[id]/route.ts` — include variant
- `api/deliveries/barcode/[code]/route.ts` — variant relace
- `api/stock/route.ts` — variantId filtrování (15 výskytů!)
- `api/stock/movements/route.ts` — variantId
- `api/sales/[id]/route.ts` — variant include (12 výskytů)
- `api/sales/price-preview/route.ts` — variantId lookup
- `api/orders/route.ts` — items.variantId
- `api/orders/[id]/route.ts` — include variant
- `api/returns/route.ts` + `[id]/route.ts` — variantId
- `api/salon-portal/catalog/route.ts` — variants + stock
- `api/cron/daily-summary/route.ts` — variant stats

**UPRAVIT (4):**
- `api/products/route.ts` — odstranit include variants
- `api/products/[id]/route.ts` — odstranit include variants
- `api/public/products/route.ts` — odstranit variants flattening
- `api/price-settings/route.ts` — přepočet retail na Product místo Variant

### Business logika — KRITICKÉ soubory (6):

| Soubor | Funkce | variantId výskyty | Riziko |
|--------|--------|-------------------|--------|
| `lib/fifo.ts` | `fifoDeduct(variantId)` — raw SQL `WHERE "variantId" = ${variantId}` | 4 | **VYSOKÉ** — raw SQL |
| `lib/stock.ts` | `getStockNumbers(variantId)` + `getAllStockNumbers()` — raw SQL GROUP BY | 14 | **VYSOKÉ** — raw SQL |
| `lib/sales.ts` | `completeSale({ items: [{ variantId }] })` — čte variant pro ceny, volá FIFO | 13 | **VYSOKÉ** — transakce |
| `lib/sale-pricing.ts` | `getSalePrice(variantId)` — `variant.findUniqueOrThrow` pro ceny | 6 | STŘEDNÍ |
| `lib/stock-in.ts` | `stockIn({ variantId })` — delivery + Telegram | 9 | STŘEDNÍ |
| `lib/order-workflow.ts` | `createOrder(items: [{ variantId }])` — stock check + reservation | 10 | **VYSOKÉ** — transakce |

### Business logika — PODRUŽNÉ soubory (14):

| Soubor | Výskyty |
|--------|---------|
| `lib/api/product-serializer.ts` | 23 — `serializeVariantForRole()` **SMAZAT**, přesunout ceny do Product |
| `lib/invoicing.ts` | 7 |
| `lib/social-post-generator.ts` | 5 |
| `lib/telegram.ts` | 4 |
| `lib/validations/product.ts` | 3 — `createVariantsSchema`, `updateVariantSchema` **SMAZAT** |
| `lib/validations/sale.ts` | 2 |
| `lib/api/delivery-serializer.ts` | 1 |
| `lib/api/sale-serializer.ts` | 2 |
| `lib/validations/delivery.ts` | 1 |
| `lib/validations/salon.ts` | 1 |
| `lib/export-excel.ts` | 1 |
| `lib/complaints.ts` | 1 |
| `lib/loyalty.ts` | 1 |
| `lib/invoice-status.ts` | 1 |

### UI komponenty (12):

**SMAZAT (2):**
- `components/products/VariantTable.tsx` (50 výskytů!) — celá tabulka variant
- `components/products/VariantBatchCreate.tsx` (15 výskytů) — batch vytváření variant

**ZJEDNODUŠIT (3):**
- `components/inventory/StockInForm.tsx` (16) — odstranit color/length dropdown
- `components/public/ProductCard.tsx` (12) — nepotřebuje variants[]
- `components/public/HeroProductSlider.tsx` (4) — nepotřebuje variants mapping

**PŘEPSAT variantId (7):**
- `components/sales/SaleItemRow.tsx` (4)
- `components/sales/SaleSummary.tsx` (2)
- `components/sales/CustomerSelect.tsx` (2)
- `components/products/SocialPostModal.tsx` (2)
- `components/BarcodeScanner.tsx` (1)
- `components/public/ProductGridCard.tsx` (12)
- `components/ui/Button.tsx` (5) — TypeScript variant type (jen název kolize)

### Admin stránky (28 souborů) — ukázka nejdůležitějších:

| Admin stránka | Výskyty | Změna |
|---------------|---------|-------|
| `products/[id]/ProductDetailClient.tsx` | 10 | Odstranit VariantTable, zobrazit ceny z Product |
| `sales/new/NewSaleWizard.tsx` | 24 | variantId → productId v sale flow |
| `dashboard/page.tsx` | 14 | Variant stats → Product stats |
| `inventory/InventoryClient.tsx` | 4 | variantId → productId |
| `orders/[id]/OrderDetailClient.tsx` | 6 | variant detail → product detail |
| `sales/[id]/SaleDetailClient.tsx` | 6 | variant detail → product detail |

---

## 5. VELIKOST ZMĚNY A RIZIKO

### Kvantifikace:

| Metrika | Hodnota |
|---------|---------|
| **Celkem souborů k úpravě** | 89 |
| **Z toho SMAZAT celé** | 4 (VariantTable, VariantBatchCreate, api/variants/[id], api/products/[id]/variants) |
| **Výskyty k přepisu** | 514 |
| **Raw SQL dotazy k přepisu** | 3 (fifo.ts line 40-46, stock.ts line 77-83 + 85-92) |
| **Prisma schema modely k úpravě** | 7 (Product, Variant→smazat, Delivery, StockMovement, Reservation, SaleItem, OrderItem) |
| **Turso ALTER TABLE příkazy** | ~12 (6× ADD COLUMN na products, 5× ADD+UPDATE+DROP na FK tabulkách, 1× DROP TABLE variants) |
| **Validační schémata (Zod) k úpravě** | 4 (product.ts, delivery.ts, sale.ts, salon.ts) |
| **Serializers k přepisu** | 3 (product-serializer, delivery-serializer, sale-serializer) |

### Riziko: **VELMI VYSOKÉ**

| Rizikový faktor | Popis |
|-----------------|-------|
| **FIFO integrita** | Raw SQL v fifo.ts — chyba = špatné odpisy skladu, ztráta peněz |
| **Datová migrace** | 1 Product s N Variant → N nových Products. FK (deliveries, sales) musí být přemapovány |
| **Turso** | Manuální ALTER TABLE, žádný rollback, nelze testovat na staging |
| **Transakce** | sales.ts + order-workflow.ts běží v transakcích — musí se změnit atomicky |
| **Produkční data** | Existující sales/deliveries mají variantId — špatná migrace = ztráta propojení |

### KRITICKÝ PROBLÉM — EXPLOZE PRODUKTŮ:

**Dnešní stav:**
- 1 Product "Virgin Rovné Indie" → 10 Variant (5 délek × 2 barvy)
- Celkem: ~10 Products, ~50-100 Variant

**Po migraci:**
- Každá Variant se stane samostatný Product
- 50-100 Products místo 10
- **Název, popis, fotky, textura, origin — DUPLIKOVÁNO** N×
- Změna popisu = editovat 10 Products místo 1
- SEO: 50+ slugů místo 10

---

## 6. MIGRAČNÍ STRATEGIE

### SQL migrace (pokud se půjde plnou cestou):

```sql
-- FÁZE 1: Přidat sloupce na products
ALTER TABLE products ADD COLUMN lengthCm INTEGER;
ALTER TABLE products ADD COLUMN color TEXT;
ALTER TABLE products ADD COLUMN costPricePerGram INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN wholesalePricePerGram INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN retailPricePerGram INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN retailManualOverride INTEGER DEFAULT 0;

-- FÁZE 2: Pro každý Variant vytvořit nový Product
-- (zachovat relace — delivery, sales, orders)
-- POZOR: SQLite nemá ALTER COLUMN, FK změna vyžaduje recreate table

-- FÁZE 3: Přesměrovat FK na všech 5 tabulkách
ALTER TABLE deliveries ADD COLUMN productId TEXT;
UPDATE deliveries SET productId = (
  SELECT productId FROM variants WHERE variants.id = deliveries.variantId
);
-- Opakovat pro: stock_movements, reservations, sale_items, order_items

-- FÁZE 4: Drop Variant
DROP TABLE variants;
```

**PROBLÉM SQLite:** SQLite nepodporuje `ALTER TABLE ... DROP COLUMN` na starších verzích a `ALTER TABLE ... ADD CONSTRAINT FOREIGN KEY`. Přesměrování FK vyžaduje:
1. Vytvořit novou tabulku s novým schématem
2. Zkopírovat data
3. Dropnout starou tabulku
4. Přejmenovat novou

---

## DOPORUČENÍ — 3 STRATEGIE

### Strategie A: PLNÉ ZRUŠENÍ VARIANT (to co uživatel žádá)
- 89 souborů, 514 výskytů, 3 raw SQL, 12+ ALTER TABLE
- **Riziko: VELMI VYSOKÉ**
- **Doba: 3-5 dní implementace + testování**
- Exploze produktů (10 → 50-100)
- Duplikace popisů, fotek, SEO dat

### Strategie B: ZACHOVAT VARIANT JAKO 1:1 SKRYTÝ DETAIL (doporučuji)
- Přidat `lengthCm`, `color`, ceny na Product (duplikovat)
- UI čte jen z Product, ignoruje Variant
- Backend interně používá Variant pro FIFO/stock/sales
- Při vytvoření Product automaticky 1 Variant
- **Změna: ~15-20 souborů (jen UI + API + CreateProductForm)**
- **0 raw SQL, 0 FK migrace, 0 riziko ztráty dat**
- **Riziko: NÍZKÉ**
- **Doba: 1 den**

### Strategie C: HYBRID — postupný přechod
1. Fáze 1: Strategie B (okamžitě)
2. Fáze 2: Přepsat FIFO/stock na productId (týdny později)
3. Fáze 3: Smazat Variant tabulku (měsíce později)

**DOPORUČUJI STRATEGII B** — stejný výsledek pro uživatele, minimální riziko, 1 den práce.

---
