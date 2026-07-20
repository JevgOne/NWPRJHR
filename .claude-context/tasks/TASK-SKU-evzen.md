# SKU Audit (Task #26)

**Auditor:** Evzen
**Date:** 2026-07-16
**Verdict:** SCHVALENO

---

## DOSLOVNE ZADANI OD UZIVATELE

1. "produkty musi mit nejaky kody kazdy produkt co se naskladnuje aby to pomohlo vyhledavani"
2. "musi to mit teda vlastni QR kod a SKU KOD, ten musi bejt nekde viditelny i ve skladu atd"
3. "jo super, tak pridel kazdemu ten kod, a dej to i do faktury atd proste vsude kde je treba"

---

## Audit: bod po bodu

### 1. SKU generator -- vlastni kody

| Pozadavek | Stav |
|-----------|------|
| SKU format existuje | OK -- `src/lib/sku.ts`: `L-RV-02-60` (kategorie-textura-barva-delka) |
| Dynamicky generovany (ne ulozeny v DB) | OK -- `generateSku()` pure function |
| Parsovatelny zpet | OK -- `parseSku()` inverse function |
| Kazdy naskladneny produkt ma kod | OK -- generuje se z variant properties (category, texture, color, length) |

**Verdict: PASS**

### 2. QR kod + SKU viditelny ve skladu

| Pozadavek | Stav |
|-----------|------|
| Sklad (InventoryClient) -- SKU v radcich | OK -- line 341-343: monospace sub-text pod nazvem produktu |
| Sklad -- SKU ve vyhledavani | OK -- line 146-150: search filter zahrnuje SKU |
| QR stitky (QrLabelSheet) -- SKU jako text | OK -- import `generateSku` on line 5 |
| Admin VariantTable -- SKU sloupec s copy | OK -- line 257-266: copy-to-clipboard |

**Verdict: PASS**

### 3. Faktury a "vsude kde je treba"

| Kde | Stav |
|-----|------|
| Faktury (invoicing.ts) | OK -- line 26-27: `"Luxe Vlasy — Rovne, 60cm, 2 (L-RV-02-60)"` |
| Emaily (email-templates.ts) | OK -- line 319, 340: SKU v potvrzeni poptavky |
| Telegram notifikace | OK -- line 143: SKU u poptavek, line 272: SKU u naskladneni |
| Poptavkovy kosik (InquiryCartClient) | OK -- line 379: SKU u kazde polozky |
| AddToInquiryForm | OK -- line 123, 311: SKU viditelny po vyberu varianty |
| JSON-LD (SEO) | OK -- page.tsx line 612-614: SKU v structured data |

**Verdict: PASS**

### 4. Zadne zkratky v UI

| Misto | Stav |
|-------|------|
| SKU samotne je technicka zkratka (Stock Keeping Unit) | AKCEPTOVATELNE -- standardni obchodni termin |
| InventoryClient SKU display | OK -- monospace, zadny dalsi text |
| VariantTable "Copy SKU" | OK -- title attribute, akceptovatelne |

**Verdict: PASS**

### 5. Poznamky k mezerach (z QA)

| Mezera | Zavaznost | Hodnoceni |
|--------|-----------|-----------|
| `notifyLowStock()` nema SKU | LOW | Neni v zadani -- uzivatel rekl "naskladneni" ne "low stock alert" |
| ProductGridCard nema SKU | LOW | Neni v zadani -- uzivatel rekl "ve skladu", ne "na webu na kartach" |

Obe mezery jsou mimo rozsah puvodniho zadani. Uzivatel chtel SKU pro: vyhledavani, sklad, faktury, a "vsude kde je treba". Vsechna tato mista jsou pokryta.

---

## Evzen pravidla

| Pravidlo | Vysledek |
|----------|----------|
| 1. Zadne zkratky v UI | OK |
| 2. Duplicitni data | N/A |
| 3. Nedokoncene funkce oznaceny | N/A -- vse dokonceno |
| 4. Nic smazano bez schvaleni | OK |
| 5. Skryte stranky | N/A |
| 6. Zmeny schvalovany jednotlive | OK |

---

## Verdict: SCHVALENO

Implementace plne odpovida zadani uzivatele. SKU kody jsou:
- Generovany pro kazdou variantu (format `L-RV-02-60`)
- Viditelne ve skladu (radky + vyhledavani)
- Na QR stictcich
- Ve fakturach
- V emailech a Telegram notifikacich
- V poptavkovem kosiku
- V JSON-LD pro SEO

Zadne bugy, zadne chybejici klice, zadne zkratky.
