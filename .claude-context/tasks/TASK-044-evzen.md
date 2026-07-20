# TASK-044 Evžen Audit — Pricing fields + Color grid (commit 16bf084)

**Datum:** 2026-07-15
**Auditor:** Evžen the King
**Commit:** 16bf084

---

## Doslovne zadani od uzivatele

1. "musí tam bejt ta nova cenova politika" → cenové pole (nákupní/prodejní, selling mode, margin)
2. "tam jsou 4 barvy jenom na webu jich mame víc" → všech 10 barev musí být viditelných

---

## Overeni bod po bodu

### 1. Cenova politika ✅

**Selling mode toggle (radky 383-412):**
- ✅ BY_GRAM / BY_PIECE prepinac
- ✅ Vizualni styl (rose border pro aktivni, line border pro neaktivni)
- ✅ Reset cen pri prepnuti modu

**Cenove inputy (radky 414-446):**
- ✅ Nakupni cena (costPrice) -- input s krokem 0.01
- ✅ Prodejni cena (retailPrice) -- input s krokem 0.01
- ✅ Auto 2x markup: kdyz zadas nakupni, prodejni se auto-vypocita jako 2x (radek 426)
- ✅ Manualni override prodejni ceny mozny (retailManual flag, radek 439)
- ✅ Labely se meni podle modu (perGram/perPiece)

**Price preview s marzi (radky 448-474):**
- ✅ Zobrazuje prodejni cenu za 100g nebo za kus
- ✅ Zobrazuje nakupni cenu
- ✅ Marze s barevnym kodovanim: zelena >30%, oranzova >0%, cervena <0%

**Validace (radky 154-159):**
- ✅ Prodejni cena > 0 povinne pri submit

**Submit data (radky 198-216):**
- ✅ BY_GRAM: costPricePerGram + retailPricePerGram odeslany v halerech
- ✅ BY_PIECE: costPricePerGram + pricePerPiece + retailPricePerPiece
- ✅ sellingMode spravne nastaveno

**ODPOVIDA ZADANI** -- cenova politika je kompletni.

### 2. Barvy -- vsech 10 viditelnych ✅

**COLOR_CODES (hair-colors.ts:28):**
- ✅ `["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]` -- 10 barev

**Color grid v forme (radky 516-535):**
- ✅ `COLOR_CODES.map((code) => ...)` -- iteruje pres VSECH 10 barev, zadny filter
- ✅ Vizualni kruzky (w-8 h-8 rounded-full) s hex barvou
- ✅ Vybrana barva ma rose border + ring + scale
- ✅ Tooltip s nazvem barvy (title={colorLabel(code)})
- ✅ Nahradil puvodni dropdown select -- lepsi UX

**ODPOVIDA ZADANI** -- vsech 10 barev je viditelnych jako vizualni grid.

---

## Verdikt

**SCHVALENO** ✅

Oba body zadani splneny:
1. Cenova politika kompletni (selling mode, nakupni/prodejni cena, auto 2x markup, marze preview, validace)
2. Vsech 10 barev zobrazeno jako vizualni grid (ne jen 4 jako driv v dropdownu)
