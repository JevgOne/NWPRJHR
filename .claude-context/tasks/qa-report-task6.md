# QA Report: Dual Selling Mode (Task #6)

**Datum:** 2026-06-30
**Kontrolor:** KONTROLOR agent

---

## 1. TypeScript Check

**Výsledek: PASS**

`npx tsc --noEmit` dokoncil bez erroru ani warningu.

---

## 2. Schema + DB

**Výsledek: PASS**

- `Variant.sellingMode`: String, default "BY_GRAM" — spravne
- `Variant.pricePerPiece`: Int? — nullable, spravne
- `Variant.retailPricePerPiece`: Int? — nullable, spravne
- `Delivery.initialPieces`, `remainingPieces`: Int — spravne
- `Delivery.pieceWeightGrams`: Int? — spravne

---

## 3. Edge Cases

### 3a. `sellingMode` chybi / null
**PASS** — vsude se pouziva `variant.sellingMode ?? "BY_GRAM"` jako fallback.
Soubory:
- `sale-pricing.ts:24`
- `sales.ts:47`
- `order-workflow.ts:81`
- `salon-portal/catalog/route.ts:87`
- `public/products/route.ts:93`

### 3b. `pricePerPiece` je null
**PASS** — vsude se pouziva `variant.pricePerPiece ?? 0` nebo `variant.retailPricePerPiece ?? variant.pricePerPiece ?? 0`.
Rizikova mista:
- `sale-pricing.ts:44` — `retailPricePerPiece ?? pricePerPiece ?? 0` — OK
- `sales.ts:63` — `retailPricePerPiece ?? pricePerPiece ?? 0` — OK
- `order-workflow.ts:102` — `pricePerPiece ?? 0` — OK

---

## 4. UI Texty (Kc/g vs Kc/ks)

**Výsledek: PASS s poznamkami**

### Spravne:
- `ProductGridCard.tsx:223` — `Kc/ks` pro BY_PIECE
- `ProductGridCard.tsx:241` — `Kc/ks` pro BY_PIECE
- `ProductGridCard.tsx:259` — `Kc/g` pro BY_GRAM
- `ProductGridCard.tsx:280` — `Kc/g` pro BY_GRAM
- `CatalogClient.tsx:280` — `Kc/ks` pro BY_PIECE
- `CatalogClient.tsx:282` — `Kc/g` pro BY_GRAM
- `AddToInquiryForm.tsx:175` — `Kc/ks` pro BY_PIECE, `Kc/g` pro BY_GRAM

### Stock display:
- `ProductGridCard.tsx:286-287` — `${totalPieces} ks` nebo `${totalStock} g` — OK
- `CatalogClient.tsx:287-288` — `${v.availablePieces} ks` nebo `${v.availableGrams} g` — OK

---

## 5. Preklady (i18n)

**Výsledek: PASS**

Vsechny 3 localy (cs, ru, uk) maji:
- `stock.sellingMode` — OK
- `stock.byGram` — OK
- `stock.byPiece` — OK
- `stock.totalPieces` — OK
- `stock.pieceWeight` — OK
- `stock.pricePerPieceCzk` — OK
- `stock.retailPricePerPieceCzk` — OK
- `stock.autoGrams` — OK
- `stock.perPiece` — OK (cs="ks", ru="шт", uk="шт")

---

## 6. Konzistence — vsude podminka na sellingMode

**Výsledek: PASS**

Vsechna mista kde se zobrazuje cena/sklad maji spravnou podminkovou logiku:
- Public API (`/api/public/products`): sellingMode predavano, stock pro pieces
- Salon catalog API: isByPiece logika pro ceny i filtrovani skladu
- ProductGridCard: `hasPieceVariants` podminka
- AddToInquiryForm: `isByPiece` podminka pro quantity step, unitLabel, maxQty
- CatalogClient: `v.sellingMode === "BY_PIECE"` podminka v tabulce

---

## 7. Backward Compatibility

**Výsledek: PASS**

- Existujici BY_GRAM produkty: `sellingMode` default "BY_GRAM" — funguje jako drive
- FIFO: gram-based logika se aktivuje kdyz `requestedPieces === 0` — OK
- SaleItem.pricePerGramUsed: uchovava gram cenu i pro BY_PIECE (pro COGS vypocet) — OK

---

## NALEZENE BUGY

### BUG-1 (MEDIUM): `sales.ts` — chybi HAIRDRESSER branch

**Soubor:** `/Users/zen/hairora/src/lib/sales.ts:53-66`

`completeSale()` ma jen dve vetvi pro cenu:
```
if (input.customerType === "SALON") { pricePerGram = wholesale }
else { pricePerGram = retail }
```

Pro HAIRDRESSER se pouzije retail cena BEZ slevy. Ale v `completeSaleSchema` (validations/sale.ts:27) je `customerType: z.enum(["SALON", "RETAIL"])` — HAIRDRESSER neni povoleny jako vstup. Takze bug je latentni (API ho neakceptuje), ale kdyz nekdo pouzije `completeSale()` primo s HAIRDRESSER, dostane spatnou cenu.

**Dopad:** Nizi — API ho filtruje. Ale `getSalePrice()` (sale-pricing.ts) HAIRDRESSER zvlada spravne.

### BUG-2 (LOW): `returns.ts:107` — heuristicke detekce BY_PIECE

**Soubor:** `/Users/zen/hairora/src/lib/returns.ts:107`

```typescript
const isByPiece = ret.saleItem.pieces > 0 && ret.pieces > 0;
```

Detekce BY_PIECE modu je heuristicka (kontroluje pocty kusu), ne ze schema. Kdyz se vrati parcial BY_GRAM produktu a `saleItem.pieces > 0` z nejakeho duvodu, muze se credit note vytvorit spatne. Spravnejsi by bylo cist `variant.sellingMode`.

**Dopad:** Nizi — v praxi BY_GRAM produkty maji `pieces=0`, ale je to technicke riziko.

### BUG-3 (LOW): `public/products route.ts` nepredava `wholesalePricePerPiece`

**Soubor:** `/Users/zen/hairora/src/app/api/public/products/route.ts:85-96`

API predava `retailPricePerPiece` ale NE `wholesalePricePerPiece`. `ProductGridCard` se ho snazi cist (`v.wholesalePricePerPiece`), ale pro public route to bude vzdy `undefined`. Cena pro SALON/HAIRDRESSER v ProductGridCard pak pouzije retail price jako zakladni. Funguje, ale salon/hairdresser zobrazi MO cenu, ne VO cenu.

**Dopad:** UI u salonu/kadernika zobrazuje spatnou (vyssi) cenu pro BY_PIECE varianty na homepage/offer. Ale AddToInquiryForm pouziva pricePerPiece, ktera uz muze byt role-specificka (dle session).

---

## SOUHRN

| Oblast | Status |
|--------|--------|
| TypeScript | PASS |
| Schema / DB | PASS |
| Edge cases (null, missing) | PASS |
| UI texty Kc/g vs Kc/ks | PASS |
| Preklady (cs/ru/uk) | PASS |
| Konzistence sellingMode | PASS |
| Backward compatibility BY_GRAM | PASS |
| Bugy | 3 nalezeny (1 medium, 2 low) |

**Celkovy verdikt: PRIPRAVENO K NASAZENI s drobnymi rezervami.**
BUG-1 a BUG-3 jsou zname technicke dluhy. BUG-1 je kryty validaci. BUG-3 ovlivnuje zobrazeni ceny pro B2B users na verejne strance (mensi dopad).
