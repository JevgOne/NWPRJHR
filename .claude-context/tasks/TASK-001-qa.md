# QA Report: TASK-001 — B2B/Dropshipping Systém

**Datum:** 2026-06-26
**Kontrolor:** KONTROLOR agent
**Stav implementace:** 5.5 / 6 fází dle TASK-001-impl.md

---

## 1. Simplify — Zbytečná komplexita

### [Low] Duplicitní výpočet ceny pro HAIRDRESSER

**Soubory:**
- `src/app/api/salon-portal/catalog/route.ts:54-56`
- `src/lib/sale-pricing.ts:26-29`

**Problém:** Identický výpočet ceny pro kadeřnici je zopakován na dvou místech:
```ts
// V catalog/route.ts:
price = roundHalereUp((v.retailPricePerGram * (10000 - hairdresserDiscountPct)) / 10000);

// V sale-pricing.ts:
const price = roundHalereUp((variant.retailPricePerGram * (10000 - discountPct)) / 10000);
```

**Doporučení:** Centralizovat do `getSalePrice()` nebo sdílené helpery. Aktuálně funkční, ale při změně logiky je nutné upravit dvě místa.

---

### [Low] Hardcoded "20%" v UI banneru

**Soubor:** `src/app/(salon)/salon/catalog/CatalogClient.tsx:67`

```ts
? `${tB2B("tierHairdresser")} — 20% ${tB2B("discount").toLowerCase()}`
```

**Problém:** Sleva kadeřnice je zobrazena jako hardcoded "20%" místo načtení aktuální hodnoty z B2BSettings. Pokud admin změní slevu na jiné číslo, banner zůstane zobrazovat "20%". Skutečná cena v tabulce produktů je ale správně dynamická (z API).

**Doporučení:** Načíst aktuální discount z API `/api/b2b-settings` nebo přidat `hairdresserDiscountPct` do response z `/api/salon-portal/catalog`. Minimálně přidat fallback z překladu.

---

### [Negligible] HAIRDRESSER fallback 0.8 v product-serializer

**Soubor:** `src/lib/api/product-serializer.ts:53`

```ts
: roundHalereUp(variant.retailPricePerGram * 0.8);
```

**Kontext:** Serializer pro `/api/products` (admin/OWNER) zahrnuje fallback 0.8 (= 20%) pro HAIRDRESSER pokud není předán `salonDiscountPercent`. V praxi tento serializer není volán pro HAIRDRESSER role (slouží pro admin pohled) — ale fallback je konzistentní s defaultní hodnotou v B2BSettings (2000 = 20%). Nízká priorita.

---

## 2. Debug — Build a TypeScript

### ✅ Next.js build: PROCHÁZÍ

```
✓ Compiled successfully in 4.4s
✓ Generating static pages (104/104)
```

Všechny nové routy jsou přítomny v buildu:
- `/pro` — B2B landing page
- `/registrace` — s type selectorem
- `/settings/b2b` — admin B2B nastavení
- `/salon/catalog` — s tier bannerem

---

### ❌ TypeScript: 3 errory (z Task #4, NE z B2B)

```
src/components/products/VariantTable.tsx(142,33): error TS2554: Expected 3 arguments, but got 2.
src/components/products/VariantTable.tsx(151,35): error TS2554: Expected 3 arguments, but got 2.
src/lib/api/product-serializer.ts(24,35): error TS2339: Property 'costPricePerGram' does not exist on type 'VariantWithProduct'.
```

**Příčina:** Tyto errory pocházejí z **Task #4** (`Add costPricePerGram to Variant model`) která je aktuálně `in_progress`. `product-serializer.ts:24` odkazuje na `variant.costPricePerGram` které ještě neexistuje v Prisma schématu, a `VariantTable.tsx` volá `handleSavePrice()` s nesprávným počtem argumentů (2 místo 3).

**Dopad na B2B Task #1:** Nulový — tyto soubory nebyly součástí B2B implementace a chyby existovaly (nebo vznikly) v rámci Task #4.

**Akce:** Task #4 musí doplnit pole `costPricePerGram` do Prisma schématu a opravit volání `handleSavePrice()` v VariantTable.

---

### ⚠️ Potenciální runtime issue: B2BSettings upsert s fixním id

**Soubor:** `src/app/api/b2b-settings/route.ts:46-56`

```ts
await prisma.b2BSettings.upsert({
  where: { id: "default" },
  create: { id: "default", ... },
  update: { ... },
});
```

**Analýza:** Pole `id` v B2BSettings modelu je definováno jako `@id @default(cuid())`. Prisma upsert s `where: { id: "default" }` je validní — při první PUT vytvoří záznam s id="default". Schema nebrání použití libovolného stringu jako `id`. Seed.ts totéž dělá správně.

**Riziko:** Pokud by se databáze resetovala a GET byl volán dříve než PUT nebo seed, vrátí se fallback hardcoded hodnoty (2000/3600) — to je správné chování. Žádné riziko. OK.

---

### ✅ Překlady: Kompletní

Všechny klíče jsou synchronizovány napříč cs/uk/ru:
- `b2b` — 0 chybějících klíčů v uk, ru
- `b2bSettings` — 0 chybějících klíčů v uk, ru
- `public.register` — 0 chybějících klíčů v uk, ru (včetně nových typeSection, typeSalon, typeHairdresser, icoLabelOptional atd.)

---

## 3. Reverzní kontrola — Porovnání se zadáním

### Požadavky ze zadání:

| # | Požadavek | Stav | Poznámka |
|---|-----------|------|----------|
| 1 | Rozšíření uživatelského modelu o role/tier (CUSTOMER, HAIRDRESSER, SALON) | ✅ | Role HAIRDRESSER přidána. CustomerType enum rozšířen. |
| 2 | Registrační formulář pro kadeřnice a salony (s ověřením — IČO, foto) | ✅ / ⚠️ | Type selector a IČO optional implementovány. Foto upload není (nebylo v plánu) |
| 3 | Admin schválení B2B registrací | ✅ | `approved: false` při registraci, auth blokuje neapproved hairdressers, admin badge v SalonsClient |
| 4 | Cenový systém — varianty s cenami pro každý tier | ✅ | Wholesale (salon) + retail (customer) existují, hairdresser = výpočet z retail |
| 5 | Stránka produktu — cena dle tier přihlášeného uživatele | ⚠️ SKIP | Dle impl.md: public offer page neexistuje, tento bod byl vědomě vynechán |
| 6 | B2B dashboard — přehled objednávek, faktur | ✅ | Hairdresser má přístup do `/salon/*` portálu (catalog, orders, invoices, profile) |
| 7 | Stránka `/pro` s informacemi o programu a registrací | ✅ | `/pro` page vytvořena s hero, kartami, how-it-works, CTA |

### Detailní průchod plánem:

| Fáze | Krok | Stav |
|------|------|------|
| 1.1 | Schema: HAIRDRESSER do Role + CustomerType, SalonType enum, B2BSettings model | ✅ |
| 1.2 | Auth: blokování neschválených HAIRDRESSER, isHairdresser(), isB2B() helpery | ✅ |
| 1.3 | Seed: B2BSettings upsert | ✅ |
| 2.1 | sale-pricing.ts: HAIRDRESSER case | ✅ |
| 2.2 | catalog API: HAIRDRESSER access + hairdresser pricing | ✅ |
| 2.3 | Public product page pricing | ⛔ SKIP (dokumentováno, stránka neexistuje) |
| 2.4 | Admin B2B settings page + API | ✅ |
| 3.1 | Registration form: type selector | ✅ |
| 3.2 | Register API: type field, correct role assignment | ✅ |
| 3.3 | Login redirect: HAIRDRESSER → /salon/catalog | ✅ |
| 4.1 | SalonsClient: type badge, pending badge, type filter | ✅ |
| 4.2 | SalonDetailClient: type badge | ✅ |
| 4.3 | Salons API: type filter | ✅ |
| 5.1 | /pro page | ✅ |
| 5.2 | Navbar /pro link | ✅ |
| 5.3 | Překlady cs/uk/ru | ✅ |
| 6.1 | Dashboard: redirect SALON/HAIRDRESSER → /salon/catalog | ✅ |
| 6.2 | CatalogClient: tier banner | ✅ (s caveátem hardcoded 20%) |

### Cross-cutting: ~30+ souborů s HAIRDRESSER role guards

Dle impl.md byly aktualizovány API routy i page guards. Spot check:
- `src/app/(salon)/salon/layout.tsx:11` — guard pro SALON || HAIRDRESSER ✅
- `src/app/(app)/dashboard/page.tsx:47` — redirect pro SALON || HAIRDRESSER ✅
- `src/app/api/salons/route.ts:31` — scoping pro SALON || HAIRDRESSER ✅

---

## Souhrn nálezů

### Blocker (brání spuštění):
- **Žádné** z B2B Task #1

### Medium:
- **TS errory z Task #4** — TS kompilace selhává kvůli `costPricePerGram` a `handleSavePrice` arity, ale jde o chyby z jiného nedokončeného tasku, ne z B2B

### Low:
1. **Hardcoded "20%" v CatalogClient banneru** — zobrazená sleva se neaktualizuje když admin změní B2BSettings
2. **Duplicitní hairdresser pricing logika** na 2 místech (catalog route + sale-pricing.ts)

### Vynecháno (dokumentováno a odsouhlaseno):
- Step 2.3: Public product page — stránka `/offer/[id]` neexistuje, je to separátní feature
- Foto upload při registraci — nebylo v plánu, jen IČO

---

## Doporučení pro implementátora

1. **Opravit hardcoded "20%" v CatalogClient** — nejjednodušší fix: přidat `hairdresserDiscountPct` do response z `/api/salon-portal/catalog` a zobrazit dynamicky
2. **Task #4 TS errory** — musí být opraveny v rámci Task #4 (přidat `costPricePerGram` do schema + opravit VariantTable.tsx volaní handleSavePrice)
3. **Volitelně:** Centralizovat hairdresser pricing výpočet do sdílené funkce

---

## Verdikt

**B2B implementace (Task #1) je funkční a správná.** Build prochází, všechny B2B požadavky jsou implementovány (s jednou dokumentovanou výjimkou — public product page). TS errory jsou z jiného tasku. Jediný Low issue je hardcoded sleva v UI banneru, jinak implementace odpovídá plánu bod po bodu.
