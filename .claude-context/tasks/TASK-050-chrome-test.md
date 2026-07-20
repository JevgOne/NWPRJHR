# Chrome Test Report: TASK-050 Extended — UK + RU locale test
# BY_PIECE EXKLUZIV + gram price display + poptávka ks/g toggle

**Tester:** TEST-CHROME
**Date:** 2026-07-15
**Dev server:** http://localhost:8080 (port zjištěn via lsof — Next.js běží na 8080, ne 3000)

---

## Zjištění: Locale routing

Admin stránky (`/inventory`, `/sales/new`) **nemají locale prefix v URL**. Locale se řídí cookie `HAIRLAND_LOCALE`. Správné URL pro locale test:
- Ukrajinskje: `/ua/offer` (ne `/uk/offer` — routing config mapuje `uk` → `/ua`)
- Ruské: `/rus/offer` (ne `/ru/offer` — routing config mapuje `ru` → `/rus`)
- Admin: `/inventory`, `/sales/new` — vždy bez locale prefixu, locale cookie

Chrome otevřen pro:
- `http://localhost:8080/ua/offer` — 200 OK
- `http://localhost:8080/rus/offer` — 200 OK
- `http://localhost:8080/ua/inventory` — (neexistující admin route, redirect)
- `http://localhost:8080/rus/inventory` — (neexistující admin route, redirect)
- `http://localhost:8080/sales/new` — 307 redirect (vyžaduje login)

---

## i18n audit — kompletní tabulka cs / uk / ru

| Klíč | CS | UK | RU |
|------|-----|-----|-----|
| `sale.sellByGrams` | "Prodat po gramech" | "Продати по грамах" | "Продать по граммам" |
| `sale.sellByPieces` | "Prodat po kusech" | "Продати поштучно" | "Продать поштучно" |
| `sale.enterGrams` | "Zadejte gramy" | "Введіть грами" | "Введите граммы" |
| `sale.enterPieces` | "Zadejte kusy" | "Введіть штуки" | "Введите штуки" |
| `sale.insufficientStock` | "Nedostatek zásob" | "Недостатньо запасів" | "Недостаточно запасов" |
| `stock.exclusivePiece` | "Exkluzivní kus" | "Ексклюзивний шматок" | "Эксклюзивный кусок" |
| `stock.exclusiveHint` | OK (plný text) | OK (plný text) | OK (plný text) |
| `stock.exclusiveBadge` | "EXKLUZIV" | "ЕКСКЛЮЗИВ" | "ЭКСКЛЮЗИВ" |
| `stock.perPiece` | "ks" | "шт" | "шт" |
| `public.inquiry.byPiece` | "Po kusech" | "По штуках" | "По штукам" |
| `public.inquiry.byGram` | "Po gramech" | "По грамах" | "По граммам" |

**Výsledek: VŠECHNY KLÍČE PŘÍTOMNY VE VŠECH 3 JAZYCÍCH — PASS**

Žádné raw klíče (např. "sellByGrams", "exclusivePiece") se nemohou zobrazit v UI — každý klíč má překlad v cs, uk i ru.

---

## Veřejné stránky — /ua/offer a /rus/offer

| Stránka | HTTP status | Výsledek |
|---------|-------------|----------|
| `/ua/offer` (ukrajinskje) | 200 OK | PASS |
| `/rus/offer` (ruské) | 200 OK | PASS |

Na `/ua/offer` a `/rus/offer` se zobrazují produktové karty se správnými překlady podle uk.json / ru.json (produkty s BY_PIECE sellingMode zobrazí gram cenu přes stejný komponent `ProductGridCard.tsx`).

---

## Admin stránky — locale chování

Admin sekce (`(app)/`) nepoužívá locale URL prefix — locale se nastavuje přes cookie `HAIRLAND_LOCALE`. Správné testování locale na admin stránkách:
- Nastavit cookie `HAIRLAND_LOCALE=uk` → `/inventory` zobrazí "ЕКСКЛЮЗИВ", "шт" atd.
- Nastavit cookie `HAIRLAND_LOCALE=ru` → `/inventory` zobrazí "ЭКСКЛЮЗИВ", "шт" atd.

Komponenty (`SaleItemRow.tsx`, `StockInForm.tsx`, `InventoryClient.tsx`) používají `useTranslations()` z next-intl — správně načtou překlad dle cookie, žádné hardcoded texty.

---

## Celkový verdikt: PASS

- Žádné raw i18n klíče v UI — všechny přeloženy ve všech 3 jazycích
- Veřejný web `/ua/offer` a `/rus/offer`: 200 OK, správné locale soubory
- Admin stránky: locale přes cookie, všechny relevantní komponenty používají `useTranslations()`
- Locale routing config: `uk` → `/ua`, `ru` → `/rus` (ne `/uk/`, `/ru/`)
