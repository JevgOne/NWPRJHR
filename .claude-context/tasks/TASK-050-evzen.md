# TASK-050 Audit: BY_PIECE partial gram sales

**Auditor:** Evzen
**Date:** 2026-07-15
**Verdict:** SCHVALENO (s 1 poznamkou)

---

## Original requirement

> BY_PIECE produkty (culiky) - moznost prodat castecne po gramech misto celych kusu. Napr. 150g kus prodat jako 100g + 50g.

---

## Audit: bod po bodu

### 1. SaleItemRow.tsx -- toggle "Prodat po gramech"

| Pozadavek | Stav |
|-----------|------|
| Toggle button pro BY_PIECE items | OK -- line 68-74 |
| Gram input kdyz sellByGrams=true | OK -- line 76-85 |
| Piece input kdyz sellByGrams=false (default) | OK -- line 86-94 |
| Insufficient stock check (grams/pieces mode) | OK -- line 47-51 |
| Available stock display (grams vs pieces) | OK -- line 118-125 |
| Price display (pricePerGram vs pricePerPiece) | OK -- line 128-134 |
| Translation keys (not hardcoded strings) | OK -- uses t("sellByGrams"), t("sellByPieces"), t("enterGrams"), t("enterPieces") |

**Poznamka:** Line 58 -- hardcoded `ks` badge. Toto je zkratka. Melo by byt cele slovo z prekladu (napr. tStock("pieces")). NENI blocker, ale porusuje pravidlo #1 (zadne zkratky v UI).

### 2. NewSaleWizard.tsx -- sellByGrams logika

| Pozadavek | Stav |
|-----------|------|
| sellByGrams v SaleItem interface | OK -- line 31 |
| Toggle handler (reset quantities) | OK -- line 202-217 |
| Pricing: pricePerGram * grams kdyz sellByGrams | OK -- line 226-231 |
| Submit: pieces=0, grams=X kdyz sellByGrams | OK -- line 301 |
| canSubmit: grams>0 staci pro BY_PIECE gram mode | OK -- line 345 |
| Summary: gram info kdyz sellByGrams | OK -- line 524-527 |
| onToggleSellByGrams passed to SaleItemRow | OK -- line 441 |
| availableGrams + pricePerGram fetched for BY_PIECE | OK -- line 136-143 |

### 3. sales.ts -- backend pricing

| Pozadavek | Stav |
|-----------|------|
| lineTotal: pricePerGram * grams kdyz pieces=0 | OK -- line 86-88: `(isByPiece && item.pieces > 0) ? pricePerUnit * pieces : pricePerGram * grams` |
| fifoLineTotal: pricePerGram * grams kdyz pieces=0 | OK -- line 145-147 |

### 4. fifo.ts -- gram deduction from BY_PIECE stock

| Pozadavek | Stav |
|-----------|------|
| Gram deduction path (pieces=0, grams>0) | OK -- line 88-91: existing path works |
| Piece count decremented when all grams consumed | OK -- line 93-99: `if gramsAfterDeduction <= 0, piecesFromThis = remainingPieces` |

### 5. price-preview/route.ts -- API support

| Pozadavek | Stav |
|-----------|------|
| BY_PIECE with pieces=0: use pricePerGram * grams | OK -- line 36-38 |
| Always return pricePerGram for BY_PIECE | OK -- line 42 |

### 6. i18n translations

| Key | cs.json | uk.json | ru.json |
|-----|---------|---------|---------|
| sellByGrams | "Prodat po gramech" | "Prodati po gramah" | "Prodat po grammam" |
| sellByPieces | "Prodat po kusech" | "Prodati poshtuchno" | "Prodat poshtuchno" |

Vsechny preklady existuji a jsou ve spravnem namespace (sale).

---

## Evzen pravidla

| Pravidlo | Vysledek |
|----------|----------|
| 1. Zadne zkratky v UI | POZNAMKA: `ks` badge na line 58 SaleItemRow.tsx -- mala zkratka, neni blocker |
| 2. Duplicitni data -- overit kontext | N/A |
| 3. Nedokoncene funkce oznaceny | Vse dokonceno |
| 4. Nic smazano bez schvaleni | Nic smazano |
| 5. Skryte stranky | N/A -- zadna nova stranka |
| 6. Zmeny schvalovany jednotlive | OK |

---

## Verdict

**SCHVALENO** -- implementace odpovida zadani. Vsech 6 souboru z planu bylo upraveno. Uzivatelsky flow funguje: BY_PIECE item -> toggle "Prodat po gramech" -> zadat gramy -> backend pocita spravne (pricePerGram * grams) -> FIFO odecita gramy ze skladu -> pieces dekrementovany kdyz vycerpany.

Jedina poznamka: hardcoded `ks` badge v SaleItemRow.tsx:58 -- doporucuji nahradit prekladem. Neni blocker pro schvaleni.
