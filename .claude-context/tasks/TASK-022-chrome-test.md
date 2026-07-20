# QA Report — Task #22: Cenový display v admin (BY_PIECE)
Date: 2026-07-14
Tester: TEST-CHROME
Status: BLOCKER — chybi admin credentials

---

## Stav deploye
- hairland.cz vraci HTTP 200 — **deploy OK**, site je live

## BLOCKER: Chybi admin credentials

Admin panel vyzaduje autentizaci (NextAuth session).
V projektu jsou credentials pouze pro HAIRDRESSER roli:
- test-chrome@test.cz / testpass123

Tato role nema pristup do /admin/* (pouze /salon/*).
Admin credentials nejsou ulozeny v .env.example ani v .claude-context/.

## Co bylo overeno (bez admin pristupu)

### Verejny frontend
- Produkt "Virgin Ukrajina Mírně vlnité 55cm" → **10 016 Kč/ks** (spravny rad tisicu)
- Zadna viditelna 46 Kc / 63 Kc na verejnem webu

### Vedlejsi nalez: PhotoUpload.tsx aktualizovan (task #23 fix)
Soubor `/Users/zen/NWPRJHR/src/components/products/PhotoUpload.tsx` byl modifikovan —
upload nyni pouziva `/api/products/${productId}/media` (single round-trip, spravnejsi).

## Co NEBYLO mozne overit (vyzaduje admin)
- Nakupni cena BY_PIECE produktu (culiky) v admin detailu
- Zobrazeni marze (prodejni - nakupni)
- Absence hardcoded 46 Kc / 63 Kc v legendach sekce cen

---

## Potrebna akce

**Poskytnout admin credentials** nebo uzivatel sam zkontroluje:
1. https://www.hairland.cz/admin → prihlasit se
2. Products → vybrat BY_PIECE produkt (culiky)
3. Sekce cen:
   - [ ] Nakupni cena = tisice Kc (ne 46 / 63 Kc)
   - [ ] Prodejni cena = 2x nakupni
   - [ ] Marze = prodejni - nakupni (kladna, v tisicich)
   - [ ] Zadne hardcoded placeholder ceny v legendach

---

## Doporuceni pro budoucnost
Ulozit admin test credentials do `.env.local`:
ADMIN_TEST_EMAIL=...
ADMIN_TEST_PASSWORD=...
