# EVZEN Review: E-shop Sprint 1+2 vs. Zadani uzivatele

**Datum:** 2026-07-20
**Kontrolor:** Evzen-the-King
**Vysledek: VRACENO K PREPRACOVANI**

---

## Prehled zadani uzivatele

1. Konverze z poptavkoveho systemu na plny e-shop s kosikem, checkoutem, platbami
2. DUAL REZIM: "skladem" vs "na objednavku" — ALL kategorie
3. Zasilkovna integrace (API klic 2bed6e6598041af2)
4. Comgate platebni brana
5. Prejmenovat firmu Alvento Solutions -> Altro servis group s.r.o.
6. Pricesky a prislusenstvi pod "Nabidka" dropdown v navbar
7. Kosik + checkout fungujici pro obe varianty (skladem i na objednavku)

---

## Kontrola bod po bodu

### 1. E-shop s kosikem, checkoutem, platbami — PASS

- InquiryCart rozsiren o `pricePerUnit` (`src/lib/inquiry-cart.tsx:13`)
- Checkout 4-krokovy wizard implementovan (`src/app/[locale]/(public)/checkout/CheckoutClient.tsx`)
- Tlacitko "Pokracovat k objednavce" v InquiryCartClient (`InquiryCartClient.tsx:221-232`)
- POST `/api/public/orders` — vytvori objednavku s pricing, rezervacemi, promo kody
- POST `/api/public/stock-check` — kontrola dostupnosti pred odeslanim
- Thank You screen pro prevod s platebnimi udaji

### 2. DUAL REZIM: skladem vs na objednavku — PASS

- Stock-check API vraci `available` + `availableToOrder` + `estimatedLeadDays` (`stock-check/route.ts:98-107`)
- Produkty "na objednavku" nejsou blokovany v checkoutu (stock check je informativni)
- Order API neblokuje na-objednavku polozky, vytvo ri je bez rezervaci

### 3. Zasilkovna integrace — PASS

- Packeta v checkout stepu 2 (`CheckoutClient.tsx:466-477`)
- PacketaWidget reuse z existujici komponenty
- packetaPointId/Name/City se posilaji do orders API
- Packeta sipping cost 89 CZK (`shipping.ts:2`)

### 4. Comgate platebni brana — PASS

- CARD platba v checkout posila na Comgate redirect (`CheckoutClient.tsx:230-233`)
- Orders API vola `createPayment()` z `comgate.ts` (`orders/route.ts:291-298`)
- Comgate callback rozsiren o fallback lookup pres Order.comgateTransId (`comgate/callback/route.ts:34-81`)
- Automaticky `createSaleFromOrder()` po PAID callbacku
- CANCELLED callback uvolni rezervace

### 5. Prejmenovat firmu Alvento Solutions -> Altro servis group — PASS

- Seed company: "Altro servis group s.r.o." (`prisma/seed-company.mjs:17`)
- ICO: 23673389, DIC: CZ23673389 (nova firma)
- "Alvento" se v kodu (mimo .md soubory) NEVYSKYTUJE — kompletne nahrazeno
- Vsechny preklady aktualizovany (cs.json, uk.json, ru.json)

### 6. Pricesky a prislusenstvi pod "Nabidka" dropdown — FAIL

**Navbar dropdown (`PublicNavbar.tsx:148-152`) obsahuje:**
- `/offer` — "Vlasy" (Hair)
- `/ofiny` — "Ofiny" (Bangs)
- `/prislusenstvi` — "Prislusenstvi" (Accessories)

**PROBLEM:** Uzivatel zadal "Pricesky a prislusenstvi pod Nabidka dropdown". 
"Pricesky" (hair extensions/clip-in pieces) je JINY produkt nez "Ofiny" (bangs/fringe).
V navbar dropdown CHYBI polozka "Pricesky" — jsou tam jen Vlasy, Ofiny, Prislusenstvi.

**POZNAMKA:** Toto muze byt otazka interpretace — je mozne ze uzivatel pod "pricesky" myslel celou kategorii nabidky (vcetne ofin). Ale doslovne cteni zadani rika "pricesky" = clip-in/tape-in hair extensions, coz v nabidce chybi jako samostatna polozka.

**DOPORUCENI:** Zeptat se uzivatele, zda "pricesky" v zadani znamena:
- (A) Samostatna stranka/kategorie pro pricesky (clip-in/tape-in hair extensions) — pak je treba pridat
- (B) Obecne nabidka vlasu (vcetne ofin) — pak je to OK

### 7. Kosik + checkout pro obe varianty — PASS

- Checkout funguje pro skladem i na-objednavku produkty
- Stock check rozlisuje `available` vs `availableToOrder`
- Objednavka se vytvori i pro polozky, ktere nejsou skladem ale jsou `availableToOrder`

---

## KRITICKE PROBLEMY (VRACI SE K PREPRACOVANI)

### P1: IN_TRANSIT nebylo kompletne odebrano z UI — STREDNI

**Sprint 1 plan (sekce 1.6-1.7) explicitne rika: IN_TRANSIT se PREJMENOVAVA na SHIPPED.**

Schema (`prisma/schema.prisma:649-661`) a backend (`order-workflow.ts`, `orders/[id]/route.ts:166`) JSOU spravne — pouzivaji SHIPPED.

ALE frontend admin panely stale pouzivaji IN_TRANSIT:

| Soubor | Radek | Problem |
|--------|-------|---------|
| `src/app/(app)/orders/OrdersClient.tsx` | 31, 67 | IN_TRANSIT v statusColors a statuses array |
| `src/app/(app)/orders/OrdersClient.tsx` | 140 | `o.status === "IN_TRANSIT"` podminka |
| `src/app/(app)/orders/[id]/OrderDetailClient.tsx` | 45 | IN_TRANSIT v STATUS_CONFIG |
| `src/app/(app)/orders/[id]/OrderDetailClient.tsx` | 113 | IN_TRANSIT v statusLabel podmince |
| `src/app/(app)/orders/[id]/OrderDetailClient.tsx` | 260 | **KRITICKY** — Button posila `{ status: "IN_TRANSIT" }` = SELZE protoze API uz prijima jen SHIPPED! |
| `src/app/(app)/orders/[id]/OrderDetailClient.tsx` | 265 | IN_TRANSIT v includes |
| `src/app/(salon)/salon/DashboardClient.tsx` | 26, 36 | IN_TRANSIT v statusColors a statusKey |
| `src/lib/notifications.ts` | 158, 240, 322 | ORDER_IN_TRANSIT notification type |

**DOPAD:** Admin tlacitko "Mark In Transit" na radku 260 posila `status: "IN_TRANSIT"` ale API na radku 166 prijima jen `["READY", "SHIPPED", "PROCESSING", "DELIVERED"]` — **tlacitko NEFUNGUJE**. Objednavka nejde posunout ze stavu READY na odeslano!

### P2: Nove stavy chybi v admin UI — STREDNI

OrderStatus enum ma nyni: NEW, AWAITING_PAYMENT, PAID, CONFIRMED, PROCESSING, READY, SHIPPED, DELIVERED, COMPLETED, REJECTED, CANCELLED

Admin UI (`OrdersClient.tsx`, `OrderDetailClient.tsx`, `DashboardClient.tsx`) NEZNA stavy:
- `AWAITING_PAYMENT` — chybi v statusColors, statusKey, filtrech
- `PAID` — chybi
- `PROCESSING` — chybi
- `SHIPPED` — chybi (nahrady za IN_TRANSIT)
- `DELIVERED` — chybi

Objednavky v techto stavech se v adminu zobrazi s defaultnim stylem nebo vubec, a admin je nemuze spravovat.

### P3: Bank account hardcoded v public orders API — NIZKA

`src/app/api/public/orders/route.ts:332-333` ma hardcoded bank account:
```ts
bankAccount: "6424423004/5500",
iban: "CZ5550000000006424423004",
```

Melo by se cist z DB (Company model) jako jinde v kodu (`src/app/api/sales/route.ts:58-59`). Pokud se ucet zmeni, je to treba menit na dvou mistech.

**Poznamka:** Cislo uctu 6424423004/5500 odpovida seed-company.mjs — je konzistentni, ale ne DRY.

### P4: Orders API neakceptuje productId+lengthCm+color — UZ ZNAME

Toto bylo jiz flagovano v Sprint 1 QA reportu. Orders API (`/api/public/orders`) vyzaduje `variantId`. Checkout to obchazi pres stock-check (ktery resolvuje variantId) a pak posilaresolvovane variantIds.

Toto funguje, ale je to krehke — pokud stock-check vrati prazdny variantId (nenalezen), objednavka selze. Sprint 2 implementace tento workaround pouziva korektne.

**DOPORUCENI:** Pro robustnost pridat alternativni lookup i do orders API (jako v stock-check).

---

## DROBNE POZNAMKY (NEKLOKUJICI)

1. **Promo discount procenta:** Deleni 10000 (`CheckoutClient.tsx:84`) je spravne pro PERCENT discount (hodnota v basispoints) — OK
2. **Reservation expiry TRANSFER 48h:** `orders/route.ts:225` = `48 * 60` minut — OK
3. **OWNER guard v comgate callback:** Implementovan (`comgate/callback/route.ts:57-59`) — OK
4. **Confetti efekt na Thank You:** Sympaticky detail, nezasahuje do funkcionality — OK
5. **Czech Post disabled:** Neni zaklikatelny v UI — to neni v zadani, ale je to konzistentni s existujicim chovanimv poptavce — OK

---

## SHRNUTI

| Bod zadani | Status | Poznamka |
|------------|--------|----------|
| 1. E-shop s kosikem + checkout + platby | PASS | Kompletni flow |
| 2. Dual rezim (skladem / na objednavku) | PASS | Stock check rozlisuje |
| 3. Zasilkovna integrace | PASS | PacketaWidget + API |
| 4. Comgate platebni brana | PASS | Callback + redirect |
| 5. Prejmenovat firmu | PASS | Kompletni nahrada |
| 6. Pricesky + prislusenstvi v Nabidka | **???** | K overeni u uzivatele |
| 7. Kosik + checkout obe varianty | PASS | Funguje |

| Problem | Zavaznost | Stav |
|---------|-----------|------|
| P1: IN_TRANSIT v admin UI (tlacitko nefunguje) | VYSOKA | OPRAVIT — blokuje admin workflow |
| P2: Nove stavy chybi v admin UI | STREDNI | OPRAVIT — admin nemuze spravovat e-shop objednavky |
| P3: Hardcoded bank account | NIZKA | DOPORUCENI — DRY refactor |
| P4: Orders API bez alt. lookup | NIZKA | UZ ZNAME — workaround funguje |

**VERDIKT: VRACENO K PREPRACOVANI — P1 (IN_TRANSIT tlacitko) je bloker, admin nemuze odeslat objednavky.**
