# TASK-024/29: Produktový text nesmí opakovat specifikace + "100% pravé vlasy" jen na detail

**Status:** Analýza v2 — AKTUALIZOVÁNO s novým požadavkem uživatele
**Autor:** Plánovač
**Datum:** 2026-07-14
**Update v2:** 2026-07-15 — nový user požadavek: "100% pravé vlasy" NE na kartu, ANO na detail

---

## Kontext

User: "nemůžeme dávat do textu produktu jakože Panenské vlasy Ukrajina Mírně vlnité 55cm protože to už tam všude je na produktu"
User (nový): "to 100% pravé vlasy, nedavej do karty produktu, ale do detailu produktu"

---

## Audit: Kde se specifikace zobrazují

### Na veřejné produktové stránce (`offer/[...slug]/page.tsx`)

Specifikace jsou viditelné na **4 místech** bez popisu:

| Místo | Co zobrazuje | Řádky |
|-------|-------------|-------|
| Product name (h1) | "Panenské Ukrajina Mírně vlnité" (= category + origin + texture) | 738 |
| Origin badge (header) | Vlajka + název země | 751-757 |
| Specs row (bg-nude-50 grid) | Origin, Texture, Color, Lengths — jako clickable pills | 826-864 |
| Variant picker table | Délka, barva, cena, dostupnost | dále v kódu |

Celkem: specifikace (kategorie, původ, textura, délka) jsou viditelné **minimálně 3×** ještě PŘED popisem.

### V popisu (description)

`generateProductBio()` (řádky 87-99) generuje:
1. `CATEGORY_STORY[data.category]` — "Tyto vlasy vám zaručují absolutní jistotu kvality..." (mluví o kategorii jako Virgin/Luxe ale obecně, NE jménem)
2. `PROCESSING_STORY[data.processingType]` — "Zpracování metodou clip-in..." (mluví o typu zpracování)

**Verdikt:** `generateProductBio()` aktuálně **NEOBSAHUJE** surové specifikace (origin, texture, length). Kategorie je zmíněna nepřímo (příběhem, ne jménem). Toto je OK.

### Na produktové kartě (`ProductGridCard.tsx`)

| Místo | Co zobrazuje | Řádky |
|-------|-------------|-------|
| Category badge | "Panenské" / "Luxusní" | 133-143 |
| Origin badge | Vlajka + země | 176-195 |
| Product name | "Panenské Ukrajina Mírně vlnité" | 201-211 |
| Texture + Color + Length | Jako ikony + text | 213-236 |

Produktový název **obsahuje** category + origin + texture a pak se ZNOVU zobrazí jako badgy pod ním.

---

## Identifikované problémy

### Problem 1: Produktový NÁZEV obsahuje specifikace

**`src/app/api/deliveries/route.ts` řádek 105:**
```typescript
name: `${catNames.cs} ${data.origin} ${data.texture}`,
```

Vytváří názvy jako "Panenské Ukrajina Mírně vlnité". Tyto specs se pak ZNOVU zobrazují jako:
- Category badge
- Origin badge s vlajkou
- Texture swatch

**Výsledek na kartě:**
```
[PANENSKÉ]                    ← badge
🇺🇦 Ukrajina                  ← origin badge
✓ 100% pravé vlasy
Panenské Ukrajina Mírně vlnité ← název (OPAKUJE category + origin + texture!)
~ Mírně vlnité                 ← texture (OPAKUJE!)
● Přírodní černá               ← barva
↕ 55 cm                        ← délka
```

### Problem 2: `generateProductBioShort()` — dead code

Funkce `generateProductBioShort()` (řádky 101-121 v `product-bio.ts`) generuje text jako:
```
Panenské clip-in vlasy | mírně vlnité | Ukrajina | 50–70 cm
```

Ale NIKDE se neimportuje ani nepoužívá. Je to mrtvý kód.

### Problem 3: Dead code v `product-bio.ts`

Následující konstanty jsou definovány ale **nikdy použity** funkcí `generateProductBio()`:
- `CATEGORY_BENEFITS` (řádky 35-61) — bullet points o výhodách kategorií
- `ORIGIN_STORY` (řádky 63-69) — příběhy o původu (Uzbekistán, Ukrajina...)
- `TEXTURE_NOTE` (řádky 80-85) — poznámky o textuře
- `CAT_LABEL` (řádky 12-17) — pouze v `generateProductBioShort()`
- `PROC_LABEL` (řádky 19-26) — pouze v `generateProductBioShort()`

Tyto konstanty zabírají prostor ale nic nedělají.

---

## Doporučený fix plan

### Krok 1: Vyčistit produktový název (DŮLEŽITÉ)

Produktový název by měl být **popisný ale ne duplicitní**. Protože category, origin a texture se zobrazují jako badges, název by je neměl opakovat.

**Varianta A (jednoduchá):** Název = jen "Vlasy pro prodloužení" nebo typ zpracování
**Varianta B (kompromis):** Název = kategorie + "vlasy" (bez origin/texture)

Doporučuji konzultaci s uživatelem, protože název je na mnoha místech (cards, detail, SEO, faktury).

**`src/app/api/deliveries/route.ts` řádek 105 — aktuální:**
```typescript
name: `${catNames.cs} ${data.origin} ${data.texture}`,
```

**Možný fix (konzervativní):** Pouze textura v názvu (origin se zobrazí jako badge):
```typescript
name: `${catNames.cs} vlasy — ${data.texture}`,
```
Výsledek: "Panenské vlasy — Mírně vlnité"

Ale tohle závisí na tom, co uživatel preferuje. Možná chce ještě kratší název. **Vyžaduje rozhodnutí uživatele.**

### Krok 2: Smazat dead code z `product-bio.ts`

Smazat:
- `generateProductBioShort()` (řádky 101-121)
- `CAT_LABEL` (řádky 12-17)
- `PROC_LABEL` (řádky 19-26)
- `CATEGORY_BENEFITS` (řádky 35-61)
- `ORIGIN_STORY` (řádky 63-69)
- `TEXTURE_NOTE` (řádky 80-85)

Zachovat:
- `CATEGORY_STORY` — používá `generateProductBio()`
- `PROCESSING_STORY` — používá `generateProductBio()`
- `generateProductBio()` — používá se na 2 místech
- `BioProductData` interface — používá `generateProductBio()`

Výsledek: ~122 řádků → ~50 řádků.

### Krok 3: Ověřit existující produkty v DB

Starší produkty mohou mít `description` uložený v DB, který obsahuje specifikace z předchozí verze generátoru. Pokud ano, bude nutné:
1. Buď je regenerovat (admin → "Regenerovat popis" tlačítko existuje)
2. Nebo vyčistit hromadně přes script

---

## Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `src/lib/product-bio.ts` | Smazat dead code (~70 řádků) |
| 2 | `src/app/api/deliveries/route.ts` řádky 105-107 | Změnit generování názvu produktu (VYŽADUJE ROZHODNUTÍ UŽIVATELE) |

---

## Otázka pro uživatele

Jak má vypadat název produktu? Aktuálně: "Panenské Ukrajina Mírně vlnité"

Možnosti:
- A) "Panenské vlasy — Mírně vlnité" (bez origin)
- B) "Panenské vlasy" (bez origin i texture)
- C) Jiný formát?

Toto rozhodnutí ovlivňuje: produktové karty, SEO title, faktury, admin seznam.

---

## UPDATE v2: "100% pravé vlasy" — přesunout z karty na detail

### Aktuální stav

**Na produktové kartě** (`src/components/public/ProductGridCard.tsx` řádek 198):
```typescript
{/* 100% real hair claim */}
<span className="text-[9px] text-emerald-600 font-medium">✓ {t("productDetail.realHair")}</span>
```
Zobrazuje `✓ 100% pravé vlasy` na KAŽDÉ kartě v gridu. User říká: **tohle tam nechce**.

**Na product detail stránce** (`src/app/[locale]/(public)/offer/[...slug]/page.tsx`):
Hledal jsem `realHair` — **NENAŠEL JSEM**. Text "100% pravé vlasy" se na detail stránce aktuálně NEZOBRAZUJE.

**V i18n** (`messages/cs.json` řádek 806):
```json
"productDetail": {
    "realHair": "100% pravé vlasy",
    ...
}
```
Klíč existuje ve všech 3 jazycích (cs/uk/ru).

### Co se má stát

1. **ODEBRAT** z `ProductGridCard.tsx` řádek 197-198 — smazat celý `{/* 100% real hair claim */}` blok
2. **PŘIDAT** na product detail stránku (`offer/[...slug]/page.tsx`) — pod h1 název produktu, vedle category/origin badges

### Doporučené umístění na detail stránce

Po origin badge (řádek ~758), přidat:
```tsx
<span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
    ✓ {t("productDetail.realHair")}
</span>
```

Výsledný layout na detailu:
```
Panenské Vlasy Ukrajina Mírně vlnité     [♥]
[PANENSKÉ]  [🇺🇦 Ukrajina]  ✓ 100% pravé vlasy   ← NOVÉ
```

### Soubory k úpravě (v2 update)

| # | Soubor | Změna |
|---|--------|-------|
| 3 | `src/components/public/ProductGridCard.tsx` řádky 197-198 | SMAZAT "100% pravé vlasy" z karty |
| 4 | `src/app/[locale]/(public)/offer/[...slug]/page.tsx` ~řádek 758 | PŘIDAT "100% pravé vlasy" na detail stránku |

### Celkový přehled všech změn v task #24/29

| # | Soubor | Změna | Rozhodnutí potřeba? |
|---|--------|-------|---------------------|
| 1 | `src/lib/product-bio.ts` | Smazat dead code (~70 řádků) | Ne |
| 2 | `src/app/api/deliveries/route.ts` řádky 105-107 | Změnit generování názvu produktu | **ANO** — formát názvu |
| 3 | `src/components/public/ProductGridCard.tsx` řádky 197-198 | Smazat "100% pravé vlasy" z karty | Ne |
| 4 | `src/app/[locale]/(public)/offer/[...slug]/page.tsx` ~řádek 758 | Přidat "100% pravé vlasy" na detail | Ne |

Implementátor může rovnou udělat kroky 1, 3, 4. Krok 2 vyžaduje rozhodnutí uživatele o formátu názvu.
