# TASK #8 — AKTUALIZOVANY PLAN OPRAVY

**Datum:** 2026-06-28
**Agent:** planovac
**Priorita:** URGENTNI

---

## PREHLED BUGU (5 polozek)

| # | Bug | Zavaznost | Kde |
|---|-----|-----------|-----|
| 1 | Chybejici i18n klice `productDetail.colorLabel` + `lengthLabel` | KRITICKE — na produkci viditelne UPPERCASED klice | `offer/[slug]/page.tsx` r.393, r.400 |
| 2 | Chybejici textura jako subtitle na kartach | STREDNI — uzivatel chce videt texturu prominentne | `ProductCard.tsx` |
| 3 | Karty homepage vs offer musi byt IDENTICKE | STREDNI — obe pouzivaji sdileny `ProductCard.tsx` | Overeno — uz jsou identicke |
| 4 | Dead links: /advice, /cooperation → 404 | NENI BUG — viz analyza nize | — |
| 5 | Nazvy produktu "Akcni vlasy" | NENI BUG — viz analyza nize | — |

---

## BUG #1: Chybejici i18n klice (KRITICKE)

### Pricina

`src/app/(public)/offer/[slug]/page.tsx`:
- Radek 393: `t("productDetail.colorLabel")` — klic NEEXISTUJE
- Radek 400: `t("productDetail.lengthLabel")` — klic NEEXISTUJE

Na produkci se zobrazi jako `PUBLIC.PRODUCTDETAIL.COLORLABEL` a `PUBLIC.PRODUCTDETAIL.LENGTHLABEL`.

### Fix

Pridat do vsech 3 message souboru do sekce `public.productDetail`:

**messages/cs.json:**
```json
"colorLabel": "Barva",
"lengthLabel": "Délka"
```

**messages/uk.json:**
```json
"colorLabel": "Колір",
"lengthLabel": "Довжина"
```

**messages/ru.json:**
```json
"colorLabel": "Цвет",
"lengthLabel": "Длина"
```

**Presna pozice:** Za `"colorToneLabel"` uvnitr `public.productDetail` objektu. Existujici klice v teto sekci:
- `colorToneLabel` ✅ (posledni pred chybejicimi)
- `colorLabel` ❌ PRIDAT
- `lengthLabel` ❌ PRIDAT

### Soubory k uprave

| Soubor | Akce |
|--------|------|
| `messages/cs.json` | Pridat 2 klice do `public.productDetail` |
| `messages/uk.json` | Pridat 2 klice do `public.productDetail` |
| `messages/ru.json` | Pridat 2 klice do `public.productDetail` |

---

## BUG #2: Textura jako subtitle na kartach

### Aktualni stav

`ProductCard.tsx` aktualne:
- ✅ Zobrazuje texturu jako BADGE (fialovy, s TextureSwatch ikonou) — radky 149-168
- ❌ NEZOBRAZUJE texturu jako SUBTITLE text pod nazvem produktu
- Mezi nazvem produktu (r.192-203) a delka+barva (r.205-212) NENI zadny subtitle

### Pozadavek uzivatele

Uzivatel chce videt texturu PROMINENTNE na karte — ne jen jako maly badge, ale jako SUBTITLE pod nazvem.

### Fix

Pridat subtitle radek do `ProductCard.tsx` MEZI nazev produktu (r.203) a delka+barva sekci (r.205):

```tsx
{/* Texture subtitle */}
{textureLabel && (
  <p className="text-[10px] text-muted line-clamp-1 mb-1">
    {textureLabel}
  </p>
)}
```

**Promenna `textureLabel` uz existuje** — definovana na radku 75:
```tsx
const textureLabel = p.texture ? tTexture(textureInfo.nameKey) : null;
```

### Soubory k uprave

| Soubor | Akce |
|--------|------|
| `src/components/public/ProductCard.tsx` | Pridat subtitle blok za `</h3>` (r.203) |

**POZNAMKA:** Protoze obe stranky (homepage i offer) pouzivaji STEJNY `ProductCard.tsx`, zmena se automaticky projevi na OBOU strankach = karty zustanou identicke.

---

## BUG #3: Karty homepage vs offer — IDENTITA

### Analyza

**VYRESENO** — obe stranky uz pouzivaji sdileny `ProductCard.tsx`:
- `HeroProductSlider.tsx` r.62: `<ProductCard product={p} variant={v} />`
- `ProductsShowcase.tsx` r.466: `<ProductCard product={p} variant={v} ... />`

Jediny rozdil je INTERAKTIVITA (homepage = staticke badges, offer = klikaci badges), ale OBSAH a DESIGN karet je identicky diky sdileneho komponentu.

**STAV: NENI POTREBA ZADNA ZMENA** — uz je spravne.

---

## BUG #4: Dead links /advice, /cooperation → NENI BUG

### Analyza

Produkni test (TASK-006) testoval ANGLICKE URL:
- `/advice` → 404
- `/cooperation` → 404

Ale navigace pouziva CESKE URL:
- Navbar r.134: `/poradna` (ne `/advice`) — stranka EXISTS `src/app/(public)/poradna/page.tsx`
- Navbar r.137-142: Dropdown "Spoluprace" s odkazy na `/pro`, `/kadernice`, `/vykup`, `/registrace` — VSECHNY stranky EXISTUJI

**VSECHNY navigacni odkazy vedou na EXISTUJICI stranky.** Zadne dead links.

### Overeni

Existujici public stranky:
```
/                      ✅ page.tsx
/offer                 ✅ page.tsx
/offer/[slug]          ✅ page.tsx
/poradna               ✅ page.tsx (= "Advice")
/poradna/[slug]        ✅ page.tsx
/pro                   ✅ page.tsx (= "Pro hairdressers")
/kadernice             ✅ page.tsx (= "Hairdressers")
/kadernice/[slug]      ✅ page.tsx
/vykup                 ✅ page.tsx (= "Buyback")
/registrace            ✅ page.tsx (= "Registration")
/contact               ✅ page.tsx
/about                 ✅ page.tsx
/privacy               ✅ page.tsx
/obchodni-podminky     ✅ page.tsx
/inquiry-cart          ✅ page.tsx
```

**STAV: NENI BUG** — vsechny navigacni linky jsou funkcni.

---

## BUG #5: Nazvy produktu "Akcni vlasy" — NENI BUG

### Analyza

Uzivatel potvrdil: **"Nazev produktu na karte JE SPRAVNE (jmeno produktu tam je)"**

`generateProductBioShort()` v `product-bio.ts` generuje text jako "Akcni clip-in vlasy | rovne | Vietnam" — toto je ZAMERNE chovani (bio/subtitle), NE nazev produktu. Nazev produktu se bere z DB poli `name`/`nameUk`/`nameRu` a zobrazuje se spravne.

**STAV: NENI BUG** — funguje dle zameru.

---

## CELKOVY PLAN IMPLEMENTACE

### Krok 1: Pridat i18n klice (3 soubory)

Pridat `colorLabel` a `lengthLabel` do `public.productDetail` ve vsech 3 locale souborech.

### Krok 2: Pridat texture subtitle na ProductCard (1 soubor)

Pridat `{textureLabel && <p>...}` blok do `ProductCard.tsx` za nazev produktu.

### Celkem: 4 soubory k uprave

| Soubor | Zmena |
|--------|-------|
| `messages/cs.json` | +2 radky |
| `messages/uk.json` | +2 radky |
| `messages/ru.json` | +2 radky |
| `src/components/public/ProductCard.tsx` | +3 radky (subtitle blok) |

### Casova narocnost: ~5 minut

---
