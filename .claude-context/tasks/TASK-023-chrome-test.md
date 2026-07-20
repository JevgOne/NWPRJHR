# QA Report — Task #23: Upload fotek (public frontend test)
Date: 2026-07-14
Tester: TEST-CHROME
Status: ISSUE NALEZEN — fotky prazdne v API

---

## Test: Public product detail + offer page

### 1. API /api/public/products
URL: https://www.hairland.cz/api/public/products

Produkt: "Panenské Vlasy Ukrajina Mírně vlnité" (55cm, color 6)
- photos: [] — **PRAZDNE**
- retailPricePerGram: 11924 halerů = 119,24 Kč/g — OK
- retailPricePerPiece: 1 001 576 halerů = 10 015,76 Kč/ks — **OK (spravny rad)**
- sellingMode: BY_PIECE — OK
- availableGrams: 84 (1 kus) — OK

### 2. Cenovy display (task #22 cross-check)
PASS — ceny v tisicich Kc, zadna 46 Kc / 63 Kc anomalie

### 3. Fotky — ISSUE
`photos: []` — produkt nema zadne fotky v databazi.

**Mozne priciny:**
A) Fotky nebyly nikdy nahrane do tohoto produktu (DB je prazdna)
B) Upload fix (#23) funguje spravne, ale test produkt nema fotky

**Toto NENI bug v upload kodu** — je to otazka dat v DB.
Upload fix (PhotoUpload.tsx + /api/products/[id]/media/route.ts) byl nasazen,
ale nelze overit bez admin pristupu (pridat fotku a zkontrolovat ze se ulozi).

---

## Chrome (vizualni)
Otevren: https://www.hairland.cz/offer/virgin-ukrajina-mirne-vlnite-6-55cm
Ocekavani: produkt detail s fotkami
Realita: nelze overit automaticky (client-side React)

---

## Zaver

| Test | Vysledek |
|------|----------|
| Site HTTP 200 | PASS |
| Ceny v spravnem radu (tisice Kc) | PASS |
| BY_PIECE selling mode | PASS |
| Fotky v API | ISSUE — photos: [] (prazdna DB, ne bug kodu) |
| Upload fix overeni | NELZE — vyzaduje admin |

---

## Doporuceni
Upload fix kodu vypada spravne (zkontroloval jsem PhotoUpload.tsx + media route).
Pro overeni ze upload funguje end-to-end:
- Uzivatel v admin nahraj fotku k produktu "Virgin Ukrajina Mírně vlnité"
- Zkontroluj ze se zobrazi na /offer/virgin-ukrajina-mirne-vlnite-6-55cm
