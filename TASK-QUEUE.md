# TASK QUEUE — Hairland

**Aktualizováno:** 2026-07-21
**Firma:** Altro servis group s.r.o., IČO 23673389
**Účet:** 6424423004/5500, IBAN CZ5555000000006424423004 — NEMĚNIT!

---

## P0 — KRITICKÉ (blokuje provoz)

### TASK-106: Mazání variant — "Unknown error"
Stav: čeká
Uživatel: screenshot "Smazání se nezdařilo: Unknown error" v Skladu
- Purge endpoint: `src/app/api/variants/[id]/purge/route.ts`
- Cascade delete v transakci: stockMovement → reservation → productReservation → stockSubscription → saleItem → orderItem → delivery (returns+complaints) → variant → product
- Možné příčiny: FK constraint, chybějící tabulka, transaction timeout
- Endpoint vrací generic "Unknown error" z catch bloku — přidat lepší error logging

---

### TASK-107: Naskladnění BY_PIECE visí na "Načítání..."
Stav: čeká
Uživatel: "ZASE SE TO NENASKLADNUJE!!!" + screenshot stuck na "Načítání..."
- LUXE exkluzivní culík se neuložil do DB (request timeoutoval)
- Deliveries POST: `src/app/api/deliveries/route.ts`
- BY_PIECE logika řádky 100-103
- Replica vrácena (`TURSO_EMBEDDED_REPLICA=true` na Vercelu)
- Prošetřit proč POST /api/deliveries timeoutuje (Vercel function limit? pomalá transakce?)

---

### TASK-108: Comgate karetní platby
Stav: HOTOVO
- Merchant 515911, heslo opraveno, test=true, "Povolit všechny IP" zapnuto
- `.trim()` na env vars (fix %0A), CARD email až po zaplacení
- Zbývá: nastavit callback URLs v portálu, otestovat platbu

---

### TASK-096: Marže 221% místo 100%
Stav: čeká na debug
Uživatel: "upravil jsem cenu nákupní na 3300 u S-RV-10-55 a marže je stale 221% má bejt 100%"
- Variant PUT: `src/app/api/variants/[id]/route.ts`
- Pricing: `src/lib/pricing.ts`
- Price settings: `src/app/api/price-settings/route.ts`

---

## P1 — DŮLEŽITÉ (opravit co nejdřív)

### TASK-097: Oddělené číslování faktur (karta vs hotovost)
Stav: IMPLEMENTOVÁNO, ČEKÁ DEPLOY
- Schema: InvoiceCounter má `prefix` field + `@@unique([year, prefix])`
- `invoice-number.ts`: prefix "H" = hotovost, "F" = faktura/karta
- Formát: H2026-0001 (hotovost), F2026-0001 (karta/převod)
- POTŘEBA: `npx prisma db push` nebo migration na produkci

---

### TASK-098: Výběr zákazníků — redesign pro mobil
Stav: IMPLEMENTOVÁNO, ČEKÁ DEPLOY
- CustomerSelect.tsx: redesign — avatary, hledání, checkmark, kompaktní layout
- ZBÝVÁ: smazat testovací zákazníky z DB (viz TASK-103)

---

### TASK-099: Notifikační zvoneček — kliknutí nefunguje + stornované položky
Stav: ROZPRACOVÁNO
- HOTOVO: `getNotificationUrl` opraveno — fallback na section URL
- ZBÝVÁ: při stornu objednávky/rezervace smazat/označit související notifikace
- ZBÝVÁ: ověřit navigaci na všech typech notifikací

---

### TASK-100: Blog — nahrávání obrázků nefunguje
Stav: čeká
Uživatel: "proč zase nejde nahrat obrazek do blogu?"
- Blog editor: `src/app/(app)/posts/[id]/BlogEditorClient.tsx` (handleCoverUpload)
- Upload API: `src/app/api/upload/photos/route.ts` — @vercel/blob + sharp watermark
- Watermark: `src/lib/watermark.ts` — může selhat na Vercelu (sharp)
- Ověřit: BLOB token, error handling, sharp kompatibilita

---

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

### TASK-109: Terminologie "poptávka" → "objednávka"
Stav: čeká
- `messages/cs.json:67-68` — inquiryCartTitle/Description
- `messages/cs.json:1020-1021` — successTitle/Text
- `messages/cs.json:1032` — submitButton
- `messages/cs.json:1075` — orSendInquiry
- Stejné v uk.json a ru.json
- `notifications.ts`, `email-templates.ts`, `telegram.ts` — "Nová poptávka"
- /inquiry-cart zůstává pro konzultace (mode=consult) — záměr

---

### TASK-079: Prodejní karta — chybí info o produktu
Stav: čeká
Uživatel: "nejsou tam puvod vlasu, atd všechny informace + není tam videt kolik je skladem G."
- `src/components/sales/SaleItemRow.tsx`

---

### TASK-027: Dashboard cache — phantom data
Stav: čeká
- Dashboard ukazuje neexistující pohyby
- `src/app/(app)/dashboard/page.tsx:111-119` — recentMovements query
- Cached s `revalidate: 60, tags: ["dashboard"]`

---

## P2 — STŘEDNÍ PRIORITA

### TASK-101: Blog — SEO meta popisky slabé
Stav: čeká
- Blog detail/listing generateMetadata
- Auto-generace SEO popisků chybí, fallback na excerpt/title slabý

---

### TASK-080: Emoji nefunguje v poptávkách (assignedTo)
Stav: čeká
- Funguje v sidebaru, ne v seznamu poptávek
- `UserBadge.tsx`, `InquiriesClient.tsx`

---

### TASK-111: Privacy stránka — chybí identifikace firmy
Stav: HOTOVO (commit 893a06e)
- Přidáno: Altro servis group s.r.o., IČO 23673389, GDPR rozšíření

---

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
