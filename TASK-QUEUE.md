# TASK QUEUE — Hairland

## AKTIVNÍ

## TASK-096: Cenová politika — marže se stále špatně počítá (221% místo 100%)
Priorita: 1
Stav: čeká na debug
Projekt: /Users/zen/NWPRJHR

### Kompletní zadání:
Uživatel: "v admin panelu jsem upravil cenu nákupní na 3300 u S-RV-10-55 a marže je stale 221% má bejt 100%"
Uživatel: "ta se přičte k nákupu a z toho je prodejní cena" + "máme automaticky nastavenou marži na 100%"

Produkt: Luxe Vlasy — Rovné 55cm Černá (slug: luxe-iran-rovne-10-55cm)
- Nákup: 3 300 Kč/100g (costPricePerGram = 3300)
- Prodejní: 10 586 Kč/100g (retailPricePerGram = 10586) — ŠPATNĚ
- Očekávaná prodejní: 6 600 Kč/100g (100% marže)
- Zobrazená marže: +7 286 Kč (221%)

### Analýza:
API route `src/app/api/variants/[id]/route.ts` při změně costPricePerGram:
1. Načte markupPercent z priceSettings pro kategorii produktu
2. Vypočítá retailPrice = calculateRetailPrice(cost, markup)
3. Uloží nový retail + reset retailManualOverride

Možné příčiny:
- priceSettings pro LUXE kategorii má v DB jiný markup než 100%
- API vrací chybu kterou frontend ignoroval (FIX: přidán error handling v commit aa11587)
- handleResetOverride jen mazal flag bez přepočtu (FIX: opraveno v commit aa11587)

### Co už bylo opraveno (commit 3ca87be + aa11587):
- Odstraněna podmínka !retailManualOverride při cost change
- Reset override přepočítá retail (posílá i costPricePerGram)
- Error handling na handleSavePrice a handleResetOverride

### Co zbývá:
1. Ověřit markup v DB pro kategorii LUXE (uživatel říká 100%, ale DB může mít jinak)
2. Uživatel musí vyzkoušet změnu nákupní ceny PO deployi aa11587
3. Pokud stále nefunguje — přidat debug logging do API route

### Kontext:
- Variant PUT API: `src/app/api/variants/[id]/route.ts`
- PriceInput: `src/components/products/VariantTable.tsx` (řádky 185-215)
- Pricing: `src/lib/pricing.ts` (calculateRetailPrice)
- Price settings: `src/app/api/price-settings/route.ts`
- Cenová politika UI: `src/app/(app)/settings/pricing/PricingSettingsClient.tsx`

---

## TASK-079: Prodejní karta položky — přidat všechny informace o produktu
Priorita: 1
Stav: čeká
Projekt: /Users/zen/NWPRJHR

### Kompletní zadání:
Uživatel: "a druha vec je ta že tohle je maximalně nepřehledné, nejsou tam puvod vlasu, atd všechny informace + není tam videt kolik je skladem G."

Na kartě položky v prodejním formuláři po nascanování QR musí být:
1. Původ vlasů (origin)
2. Textura (texture)
3. SKU kód
4. Skladem info: BY_PIECE = "1ks - 100g", BY_GRAM = celkové gramy

### Kontext:
- Prodejní stránka: `src/app/(app)/sales/new/page.tsx`
- Item row: `src/components/sales/SaleItemRow.tsx`
- SKU: `src/lib/sku.ts`

---

## TASK-080: Emoji nefunguje v poptávkách (assignedTo)
Priorita: 2
Stav: čeká
Projekt: /Users/zen/NWPRJHR

### Kompletní zadání:
Emoji (👑🐀🐻) funguje v sidebaru ale nefunguje v seznamu poptávek.

### Kontext:
- UserBadge: `src/components/ui/UserBadge.tsx`
- Poptávky: `src/app/(app)/inquiries/InquiriesClient.tsx`

---

## BACKLOG

## TASK-071: Performance — pomalé načítání produktů a admin panelu
Priorita: 2
Stav: čeká

---

## ČEKÁ

---

## HOTOVÉ
- TASK-087: Fix fotek na product detail (commit e6f9b55) — 2026-07-19
- TASK-088: Kategorie → update jmen/slug/cen (commit e6f9b55) — 2026-07-19
- TASK-089: Premium design produktové stránky (commit cb8a9da) — 2026-07-19
- TASK-090: Oprava kalkulace prodejní ceny + reset override UI (commit 3ca87be) — 2026-07-19
- TASK-091: Top info bar s kontakty a trust badges (commit 3ca87be) — 2026-07-19
- TASK-092: SEO audit hairland.cz vs goldhair.cz — kompletní report — 2026-07-19
- TASK-093: SEO kódové fixy (ItemList, mpn, sitemap, HowTo) — vše už implementováno — 2026-07-19
- TASK-094: SEO bugy produktu (availability, og:type, reviews, meta title) (commit 5019ea5) — 2026-07-19
- TASK-095: Rozšíření FAQ na produktových stránkách (commit 5019ea5) — 2026-07-19
- SEO základy (sitemap, robots.txt, schema markup, OG tags, meta tags)
- Audit log rozšíření (35+ API routes, filtrování, barevné badge)
- Reklamace sloučení (interní + tikety → jen tikety)
- Order detail redesign (červený cancel s potvrzením, status banner)
- Logout v public navbar
- Slevové kódy admin CRUD (/promo-codes)
- Cancel notifikace obousměrně (salon→admin, admin→salon)
- Unicode fix ReviewsClient.tsx (2026-07-09)
- Notification badge revalidation (2026-07-09)
- Blog OG image auto z cover image (2026-07-09)
- Produktové karty flatten (2026-07-09)
- Stock-in force-dynamic (2026-07-09)
- Demo produkty smazány, cenový formulář (2026-07-10)
- Recenze gender-neutral + premium cards (2026-07-10)
