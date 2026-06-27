# TASK QUEUE — Hairland

## AKTIVNÍ

## TASK-004: Struktura vlasů + tóny barev — celý systém
Priorita: 1
Stav: plánování
Projekt: /Users/zen/hairora

### Kompletní zadání:
Přidat do celého systému (DB, admin, public web) dvě nové vlastnosti produktu:

**1. Struktura vlasu (hair texture):**
- Přesný seznam struktur musí potvrdit majitel (zatím zmínil: rovné, vlnité)
- Musí být na: kartě produktu, homepage slideru, detailu produktu, při naskladnění
- Překlady do 3 jazyků (cs/uk/ru)

**2. Tóny barev (zjednodušené):**
- Majitel chce jednodušší systém než profesionální vzorník — jen základní tóny:
  - Blond, Hnědá, Tmavě hnědá, Zrzavá (+ černá TBD)
- Nahrazuje/doplňuje stávající 1-10 škálu v `src/lib/hair-colors.ts`
- Překlady do 3 jazyků (cs/uk/ru)

**Kde všude přidat:**
- DB: nový enum `HairTexture` + pole `texture` na modelu Product
- Prisma schema + Turso ALTER TABLE (nelze prisma db push s libsql://)
- Public API: `/api/public/products` — vracet texture
- Product card (`src/app/(public)/offer/ProductsShowcase.tsx`) — zobrazit texturu
- Homepage slider (`src/components/public/HeroProductSlider.tsx`) — zobrazit texturu
- Product detail (`src/app/(public)/offer/[id]/page.tsx`) — zobrazit texturu ve specích
- Filtrování na offer stránce — filtr podle textury
- Admin create form (`src/app/(app)/products/new/CreateProductForm.tsx`) — select textury
- Admin detail (`src/app/(app)/products/[id]/ProductDetailClient.tsx`) — zobrazit texturu
- Admin list (`src/app/(app)/products/ProductListClient.tsx`) — zobrazit texturu
- Stock-in form (`src/components/inventory/StockInForm.tsx`) — texturu u produktu
- Product serializer (`src/lib/api/product-serializer.ts`) — přidat texture
- Validation schema (`src/lib/validations/product.ts`) — přidat texture enum
- SEO metadata: texture v titulku/popisu produktu

### Kontext:
- Hairland prodává SUROVÉ vlasy (ne hotové clip-in/keratin), zpracování je volitelná služba
- Stávající `processingType` na Product je méně relevantní pro primární klasifikaci
- Barvy jsou teď kódy 1-10 v `src/lib/hair-colors.ts` → možná přejít na tóny
- Turso DB vyžaduje ALTER TABLE přes CLI, ne prisma db push
- 3 jazyky: cs/uk/ru (next-intl, cookie HAIRLAND_LOCALE)

---

## TASK-005: SEO automatizace pro nové produkty
Priorita: 1
Stav: plánování
Projekt: /Users/zen/hairora

### Kompletní zadání:
Zajistit že při přidání nového produktu se automaticky generuje:
- Unikátní SEO title z: název + textura + původ + typ (generateMetadata)
- Meta description z popisu produktu
- OG image z první fotky produktu
- Produkt se automaticky objeví v sitemap.xml
- Product JSON-LD schema (schema.org)
- Canonical URL

Aktuální stav: základní SEO je implementováno (sitemap.ts, robots.txt, generateMetadata na offer/[id]/page.tsx), ale:
- Title používá processingType + origin → přidat texture
- Description je generická → přidat specifický popis s texturou, barvami, délkami
- JSON-LD schema je na detail page → rozšířit o texture

### Kontext:
- SEO strategie dokument: `.claude-context/tasks/SEO-STRATEGY-2026.md`
- Sitemap: `src/app/sitemap.ts` (dynamický, čte z DB)
- Meta: `src/app/(public)/offer/[id]/page.tsx` (generateMetadata)
- Root layout: `src/app/layout.tsx` (metadataBase, title template)

---

## BACKLOG

## TASK-001: B2B/Dropshipping systém s třemi cenovými úrovněmi
Priorita: 2
Stav: hotovo (základní implementace)

## TASK-002: Blog/Poradna
Priorita: 2
Stav: čeká

### Kompletní zadání:
Vytvořit blog/poradnu jako SEO magnet. Stránka `/blog` s články typu "Jak vybrat správné vlasy", "Péče o extenze", "Clip-in vs Tape-in". Admin panel pro správu článků. Články v CZ/UA/RU.

## TASK-003: Referral program
Priorita: 3
Stav: čeká

### Kompletní zadání:
Každá zákaznice dostane unikátní referral kód/odkaz. Když jej sdílí a někdo nakoupí, obě dostanou slevu. Tabulka referral_codes v DB + logika při checkout.

---

## ČEKÁ

## HOTOVÉ
- SEO základy (sitemap, robots.txt, schema markup, OG tags, meta tags) — commit b5f1c24
