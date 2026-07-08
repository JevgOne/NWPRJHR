# Velky SEO Audit — hairland.cz

**Datum:** 2026-07-04
**Domena:** https://www.hairland.cz
**Tech stack:** Next.js 16 (App Router), Prisma 7, Turso, Vercel (CDG1)

---

## 1. TECHNICKE SEO

### 1.1 Sitemap.xml

**Soubor:** `src/app/sitemap.ts` (dynamicky generovany Next.js)
**Live URL:** https://www.hairland.cz/sitemap.xml

- Obsahuje 36 URL (staticke stranky, produkty, clanky, stylistky, blog)
- Produkty a blog posty pouzivaji `updatedAt` z DB — dobre
- Staticke stranky pouzivaji `STATIC_DATE = "2026-06-01"` — manualne nastaveny datum

**Problemy:**

- ❌ **P1** — `lastModified` pro staticke stranky je hardcoded na `2026-06-01`. Google preferuje realne datumy updatu. Pokud se stranka nezmenila, lepe je `lastModified` vynechat nez mit falesny datum.
- ❌ **P2** — Chybi stranky: `/blog` index stranka neni v sitemape jako samostatna polozka (je tam az blog posts). UPDATE: `/blog` JE v sitemape — OK.
- ❌ **P2** — `/pruvodce-gramazi` JE v sitemape — OK.
- ❌ **P2** — Chybi `changeFrequency` typ validace — pouziva se `"weekly"` i pro stranky ktere se realne meni minimalne (privacy, obchodni-podminky).

### 1.2 Robots.txt

**Soubor:** `public/robots.txt`

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard
... (admin paths)
Sitemap: https://www.hairland.cz/sitemap.xml
```

- ✅ Spravne blokuje admin sekce (/dashboard, /salon, /settings, /inventory atd.)
- ✅ Blokuje /api/
- ✅ Obsahuje odkaz na sitemap
- ❌ **P3** — Chybi `Disallow: /login` s lomitkem na konci — aktualne `/login` je blokovany, ale `/login/` by nebyl. Next.js obvykle neroutuje s trailing slash, takze to je OK, ale best practice je pridat obe varianty.
- ❌ **P2** — Chybi `Disallow: /inquiry-cart` — nechceme indexovat kosik poptavek
- ❌ **P3** — Chybi `Disallow: /stylists/` (admin strana, ne verejna `/kadernice/`)

### 1.3 Canonical URL

- ✅ Root layout nastavuje `metadataBase: new URL("https://www.hairland.cz")`
- ✅ Kazda verejna stranka ma `alternates: { canonical: "/path" }` — VYBORNE
- ✅ Produkty pouzivaji `canonical: /offer/${product.slug ?? slug}`
- ✅ Presmerovani z ID URL na slug URL (redirect v product page)

**Problemy:**

- ❌ **P1** — `www` vs `non-www`: Neni videt explicitni redirect `hairland.cz` -> `www.hairland.cz` v next.config.ts ani ve Vercel konfiguraci. Toto musi byt nastaveno na Vercelu (domain settings). Canonical ukazuje na `www.hairland.cz`.

### 1.4 Hreflang tagy

**Soubor:** `src/components/HreflangTags.tsx`

```tsx
<link rel="alternate" hrefLang="cs" href={url} />
<link rel="alternate" hrefLang="uk" href={url} />
<link rel="alternate" hrefLang="ru" href={url} />
<link rel="alternate" hrefLang="x-default" href={url} />
```

- ✅ Vsechny 3 jazyky + x-default
- ❌ **P1** — KRITICKA CHYBA: Vsechny hreflang odkazy vedou na STEJNOU URL (bez locale v URL). Google nemuze rozlisit jazykove verze, protoze URL je stejna pro vsechny jazyky. Hreflang je v podstate nefunkcni — locale se prepina pres cookie, ne URL. Google neuznava cookie-based locale switching.
- ❌ **P1** — Hreflang tagy by mely ukazovat na ruzne URL (napr. `/cs/`, `/uk/`, `/ru/`) nebo pouzit subdomeny. Aktualni implementace s `next-intl` cookie-based locale je pro SEO NEOPTIMALNI. Google vi indexovat pouze defaultni verzi (cs).

### 1.5 Meta tagy a OpenGraph

**Root layout (`src/app/layout.tsx`):**

- ✅ `title.template: "%s | Hairland"` — dobry template
- ✅ `title.default: "Premiove vlasy k prodlouzeni — skladem v Praze | Hairland"` — 59 znaku, OK
- ✅ `description` — 143 znaku, obsahuje klicova slova
- ✅ OpenGraph: type, siteName, locale (cs_CZ), image (1200x630)
- ✅ Twitter card: summary_large_image
- ✅ `metadataBase` nastavena
- ✅ Manifest PWA
- ✅ Favicon + Apple icon

### 1.6 Schema.org (JSON-LD)

| Stranka | Schema typy | Status |
|---------|------------|--------|
| Homepage | Store, WebSite, Organization | ✅ Kompletni |
| Product detail | Product, BreadcrumbList, FAQPage | ✅ VYBORNE |
| Contact | LocalBusiness | ✅ Kompletni |
| Blog post | Article, BreadcrumbList | ✅ Kompletni |
| Blog index | CollectionPage + ItemList | ✅ |
| Poradna | CollectionPage + ItemList | ✅ |
| Stylist | Person | ✅ |
| Pruvodce gramazi | HowTo | ✅ |
| Offer (list) | ZADNY | ❌ P2 |

**Product schema detaily:**

- ✅ name, description, image, brand, sku
- ✅ offers: price, priceCurrency, availability, seller
- ✅ shippingDetails (CZ, free shipping)
- ✅ MerchantReturnPolicy (14 dni, free return)
- ✅ aggregateRating (pokud existuji recenze)
- ❌ **P2** — Chybi `gtin`, `mpn` nebo `productID` pro Google Merchant Center
- ❌ **P2** — `offers.price` pouziva `priceTip100g / 100` — cena za 100g, ne za 1g. Melo by byt jasne, ze se jedna o cenu za urcite mnozstvi, nebo pouzit `priceSpecification` s `unitPriceSpecification`.

### 1.7 Vykon a optimalizace

- ✅ `poweredByHeader: false` — skryva X-Powered-By
- ✅ Image formats: `['image/avif', 'image/webp']` — moderni formaty
- ✅ `minimumCacheTTL: 86400` — 24h cache pro obrazky
- ✅ Preconnect na blob storage
- ✅ Geist font z Google Fonts s latin-ext subset
- ✅ Service Worker registrace (PWA)
- ✅ Vercel region: CDG1 (Pariz) — blizko CZ
- ❌ **P2** — Blog pouziva `<img>` misto `<Image>` z Next.js pro cover images v listingu — bez lazy loading a optimalizace
- ❌ **P3** — PublicNavbar fetch session na klientu (`/api/auth/session`) — kazdy page load = extra request

### 1.8 URL struktura

- ✅ Produkty: `/offer/{slug}` — ciste URL se slugem
- ✅ Presmerovani z CUID ID na slug URL (SEO-friendly)
- ✅ Blog: `/blog/{slug}`
- ✅ Kadernice: `/kadernice/{slug}`
- ✅ Poradna: `/poradna/{slug}`
- ✅ 301 redirecty v next.config.ts (`/advice` -> `/poradna`, `/cooperation` -> `/pro`, `/kontakt` -> `/contact`)
- ❌ **P2** — Filtry na `/offer` pouzivaji query params (`?category=VIRGIN`, `?color=1`) — tyto stranky nejsou v sitemape. Pro SEO by bylo lepsi mit `/offer/virgin`, `/offer/premium` jako skutecne stranky.

---

## 2. ON-PAGE SEO

### 2.1 Titulky stranek (title tags)

| Stranka | Title | Delka | Hodnoceni |
|---------|-------|-------|-----------|
| Homepage | Premiove vlasy k prodlouzeni — skladem v Praze \| Hairland | 59 | ✅ |
| Offer | Nabidka premiovych vlasu \| Virgin, Premium, Standard \| Hairland | 63 | ✅ |
| Product | {name} {delky} [{barvy}] \| Hairland | Auto-gen, max 60 | ✅ VYBORNE |
| Blog | {title} \| Blog \| Hairland | Dynamicky | ✅ |
| Contact | Kontakt — osobni konzultace v Praze \| Hairland | 50 | ✅ |
| About | O nas — premiove vlasy z primeho importu \| Hairland | 52 | ✅ |
| Poradna | Dynamicky z prekladu \| Hairland | OK | ✅ |
| Gramaz | Kolik gramu vlasu potrebuji? — pruvodce gramazi \| Hairland | 58 | ✅ |

- ✅ Vsechny titulky obsahuji branding " | Hairland"
- ✅ Produkty maji chytry auto-generation: name + lengths + colors (pokud se vejdou do 60 znaku)
- ✅ Moznost manual override pres `metaTitle` v DB

### 2.2 Meta descriptions

| Stranka | Delka | Kvalita |
|---------|-------|---------|
| Homepage | 143 | ✅ — obsahuje klicova slova |
| Offer | 142 | ✅ |
| Product | Auto-gen, max 155 | ✅ VYBORNE |
| Blog | Dynamicky z excerpt/metaDescription | ✅ |
| Contact | 106 | ✅ |
| About | 128 | ✅ |

- ✅ Produkty: automaticky generovany z name + origin + colors + texture + lengths + CTA
- ✅ Moznost manual override pres `metaDescription` v DB
- ❌ **P3** — Stylist pages pouzivaji `bio?.slice(0, 155)` — muze orezat uprostred slova

### 2.3 Heading struktura (H1-H6)

**Homepage:**
- H1: "Premiove vlasy k prodlouzeni — skladem v Praze" ✅
- H2: "Vyberte si z nasi nabidky", "Siroka skala odstinu", "Jak to funguje", "Proc nakupovat u nas", "Co rikaji nase zakaznice", "Nase kadernice" ✅
- H3: Pouzity pro podpolocky v sekcich ✅

**Product detail:**
- H1: `{productName}` ✅
- H2: "Souvisejici produkty" ✅

**Offer listing:**
- H1: Preklad `products.title` ✅
- H2: Banner "Zpracovani na zakazku" ✅

- ✅ Kazda stranka ma prave jeden H1
- ✅ Logicka hierarchie H1 -> H2 -> H3

### 2.4 Alt texty obrazku

- ✅ Product photos: `alt={productName}` — presny nazev produktu
- ✅ Category images: `alt={tCategory(key)}` — lokalizovane nazvy kategorii
- ✅ Stylist photos: `alt={s.name}` — jmeno stylistky
- ✅ Color palette: `alt={t("landing.colorPaletteAlt")}`
- ❌ **P2** — Blog cover images v listingu pouzivaji `<img>` s alt textem, ale chybi width/height atributy
- ❌ **P3** — Logo v navbaru a footeru ma `alt="Hairland"` — mohlo by byt popisnejsi

### 2.5 Interni prolinkavani

**Navigace:**
- ✅ Hlavni menu: Home, Nabidka, Spoluprace (dropdown: Pro, Kadernice, Vykup, Registrace), Inspirace (dropdown: Poradna, Blog), Kontakt, O nas
- ✅ Footer: kompletni navigace + legal linky + kontakt + socials
- ✅ Breadcrumbs na product detail (JSON-LD i vizualni)
- ✅ Blog -> Poradna a naopak vzajemne prolinkavani
- ✅ Related products na product detail
- ✅ CTA sekce na blogu (odkaz na offer + contact)

**Problemy:**
- ❌ **P2** — Chybi breadcrumbs na blog posts vizualne (jsou jen v JSON-LD, ne na strance... UPDATE: jsou tam v vizualni podobe na strance s cover image. OK.)
- ❌ **P2** — Poradna clanky nemaji breadcrumbs vubec (ani JSON-LD ani vizualni)
- ❌ **P3** — Homepage nema odkaz na `/pruvodce-gramazi` — dulezita stranka neni primo linkована z hlavni stranky

---

## 3. PRODUKTOVE SEO

### 3.1 Automaticke SEO pravidla

**Aktualni implementace (VYBORNE):**

1. **Title auto-generation** (`offer/[slug]/page.tsx:126-136`):
   - Format: `{name} {lengths} [{colors}] | Hairland`
   - Inteligentni trimming: pridava barvy jen pokud se vejdou do 60 znaku
   - Manual override: `product.metaTitle` z DB

2. **Description auto-generation** (`offer/[slug]/page.tsx:138-145`):
   - Format: `{name}. puvod {origin}. {colors}. {texture}. {lengths}. Osobni odber Praha zdarma, zpracovani na zakazku.`
   - Max 155 znaku
   - Manual override: `product.metaDescription` z DB

3. **OG Image** (`offer/[slug]/opengraph-image.tsx`):
   - Dynamicky generovany OG image s product photo + name + price
   - Fallback na branded placeholder
   - Manual override: `product.ogImage` z DB

4. **Product bio auto-generation** (`src/lib/product-bio.ts`):
   - Generuje kompletni popis na zaklade: kategorie, zpracovani, puvod, textura, barvy
   - Obsahuje: popis kategorie, story o puvodu, benefity, zaruka spokojenosti
   - Lokalizovane (cs/uk/ru) s fallbackem na auto-bio

5. **FAQ auto-generation**:
   - Automaticky FAQ podle kategorie produktu (VIRGIN, PREMIUM, STANDARD)
   - + obecne FAQ (aplikace, gramaz, doprava)
   - FAQPage JSON-LD schema

### 3.2 Databazova podpora SEO

**Product model fields:**
- `slug` — SEO-friendly URL ✅
- `metaTitle` — manual override ✅
- `metaDescription` — manual override ✅
- `ogImage` — custom OG image ✅
- `name`, `nameUk`, `nameRu` — lokalizovane nazvy ✅
- `description`, `descriptionUk`, `descriptionRu` — lokalizovane popisy ✅

### 3.3 Schema.org Product — detailni analyza

```json
{
  "@type": "Product",
  "name": "...",
  "description": "...",  // max 160 chars
  "image": ["..."],
  "brand": { "@type": "Brand", "name": "Hairland" },
  "sku": "cuid",
  "offers": {
    "@type": "Offer",
    "price": "...",        // cena za 100g v CZK
    "priceCurrency": "CZK",
    "availability": "InStock|Discontinued",
    "shippingDetails": { ... },  // CZ, free
    "hasMerchantReturnPolicy": { ... }  // 14 days, free return
  },
  "aggregateRating": { ... }  // pokud existuji recenze
}
```

**Chybi:**
- ❌ **P2** — `offers.price` nezminuje `unitPriceSpecification` — Google nezna mnozstvi
- ❌ **P2** — Chybi `material` (napr. "lidske vlasy", "100% human hair")
- ❌ **P3** — Chybi `countryOfOrigin` v schema
- ❌ **P3** — Chybi `additionalProperty` pro texturu, barvu, delku
- ❌ **P2** — Chybi individualni `Review` objekty v JSON-LD (je jen `aggregateRating`)

---

## 4. OBSAHOVE SEO

### 4.1 Obsahova analyza homepage

- ✅ Hero sekce s jasnym USP: "Premiove vlasy k prodlouzeni — skladem v Praze"
- ✅ 4 produktove kategorie s obrazky
- ✅ Barevna paleta — 10 odstinu s odkazy na filtr
- ✅ "Jak to funguje" — 4 kroky
- ✅ "Proc nakupovat u nas" — 4 trust boxy
- ✅ Recenze zakaznic
- ✅ Partnerske kadernice
- ✅ Vicejazykovy banner (CZ/UA/RU)
- ✅ CTA sekce + B2B odkazy

**Klicova slova na homepage:**
- "premiove vlasy" ✅
- "prodlouzeni vlasu" ✅
- "clip-in, tape-in, micro ring" ✅
- "skladem v Praze" ✅
- "zpracovani na zakazku" ✅
- "primy import" ✅

### 4.2 Obsahove mezery

- ❌ **P1** — Blog ma pouze 1 clanek ("5 Reasons to Invest in Quality Hair"). Blog sekce je v podstate prazdna — velka prilocitost pro organic traffic.
- ❌ **P2** — Chybi FAQ stranka (jako samostatna stranka, ne jen na produktech)
- ✅ Poradna ma 8 clanku pokryvajicich klicova temata (typy prodlouzeni, clip-in vs tape-in, vyber barvy/delky, pece, puvod, virgin vs remy, jak dlouho vydrzi)
- ❌ **P2** — Chybi stranka "Recenze" jako agregovany prehled vsech recenzi
- ❌ **P2** — Chybi obsah o specifickych puvodech vlasu (napr. `/puvod/ukrajina`, `/puvod/rusko`) — kazdy puvod by mohl byt landing page pro long-tail keywords
- ❌ **P3** — About stranka je velmi strucna — chybi pribeh firmy, fotky, vize

### 4.3 Klicova slova — pokryti

| Klicove slovo | Pozice | Pokryti |
|--------------|--------|---------|
| premiove vlasy | Homepage H1 + title + desc | ✅ Silne |
| prodlouzeni vlasu | Homepage + offer + poradna | ✅ Silne |
| clip-in vlasy | Poradna clanek + produkt popisy | ✅ OK |
| tape-in vlasy | Poradna clanek + produkt popisy | ✅ OK |
| prodej vlasu Praha | Homepage + contact | ✅ OK |
| virgin vlasy | Offer filtr + poradna | ✅ OK |
| keratin vlasy | Produkt popisy | ⚠️ Slabe — chybi dedicka stranka |
| micro ring vlasy | Produkt popisy | ⚠️ Slabe — chybi dedicka stranka |
| kolik gramu vlasu | Pruvodce gramazi | ✅ Dedicka stranka |
| pece o prodlouzene vlasy | Poradna clanek | ✅ OK |
| nejlepsi vlasy na prodlouzeni | Chybi | ❌ Nepokryto |
| cena prodlouzeni vlasu | Chybi | ❌ Nepokryto |
| kde koupit vlasy v Praze | Chybi | ❌ Nepokryto |

---

## 5. KONKURENCNI ANALYZA

### 5.1 Hlavni konkurenti (CZ trh)

| Konkurent | URL | Zamereni |
|-----------|-----|----------|
| ClipInHair.cz | clipinhair.cz | Clip-in vlasy, REMY, tapeX |
| ProfiBeauty.cz | profibeauty.cz | Kompletni sortiment + kosmetika |
| czVlasy.cz | czvlasy.cz | Clip-in, keratin, micro ring, tapex |
| HOTstyle.cz | hotstyle.cz | Nejsirsi vyber, clip-in, tape-in, keratin |
| HumanHair.cz | humanhair.cz | Premium clip-in, keratin, micro ring |
| Clip-Vlasy.cz | clip-vlasy.cz | Clip-in zamecteni |
| Tape-Vlasy.cz | tape-vlasy.cz | Tape-in specializace |
| BeautyShape.cz | beautyshape.cz | Salon + extensions, premium |
| AFRODITI | afroditi | Virgin slavic hair, 3000+ bundles |
| Ebony Prague | ebonyprague.cz | Extensions + wigs |

### 5.2 Konkurencni vyhody Hairland

- ✅ **Primy import** (ne reseller) — unikatni USP
- ✅ **Vicejazykova podpora** (CZ/UA/RU) — zadny konkurent to nema
- ✅ **B2B program** s loyalty tiers — propracovany system
- ✅ **Schema markup** — nadprumerne v oboru
- ✅ **Poradna sekce** — edukativni obsah
- ✅ **Osobni pristup** — konzultace, dovoz zdarma Praha

### 5.3 Kde konkurence vede

- ❌ HOTstyle/ClipInHair maji stovky produktovych stranek — vice long-tail keywords
- ❌ ProfiBeauty ma silny blog s desitkami clanku
- ❌ czVlasy.cz ma kategorizovane stranky pro kazdy typ zpracovani
- ❌ Konkurenti maji e-shop s primym nakupem (Hairland ma poptavkovy system)

---

## 6. LOKALIZACE A MEZINARODNI SEO

### 6.1 Aktualni stav

- Jazyky: cs (vychozi), uk (ukrajinstina), ru (rustina)
- Implementace: `next-intl` s cookie-based locale switching
- Preklady: `messages/cs.json`, `messages/uk.json`, `messages/ru.json`
- Content lokalizace: produkty (name, description), blog (title, excerpt, content), clanky

### 6.2 SEO problemy lokalizace

- ❌ **P1** — KRITICKE: Google nemuze indexovat ukrajinske/ruske verze. URL je stejna pro vsechny jazyky, locale se meni jen pres cookie. Google vzdy uvi pouze ceskou verzi.
- ❌ **P1** — Hreflang tagy jsou nefunkcni — vsechny ukazuji na stejnou URL
- ❌ **P2** — Sitemap neobsahuje jazykove alternativy (`<xhtml:link rel="alternate">`)
- ❌ **P2** — Produktove meta title/description jsou generovany pouze v cestine, i kdyz existuji preklady

### 6.3 Doporuceni

Pro plne funkcni mezinarodni SEO by bylo potreba:
1. Prefix-based routing (`/cs/`, `/uk/`, `/ru/`) — VELKA zmena
2. NEBO subdomeny (`cs.hairland.cz`, `uk.hairland.cz`)
3. Aktualizace sitemape s `<xhtml:link>` alternativami

**Realisticka alternativa (bez zmeny URL):**
- Ponechat cookie-based pro UX
- Pridat `<meta name="robots" content="noindex">` pro non-default locale? NE — to nema smysl.
- Akceptovat, ze UA/RU verze nebudou indexovany a zamerit SEO na cesky trh.

---

## 7. SOUHRNNE HODNOCENI

### Co je dobre

- ✅ **Schema markup** — jeden z nejlepsich v oboru CZ. Product, Store, WebSite, Organization, Article, Person, HowTo, FAQPage, BreadcrumbList — vse spravne implementovano.
- ✅ **Automaticke SEO pravidla pro produkty** — chytre auto-generation title/description/bio s manual override
- ✅ **OG Image generation** — dynamicky generovane OG images pro produkty
- ✅ **Canonical URL** na kazde strance
- ✅ **Clean URL structure** se slugy
- ✅ **Image optimization** — AVIF/WebP, cache, preconnect
- ✅ **Meta tagy** — dobre titulky a popisy s klicovymi slovy
- ✅ **Heading hierarchie** — spravna H1-H3 struktura
- ✅ **Interni prolinkavani** — propracovane s dropdowny, related products, cross-links
- ✅ **PWA ready** — manifest, service worker, icons

### Co je spatne / chybi

| Priorita | Problem | Dopad |
|----------|---------|-------|
| **P1** | Hreflang tagy nefungujicni (vsechny ukazuji na stejnou URL) | UA/RU verze nebudou indexovany |
| **P1** | Blog skoro prazdny (1 clanek) — obrovska ztracena prilezitost | Minimalni organic traffic z blogu |
| **P1** | www vs non-www redirect neni overeny | Mozna duplicita indexace |
| **P2** | Filtry na /offer nejsou samostatne stranky | Long-tail keywords nepokryty |
| **P2** | Chybi /inquiry-cart v robots.txt | Mozna indexace kosiku |
| **P2** | Blog pouziva `<img>` misto `<Image>` | Horsi performance |
| **P2** | Product schema chybi material, countryOfOrigin | Mensi sance na rich results |
| **P2** | Chybi dedicke landing pages pro zpracovani (keratin, micro-ring) | Nepokryte klicove slovy |
| **P2** | Poradna clanky nemaji breadcrumbs | Slabsi interni linkage |
| **P2** | Meta descriptions pro produkty jsou jen v cestine | UA/RU meta zbytecne |
| **P3** | Staticke stranky maji hardcoded lastModified v sitemape | Minor signal issue |
| **P3** | About stranka prilis strucna | Ztracena prilezitost pro E-E-A-T |

---

## 8. KONKRETNI DOPORUCENI

### P1 — Kriticka (udelat co nejdrive)

1. **Blog content plan** — Napsat minimalne 5-10 clanku pokryvajicich:
   - "Jak vybrat spravne vlasy na prodlouzeni" (2000+ slov)
   - "Cena prodlouzeni vlasu — kompletni pruvodce 2026"
   - "Kde koupit kvalitni vlasy v Praze"
   - "Virgin vs Remy vlasy — jaky je rozdil a co je lepsi"
   - "Prodlouzeni vlasu keratinem — kompletni pruvodce"
   - "Tape-in vlasy — vse co potrebujete vedet"
   - "Jak pecovat o prodlouzene vlasy v lete/zime"
   - "5 chyb pri vyberu vlasu na prodlouzeni"

2. **Overit www redirect** — Zkontrolovat ve Vercel dashboard, ze `hairland.cz` redirectuje 301 na `www.hairland.cz`.

3. **Opravit hreflang** — Bud:
   a) Prejit na prefix-based routing (velka zmena) — DOPORUCENO pro budoucnost
   b) NEBO odstranit hreflang tagy uplne (pokud locale zustane cookie-based) — lepsi nez nefunkcni

### P2 — Dulezite (udelat v pristich tydnech)

4. **Kategorizovane landing pages** — Pridat staticke stranky:
   - `/offer/virgin` — landing page pro virgin vlasy
   - `/offer/premium` — landing page pro premium vlasy
   - `/offer/standard` — landing page pro standard vlasy
   Kazda s unikatnim obsahem, H1, meta tagy, schema

5. **Pridat do robots.txt**: `Disallow: /inquiry-cart`

6. **Product schema vylepseni**:
   - Pridat `material: "100% lidske vlasy"`
   - Pridat `countryOfOrigin`
   - Pridat `additionalProperty` pro texturu, barvu
   - Zvazit individualni `Review` objekty

7. **Blog images** — Nahradit `<img>` za `<Image>` z Next.js v blog listing page

8. **Breadcrumbs na poradnu** — Pridat BreadcrumbList JSON-LD + vizualni breadcrumbs

9. **Recenze stranka** — Agregovana stranka vsech recenzi s filtrovanim

### P3 — Nice to have

10. **About stranka rozsirit** — Pribeh firmy, fotky, tym, vize, certifikaty
11. **Logo alt text** — "Hairland — premiove vlasy k prodlouzeni"
12. **Homepage link na gramaz** — Pridat odkaz na pruvodce gramazi do homepage
13. **Sitemap lastModified** — Odstranit hardcoded datum pro staticke stranky

---

## 9. NAVRH AUTOMATICKYCH SEO PRAVIDEL PRO PRODUKTY

Aktualni auto-generation je jiz velmi dobry. Navrhuji doplneni:

### Pravidlo 1: Title formula
```
{Product Name} {lengths}cm [{colors}] | Hairland
```
- Max 60 znaku (vcetne " | Hairland")
- Pokud se barvy nevejdou, vynechat
- Manual override: `metaTitle` v DB

### Pravidlo 2: Description formula
```
{Name}. Puvod {origin}. {texture}. {lengths}cm. {colors}.
Osobni odber Praha zdarma, zpracovani na zakazku do 7 dni.
```
- Max 155 znaku
- Vzdy koncit CTA ("Osobni odber Praha zdarma")
- Manual override: `metaDescription` v DB

### Pravidlo 3: Product bio (uz implementovano)
- Auto-generated z category + origin + texture + processing type
- Obsahuje: specs, story, benefits, zaruka
- Manual override: `description` v DB

### Pravidlo 4: OG Image (uz implementovano)
- Dynamicky generovany s product photo + name + price
- Fallback na branded placeholder
- Manual override: `ogImage` v DB

### Pravidlo 5: Schema enrichment (NOVE)
```json
{
  "material": "100% lidske vlasy",
  "countryOfOrigin": "{origin}",
  "additionalProperty": [
    { "name": "Textura", "value": "{texture}" },
    { "name": "Barevny ton", "value": "{colorTone}" },
    { "name": "Dostupne delky", "value": "{lengths}" }
  ]
}
```

### Pravidlo 6: URL slug (uz implementovano)
- Auto-generate z nazvu produktu
- NFD normalizace pro diakritiku
- Redirect z ID na slug URL

---

## 10. CELKOVE SKORE

| Oblast | Skore | Poznamka |
|--------|-------|----------|
| Technicke SEO | 7/10 | Solidni zaklad, problem s hreflang |
| On-page SEO | 8/10 | Vyborne titulky, popisy, heading hierarchie |
| Schema markup | 9/10 | Nadprumerne, kompletni |
| Obsahove SEO | 5/10 | Poradna dobra, blog prazdny, chybi landing pages |
| Produktove SEO | 9/10 | Vyborne auto-generation, DB override |
| Mezinarodni SEO | 3/10 | Hreflang nefunkcni, cookie-based locale |
| Vykon | 8/10 | Moderni stack, drobne nedostatky |
| **CELKEM** | **7/10** | **Solidni technicka zakladna, obsahove mezery** |

Nejvetsim SEO potencialem je **obsahova strategie** (blog + landing pages) a **oprava mezinarodniho SEO** (hreflang/locale routing).
