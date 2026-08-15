# TASK QUEUE — Hairland

**Aktualizováno:** 2026-08-15
**Firma:** Altro servis group s.r.o., IČO 23673389
**Účet:** 6424423004/5500, IBAN CZ5555000000006424423004 — NEMĚNIT!

---

## P0 — KRITICKÉ (blokuje provoz)

### TASK-107: Naskladnění BY_PIECE visí na "Načítání..."
Stav: čeká
Uživatel: "ZASE SE TO NENASKLADNUJE!!!" + screenshot stuck na "Načítání..."
- LUXE exkluzivní culík se neuložil do DB (request timeoutoval)
- Deliveries POST: `src/app/api/deliveries/route.ts`
- BY_PIECE logika řádky 100-103
- Replica vrácena (`TURSO_EMBEDDED_REPLICA=true` na Vercelu)
- Prošetřit proč POST /api/deliveries timeoutuje (Vercel function limit? pomalá transakce?)

---

### TASK-096: Marže 221% místo 100%
Stav: čeká na debug
Uživatel: "upravil jsem cenu nákupní na 3300 u S-RV-10-55 a marže je stale 221% má bejt 100%"
- Variant PUT: `src/app/api/variants/[id]/route.ts`
- Pricing: `src/lib/pricing.ts`
- Price settings: `src/app/api/price-settings/route.ts`

---

## P1 — DŮLEŽITÉ (opravit co nejdřív)

### TASK-102: Kalendář — mobilní optimalizace + WOW design
Stav: čeká
Uživatel: "kalendář jsi nedořešil furt je to obyčejny, neni optimalizace pro telefon"
- Responzivní design, swipe gesta, mobilní view, WOW vizuální styl

---

### TASK-103: Smazání testovacích zákazníků z DB
Stav: čeká
- "Test ApiTest" musí pryč z produkční DB
- Ověřit "Jitka Zkouška" (příjmení = test?)

---

## P2 — STŘEDNÍ PRIORITA

### TASK-071: Performance — pomalé načítání admin panelu
Stav: čeká

---

### TASK-112: Zásilkovna widget — nefunguje výběr pobočky
Stav: čeká
- Widget se neotevírá při výběru Zásilkovny v checkoutu
- `src/app/[locale]/(public)/checkout/CheckoutClient.tsx`
- Packeta widget: `public/` script v layout, `PacketaWidget.tsx`

---

### TASK-113: Registrace zákazníků na e-shopu
Stav: BACKLOG — větší feature
- Checkout: volba "Vytvořit účet" vs "Nákup bez registrace"
- Customer model má `passwordHash` — základ připraven
- Přihlášení zákazníka, předvyplnění formuláře, "Moje objednávky"
- Email s potvrzením registrace (NE s heslem)
- Zapomenuté heslo flow

---

## BACKLOG

### TASK-104: Rezervace 50% záloha + Comgate
Stav: plán hotový v `.claude-context/tasks/TASK-104-reservation-deposit-plan.md`

---

### TASK-105: Telegram bot pro Hairland
Stav: analýza hotová, uživatel chce udělat jako POSLEDNÍ (~prosinec 2026)

---

## HOTOVÉ
- TASK-097: Oddělené číslování faktur — prefix H/F (commit 04b5490) — 2026-08-15
- TASK-098: Výběr zákazníků — redesign pro mobil (commit 04b5490) — 2026-08-15
- TASK-100: Blog — nahrávání obrázků fix (commit 95920df) — 2026-08-15
- TASK-114: Prodej — multi QR do jedné faktury (commit a296a6e) — 2026-08-15
- TASK-027: Dashboard cache — phantom data fix (force-dynamic) — 2026-08-15
- TASK-080: Emoji v poptávkách fix (commit 9d312db) — 2026-08-15
- TASK-101: Blog — SEO meta popisky (commit 582983b) — 2026-08-15
- TASK-106: Mazání variant — cascade delete fix — 2026-08-09
- TASK-108: Comgate karetní platby — merchant 515911 setup — 2026-08-09
- TASK-099: Notifikační zvoneček — navigace + storno cleanup — 2026-08-09
- TASK-109: Terminologie "poptávka" → "objednávka" — SEO overhaul — 2026-08-09
- TASK-079: Prodejní karta — info o produktu doplněno — 2026-08-09
- TASK-111: Privacy stránka — identifikace firmy (commit 893a06e) — 2026-08-09
- TASK-087: Fix fotek na product detail (commit e6f9b55) — 2026-07-19
- TASK-088: Kategorie → update jmen/slug/cen (commit e6f9b55) — 2026-07-19
- TASK-089: Premium design produktové stránky (commit cb8a9da) — 2026-07-19
- TASK-090: Oprava kalkulace prodejní ceny + reset override UI (commit 3ca87be) — 2026-07-19
- TASK-091: Top info bar s kontakty a trust badges (commit 3ca87be) — 2026-07-19
- TASK-092: SEO audit hairland.cz vs goldhair.cz — kompletní report — 2026-07-19
- TASK-093: SEO kódové fixy (ItemList, mpn, sitemap, HowTo) — 2026-07-19
- TASK-094: SEO bugy produktu (availability, og:type, reviews, meta title) (commit 5019ea5) — 2026-07-19
- TASK-095: Rozšíření FAQ na produktových stránkách (commit 5019ea5) — 2026-07-19
- Košík → checkout redirect (commit 639b03e) — 2026-07-21
