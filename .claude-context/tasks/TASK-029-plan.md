# TASK-029: Product name nesmí opakovat specs z badges

**Status:** Analýza hotová — připraveno pro implementátora
**Autor:** Plánovač
**Datum:** 2026-07-15

---

## 1. Kde se product NAME generuje

**JEDINÉ místo:** `src/app/api/deliveries/route.ts` řádky 101-114

Při prvním naskladnění, pokud produkt neexistuje, vytvoří se nový:

```typescript
const catNames = CATEGORY_NAMES[data.category] ?? CATEGORY_NAMES.STANDARD;
product = await prisma.product.create({
    data: {
        name: `${catNames.cs} ${data.origin} ${data.texture}`,       // "Panenské Vlasy Ukrajina Mírně vlnité"
        nameUk: `${catNames.uk} ${data.origin} ${data.texture}`,     // "Натуральне Волосся Ukrajina Mírně vlnité"
        nameRu: `${catNames.ru} ${data.origin} ${data.texture}`,     // "Натуральные Волосы Ukrajina Mírně vlnité"
        ...
    },
});
```

`CATEGORY_NAMES` (řádky 59-64):
- VIRGIN → `"Panenské Vlasy"` / `"Натуральне Волосся"` / `"Натуральные Волосы"`
- LUXE → `"Luxe Vlasy"` / `"Люкс Волосся"` / `"Люкс Волосы"`
- STANDARD → `"Standard Vlasy"` / `"Стандарт Волосся"` / `"Стандарт Волосы"`
- SALE → `"Výprodej"` / `"Розпродаж"` / `"Распродажа"`

---

## 2. Co je aktuálně v názvu a co je duplicitní

Aktuální název: **"Panenské Vlasy Ukrajina Mírně vlnité"**

Na **produktové kartě** (`ProductGridCard.tsx`) se zobrazuje:
```
[PANENSKÉ]                        ← category badge (řádek 133-143)
🇺🇦 Ukrajina                      ← origin badge (řádek 176-194)
Panenské Vlasy Ukrajina Mírně vlnité  ← NAME (řádek 198-208) ← DUPLIKUJE!
~ Mírně vlnité                    ← texture swatch (řádek 212-216)
● Přírodní černá                  ← barva (řádek 218-225)
↕ 55 cm                           ← délka (řádek 227-231)
```

**Duplicity v názvu:**
- `"Panenské"` — už v category badge nahoře
- `"Ukrajina"` — už v origin badge s vlajkou
- `"Mírně vlnité"` — už v texture swatch pod názvem

Na **detail stránce** (`offer/[...slug]/page.tsx`) totéž:
- h1 (řádek 738): `productName` = "Panenské Vlasy Ukrajina Mírně vlnité"
- Category badge (řádek 747-749): "Panenské"
- Origin badge (řádek 751-757): vlajka + "Ukrajina"
- Specs grid (řádky 826-864): origin, texture, color, length jako clickable pills

---

## 3. Co v názvu NEMÁ být (je v badges)

- ❌ Origin (Ukrajina) — badge s vlajkou
- ❌ Texture (Mírně vlnité) — TextureSwatch + label
- ❌ Category (Panenské) — category badge — ALE: category JE součástí identity produktu, takže v názvu může zůstat
- ❌ Length — v specs řádku
- ❌ "100% pravé vlasy" — user chce jen na detail, ne na kartu

## 4. Co v názvu MÁ být

**Vyžaduje rozhodnutí uživatele.** Navržené varianty:

| Varianta | Formát | Příklad CS | Příklad UK |
|----------|--------|------------|------------|
| A | Jen kategorie | "Panenské vlasy" | "Натуральне волосся" |
| B | Kategorie + texture | "Panenské vlasy — Mírně vlnité" | "Натуральне волосся — Злегка хвилясте" |
| C | Jen "Vlasy pro prodloužení" | "Vlasy pro prodloužení" | "Волосся для нарощування" |

**Doporučuji variantu A** — nejkratší, bez duplikací. Všechny detaily (origin, texture, color, length) jsou viditelné v badges a specs.

---

## 5. Kde se name zobrazuje

| Místo | Soubor | Řádek | Dopad změny |
|-------|--------|-------|-------------|
| Produktová karta | `ProductGridCard.tsx` | 198-208 | Kratší název = lepší layout |
| Detail h1 | `offer/[...slug]/page.tsx` | 738 | Kratší h1, specs v badges |
| SEO title | `offer/[...slug]/page.tsx` | 305 | `product.name + length + color` — automaticky |
| Admin product detail | `ProductDetailClient.tsx` | header | Kratší název |
| Inventory tabulka | `InventoryClient.tsx` | 264-266 | Kratší název |
| Faktury | `invoice-pdf.ts` | ? | Kratší název na faktuře |

---

## 6. "100% pravé vlasy" — přesunout z karty na detail

**Na kartě** (`ProductGridCard.tsx`): text "✓ 100% pravé vlasy" byl **už odstraněn** v předchozím deployi.

**Na detail stránce** (`offer/[...slug]/page.tsx`): text "100% pravé vlasy" se **nezobrazuje**. User ho tam chce.

**Fix:** Přidat na detail stránku za origin badge (~řádek 758):
```tsx
<span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
    ✓ {t("productDetail.realHair")}
</span>
```

i18n klíč `productDetail.realHair` existuje ve všech 3 jazycích (cs/uk/ru).

---

## Fix plan pro implementátora

| # | Soubor | Řádky | Změna | User input? |
|---|--------|-------|-------|-------------|
| 1 | `src/app/api/deliveries/route.ts` | 105-107 | Změnit name na `catNames.XX` (jen kategorie) | **ANO** — zvolit variantu A/B/C |
| 2 | `src/app/[locale]/(public)/offer/[...slug]/page.tsx` | ~758 | Přidat "✓ 100% pravé vlasy" vedle badges | Ne |
| 3 | `src/lib/product-bio.ts` | celý soubor | Smazat dead code: `generateProductBioShort()`, `CAT_LABEL`, `PROC_LABEL`, `CATEGORY_BENEFITS`, `ORIGIN_STORY`, `TEXTURE_NOTE` | Ne |

**Poznámka:** Existující produkty v DB mají staré názvy. Po změně formátu bude potřeba buď:
- Nechat staré (nekonzistentní ale neškodí)
- Hromadně přejmenovat přes DB script
