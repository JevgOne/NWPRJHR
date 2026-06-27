# TASK-008 Evzen Audit — Ceny, Badge, Dashboard, Telegram, Salons Tab
**Date:** 2026-06-27
**Reviewer:** evzen-the-king (READ-ONLY kontrolor)
**Status:** COMPLETED

---

## 1. HeroProductSlider.tsx — Ceny / Badge

### Ceny bez "od"
**Verdict: ⚠️ Potrebuje opravu**

Soubor: `src/components/public/HeroProductSlider.tsx`

Slovo "od" se v kodu NEZOBRAZUJE. Radek 129-132:
```
{pricePerGram} Kc/g
```
Nicmene radek 58 pouziva `Math.min(...)` pres vsechny varianty:
```
const minPrice = Math.min(...product.variants.map((v) => v.retailPricePerGram));
```
Pokud ma produkt varianty s ruznymi cenami, zobrazuje se NEJNIZSI cena = semanticky "od" bez slova "od". Uzivatel rekl: "ceny nesmi byt OD ale presne".

### Badge Virgin/Premium viditelnost
**Verdict: ⚠️ Potrebuje opravu**

Radek 91 — VSECHNY kategorie pouzivaji STEJNY styl:
```
bg-rose text-white shadow-sm
```
Virgin, Premium, Standard, Sale — vsechny vypadaji uplne stejne.
Uzivatel rekl: "badge jako Virgin, Premium musi byt vice vidielne!!"

Badge JE solid barva (bg-rose = solid, text-white = solid) — NENI pruhledny. Ale chybi rozliseni mezi kategoriemi. Dashboard uz pouziva rozlisene barvy:
- VIRGIN: bg-amber-100 text-amber-800
- PREMIUM: bg-indigo-100 text-indigo-800
- STANDARD: bg-emerald-100 text-emerald-800
- SALE: bg-rose-100 text-rose-800

Doporuceni: pouzit stejne category-specific barvy i v slideru.

---

## 2. /pro page — Kadernicka karta barva
**Verdict: ✅ OK**

Soubor: `src/app/(public)/pro/page.tsx`

- Salon karta (radek 30-63): bg-rose/10, icon text-rose, CTA bg-rose = ROSE tema
- Kadernicka karta (radek 67-101):
  - Pozadi ikony: `bg-amber-50` (radek 69)
  - Ikona: `text-amber-600` (radek 70)
  - Cena slevy: `text-amber-600` (radek 76)
  - CTA tlacitko: `bg-amber-600 hover:bg-amber-700` (radek 97)
- ZADNA modra barva na cele strance
- Uzivatel rekl "misto ty modry tam dej jinou barvu" -> modra nahrazena amber. SPRAVNE.

---

## 3. Dashboard — Stat karty a QuickBadge realna data
**Verdict: ✅ OK**

Soubor: `src/app/(app)/dashboard/page.tsx`

VSECHNY stat karty a badge ctou realna data z Prisma DB (radky 53-131):

**StatCard (Row 1, radky 161-185):**
- Skladem: `prisma.delivery.findMany({ where: { remainingGrams: { gt: 0 } } })` -> totalStockGrams, stockValuePurchase, stockValueRetail
- Prodeje tento mesic: `prisma.sale.aggregate({ where: { status: "COMPLETED", completedAt: { gte: monthStart } } })` -> salesCount, salesRevenue
- Prodano celkem: `prisma.sale.aggregate({ where: { status: "COMPLETED" } })` -> totalSold, totalSoldCount, totalCOGS
- Otevrene faktury: `prisma.invoice.aggregate({ where: { type: "INVOICE", status: { in: ["ISSUED","AWAITING","OVERDUE"] } } })` -> invoiceTotal, invoiceCount

**QuickBadge (Row 4, radky 288-293):**
- Aktivni salony: `prisma.salon.count({ where: { archived: false } })` -> activeSalonsCount, odkaz /salons
- Cekajici registrace: `prisma.salon.count({ where: { approved: false, archived: false } })` -> pendingRegistrations, odkaz /salons
- Nove objednavky: `prisma.order.count({ where: { status: "NEW" } })` -> newOrders, odkaz /orders
- Neprectena oznameni: `prisma.notification.count({ where: { recipientId: session.user.id, read: false } })` -> unreadNotifications, odkaz /notifications

Zadne placeholdery, vsechno z DB.

**Drobny bug:** Radek 177 — `fmtGrams(0)` je hardcoded 0 misto `totalGramsSoldAgg._sum.grams`. Promenna `totalGramsSoldAgg` je fetchnuta (radek 59) ale nikdy pouzita v renderovani. Ukazuje "0 g" misto skutecneho poctu prodanych gramu.

---

## 4. telegram.ts — Registracni notifikace
**Verdict: ✅ OK**

Soubor: `src/lib/telegram.ts`

- `notifySalonRegistration()` (radky 188-215) pouziva `sendRegistrationNotification()` (radek 214)
- `sendRegistrationNotification()` (radky 217-240) vytvari URL tlacitko:
  ```
  inline_keyboard: [[{ text: "✅ Otevřít admin panel", url: "https://www.hairland.cz/salons" }]]
  ```
- NEPOUZIVA `sendWithClaimButton()` (ta ma callback "BERU / BEPY")
- Tlacitko je URL typ (otevre browser), NE callback typ (neposila callback_data)
- Zprava obsahuje typ registrace (Salon/Kadernice) — radek 196-199

"BERU" tlacitko (radek 13) zustava POUZE pro inquiry a contact notifikace — to je ok, uzivatel si stezoval specificky na registracni tlacitko.

---

## 5. SalonsClient.tsx — Tab "Cekajici schvaleni"
**Verdict: ✅ OK**

Soubor: `src/app/(app)/salons/SalonsClient.tsx`

- Tri taby (radek 42): `pending | active | archived`
- **Default tab je `"pending"`** (radek 42) — admin vidi cekajici registrace HNED
- Tab "Cekajici schvaleni" (radky 81-90):
  - Label: `t("pendingApproval")`
  - Active styling: `border-amber-600 bg-amber-50 text-amber-700`
- Filter logika pro pending (radky 51-53): `archived=false, approved=false`
- Type filter dropdown (radky 111-119): SALON / HAIRDRESSER
- Hairdresser badge na radcich (radky 161-165): `bg-blue-100 text-blue-700`
- Pending badge na radcich (radky 166-170): `bg-amber-100 text-amber-700`
- Kazdy salon odkazuje na detail `/salons/${s.id}` (radek 151)

---

## SUMMARY

| # | Check | Verdikt |
|---|-------|---------|
| 1a | Ceny bez "od" | ⚠️ Slovo "od" neni, ale Math.min = semanticky "od" |
| 1b | Badge Virgin/Premium solid | ⚠️ Solid ANO (bg-rose), ale vsechny kategorie STEJNY styl — chybi rozliseni |
| 2 | /pro page amber (ne modra) | ✅ OK |
| 3 | Dashboard realna data | ✅ OK (drobny bug: fmtGrams(0) hardcoded) |
| 4 | Telegram "Otevrit admin panel" | ✅ OK |
| 5 | SalonsClient "Cekajici schvaleni" | ✅ OK — default tab |
