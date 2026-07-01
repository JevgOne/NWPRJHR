# QA Report: Dual Selling Mode (BY_GRAM + BY_PIECE)
# Kompletní kontrola implementace

**Datum:** 2026-06-30
**Kontrolor:** KONTROLOR agent

---

## 1. TypeScript Check

**Status: PASS**

`npx tsc --noEmit` — dokoncil bez jakýchkoli chyb.

---

## 2. Next.js Build

**Status: PASS**

`npx next build` — úspěšně dokončil. Žádné chyby ani warningy. Všechny stránky (static + dynamic) prošly kompilací.

---

## 3. Konzistence — Porovnání s plánem

### PHASE 3 — Business logika

| Soubor | Status | Poznámka |
|--------|--------|----------|
| `src/lib/sale-pricing.ts` | PASS | getSalePrice vrací SalePriceResult se sellingMode, pricePerPiece |
| `src/lib/sales.ts` | PASS | completeSale počítá lineTotal podle sellingMode |
| `src/app/api/sales/price-preview/route.ts` | PASS | Vrací sellingMode, pricePerPiece, BY_PIECE lineTotal |
| `src/lib/order-workflow.ts` | PASS | createOrder rozlišuje stock check + ceny pro BY_PIECE |
| `src/lib/returns.ts` | PASS (s výhradou) | approveReturn používá heuristiku pieces>0 — viz BUG-2 |
| `src/lib/complaints.ts` | PASS (s výhradou) | createComplaint stejná heuristika pieces>0 — viz BUG-2 |
| `src/app/api/deliveries/route.ts` | PASS | isByPiece logika, effectiveTotalGrams, sellingMode na variantě |

### PHASE 4 — Stock-in formulář

| Soubor | Status | Poznámka |
|--------|--------|----------|
| `src/components/inventory/StockInForm.tsx` | PASS* | Přepínač BY_GRAM/BY_PIECE, piece fields, dynamický submit |

*Poznámka: Implementace se mírně liší od plánu v submit body:
- Plán: BY_PIECE odstraňuje `purchasePricePerGramRaw` (nastavuje 0)
- Implementace: posílá `purchasePricePerGramRaw: Math.round(parseFloat(purchasePrice) * 100)` vždy, ale pole je stále zobrazeno pro BY_GRAM.
- Dopad: Zákazník vidí pole pro purchase price u BY_GRAM, ale pro BY_PIECE je pole skryto a purchasePrice string bude prázdný → `Math.round(parseFloat("") * 100)` = `NaN * 100 = NaN`.
- **BUG-4 (MEDIUM):** Viz sekce bugů níže.

### PHASE 5 — Frontend

| Soubor | Status | Poznámka |
|--------|--------|----------|
| `src/components/public/ProductGridCard.tsx` | PASS | hasPieceVariants, minPiecePrice, Kc/ks, stock v ks |
| `src/app/(public)/offer/[slug]/page.tsx` | PASS | sellingMode ve select, availablePieces, priceUnit /ks, priceTip skryt |
| `src/app/(public)/offer/[slug]/AddToInquiryForm.tsx` | PASS | isByPiece, step/minQty/unitLabel, resetOnVariantChange |
| `src/app/(public)/inquiry-cart/InquiryCartClient.tsx` | PASS | CartItemRow: step/minQty dle unit, `{item.quantity}{item.unit}` |
| `src/app/(salon)/salon/catalog/CatalogClient.tsx` | PASS | CartItem.pieces, cartTotalPieces, BY_PIECE input, Kc/ks |
| `src/app/api/public/products/route.ts` | PASS | sellingMode, retailPricePerPiece, availablePieces |
| `src/app/api/salon-portal/catalog/route.ts` | PASS | isByPiece ceny, loyaltyDiscount na piecePrice, filter fix |

### Admin sales komponenty (NEBYLY V PLÁNU, ale byly implementovány)

| Soubor | Status | Poznámka |
|--------|--------|----------|
| `src/components/sales/SaleItemRow.tsx` | PASS | isByPiece badge, piece input, pricePerPiece display |
| `src/components/sales/SaleSummary.tsx` | PASS | sellingMode podmínka v items, ks@cena/ks vs g@cena/g |
| `src/app/(app)/sales/new/NewSaleWizard.tsx` | PASS | fetchPricePreview vrací sellingMode, isByPiece flow |
| `src/app/(app)/sales/[id]/SaleDetailClient.tsx` | PASS | sellingMode detekce v items, ks/g zobrazení |
| `src/components/products/VariantTable.tsx` | PASS | isByPiece, pricePerPiece/retailPricePerPiece, ks badge, ks stock |

---

## 4. Logická kontrola

### sale-pricing.ts — getSalePrice
PASS:
- RETAIL: `retailPricePerPiece ?? pricePerPiece ?? 0`
- HAIRDRESSER: sleva z `retailPricePerPiece`
- SALON: `pricePerPiece ?? 0`
- `sellingMode ?? "BY_GRAM"` fallback vždy přítomen

### sales.ts — completeSale
PASS s výhradou:
- Pricing: sellingMode, isByPiece, pricePerUnit — vše správně
- lineTotal: BY_PIECE = pricePerUnit * pieces, BY_GRAM = pricePerUnit * grams — OK
- FIFO loop: fifoLineTotal správně počítán dle sellingMode
- **VÝHRADA:** chybí HAIRDRESSER branch, viz BUG-1

### returns.ts — approveReturn
PASS s výhradou:
- isByPiece = `saleItem.pieces > 0 && ret.pieces > 0` — heuristika dle plánu (plan to schválil)
- returnValue správně: pieces vs grams
- Credit note unit: "ks" nebo "g" — OK

### complaints.ts — createComplaint
PASS s výhradou:
- isByPiece = `saleItem.pieces > 0 && input.pieces > 0` — stejná heuristika
- refundAmount správně

### StockInForm — submit
BUG-4 — viz sekce bugů

---

## 5. Edge Cases

### sellingMode chybí (null) na staré variantě
PASS — `(variant.sellingMode ?? "BY_GRAM")` použito ve všech klíčových místech:
- sale-pricing.ts:24, sales.ts:47, order-workflow.ts:81
- salon-portal/catalog:87, public/products:93

### pricePerPiece je null na BY_PIECE variantě
PASS — `variant.pricePerPiece ?? 0` nebo `retailPricePerPiece ?? pricePerPiece ?? 0` vždy přítomno.
Edge case: getSalePrice vrací `pricePerPiece: 0` místo null — lineTotal bude 0. Ošetřitelné validací při naskladnění (zod schema vyžaduje pricePerPiece pro BY_PIECE).

### ProductGridCard mix BY_GRAM + BY_PIECE variant
PASS — `hasPieceVariants` prioritizuje BY_PIECE zobrazení. Pokud má produkt oba typy, zobrazí se cena/ks. Mírně neoptimální pro smíšené produkty, ale funkčně korektní.

### StockInForm BY_PIECE bez zadané purchase price
**BUG-4** — viz níže.

---

## 6. i18n Překlady

**Status: PASS**

Všechny 3 lokality (cs, ru, uk) obsahují potřebné klíče:

| Klíč | cs | ru | uk |
|------|----|----|----|
| `stock.sellingMode` | ✅ | ✅ | ✅ |
| `stock.byGram` | ✅ | ✅ | ✅ |
| `stock.byPiece` | ✅ | ✅ | ✅ |
| `stock.totalPieces` | ✅ | ✅ | ✅ |
| `stock.pieceWeight` | ✅ | ✅ | ✅ |
| `stock.pricePerPieceCzk` | ✅ | ✅ | ✅ |
| `stock.retailPricePerPieceCzk` | ✅ | ✅ | ✅ |
| `stock.autoGrams` | ✅ | ✅ | ✅ |
| `stock.perPiece` | ✅ (ks) | ✅ (шт) | ✅ (шт) |
| `stock.pieces` | ✅ (ks) | ✅ | ✅ |
| `sale.enterPieces` | ✅ | ✅ | ✅ |
| `sale.insufficientStock` | ✅ | ✅ | ✅ |

---

## 7. Backward Compatibility

**Status: PASS**

- Existující BY_GRAM produkty: `sellingMode` = "BY_GRAM" (default) — fungují beze změny
- FIFO: gram-based logika aktivní pro `requestedPieces === 0` — OK
- Všechna nová pole jsou optional (`?`) s `?? "BY_GRAM"` / `?? 0` fallbacky
- Salon catalog filter: BY_GRAM produkty filtrovány přes `availableGrams > 0` — nezměněno

---

## NALEZENÉ BUGY

### BUG-1 (MEDIUM — latentní): `sales.ts:53-66` — chybí HAIRDRESSER branch

`completeSale()` nemá HAIRDRESSER větev. Pokud by byl volán s `customerType: "HAIRDRESSER"`, použije retail cenu bez slevy. Aktuálně `completeSaleSchema` nepřijímá HAIRDRESSER (`z.enum(["SALON", "RETAIL"])`), takže bug je latentní — API ho blokuje.

**Riziko:** Nízké v produkci, ale technický dluh.

---

### BUG-2 (LOW): `returns.ts:107`, `complaints.ts:66` — heuristická detekce BY_PIECE

```typescript
const isByPiece = saleItem.pieces > 0 && ret.pieces > 0;
```

Heuristika dle plánu (plán ji explicitně schválil). Riziko: BY_GRAM produkt s pieces>0 ze smíšeného FIFO by mohl být špatně detekován. V praxi BY_GRAM vždy pieces=0.

**Riziko:** Velmi nízké.

---

### BUG-3 (LOW): `/api/public/products` nepředává `wholesalePricePerPiece`

`ProductGridCard` čte `v.wholesalePricePerPiece` pro SALON zobrazení BY_PIECE ceny, ale public API ho neposílá. Pro SALON/HAIRDRESSER users na homepage/offer se zobrazí retail cena BY_PIECE variant.

**Riziko:** Nízké — zobrazení ceny pro B2B users na veřejné stránce.

---

### BUG-4 (MEDIUM): `StockInForm.tsx:138` — purchasePricePerGramRaw vždy odesílán

**Soubor:** `/Users/zen/hairora/src/components/inventory/StockInForm.tsx:138`

Implementace odesílá `purchasePricePerGramRaw: Math.round(parseFloat(purchasePrice) * 100)` vždy, ale pole purchase price je skryto pro BY_PIECE (`sellingMode === "BY_PIECE"` skryje Input). Tedy `purchasePrice` zůstane prázdný string a `parseFloat("") → NaN → NaN*100 = NaN`.

Validation schema `newStockInSchema` pro BY_PIECE nevyžaduje `purchasePricePerGramRaw` (je `z.number().int().positive()`). NaN selže zod validaci → error od serveru.

**Oprava:** Buď vynutit `purchasePricePerGramRaw: 0` pro BY_PIECE (jak říká plán), nebo vždy zobrazit pole s jinou labels.

**Dopad:** Střední — naskladnění culíků (BY_PIECE) selže serverovou validací. Formulář zobrazí error.

---

## SOUHRN

| Oblast | Status |
|--------|--------|
| TypeScript (`tsc --noEmit`) | ✅ PASS |
| Next.js build | ✅ PASS |
| PHASE 3: Business logika | ✅ PASS |
| PHASE 4: StockInForm | ⚠️ BUG-4 (submit selže pro BY_PIECE) |
| PHASE 5: Frontend | ✅ PASS |
| Admin sales komponenty | ✅ PASS (bonus implementace) |
| Edge cases | ✅ PASS (s BUG-4) |
| i18n klíče | ✅ PASS |
| Backward compatibility | ✅ PASS |

**Celkový verdikt: BLOKUJÍCÍ BUG — BUG-4 brání naskladnění BY_PIECE produktů.**

Priorita oprav:
1. **BUG-4 (MEDIUM/BLOKUJÍCÍ):** Opravit submit body v StockInForm — `purchasePricePerGramRaw: isByPiece ? 0 : Math.round(parseFloat(purchasePrice) * 100)`
2. BUG-1, BUG-2, BUG-3 jsou nízká priorita / latentní.
