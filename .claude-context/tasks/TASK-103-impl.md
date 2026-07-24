# TASK-103: Smazání testovacích zákazníků z DB — Implementace

**Stav:** SKRIPT HOTOV, CEKA NA SPUSTENI NA PRODUKCI
**Datum:** 2026-07-23
**TypeScript:** 0 chyb

---

## Vytvoreny soubor

### `scripts/delete-test-customers.ts`

Jednorazovy Prisma skript pro smazani testovacich zakazniku.

**Co dela:**
1. Najde zakazniky obsahujici "ApiTest", "Zkouška" nebo "Zkouska" v jmene
2. Vypise nalezene zakazniky s emailem a ID
3. Pro kazdeho overi pocet navazanych zaznamu (sales, invoices, orders, inquiries, reservations, referrals)
4. Odpoji vsechny FK relace (SET NULL na 6 tabulkach paralelne)
5. Smaze customera
6. Loguje kazdy krok

**Testovano na dev DB:**
- Skript se spustil uspesne
- Zadni testovaci zakaznici v dev DB → "No test customers found. Already deleted?"
- Zadne errory

**Jak spustit na produkci:**
```bash
TURSO_DATABASE_URL="libsql://hairora-eu-jevgone.aws-eu-west-1.turso.io" \
TURSO_AUTH_TOKEN="<token>" \
npx tsx scripts/delete-test-customers.ts
```

## Zadne dalsi soubory zmeneny
- Zadna DB migrace
- Zadne zmeny v API nebo UI
- Skript je jednorazovy, po spusteni muze zustat v `scripts/` pro referenci
