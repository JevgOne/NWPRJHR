# QA Plan — Admin Product Detail Page
Date: 2026-07-14
Tester: TEST-CHROME
Status: READY (waiting for deploy)

## Target
URL: https://www.hairland.cz/admin — product detail page for a BY_PIECE product

---

## Scenario 1: Cenový display (task #22)
**Bug:** Zobrazovalo se 46 Kč nákupní cena místo správných tisíců.

**Kroky:**
1. Otevrit Chrome → přihlásit se do admin
2. Najít BY_PIECE produkt (např. culíky/hotové produkty)
3. Otevřít detail produktu
4. Zkontrolovat sekci cen — nákupní cena musí být reálná hodnota (stovky/tisíce Kč), NE placeholder (46 Kč)
5. Zkontrolovat prodejní cenu = 2× nákupní (marže 100%)
6. Zkontrolovat B2B cenu = prodejní × 0.70–0.85

**Kritéria úspěchu:**
- Nákupní cena zobrazuje reálná data z DB (ne placeholder/default)
- Žádné "46 Kč" ani jiné nesmyslné číslo
- Prodejní a B2B ceny odpovídají logice marží

---

## Scenario 2: Upload fotek (task #23)
**Bug:** Fotky se nepřidávají — upload nefunguje.

**Kroky:**
1. Otevřít detail produktu v admin
2. Přejít do sekce fotek/galerie
3. Kliknout na "Přidat fotku" / upload button
4. Vybrat testovací obrázek (JPG nebo PNG, ~500KB)
5. Potvrdit upload
6. Počkat na výsledek (max 30 sekund)
7. Zkontrolovat že fotka se zobrazí v galerii produktu

**Kritéria úspěchu:**
- Upload dialog/button reaguje na klik
- Po výběru souboru proběhne upload bez chyby
- Fotka se zobrazí v galerii okamžitě po uploadu
- Žádná chybová hláška v UI

---

## Scenario 3: Toggle "Na objednávku" (task #26)
**Bug:** Toggle na variantě nereaguje na klik.

**Kroky:**
1. Otevřít detail produktu s variantami
2. Najít variantu a její toggle "Na objednávku"
3. Kliknout na toggle — očekávám vizuální změnu (on/off)
4. Refreshnout stránku
5. Zkontrolovat že stav přetrval (toggle zůstal v novém stavu)

**Kritéria úspěchu:**
- Toggle vizuálně přepne stav okamžitě po kliknutí
- Po refreshi stav přetrvá (uloženo do DB)
- Žádná JS chyba v konzoli

---

## Scenario 4: QR kód po naskladnění (task #25)
**Bug:** QR kód se nezobrazuje/nejde stáhnout po naskladnění.

**Kroky:**
1. Najít naskladněný BY_PIECE produkt (nebo provést testovací naskladnění)
2. Otevřít detail produktu/varianty po naskladnění
3. Zkontrolovat že QR kód je viditelný na stránce
4. Kliknout na "Stáhnout QR" / download button
5. Ověřit že se QR soubor stáhl (PNG/SVG)
6. Otevřít stažený QR a zkontrolovat že je čitelný

**Kritéria úspěchu:**
- QR kód se zobrazí po naskladnění bez nutnosti refreshe
- Download button funguje a stáhne soubor
- QR kód v souboru je správně čitelný (naskenovat telefonem)

---

## Poznámky
- Testovat ve viditelném Chrome (ne headless)
- Před testem: přihlásit se do admin s admin účtem
- Zachytit screenshots při selhání
- Při chybě v JS konzoli zapsat přesný error text do reportu
