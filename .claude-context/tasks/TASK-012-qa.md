# QA Report: Task #9 — i18n fix + sdílený ProductCard + karty
**Datum:** 2026-06-28
**Kontrolor:** KONTROLOR agent
**Task:** #12 (QA pro Task #9)

---

## 1. REVERZNÍ KONTROLA — bod po bodu

### Požadavek 1: i18n klíče colorLabel a lengthLabel existují ve všech 3 jazycích
✅ **cs.json:** `offer.colorLabel` = "Barva", `offer.lengthLabel` = "Délka" (ř. 605–606), `inquiry.colorLabel` = "Barva", `inquiry.lengthLabel` = "Délka" (ř. 642–643)
✅ **uk.json:** `offer.colorLabel` = "Колір", `offer.lengthLabel` = "Довжина" — OK
✅ **ru.json:** `offer.colorLabel` = "Цвет", `offer.lengthLabel` = "Длина" — OK

Klíče jsou přítomny a přeloženy ve všech 3 jazycích.

### Požadavek 2: Karty na homepage a offer jsou IDENTICKÉ (design, velikost, informace)
✅ Obě stránky používají **stejný komponent `ProductCard`** ze `src/components/public/ProductCard.tsx`.
- Homepage (`HeroProductSlider.tsx`): `<ProductCard product={p} variant={v} />` (bez callbacků)
- Offer (`ProductsShowcase.tsx`): `<ProductCard ... onCategoryClick={...} onOriginClick={...} onTextureClick={...} />`
- Rozdíl v chování (non-interactive vs. interactive) je záměrný — design a informace jsou identické.

⚠️ **Drobná nesrovnalost:** `HeroProductSlider.tsx` `SliderVariant` neobsahuje `wholesalePricePerGram` — ale v `ProductCardVariant` je toto pole `optional` (`?`), takže při zobrazení B2B ceny na homepage se přeskočí na retail cenu. Pravděpodobně záměrné (homepage není B2B).

### Požadavek 3: Na kartách se zobrazuje textura (Rovné/Vlnité/Kudrnaté) místo starého subtitle
✅ `ProductCard.tsx` zobrazuje texturu na dvou místech:
1. Jako badge (ř. 145–163): `<TextureSwatch>` + `{textureLabel}` v sekci "Origin + texture badges"
2. Jako subtitle (ř. 181–186): `<p className="text-[10px] text-muted">{textureLabel}</p>`

⚠️ **NALEZENA DUPLICITA:** Textura se zobrazuje dvakrát — jednou jako badge a jednou jako subtitle text pod názvem produktu. Je to pravděpodobně nežádoucí opakování.

Překlady textur OK ve všech 3 jazycích:
- CS: straight="Rovné", wavy="Vlnité", curly="Kudrnaté", slightlyWavy="Mírně vlnité"
- UK: straight="Рівне", wavy="Хвилясте", curly="Кучеряве"
- RU: straight="Прямые", wavy="Волнистые", curly="Кудрявые"

### Požadavek 4: TypeScript kompilace bez chyb
✅ `npx tsc --noEmit` — **0 chyb** (žádný výstup = clean)

### Požadavek 5: Build projde
✅ `npm run build` — **BUILD ÚSPĚŠNÝ**
- `✓ Compiled successfully in 5.4–5.8s`
- `✓ Generating static pages (123/123)`
- Žádné TypeScript chyby ani build errory

### Požadavek 6: Žádné rozbité importy
✅ Všechny importy v `ProductCard.tsx` existují:
- `@/lib/hair-colors` → `src/lib/hair-colors.ts` ✅
- `@/lib/origin-flags` → `src/lib/origin-flags.ts` ✅
- `@/lib/hair-textures` → `src/lib/hair-textures.ts` ✅
- `@/components/TextureSwatch` → `src/components/TextureSwatch.tsx` ✅
- `@/components/public/ProductCard` importován v obou souborech ✅

---

## 2. SIMPLIFY KONTROLA

### Nalezené problémy:

**A) Nevyužité importy v `ProductsShowcase.tsx`:**
- `getTextureInfo` importován ale nepoužíván (ř. 8) — texturní logika přesunuta do `ProductCard`
- `TEXTURE_OPTIONS` importován ale nepoužíván (ř. 8)

**B) Nevyužitý parametr v `ProductCard.tsx`:**
- `activeCategoryFilter` (ř. 51) přijat ale nikde nepoužit — kategorie badge nemá interactive highlight na rozdíl od origin/texture

---

## 3. DEBUG KONTROLA — ESLint výsledky

**ERRORS (4):**
```
ProductsShowcase.tsx:8:10  @typescript-eslint/no-unused-vars
  'getTextureInfo' is defined but never used
  
ProductsShowcase.tsx:8:26  @typescript-eslint/no-unused-vars
  'TEXTURE_OPTIONS' is defined but never used

ProductsShowcase.tsx:138:5  react-hooks/set-state-in-effect
  Avoid calling setState() directly within an effect
  (setLoading(true) v useEffect body)

ProductCard.tsx:51:3  @typescript-eslint/no-unused-vars
  'activeCategoryFilter' is defined but never used
```

**WARNINGS (4):**
- 2x v ProductsShowcase.tsx: `<img>` místo Next.js `<Image />` (ř. 293, 364)
- 2x v ProductCard.tsx: `<img>` místo Next.js `<Image />` (ř. 97, 192)
  *(Tyto `<img>` warnings existovaly pravděpodobně i před Taskem #9 — nejde o regrese)*

---

## 4. SHRNUTÍ

| # | Požadavek | Stav |
|---|-----------|------|
| 1 | i18n klíče ve všech 3 jazycích | ✅ OK |
| 2 | Identické karty homepage/offer | ✅ OK (záměrné rozdíly v interaktivitě) |
| 3 | Textura místo subtitle | ✅ OK (ale DUPLICITNÍ zobrazení) |
| 4 | TypeScript bez chyb | ✅ OK |
| 5 | Build projde | ✅ OK |
| 6 | Žádné rozbité importy | ✅ OK |

### Nalezené problémy k opravě:
1. ❌ **ESLint ERROR:** `getTextureInfo` a `TEXTURE_OPTIONS` nepoužity v `ProductsShowcase.tsx` — odstranit import
2. ❌ **ESLint ERROR:** `activeCategoryFilter` nepoužitý parametr v `ProductCard.tsx` — odstranit nebo použít
3. ⚠️ **ESLint ERROR:** `setLoading(true)` v useEffect — existující issue, pravděpodobně pre-existing
4. ⚠️ **DUPLICITA:** `textureLabel` se zobrazuje dvakrát na kartě (badge + subtitle)

### Závěr:
Build projde a TypeScript je čistý. ESLint hlásí **4 reálné errory** — 3 jsou přímé důsledky refaktoringu Task #9 (unused imports po přesunu logiky do ProductCard). Doporučuji opravu před mergeováním.
