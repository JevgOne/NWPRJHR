# TASK QUEUE — Hairland

## AKTIVNÍ

## TASK-070: Slevový kód při objednávce/poptávce
Priorita: 1
Stav: čeká
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

## TASK-071: Performance — pomalé načítání produktů a admin panelu
Priorita: 1
Stav: čeká
Projekt: /Users/zen/hairora

### Kompletní zadání:
Uživatel reportuje:
- "produkty se načítají hrooozne pomalu ale fakt"
- "to same když se přihlašují do admin panelu hrozne dlouho se to načíta"

Potřeba analyzovat:
1. Proč jsou API endpointy pomalé (Turso remote SQLite latence?)
2. Optimalizace DB dotazů (select only needed fields, indexy)
3. Cachování (Next.js cache, unstable_cache, revalidate)
4. Lazy loading komponent v admin panelu
5. Connection pooling k Turso

### Kontext:
- DB: Turso (libsql remote SQLite)
- Prisma 7 s Turso adapterem
- Next.js 16 s Turbopack
- Produkce: hairland.cz

---

## TASK-072: DB migrace — PromoCode tabulka do Turso
Priorita: 1
Stav: čeká
Projekt: /Users/zen/hairora

### Kompletní zadání:
Prisma schema obsahuje nový model `PromoCode` ale tabulka `promo_codes` ještě neexistuje v Turso DB.
Spustit ALTER TABLE / CREATE TABLE přes Turso CLI nebo SQL.

### Kontext:
- Turso vyžaduje manuální migrace (ne prisma db push)
- Schema: `prisma/schema.prisma` model PromoCode na konci souboru

---

## BACKLOG

## TASK-004: Struktura vlasů + tóny barev — celý systém
Priorita: 2
Stav: odloženo

## TASK-005: SEO automatizace pro nové produkty
Priorita: 2
Stav: odloženo

## TASK-002: Blog/Poradna
Priorita: 3
Stav: čeká

## TASK-003: Referral program
Priorita: 3
Stav: čeká

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
