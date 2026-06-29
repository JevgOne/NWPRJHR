# AUDIT — Zmeny mimo workflow

**Datum:** 2026-06-28
**Agent:** planovac

---

## SOUHRN

Posledni ~20 commitu (poslednich 10 hodin) obsahuje vyznamne zmeny ktere nebyly sledovane v task systemu. Navic existuji NECOMMITOVANE zmeny (18 modified + 2 new soubory) ktere jsou soucasti probihajiho TASK-004 (colorTone).

---

## COMMITOVANE ZMENY (posledni 20 commitu)

### Skupina 1: Stock-in vylepseni (~10h zpet)
| Commit | Popis |
|--------|-------|
| `ea0c89e` | Stock-in form: color/length selectory, CZK-only pricing |
| `c8579f9` | Stock-in form: CZK input (ne halere), odstraneni redundantni kategorie |

**Co se zmenilo:** StockInForm.tsx — vizualni color swatche a length buttony misto textu, cena se zadava v CZK (ne halerich), odstranena redundantni kategorie.

### Skupina 2: Salon/B2B opravy (~10h zpet)
| Commit | Popis |
|--------|-------|
| `bf2357c` | Odstraneni processingType ze salon katalogu |
| `936d98a` | Preklady, homepage text, brand barvy, cookie banner |

### Skupina 3: Public offer redesign (~3h zpet)
| Commit | Popis |
|--------|-------|
| `7e101a6` | Product detail: interaktivni color→length picker s cenou a stavem |
| `5e847a9` | Zjednoduseni karet: odstraneni length badgu, color swatchu, price ranges |
| `33883ac` | Fix: "Kc" → "Kč" v length picker |
| `3bca2db` | Refactor /offer: kazda varianta jako samostatna karta |
| `82eefbd` | Texture badge na variant kartach na /offer |
| `0d2badc` | B2B pricing na /offer kartach |
| `067cbba` | Performance fix + sjednoceni product karet |

### Skupina 4: Admin features (~2h zpet)
| Commit | Popis |
|--------|-------|
| `5d7974f` | Fix salon order error + texture support vsude |
| `0d0e261` | QR kod pri stock-in uspechu |
| `0404a34` | IG/FB post generator v admin product detail |

### Skupina 5: SEO + URL slugs (~2h zpet)
| Commit | Popis |
|--------|-------|
| `59103ec` | URL slugy pro produkty (pretty URL misto CUID) |
| `f4c639a` | Auto-generated product bio descriptions |
| `74a56ac` | Fix slugs + exact lengths na detail |
| `4fd3a18` | Revert delky zpet na range na detail |
| `cb9bedd` | Variant-focused product detail page |
| `d74df00` | Fix order error handling + variant-focused detail |

---

## NECOMMITOVANE ZMENY (in-progress TASK-004: colorTone)

### Modifikovane soubory (18):

| Soubor | Zmena |
|--------|-------|
| `prisma/schema.prisma` | +1 radek — pridany `colorTone String?` na Product |
| `src/lib/validations/product.ts` | +1 — pridany `colorTone` do validace |
| `src/lib/api/product-serializer.ts` | +1 — pridany `colorTone` do serializace |
| `src/app/api/products/route.ts` | +2 — colorTone filtering v admin API |
| `src/app/api/products/options/route.ts` | +18 — DISTINCT colorTone query |
| `src/app/api/public/products/route.ts` | +4 — colorTone select + filter |
| `messages/cs.json` | +14 — colorTone preklady |
| `messages/ru.json` | +14 — colorTone preklady |
| `messages/uk.json` | +14 — colorTone preklady |
| `src/app/(app)/products/new/CreateProductForm.tsx` | +59 — colorTone combo-box |
| `src/app/(app)/products/[id]/ProductDetailClient.tsx` | +75 — inline colorTone editing |
| `src/app/(app)/products/ProductListClient.tsx` | +7 — colorTone badge |
| `src/app/(public)/offer/ProductsShowcase.tsx` | -160/+neco — refaktor na ProductCard |
| `src/components/public/HeroProductSlider.tsx` | -104/+neco — refaktor na ProductCard |
| `src/components/inventory/StockInForm.tsx` | +1 — colorTone info |
| `next.config.ts` | +14 — nespecifikovano |
| `.claude-context/tasks/TASK-001-qa.md` | zmeny v QA reportu |
| `.claude-context/tasks/TASK-033-chrome-test.md` | zmeny v test reportu |

### Nove soubory (2):
| Soubor | Popis |
|--------|-------|
| `src/components/public/ProductCard.tsx` | Sdileny ProductCard komponent (Task #9 output) |
| `src/lib/color-tones.ts` | COLOR_TONE_OPTIONS + getColorToneInfo() (TASK-004) |

---

## CO UZ JE IMPLEMENTOVANO (z commitu)

### Texture (struktura vlasu) — HOTOVO ✅
- TextureSwatch SVG komponent
- Texture combo-box v admin create formu
- Inline texture editing na product detail
- Texture badge na kartach (homepage + offer)
- Texture filtr na /offer
- Texture v stock-in formu

### URL slugy — HOTOVO ✅
- `slug` pole na Product modelu
- Auto-slugify pri vytvoreni
- Redirect z CUID URL na slug URL
- Sitemap pouziva slugy

### Product bio — HOTOVO ✅
- `generateProductBio()` a `generateProductBioShort()` v `product-bio.ts`
- Automaticky generovane popisy z kategorie + textura + puvod
- Tlacitko "Vygenerovat popis" na admin product detail

### IG/FB post generator — HOTOVO ✅
- SocialPostModal v admin product detail
- Generovani postoveho textu z produktovych dat

### QR kody pri stock-in — HOTOVO ✅
- Po naskladneni se zobrazi QR kod s linkem na produkt
- Moznost tisknout stitek

### Product detail redesign — HOTOVO ✅
- Interaktivni color→length picker
- Cena a stav skladu u kazde varianty
- B2B ceny pro salony/kadernice

### Offer page redesign — HOTOVO ✅
- Kazda varianta jako samostatna karta
- Sdileny ProductCard komponent
- B2B pricing na kartach

---

## CO JESTE CHYBI (necommitovane TASK-004)

### ColorTone (ton barvy) — ROZDELANO 🔧
Zmeny existuji v working tree ale nejsou commitnute:
- Schema: `colorTone String?` v prisma/schema.prisma
- Novy soubor: `src/lib/color-tones.ts`
- Validace, serializace, API filtering
- Admin forms (create + detail + list)
- i18n preklady (cs/uk/ru)
- Public API + offer filtr

**CHYBI:** DB migrace (`ALTER TABLE products ADD COLUMN colorTone TEXT;` na Turso)

---

## DOPORUCENI

1. **TASK-004 (colorTone)** je rozdelany — implementator (Task #2) na nem pracuje
2. **DB migrace** pro colorTone jeste nebyla provedena — az po commitnuti kodu
3. Commity z posledich hodin obsahuji hodne features ktere nebyly v TASK-QUEUE — doporucuji je zpetne zapsat

---
