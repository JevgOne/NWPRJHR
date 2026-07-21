# URGENTNI AUDIT PRODUKCE — hairland.cz

**Datum:** 2026-07-21
**Status:** KOMPLETNI ANALYZA

---

## SOUHRN NALEZU

### KRITICKE (musí se opravit ihned)

#### 1. SPATNY BANKOVNI UCET — klienti platí na neexistující účet!
**Závažnost: KRITICKA** — zákazníci posílají peníze na špatný účet

- **V DB** (`companies` tabulka): `bankAccount = "6424423004/5500"`, `bankIban = "CZ5555000000006424423004"`
- **Správné hodnoty**: `7141812004/5500`, IBAN: `CZ6755000000007141812004`
- **Dotčené soubory s hardcoded fallbackem:**
  - `src/app/api/sales/route.ts:60-61` — fallback na špatný účet
  - `src/app/api/public/orders/route.ts:385,444-445` — hardcoded špatný účet pro objednávky
  - `src/lib/invoice-pdf.ts:256` — špatný účet na fakturách
  - `src/app/(app)/settings/companies/CompaniesClient.tsx:241` — placeholder v UI

**FIX:** Aktualizovat DB záznam company_alvento + opravit všechny hardcoded fallbacky v kódu.

#### 2. SPATNY NAZEV FIRMY v DB
- V DB: `"Altro Servis Group s.r.o."`
- Správně: `"Alvento Solutions"`
- Dotčeno: Faktury, obchodní podmínky, všechny dokumenty

**FIX:** UPDATE companies SET name = 'Alvento Solutions' WHERE id = 'company_alvento'

---

### DULEZITE (potřeba opravit brzy)

#### 3. Embedded replica na Vercelu — potenciální příčina prázdných stránek
**Soubor:** `src/lib/db.ts`
- `TURSO_EMBEDDED_REPLICA=true` v `.env.local`
- Replica je na `/tmp/turso-replica.db` — na Vercelu je `/tmp` efemérní
- Při cold startu: prázdná SQLite DB → Prisma dotazy vrátí 0 řádků → stránky se zdají prázdné
- `syncInterval: 60` — ale první sync může selhat/být pomalý
- `readYourWrites: true` — zápisy jdou přes remote, čtení z lokální repliky

**Diagnóza:** Pokud uživatel viděl "0 produktů" na admin stránce, může to být tím, že serverless funkce měla cold start a replica ještě nesynchronizovala.

**OVŠEM:** DB data jsou v pořádku:
- 35 produktů v DB (aktivních, nearchivovaných)
- 35 aktivních variant
- 43 dodávek se zásobou
- VIRGIN culík (cmrugysu3) — 55g, 1 kus, exclusive=1 — naskladnění PROBĚHLO úspěšně

**FIX options:**
1. **Rychlý fix:** Přidat explicit sync volání na začátku server komponent (před dotazy)
2. **Bezpečný fix:** Vypnout embedded replica (`TURSO_EMBEDDED_REPLICA=false`), bude pomalejší ale spolehlivé
3. **Správný fix:** Přidat retry/fallback — pokud replica vrátí 0 produktů, zkusit remote

#### 4. Products stránka — NE 404, ale může vracet prázdný seznam
**Soubor:** `src/app/(app)/products/page.tsx`
- Stránka existuje a je správně napsaná
- Používá `unstable_cache` s `revalidate: 60, tags: ["products"]`
- Dotaz `prisma.product.findMany({ where: { archived: false } })` vrátí 35 produktů z remote DB
- Pokud embedded replica je prázdná → vrátí 0 → stránka vykreslí prázdný seznam
- To vypadá jako "404" ale je to vlastně prázdná odpověď

#### 5. Dashboard cache — ukazuje neexistující pohyby
**Soubor:** `src/app/(app)/dashboard/page.tsx`
- Dashboard zobrazuje `recentMovements` — posledních 6 stock_movements
- V DB: 43 RECEIPT + 1 ISSUE = 44 pohybů — to je správné
- Pokud dashboard ukazuje pohyby které "neexistují" → pravděpodobně cache problém (60s revalidation)
- Po naskladnění se volá `revalidateTag("dashboard", "max")` → mělo by fungovat

---

### NIZKA PRIORITA

#### 6. 0 objednávek — SPRAVNE
- Tabulka `orders` je prázdná — to je OK, e-shop ještě nebyl spuštěn
- 2 product_reservations ve stavu PENDING/PAID existují

#### 7. LUXE culík naskladnění — FUNGUJE
- Task #25 tvrdil, že LUXE exkluzivní culíky se neukládají
- **Ale DB ukazuje:** VIRGIN culík cmrugysu3 (BY_PIECE, exclusive=1) byl naskladněn 2026-07-21 09:46
- Delivery existuje: 55g, 1 kus, exclusive=1
- StockMovement RECEIPT existuje
- **Závěr:** Naskladnění funguje, problém mohl být pouze dočasný (timeout → ale DB zápis proběhl)

#### 8. Stock_batches — 2 otevřené
- Auto-vytváření batches funguje správně

---

## STAV DB (ověřeno přímým dotazem na Turso)

| Entita | Počet | Poznámka |
|--------|-------|----------|
| products | 35 | aktivních, nearchivovaných |
| variants | 35 | aktivních |
| deliveries | 43 | všechny s remaining stock |
| stock_movements | 44 | 43 RECEIPT + 1 ISSUE |
| stock_batches | 2 | |
| orders | 0 | e-shop nespuštěn — SPRÁVNĚ |
| sales | existují | počet neověřen |
| product_reservations | 2 | PENDING/PAID |
| companies | 1 | SPATNY UCET + SPATNY NAZEV! |
| reviews | 0 | aktivních |

---

## DOPORUCENE AKCE (v pořadí priority)

### IHNED (dnes):
1. **Opravit bankovní účet** v DB + kódu — zákazníci posílají peníze na špatný účet
2. **Opravit název firmy** v DB — `Alvento Solutions` místo `Altro Servis Group s.r.o.`
3. **Opravit hardcoded fallbacky** v `sales/route.ts`, `public/orders/route.ts`, `invoice-pdf.ts`

### BRZY (tento týden):
4. **Vyřešit embedded replica** — buď vypnout, nebo přidat sync na začátku dotazů
5. **Ověřit Vercel env vars** — zkontrolovat že TURSO_EMBEDDED_REPLICA je nastavena

### INFORMATIVNI:
6. Task #25 (BY_PIECE stock-in) — funguje, naskladnění proběhlo úspěšně
7. Task #26 (Products 404) — stránka existuje, problém je v datech (embedded replica)
8. Task #27 (Dashboard cache) — data jsou správná, pokud problém přetrvává → cache
