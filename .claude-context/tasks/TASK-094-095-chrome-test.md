# Chrome Test Report: TASK-094 + TASK-095

**Tester:** TEST-CHROME  
**Date:** 2026-07-19  
**Dev server:** http://localhost:3000 (Turso credentials)  
**Testovaný produkt:** `/offer/luxe-ukrajina-mirne-vlnite-2-55cm` (Luxe Vlasy — Mírně vlnité 55cm Světlá blond)  
**Chrome otevřen:** `http://localhost:3000/cs/offer` + produkt detail

---

## TASK-094: SEO fixy

### Meta title — PASS

```
Luxe Vlasy — Mírně vlnité 55cm Světlá blond | Hairland
```

Obsahuje: textura (`Mírně vlnité`), délka (`55cm`), barva (`Světlá blond`). Optimalizovaný pro SEO.

### JSON-LD Product schema — PASS (všechna 4 pole)

| Pole | Hodnota | Status |
|------|---------|--------|
| `availability` | `https://schema.org/InStock` | PASS |
| `itemCondition` | `https://schema.org/NewCondition` | PASS |
| `priceValidUntil` | `2026-08-18` (~30 dní od testu) | PASS |
| `color` (top-level) | `Světlá blond` | PASS |

**Availability logika** (source kód, řádky 652-661):
- `archived` → `Discontinued`
- `hasStock` → `InStock`
- `hasPreOrder` → `PreOrder`
- jinak → `OutOfStock`

**Implementace priceValidUntil:**
```js
new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
```
Dynamicky počítá 30 dní dopředu.

### JSON-LD bloky nalezeny — PASS

Stránka má 3 JSON-LD bloky:
1. `Product` — s offers, availability, color, priceValidUntil
2. `BreadcrumbList` — navigace
3. `FAQPage` — 16 otázek

---

## TASK-095: Rozšířené FAQ

### Počet otázek — PASS

| | Výsledek | Status |
|--|---------|--------|
| FAQ accordion items (HTML) | 16 | PASS |
| FAQPage JSON-LD otázky | 16 | PASS |
| Celkem otázek v source kódu | 28 (filtrováno dle produktu) | PASS |

### Specifické nové otázky — PASS

| Otázka | Nalezena v HTML | Status |
|--------|-----------------|--------|
| "Jak probíhá objednávka vlasů na míru?" | ANO (jako #10) | PASS |
| "Jaké platební metody přijímáte?" | ANO (jako #14) | PASS |
| "Nabízíte osobní konzultaci před nákupem?" | ANO (jako #12) | PASS |

**Poznámka:** Task říkal "Jak si objednat vlasy na míru?" — skutečná formulace je "Jak probíhá objednávka vlasů na míru?" (obsahově totožné, jiné sloveso). Otázka je přítomna.

### Všechny FAQ otázky (pořadí v HTML)

1. Jaký je rozdíl mezi luxe a panenskými vlasy?
2. Jak dlouho vydrží luxe vlasy?
3. Jaké možnosti stylování mají luxe vlasy?
4. Mohu luxe vlasy přebarvit?
5. Pro koho jsou luxe vlasy ideální?
6. Jaký je rozdíl mezi rovnými, vlnitými a kudrnatými vlasy?
7. Jak pečovat o rovné prodloužené vlasy?
8. Jak pečovat o vlnité a kudrnaté vlasy?
9. Co jsou RAW vlasy a jak se liší od hotových příčesků?
10. Jak probíhá objednávka vlasů na míru?
11. Kolik gramů vlasů potřebuji k prodloužení?
12. Nabízíte osobní konzultaci před nákupem?
13. Jak funguje doručení a kolik stojí?
14. Jaké platební metody přijímáte?
15. Mohu vlasy vrátit, pokud mi nesedí?
16. Spolupracujete s kadeřníky a salony?

### Diakritika — PASS

Žádné broken encoding (`Ã­`, `Ä›`, `Å¡` atd.) v HTML. `&amp;` výskyty jsou správné HTML escapování URL query stringů (`?mode=consult&amp;reason=real-photo`) — není to chyba.

---

## JS konzole — PASS

Dev log po načtení stránky:
```
✓ Compiled in 78ms
✓ Compiled in 110ms
✓ Compiled in 86ms
```
Žádné JS chyby, žádné React warnings (krom pre-existing LCP warning o logo.svg).

---

## Celkový verdikt

| Oblast | Status |
|--------|--------|
| Meta title s texturou/délkou/barvou | PASS |
| JSON-LD `availability` (InStock/PreOrder/OutOfStock) | PASS |
| JSON-LD `itemCondition` = NewCondition | PASS |
| JSON-LD `priceValidUntil` ~30 dní | PASS |
| JSON-LD `color` top-level property | PASS |
| FAQPage schema 16 otázek | PASS |
| FAQ accordion 16 items v HTML | PASS |
| Otázka o objednávce na míru | PASS |
| Otázka o platebních metodách | PASS |
| Otázka o osobní konzultaci | PASS |
| Diakritika bez broken encoding | PASS |
| JS konzole bez chyb | PASS |
| **CELKOVÝ VERDIKT** | **PASS** |

Obě tasky (TASK-094 SEO + TASK-095 FAQ) implementovány správně. Připraveno k deployi.
