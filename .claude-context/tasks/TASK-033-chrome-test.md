# CHROME TEST REPORT — Full Site Walkthrough

**Tester:** TEST-CHROME  
**Datum:** 2026-06-27  
**Web:** https://www.hairland.cz  

---

## VEŘEJNÉ STRÁNKY

| URL | HTTP | Obsah OK |
|---|---|---|
| / | 200 | PASS — "Prémiové vlasy" 4x, "Clip-in" 9x, žádné broken img |
| /offer | 200 | PASS — produkty se načítají (client-side) |
| /offer/[id] | 200 | PASS — fotky, barvy, "Přidat do poptávky", ceny |
| /poradna | 200 | PASS — české texty badges |
| /poradna/[slug] | 200 | PASS — 5 článků otestováno |
| /kadernice | 200 | PASS — "Test Kadeřnice" 2x |
| /kadernice/test-kade-nice | 200 | PASS — veřejný profil |
| /pro | 200 | PASS |
| /contact | 200 | PASS — telefon 728 729 666 2x, email 4x |
| /about | 200 | PASS — Hairland 4x, žádné Lorem ipsum |
| /vykup | 200 | PASS — "Kč" správně (ne "Kc") |
| /registrace | 200 | PASS |
| /obchodni-podminky | 200 | PASS |
| /privacy | 200 | PASS |
| /login | 200 | PASS |

Chrome otevřen na všech stránkách.

---

## SALON PORTÁL (po přihlášení)

Login: test-chrome@test.cz / testpass123 (role: HAIRDRESSER)

| URL | HTTP | Obsah |
|---|---|---|
| /salon | 200 | PASS — dashboard s tier/body/slevou |
| /salon/catalog | 200 | PASS — 8 produktů, zásoby viditelné |
| /salon/orders | 200 | 0 objednávek (prázdný stav) |
| /salon/invoices | 200 | 0 faktur (prázdný stav) |
| /salon/samples | 200 | 0 vzorků (prázdný stav) |
| /salon/profile | 200 | PASS — profil kadeřnice editovatelný |

---

## 404 HANDLING

- /nonexistent-page → 404 ✓
- /offer/nonexistent-id → 404 ✓  
- /kadernice/nonexistent → 404 ✓
- /poradna/nonexistent → 404 ✓

Chrome otevřen: /nonexistent-page

---

## BRAND BARVY

Grep přes celý src/: žádné `text-blue-*`, `bg-blue-*`, `text-indigo-*`, `bg-indigo-*` v public ani admin komponentách.

**PASS** — brand barvy v pořádku.

---

## I18N RAW KEYS

- Poradna badges: české texty, žádné raw klíče ✓
- "s.r.o" falešný pozitivní (firemní forma) ✓
- Žádné `loginButton`, `nav.home` apod. viditelné ✓

**PASS** — překlady fungují.

---

## NALEZENÉ PROBLÉMY

### BUG #1 — KRITICKÝ: Veřejný eshop nezobrazuje zásoby
**URL:** https://www.hairland.cz/offer

API `/api/public/products` **neobsahuje `availableGrams`** v Prisma selectu.
Všech 8 produktů vrací `availableGrams: 0` pro všechny varianty.

Admin vidí zásoby (15 variant s >0g), zákazník nevidí nic.

**Dopad:** ProductsShowcase nemůže zobrazit "skladem" badge / filtrovat dostupné produkty.

Soubor: `/Users/zen/hairora/src/app/api/public/products/route.ts`
Chybí v `select` pro `variants`:
```
availableGrams: true  // CHYBÍ
```
(musí se dopočítat z deliveries — není přímé pole, ale agregace)

---

### BUG #2 — STŘEDNÍ: Salon katalog nezobrazuje ceny
**URL:** https://www.hairland.cz/salon/catalog

API `/api/salon-portal/catalog` vrací `availableGrams` (stock OK), ale `retailPricePerGram = 0` pro všechny varianty.

Salon/kadeřnice vidí zásoby ale ne ceny produktů.

Příklad:
```
Panenské vlasy 40cm: avail=300g price=0
```

Admin API `/api/stock` vrací správné ceny (30 Kč/g, 60 Kč/g atd.) — problém je v salon-portal/catalog route.

Soubor: `/Users/zen/hairora/src/app/api/salon-portal/catalog/route.ts`

---

### BUG #3 — MINOR: Všechny produkty nemají description
**URL:** https://www.hairland.cz/offer/[id]

Všech 8 produktů v DB má `description: null`.
Na detail stránce tedy chybí popis produktu — uživatel vidí prázdný prostor.

**Řešení:** Vyplnit popisy produktů v admin panelu (/products/[id]).

---

### INFO: Salon/hairdresser 0 objednávek/faktur/vzorků
Test-chrome@test.cz je nová testovací kadeřnice — prázdný stav je normální.
Salon portal prázdné stavy jsou zobrazeny správně (ne crash/error).

---

## CELKOVÝ VERDICT

**13/15 PASS, 2 BUGS, 1 MINOR**

Kritické:
- BUG #1: Veřejný eshop — stock neviditelný pro zákazníky
- BUG #2: Salon katalog — ceny 0 pro kadeřnice/salony

Tyto dva bugy ovlivňují B2B objednávání a e-shop UX.
