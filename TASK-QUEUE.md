# TASK QUEUE — Hairland

## AKTIVNÍ

## TASK-078: Přepsat překladové stringy — odstranit "velkoobchodní" a staré % slev
Priorita: 1
Stav: hotovo
Projekt: /Users/zen/hairora

### Kompletní zadání:
Na webu jsou texty odkazující na starý cenový systém. Musí se přepsat ve VŠECH 3 locale souborech (cs.json, uk.json, ru.json):

1. `wholesalePrice` (cs.json ~ř.285): "Velkoobchodní cena" → "Partnerská cena" (admin label)
2. `b2bDesc` (cs.json ~ř.693): "zvýhodněné velkoobchodní ceny" → odstranit "velkoobchodní"
3. `pageTitle` (cs.json ~ř.1610): "velkoobchod RAW vlasů" → přepsat bez "velkoobchod"
4. `salonDiscountHelp` (cs.json ~ř.1650): "velkoobchodní cenu z varianty" → přepsat na "partnerskou slevu z marže"
5. `seg20` (cs.json ~ř.1722): "20% sleva" — ověřit kontext, pokud je to spin wheel segment tak nechat (nesouvisí s B2B)
6. `b2bSettings.description` (cs.json ~ř.1646): "z maloobchodní ceny" → "z marže"
7. `hairdresserDiscountHelp` (cs.json ~ř.1648): "z retailové ceny" → "z marže"
8. Totéž v uk.json a ru.json — najít ekvivalentní stringy a přeložit

### Kontext:
- Pricing systém přestavěn: 100% markup, B2B slevy z marže (ne z retailové ceny)
- Vzorec: `b2bPrice = retailPrice - (retailPrice * discountPct) / 20000`
- Kadeřnice 20% z marže, Salon 30% z marže
- Věrnostní program se NEPOUŽÍVÁ pro pricing (zatím)
- Nesmí se na webu zobrazovat konkrétní % slev pro kadeřnice/salony

---

## TASK-073: Product detail — duplicitní text + kratší popis doleva
Priorita: 1
Stav: hotovo
Projekt: /Users/zen/hairora

### Kompletní zadání:
Uživatel: "ten text se opakuje, a co když ho dame kratší ale do leva?"
- Nadpis produktu (H1) se opakuje v popisu — bio generátor (`src/lib/product-bio.ts`) už opraven (odstraněn duplicitní název), ale na webu popis stále opakuje specifikace (barevný tón, struktura, délka) které jsou i ve specs boxu dole
- Popis zkrátit a zarovnat doleva (ne centrovaný)
- Specs box (origin, textura, barva, délka) se taky duplikuje s popisem

### Kontext:
- Detail page: `src/app/[locale]/(public)/offer/[...slug]/page.tsx` (řádky 680-900)
- Bio generátor: `src/lib/product-bio.ts` (už upraven — bez názvu na začátku)
- Momentálně 0 produktů v DB (demo smazané), ale musí být ready pro nové

---

## TASK-074: Fotogalerie — zvětšení fotek (lightbox/zoom)
Priorita: 1
Stav: hotovo
Projekt: /Users/zen/hairora

### Kompletní zadání:
Uživatel: "a dal bych jako aby se to dalo zvetšit ty fotky v galerii?"
- Na product detail page přidat možnost zvětšit fotky
- Kliknutí na hlavní fotku → otevře lightbox/modal s velkou fotkou
- Možnost přecházet mezi fotkami v lightboxu (šipky/swipe)
- Zavřít kliknutím na X nebo mimo fotku

### Kontext:
- Galerie: `src/app/[locale]/(public)/offer/[...slug]/PhotoGallery.tsx`
- Je to client component (interaktivita)
- Nesmí být žádná nová závislost — implementovat čistě v CSS/React

---

## TASK-075: Ceny pro culíky (BY_PIECE) — oprava výpočtu
Priorita: 1
Stav: hotovo
Projekt: /Users/zen/hairora

### Kompletní zadání:
Uživatel: "to se musí počítat líp na ty culíky ta cena atd jako kamo proste"
Uživatel: "ono to nejak špatne počíta zadal se MO cenu 12500 za 100g a ono mi to ted ukazuje na webu v produktech 225000 cenu za 100G"
- Cenový formulář už předělán (nákupní + prodejní cena), ale API route stále používá markup kalkulaci
- Ověřit že BY_PIECE produkty (culíky) ukazují správnou cenu
- Ověřit formatCZK — halíře/100 konverze je správná
- ProductGridCard a detail page musí ukazovat cenu za kus, ne za gram
- Tip "cena za 100g" se nesmí zobrazovat u BY_PIECE produktů

### Kontext:
- Pricing: `src/lib/pricing.ts` (calculateRetailPrice, formatCZK)
- Variant batch create: `src/components/products/VariantBatchCreate.tsx` (už předělán)
- API: `src/app/api/products/[id]/variants/route.ts` (markup odstraněn)
- ProductGridCard: `src/components/public/ProductGridCard.tsx`
- Detail page: `src/app/[locale]/(public)/offer/[...slug]/page.tsx`

---

## TASK-076: Footer na desktopu opravit
Priorita: 2
Stav: hotovo
Projekt: /Users/zen/hairora

### Kompletní zadání:
Uživatel: "footer na deskopu nic moc teda"
- Zkontrolovat a opravit footer layout na desktopu
- Musí vypadat profesionálně a premium

### Kontext:
- Footer component: hledat v `src/components/` nebo `src/app/[locale]/(public)/`

---

## TASK-077: Notifikace po schválení recenze
Priorita: 2
Stav: hotovo
Projekt: /Users/zen/hairora

### Kompletní zadání:
Uživatel: "ty notrifikace, když schvalím tu recenzi tak už to nemusí bejt v oznamení musí to spolupracovat"
- Když admin schválí recenzi, notifikace o nové recenzi se musí automaticky označit jako přečtená/smazat
- Aktuálně notifikace zůstává i po schválení

### Kontext:
- Notifications: hledat v `src/app/api/` a `src/components/`
- Review approval: hledat v admin review management

---

## TASK-070: Slevový kód při objednávce/poptávce
Priorita: 2
Stav: hotovo
Projekt: /Users/zen/hairora

### Kompletní zadání:
Slevový kód musí být možné vložit při:
1. **B2B objednávce** (salon/kadeřnice) — pole pro zadání kódu v objednávkovém formuláři, validace přes `/api/promo-codes/validate`, přepočet ceny, uložení použitého kódu k objednávce
2. **Poptávce** (koncový zákazník) — pole pro zadání kódu v inquiry formuláři

Admin stránka pro zakládání kódů už existuje: `/promo-codes` (Marketing → Slevové kódy).
DB model `PromoCode` je v schema.prisma (ještě NEpushnuto do Turso — potřeba ALTER TABLE).
API: `/api/promo-codes` (CRUD), `/api/promo-codes/validate` (validace).

### Kontext:
- Objednávkový formulář salonu: hledat v `src/app/(salon)/`
- Poptávkový formulář: `src/app/(public)/inquiry-cart/`
- PromoCode model: `prisma/schema.prisma` (na konci)
- Turso DB: ALTER TABLE přes CLI, nelze prisma db push
- Při použití kódu inkrementovat `usedCount` na PromoCode

---

## TASK-072: DB migrace — PromoCode tabulka do Turso
Priorita: 2
Stav: hotovo
Projekt: /Users/zen/hairora

### Kompletní zadání:
Prisma schema obsahuje nový model `PromoCode` ale tabulka `promo_codes` ještě neexistuje v Turso DB.
Spustit ALTER TABLE / CREATE TABLE přes Turso CLI nebo SQL.

### Kontext:
- Turso vyžaduje manuální migrace (ne prisma db push)
- Schema: `prisma/schema.prisma` model PromoCode na konci souboru

---

## BACKLOG

## TASK-071: Performance — pomalé načítání produktů a admin panelu
Priorita: 2
Stav: čeká

## TASK-004: Struktura vlasů + tóny barev — celý systém
Priorita: 2
Stav: hotovo

## TASK-005: SEO automatizace pro nové produkty
Priorita: 2
Stav: hotovo

## TASK-002: Blog/Poradna
Priorita: 3
Stav: hotovo

## TASK-003: Referral program
Priorita: 3
Stav: hotovo

---

## ČEKÁ

## HOTOVÉ
- SEO základy (sitemap, robots.txt, schema markup, OG tags, meta tags)
- Audit log rozšíření (35+ API routes, filtrování, barevné badge)
- Reklamace sloučení (interní + tikety → jen tikety)
- Order detail redesign (červený cancel s potvrzením, status banner)
- Logout v public navbar
- Reklamace odkaz v salon panelu
- Slevové kódy admin CRUD (/promo-codes)
- Cancel notifikace obousměrně (salon→admin, admin→salon)
- Unicode fix ReviewsClient.tsx — escape sekvence → UTF-8 (2026-07-09)
- Notification badge revalidation — cache tag "badges" (2026-07-09)
- Heslo reset OWNER účtů (2026-07-09)
- Blog OG image auto z cover image (2026-07-09)
- Produktové karty flatten — 1 barva/délka/cena per karta (2026-07-09)
- "0 Kč dovoz" → "Zdarma" ve všech locale (2026-07-09)
- Sticky galerie na product detail (2026-07-09)
- Auto-scroll v naskladnění formuláři (2026-07-09)
- Stock-in force-dynamic — nový dodavatel se hned zobrazí (2026-07-09)
- Kompletní audit webu — 0 kritických problémů (2026-07-09)
- Demo produkty smazány, varianta split migrace, cenový formulář (2026-07-10)
- Recenze gender-neutral zákazníci (2026-07-10)
- Premium review cards redesign (2026-07-10)
- Asymetrický layout recenze (2026-07-10)
