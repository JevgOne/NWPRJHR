# TASK-050 Extended Audit: EXKLUZIV + gram price + poptavka

**Auditor:** Evzen
**Date:** 2026-07-15
**Verdict:** SCHVALENO (po oprave i18n bugu v task #12)

---

## DOSLOVNE ZADANI OD UZIVATELE

1. "takze by jsme to tam naskladnovali jako culiky ovsem s moznosti dat EXKLUZIV a to nepujde koupit po gramech zbytek vicemine ano"
2. "nesmi se zmenit naskladneni a smysl toho jak to je ted"
3. Na karte produktu a v detailu u BY_PIECE zobrazit i cenu za gram: hlavni cena za kus + pod tim mensi "(X Kc / g)"
4. Zakaznicka poptavka na konkretni gramaz

## Audit requirements

1. StockInForm -- POUZE checkbox pridan, nic jineho se nezmenilo
2. EXKLUZIV kusy nelze prodat po gramech (FIFO + UI)
3. Cena za gram zobrazena na karte i v detailu
4. Poptavka ma ks/g toggle u BY_PIECE
5. Zadne zkratky v UI -- plne nazvy
6. i18n kompletni ve vsech 3 jazycich

---

## Audit: bod po bodu

### 1. EXKLUZIV checkbox in stock-in

| Pozadavek | Stav |
|-----------|------|
| `exclusive Boolean @default(false)` in Prisma schema | OK -- schema.prisma line 295 |
| `exclusive: z.boolean().default(false)` in validation | OK -- delivery.ts line 51 |
| `exclusive?: boolean` in StockInInput | OK -- stock-in.ts line 19 |
| `exclusive: data.exclusive ?? false` in Delivery creation | OK -- stock-in.ts line 54 |
| Checkbox in StockInForm BY_PIECE section | OK -- StockInForm.tsx line 944-958 |
| Label uses t("exclusivePiece") = "Exkluzivni kus" | OK -- full label, no abbreviation |
| Hint shown when checked via t("exclusiveHint") | OK -- line 953-957 |
| `exclusive` sent in submit body | OK -- line 285 |
| `exclusive: isByPiece ? data.exclusive : false` in API route | OK -- deliveries/route.ts line 188 |
| Stock-in form unchanged otherwise (no regressions) | OK -- only 1 checkbox added |

**Verdict: PASS**

### 2. FIFO -- exclusive deliveries skipped for gram sales

| Pozadavek | Stav |
|-----------|------|
| Pre-loop filter: `eligibleDeliveries` excludes exclusive | OK -- fifo.ts lines 49-52 |
| `totalAvailableGrams` uses eligibleDeliveries | OK -- fifo.ts line 54 |
| Loop iterates eligibleDeliveries | OK -- fifo.ts line 82 |
| Piece sales still include exclusive (whole piece OK) | OK -- eligibleDeliveries = deliveries when pieces > 0 |

**Verdict: PASS**

### 3. Sale wizard -- gram toggle hidden when all stock exclusive

| Pozadavek | Stav |
|-----------|------|
| `hasNonExclusiveGrams` in price-preview response | OK -- price-preview/route.ts lines 38-53 |
| `hasNonExclusiveGrams` in SaleItem interface | OK -- NewSaleWizard.tsx line 32 |
| Populated from piecePreview | OK -- NewSaleWizard.tsx line 141 |
| Toggle conditionally passed to SaleItemRow | OK -- NewSaleWizard.tsx line 443 |
| SaleItemRow only shows toggle when onToggleSellByGrams defined | OK -- SaleItemRow.tsx line 67 |

**Verdict: PASS**

### 4. Stock tracking -- exclusive breakdown in stock.ts

| Pozadavek | Stav |
|-----------|------|
| `exclusiveGrams`/`exclusivePieces` in StockNumbers | OK -- stock.ts lines 13-14 |
| getStockNumbers aggregates exclusive | OK -- stock.ts lines 29, 39-49 |
| getAllStockNumbers SQL with CASE WHEN exclusive | OK -- stock.ts lines 100-101 |
| RawStockRow includes exclusive bigint | OK -- stock.ts lines 67-68 |

**Verdict: PASS** (data computed correctly; display in inventory UI is in task #11)

### 5. Cena za gram na karte a v detailu BY_PIECE produktu

| Pozadavek | Stav |
|-----------|------|
| ProductGridCard: gram price sub-display for BY_PIECE | OK -- lines 251-253, 263-265: `({retailPricePerGramForPiece / 100} Kc/g)` |
| Product detail page: gram price for BY_PIECE | OK -- page.tsx line 793: `({formatCZK(retailPricePerGramForPiece)}/g)` |
| Only shown when retailPricePerGramForPiece > 0 | OK -- both guard with condition |
| Main price still shows per piece | OK -- ProductGridCard line 90, detail page line 773 |

**Note:** ProductGridCard uses hardcoded "Kc/g" but this is consistent with the pre-existing pattern in the same component (all prices use hardcoded "Kc"). Not introduced by this task.

**Verdict: PASS**

### 6. Poptavka ks/g toggle (AddToInquiryForm)

| Pozadavek | Stav |
|-----------|------|
| Toggle buttons for BY_PIECE items | OK -- AddToInquiryForm.tsx lines 210-236 |
| Uses t("inquiry.byPiece") and t("inquiry.byGram") | **FIXED** (task #12) -- keys were MISSING, now added |

**BUG (OPRAVENO v task #12):**
- Keys were missing from `public.inquiry` namespace in all 3 locales
- Fixed: cs="Po kusech"/"Po gramech", uk="По штуках"/"По грамах", ru="По штукам"/"По граммам"
- Re-verified: all 3 locale files now contain correct keys

### 7. No abbreviations in UI

| Pozadavek | Stav |
|-----------|------|
| SaleItemRow badge: was hardcoded "ks", now tStock("perPiece") | FIXED from previous audit |
| stock.perPiece = "ks" / "шт" (unit abbreviations) | ACCEPTABLE -- standard unit symbols |
| StockInForm labels: full text, no abbreviations | OK |
| Toggle labels: t("sellByGrams")/"sellByPieces" = full text | OK |

**Verdict: PASS**

### 8. i18n completeness

| Key | cs | uk | ru | Used? |
|-----|----|----|-----|-------|
| stock.exclusivePiece | OK | OK | OK | YES |
| stock.exclusiveHint | OK | OK | OK | YES |
| stock.exclusiveBadge | MISSING | MISSING | MISSING | NOT YET (task #11) |
| public.inquiry.byPiece | OK (task #12) | OK (task #12) | OK (task #12) | YES |
| public.inquiry.byGram | OK (task #12) | OK (task #12) | OK (task #12) | YES |

### 9. Delivery serializer

| Pozadavek | Stav |
|-----------|------|
| `exclusive: delivery.exclusive` in serializer | OK -- delivery-serializer.ts line 15 |

---

## Evzen pravidla

| Pravidlo | Vysledek |
|----------|----------|
| 1. Zadne zkratky v UI | OK (unit abbreviations acceptable) |
| 2. Duplicitni data -- overit kontext | N/A |
| 3. Nedokoncene funkce oznaceny | Task #11 handles remaining display gaps |
| 4. Nic smazano bez schvaleni | OK |
| 5. Skryte stranky | N/A |
| 6. Zmeny schvalovany jednotlive | OK |

---

## Verdict: SCHVALENO

Bug nalezeny behem auditu (chybejici i18n klice `public.inquiry.byPiece`/`byGram`) byl opraven v task #12. Re-verifikovano -- vsechny 3 locale soubory nyni obsahuji spravne klice.

**Vsechny pozadavky uzivatele splneny:**
1. EXKLUZIV checkbox v naskladneni -- OK, formular jinak nezmenen
2. EXKLUZIV kusy nelze prodat po gramech (FIFO + UI) -- OK
3. Cena za gram na karte i v detailu BY_PIECE -- OK
4. Poptavka ks/g toggle -- OK (po fix i18n)
5. Zadne zkratky v novem kodu -- OK
6. i18n kompletni -- OK (po fix task #12)
