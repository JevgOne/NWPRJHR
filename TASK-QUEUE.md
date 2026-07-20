# TASK QUEUE — Hairland

## AKTIVNÍ

## TASK-097: Oddělené číslování faktur (karta vs hotovost)
Priorita: 1
Stav: implementováno, čeká deploy
Projekt: /Users/zen/NWPRJHR

### Kompletní zadání:
Uživatel: "dej zvlíšt číslování faktur pro platby kartou a zvlíšt pro platby hotově at jdou za sebou"

### Co bylo uděláno:
- Schema: InvoiceCounter má nový `prefix` field + `@@unique([year, prefix])`
- `invoice-number.ts`: getNextInvoiceNumber přijímá prefix ("H" = hotovost, "F" = faktura/karta)
- `invoicing.ts`: createInvoiceFromSale předává prefix podle paymentType
- `credit-note.ts`: dobropis dědí prefix z originální faktury
- Formát: H2026-0001 (hotovost), F2026-0001 (karta/převod)

---

## TASK-098: Výběr zákazníků — redesign pro mobil
Priorita: 1
Stav: implementováno, čeká deploy
Projekt: /Users/zen/NWPRJHR

### Kompletní zadání:
Uživatel: "ten vyber zakaznicu je furt stejny uplne napíču"
Screenshot: Na mobilu jsou zákaznické karty ošklivé, příliš velké, bez avatarů, testovací zákazníci.

### Co bylo uděláno:
- CustomerSelect.tsx: kompletní redesign — avatary s iniciálami, ikona hledání, checkmark vybraného, kompaktní layout
- Smazat testovací zákazníky z DB (Test ApiTest atd.) — ZBÝVÁ

---

## TASK-099: Notifikační zvoneček — kliknutí nefunguje + stornované položky
Priorita: 1
Stav: částečně opraveno
Projekt: /Users/zen/NWPRJHR

### Kompletní zadání:
Uživatel: "když klinu na zvoneček pak na oznamení nic se neudela"
Uživatel: "pokud se objednavka/rezervace nebo cokloliv stornuje logicky už nema co delat v oznamení"

### Co bylo uděláno:
- NotificationBell.tsx: opraveno `getNotificationUrl` — vrací URL i bez data pole (fallback na section URL)

### Co zbývá:
- Při stornu objednávky/rezervace smazat nebo označit související notifikace
- Ověřit že kliknutí naviguje správně na všech typech notifikací

---

## TASK-100: Blog — nahrávání obrázků nefunguje
Priorita: 1
Stav: čeká
Projekt: /Users/zen/NWPRJHR

### Kompletní zadání:
Uživatel: "proč zase nejde nahrat obrazek do blogu?"

### Kontext:
- Blog editor: `src/app/(app)/posts/[id]/BlogEditorClient.tsx` (handleCoverUpload, řádek 116)
- Upload API: `src/app/api/upload/photos/route.ts` — používá @vercel/blob + sharp watermark
- Watermark: `src/lib/watermark.ts` — může selhat na Vercelu (sharp + watermark.png)
- Potřeba: ověřit error handling, ověřit BLOB token, ověřit sharp na Vercelu

---

## TASK-101: Blog — SEO meta popisky slabé
Priorita: 2
Stav: čeká
Projekt: /Users/zen/NWPRJHR

### Kompletní zadání:
Uživatel: "SEO za me meta popisky atd jsou slabe na blogu nebo snad mi chceš říct že ne?"

### Kontext:
- Blog detail: `src/app/[locale]/(public)/blog/[slug]/page.tsx` — generateMetadata
- Blog listing: `src/app/[locale]/(public)/blog/page.tsx` — generateMetadata
- Editor: `src/app/(app)/posts/[id]/BlogEditorClient.tsx` — metaTitle, metaDescription fields
- Možné problémy: auto-generace SEO popisků chybí, fallback na excerpt/title je slabý

---

## TASK-102: Kalendář — mobilní optimalizace + WOW design
Priorita: 1
Stav: čeká
Projekt: /Users/zen/NWPRJHR

### Kompletní zadání:
Uživatel: "kalendář jsi nedořešil furt je to obyčejny, neni optimalizace pro telefon"
Uživatel: "kalendář chce urcite jeste vylepšit design na WOW neco"

### Kontext:
- Najít calendar komponentu v src/app/(app)/ nebo src/components/
- Potřeba: responzivní design, swipe gesta, mobilní view (den/týden), WOW vizuální styl

---

## TASK-103: Smazání testovacích zákazníků z DB
Priorita: 1
Stav: čeká
Projekt: /Users/zen/NWPRJHR

### Kompletní zadání:
Ze screenshotu: "Test ApiTest" zákazník musí být smazán z produkční DB.
Ověřit zda "Jitka Zkouška" je test (příjmení = zkouška/test).

---

## TASK-096: Cenová politika — marže se stále špatně počítá (221% místo 100%)
Priorita: 1
Stav: čeká na debug
Projekt: /Users/zen/NWPRJHR

### Kompletní zadání:
Uživatel: "v admin panelu jsem upravil cenu nákupní na 3300 u S-RV-10-55 a marže je stale 221% má bejt 100%"

### Kontext:
- Variant PUT API: `src/app/api/variants/[id]/route.ts`
- Pricing: `src/lib/pricing.ts`
- Price settings: `src/app/api/price-settings/route.ts`

---

## TASK-079: Prodejní karta položky — přidat všechny informace o produktu
Priorita: 1
Stav: čeká
Projekt: /Users/zen/NWPRJHR

### Kompletní zadání:
Uživatel: "nejsou tam puvod vlasu, atd všechny informace + není tam videt kolik je skladem G."

### Kontext:
- Item row: `src/components/sales/SaleItemRow.tsx`
- SKU: `src/lib/sku.ts`

---

## TASK-080: Emoji nefunguje v poptávkách (assignedTo)
Priorita: 2
Stav: čeká
Projekt: /Users/zen/NWPRJHR

### Kompletní zadání:
Emoji (👑🐀🐻) funguje v sidebaru ale nefunguje v seznamu poptávek.

### Kontext:
- UserBadge: `src/components/ui/UserBadge.tsx`
- Poptávky: `src/app/(app)/inquiries/InquiriesClient.tsx`

---

## BACKLOG

## TASK-071: Performance — pomalé načítání produktů a admin panelu
Priorita: 2
Stav: čeká

---

## TASK-104: Rezervace 50% záloha + Comgate
Priorita: 2
Stav: plán hotový v .claude-context/tasks/TASK-104-reservation-deposit-plan.md
Projekt: /Users/zen/NWPRJHR

---

## TASK-105: Telegram bot pro Hairland
Priorita: 3
Stav: analýza hotová, uživatel chce udělat jako POSLEDNÍ

---

## ČEKÁ

---

## HOTOVÉ
- TASK-087: Fix fotek na product detail (commit e6f9b55) — 2026-07-19
- TASK-088: Kategorie → update jmen/slug/cen (commit e6f9b55) — 2026-07-19
- TASK-089: Premium design produktové stránky (commit cb8a9da) — 2026-07-19
- TASK-090: Oprava kalkulace prodejní ceny + reset override UI (commit 3ca87be) — 2026-07-19
- TASK-091: Top info bar s kontakty a trust badges (commit 3ca87be) — 2026-07-19
- TASK-092: SEO audit hairland.cz vs goldhair.cz — kompletní report — 2026-07-19
- TASK-093: SEO kódové fixy (ItemList, mpn, sitemap, HowTo) — vše už implementováno — 2026-07-19
- TASK-094: SEO bugy produktu (availability, og:type, reviews, meta title) (commit 5019ea5) — 2026-07-19
- TASK-095: Rozšíření FAQ na produktových stránkách (commit 5019ea5) — 2026-07-19
