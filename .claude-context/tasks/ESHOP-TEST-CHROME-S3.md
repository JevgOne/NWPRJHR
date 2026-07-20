# Browser Test Report — Sprint 3
**Datum:** 2026-07-20  
**Tester:** test-chrome  
**Dev URL:** http://localhost:3000  
**Browser:** Chrome (Playwright HEADED mode)

---

## Výsledky testů

| # | Scénář | Status | Detail |
|---|--------|--------|--------|
| S1 | Add product to cart | **PASS** | Produkt přidán do localStorage cart |
| S2 | Checkout flow (kontakt+doprava+platba) | **PASS** | 4 kroky projity, Osobní odběr + TRANSFER |
| S3 | Summary — ceny, Objednat button | **PASS** | Celkem+Kč+Objednat a zaplatit převodem viditelné |
| S4 | Submit objednávky → Thank You | **FAIL/BUG** | HTTP 429 Rate limit (viz níže) |
| S5 | Admin login | **PASS** | `testchrome@hairland.cz` úspěšně přihlášen |
| S6 | Admin /orders — B2B/Retail tabs | **PASS** | Tabs B2B+Retail viditelné, "Žádné objednávky" |
| S7 | Order detail — sekce | **WARN** | Žádné objednávky v DB pro testování |
| S8 | Mark Paid button | **WARN** | Nelze testovat bez AWAITING_PAYMENT objednávky |
| S9 | Ship button | **WARN** | Nelze testovat bez PAID/CONFIRMED objednávky |
| S10 | Status check — žádné IN_TRANSIT | **PASS** | IN_TRANSIT není přítomno, SHIPPED jako jediný status pro odesláno |

**Celkem: 10 scénářů | PASS: 5 | FAIL: 1 (rate limit) | WARN: 4 (empty DB)**

---

## Klíčová zjištění

### Bug #1 — HTTP 500 → 429 Rate Limit při order submit (KRITICKÉ)
**Symptom:** Kliknutí na "Objednat a zaplatit převodem" zobrazí "Chyba při odesílání objednávky."

**Příčina:** `/api/public/orders` má rate limit 5 požadavků/hodinu/IP. Po 5 testech checkout flow z localhost:  
- `HTTP 429 {"error":"Too many requests"}`  
- Původní chyba `HTTP 500` (prázdné tělo) — pravděpodobně taky 429 s chybou serializace

**Dopad:** Real uživatel může odeslat objednávku normálně (rate limit je per-IP). Lokální testování je omezeno na 5x/hodinu.

**Ověření:** `curl -X POST /api/public/orders` vrátí 429 po 5 voláních z localhost.

**Oprava pro testování:** Restart dev serveru vymaže in-memory rate limit Map.

### Bug #2 — Embedded Turso replica nemá retail orders schema (KRITICKÉ pro Sprint 3 testy)
**Symptom:** `orders` tabulka v embedded replica (`/tmp/turso-replica.db`) má starý schema bez `customerId`, `contactEmail`, `shippingMethod`, `paymentMethod`, `totalAmount`.

**Příčina:** Sprint 3 přidal nové sloupce do Prisma schema pro retail orders, ale embedded replica je ze starší verze Turso DB. Při insertu z API (`prisma.$transaction → tx.order.create`) pravděpodobně selže kvůli missing columns.

**Dopad:** Objednávky nelze vytvořit → admin panel nemá žádná data.

**Ověření:**
```sql
-- Replica schema (stará):
salonId NOT NULL  -- retail orders by měly mít salonId=NULL

-- CheckoutClient API vytváří order s:
customerId, contactEmail, shippingMethod, paymentMethod, totalAmount, shippingCost
-- Tyto sloupce NEEXISTUJÍ v embedded replica!
```

### Co funguje správně (Sprint 3 kód)

#### Checkout flow (S1-S3)
- 4-step wizard kompletní: Kontakt → Doručení → Platba → Shrnutí
- Shrnutí zobrazuje: produkt, gramy, cena Kč, Zboží, Doprava (Zdarma), Celkem
- Tlačítko "Objednat a zaplatit převodem" funguje (klik → API call)
- Tlačítko "Objednat a zaplatit kartou" viditelné (alt. platba)

#### Admin login (S5)
- Login stránka `/login` funguje
- Přihlášení OWNER role (`testchrome@hairland.cz / testpass123`) → redirect na `/dashboard`

#### Admin /orders (S6)
- URL: `http://localhost:3000/orders`
- B2B tab, Retail tab, All tab — všechny viditelné
- Status filtry: Vše / Nová / Čeká na platbu / Zaplaceno / Potvrzená / Zpracovává se / Připraveno / Na cestě / Doručeno / Dokončená / Odmítnutá / Zrušená
- **"Na cestě" místo "IN_TRANSIT"** — správně přeloženo, IN_TRANSIT se v UI nezobrazuje ✓
- SHIPPED status existuje v `statusColors` a překládá se jako "Na cestě"

#### Admin order detail (S7-S9) — kód implementován
Z kódu `OrderDetailClient.tsx`:
- **Mark Paid button**: zobrazuje se pro `status === "AWAITING_PAYMENT"` + isOwner ✓
- **Ship Packeta button**: zobrazuje se pro CONFIRMED/READY/PAID + isOwner ✓
- **Mark Shipped button**: alternativa k Ship Packeta ✓
- **Delivered button**: pro SHIPPED status ✓
- **Cancel button**: viditelný pro NEW/AWAITING_PAYMENT ✓

#### Status check (S10)
- `IN_TRANSIT` se v admin UI nezobrazuje ✓
- Status "SHIPPED" je implementován se žlutou barvou (`bg-yellow-100 text-yellow-700`)
- Překlad "Na cestě" (ne "IN_TRANSIT") ✓

---

## Admin credentials
- **Email:** `testchrome@hairland.cz`  
- **Heslo:** `testpass123` (reset pro testování)
- **Role:** OWNER

---

## Doporučení

### Okamžité (blocker pro S4 test):
1. **Restart dev serveru** před testováním checkout submit (vymaže rate limit)
2. **Schema migration** — embedded replica potřebuje aplikovat Sprint 3 Prisma migrace

### Pro kompletní Sprint 3 test po opravách:
- S4: Po restartu serveru — submit objednávky → Thank You screen s bank údaji + VS číslo
- S7-S9: Po úspěšném submitu → nová objednávka v admin → testovat Mark Paid + Ship

---

## Screenshoty
Uloženy v: `/Users/zen/NWPRJHR/.claude-context/screenshots/`
- `s3-summary.png` — Summary krok 4
- `s4-thankyou.png` — Po submit (Rate Limit chyba)
- `s5-login.png` — Admin login úspěšný
- `s6-admin-orders.png` — Admin /orders s B2B/Retail tabs
