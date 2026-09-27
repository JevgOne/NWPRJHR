# TASK QUEUE — Hairland

**Aktualizováno:** 2026-09-25
**Firma:** Altro servis group s.r.o., IČO 23673389
**Účet:** 6424423004/5500, IBAN CZ5555000000006424423004 — NEMĚNIT!

---

## P0 — KRITICKÉ (blokuje provoz)

### TASK-151: Reklamační řád, péče o vlasy, e-mailová automatizace, checkout
Stav: čeká
Priorita: P0 — právní povinnost + ochrana firmy
Zadání: soubor `/Users/zen/Desktop/files-10/0-ZADANI-pro-Claude-Code.md` (KOMPLETNÍ, nezkracovat)

#### Pořadí nasazení (ze zadání):
1. **Opravy textů na webu** (sekce 2.4) — nejnaléhavější
2. **E-mail č. 1** s poučením a formulářem — právní povinnost
3. **Checkboxy a pole IČO** v objednávce
4. **Stránka /pece-o-vlasy** + nový reklamační řád na `/reklamacni-rad`
5. **Reklamační formulář** — kroky 7 a 8
6. **Zbytek e-mailové sekvence** (e-maily 2–5)
7. **Stránka /odstoupeni-od-smlouvy** — ONLINE FORMULÁŘ (ne jen text), odeslání na email/admin panel

#### Zdrojové soubory s hotovými texty:
- `/Users/zen/Desktop/files-10/1-Reklamacni-rad-Hairland.md`
- `/Users/zen/Desktop/files-10/2-Navod-na-peci-o-prodlouzene-vlasy.md`
- `/Users/zen/Desktop/files-10/3-Formulare-k-tisku.md`
- `/Users/zen/Desktop/files-10/4-Audit-a-doporuceni-INTERNI.md`
- `/Users/zen/Desktop/files-10/5-Emailove-sablony.md`

#### Otevřené otázky (sekce 6 zadání) — NUTNO DOPLNIT:
1. Datum účinnosti reklamačního řádu → čl. A11.5
2. Fyzická adresa pro zasílání reklamací → čl. A7
3. Jednotná formulace původu vlasů → celý web
4. B2B lhůta — 6 nebo 3 měsíce? → čl. A6.1
5. Zpracování — zprostředkování nebo vlastní služba? → čl. A1.2–A1.4, A4.3

#### POZOR:
- Texty jsou FINÁLNÍ — neupravovat obsah, pouze zasadit do webu
- Formulář pro odstoupení = ONLINE FORMA (uživatel explicitně řekl)
- "KAZDA JAZYKOVA VERZE MUSI MIT SVOJE NAZVY" — i18n překlady, ne strojový překlad

---

## P1 — DŮLEŽITÉ (opravit co nejdřív)

### TASK-103: Smazání testovacích zákazníků z DB
Stav: čeká — skript existuje, čeká na spuštění na produkci
- "Test ApiTest" musí pryč z produkční DB
- Ověřit "Jitka Zkouška" (příjmení = test?)

---

## P2 — STŘEDNÍ PRIORITA

### TASK-071: Performance — pomalé načítání admin panelu
Stav: základ hotový, zbylé nice-to-have

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
- TASK-107: Naskladnění BY_PIECE — fixnuto (maxDuration=30) — 2026-09-25
- TASK-096: Marže 221% — fixnuto (calculateRetailPrice) — 2026-09-25
- TASK-102: Kalendář mobilní — hotovo (swipe, denní view, WOW design) — 2026-09-25
- TASK-112: Zásilkovna widget — hotovo (PacketaWidget.tsx) — 2026-09-25
- TASK-150: SEO indexation fix — localeDetection off, sitemap ISR, barva landing pages IN query, i18n color links — 2026-09-19
- TASK-152: SKU sekvenční číslo — formát V-RV-01-45-00001, hlavní vyhledávač — 2026-09-19
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
