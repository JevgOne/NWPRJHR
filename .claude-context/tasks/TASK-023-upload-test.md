# QA Report — Task #23: Upload fotek (produkce)
Date: 2026-07-14
Tester: TEST-CHROME
Status: PARTIAL — auth check OK, end-to-end vyzaduje admin session

---

## Test 1: /api/upload/photos bez auth
```
curl -X POST https://www.hairland.cz/api/upload/photos -F "files=@/tmp/test.jpg"
→ HTTP 401: {"error":"Unauthorized"}
```
PASS — endpoint spravne odmita neautentizovane requesty.

## Test 2: /api/products/{id}/media bez auth
```
curl -X POST https://www.hairland.cz/api/products/cmrlpxx19000004kyqcjqa634/media -F "files=@/tmp/test.jpg"
→ HTTP 401: {"error":"Unauthorized"}
```
PASS — auth check je prvni (pred validaci souboru). Spravne.

## Test 3: Spatny Content-Type
```
curl -X POST /api/upload/photos --data "test" -H "Content-Type: application/json"
→ HTTP 401: {"error":"Unauthorized"}
```
PASS — auth check je konzistentni bez ohledu na payload.

---

## Zaver API testu
- Auth ochrana funguje spravne na obou endpointech
- Endpoint existuje a odpovida (neni 404)
- End-to-end upload (s platnou session) nelze overit bez admin credentials

## Chrome
- Otevren: https://www.hairland.cz/products
- Strana vyzaduje prihlaseni → redirect na login

---

## Co vyzaduje manualni overeni (uzivatel)
1. Prihlasit se na https://www.hairland.cz/products
2. Vybrat produkt → Upravit
3. Sekce "Fotky produktu" → nahrát JPG/PNG
4. Overit ze se fotka zobrazi v galerii bez chyby
5. Overit ze QR ikona je viditelna u variant v /inventory

---

## Doporuceni
Pro budouci automatizovane testy: nastavit SESSION cookie do env pro curl testy.
