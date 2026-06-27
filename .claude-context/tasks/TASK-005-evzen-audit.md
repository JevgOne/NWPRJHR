# TASK-005 Evzen Audit — Full Code Review
**Date:** 2026-06-27
**Reviewer:** evzen-the-king (READ-ONLY kontrolor)
**Status:** COMPLETED

---

## 1. PublicNavbar.tsx — Dropdown "Spoluprace"
**Verdict: OK**

- NavDropdown component (line 47-101) with click toggle, chevron rotation
- Contains all 4 required items:
  - /pro -> "Pro salony a kadernice" (navbar.pro)
  - /kadernice -> "Kadernice" (navbar.hairdressers)
  - /vykup -> "Vykup vlasu" (navbar.buyback)
  - /registrace -> "Registrace" (navbar.register)
- All 4 target pages exist under src/app/(public)/
- Translations present in all 3 locales (cs, uk, ru)
- Close on outside click: mousedown listener with ref.current.contains check (line 60-66)
- Close on item click: onClick={() => setOpen(false)} on each Link (line 87)
- Mobile: all links rendered flat (no dropdown) via allMobileLinks spread (line 129-133)
- Active state highlighting works via pathname.startsWith (line 58)

---

## 2. HeroProductSlider.tsx — Prices / Badges
**Verdict: NEEDS FIX (2 issues)**

### 2a. Prices - "od" keyword
The word "od" is NOT literally displayed. Line 129-132 shows: `{pricePerGram} Kc/g`
However, line 58 uses `Math.min(...)` across all variants. If a product has variants with different prices, this effectively shows the LOWEST price — which is semantically "from" pricing without saying "od". The user said "ceny nesmi byt OD ale presne" = prices must be exact, not "from".

**ISSUE:** If variants have different prices per gram, the displayed price is the minimum, which is misleading. Need to verify: do products actually have varying retailPricePerGram across variants? If yes, showing min is wrong per user requirements.

### 2b. Category badges (Virgin/Premium visibility)
Line 91: ALL categories use identical styling `bg-rose text-white shadow-sm`.
There is NO category-specific differentiation. Virgin badge looks the same as Premium, Standard, Sale.
User said: "badge jako Virgin, Premium musi byt vice vidielne!!"

**ISSUE:** Badges need category-specific colors to differentiate them. The dashboard already has distinct category colors (line 21-26 of dashboard): VIRGIN=amber, PREMIUM=indigo, STANDARD=emerald, SALE=rose. The slider should use similar differentiation.

---

## 3. /pro page (pro/page.tsx) — Hairdresser card color
**Verdict: OK**

- Salon card: bg-rose/10, icon text-rose, CTA bg-rose (line 32-63) = rose/pink theme
- Hairdresser card: bg-amber-50, icon text-amber-600, discount text-amber-600, CTA bg-amber-600 (line 69-101) = AMBER theme
- NO blue anywhere on this page
- User said "misto ty modry tam dej jinou barvu" -> blue was replaced with amber. CORRECT.

---

## 4. Dashboard badges (dashboard/page.tsx) — Real data
**Verdict: OK**

ALL stats/badges read REAL data from Prisma DB (lines 53-131):
- Skladem: `prisma.delivery.findMany({ where: { remainingGrams: { gt: 0 } } })` -> totalStockGrams (line 134)
- Prodeje tento mesic: `prisma.sale.aggregate({ where: { status: "COMPLETED", completedAt: { gte: monthStart } } })` -> salesCount (line 148)
- Prodano celkem: `prisma.sale.aggregate({ where: { status: "COMPLETED" } })` -> totalSold (line 152)
- Otevrene faktury: `prisma.invoice.aggregate({ where: { type: "INVOICE", status: { in: ["ISSUED","AWAITING","OVERDUE"] } } })` -> invoiceCount (line 150)
- Aktivni salony: `prisma.salon.count({ where: { archived: false } })` -> activeSalonsCount (line 93)
- Cekajici registrace: `prisma.salon.count({ where: { approved: false, archived: false } })` -> pendingRegistrations (line 130)
- Nove objednavky: `prisma.order.count({ where: { status: "NEW" } })` -> newOrders (line 128)
- Neprectena oznameni: `prisma.notification.count({ where: { recipientId: session.user.id, read: false } })` -> unreadNotifications (line 129)

All badges are clickable links:
- Aktivni salony -> /salons (line 289)
- Cekajici registrace -> /salons (line 290)
- Nove objednavky -> /orders (line 291)
- Neprectena oznameni -> /notifications (line 292)

**Minor note:** "Prodano celkem" sub1 shows `fmtGrams(0)` (hardcoded 0 grams, line 177) instead of actual totalGramsSoldAgg. The totalGramsSoldAgg is fetched (line 59) but never used. This is a minor data bug — shows "0 g" for total grams sold.

---

## 5. telegram.ts — Registration notification button
**Verdict: MIXED (registration OK, but "BERU" still exists for other notifications)**

### Registration notification (notifySalonRegistration, line 188-215):
- Uses `sendRegistrationNotification()` (line 214) NOT `sendWithClaimButton()`
- Button text: "Otevrit admin panel" (line 223) -- NOT "BERU"
- Button is a URL button linking to https://www.hairland.cz/salons (line 223) -- CORRECT
- Message includes type label (Salon/Kadernice), line 196-199

### Other notifications (inquiry, contact):
- Still use `sendWithClaimButton()` with "BERU / BEPY" button (line 13)
- This is SEPARATE from registration — user complaint was specifically about registration button
- Registration flow: CORRECT per user requirements

---

## 6. SalonsClient.tsx — Tab "Cekajici schvaleni"
**Verdict: OK**

- Three tabs implemented (line 42): `pending | active | archived`
- Default tab is `"pending"` (line 42) — opens on "Cekajici schvaleni" by default
- Tab buttons (lines 81-110):
  - "Cekajici schvaleni" (`t("pendingApproval")`) — amber active styling (border-amber-600, bg-amber-50, text-amber-700)
  - "Aktivni" (`t("active")`) — indigo active styling
  - "Archivovane" (`t("archived")`) — indigo active styling
- Pending filter logic (line 51-53): `archived=false, approved=false` — correctly fetches unapproved salons
- Type filter dropdown (lines 111-119): filters by SALON or HAIRDRESSER — correct
- Hairdresser badge on rows (line 161-165): blue badge `bg-blue-100 text-blue-700` shown for type=HAIRDRESSER
- Pending badge on rows (line 166-170): amber badge `bg-amber-100 text-amber-700` shown for unapproved salons
- Each salon links to detail page `/salons/${s.id}` (line 151)
- Search input present (line 120-125)

**Note:** Tab defaults to "pending" which means admin sees pending registrations FIRST when opening /salons. This directly addresses user complaint "udelal jsem registraci kadernice a nevidim nikde nic v admin panelu".

---

## SUMMARY

| # | Check | Verdict |
|---|-------|---------|
| 1 | Navbar dropdown "Spoluprace" | OK |
| 2a | Prices without "od" | WARNING — shows min price, semantically "from" |
| 2b | Badge Virgin/Premium visibility | NEEDS FIX — all categories use same bg-rose |
| 3 | /pro page amber (not blue) | OK |
| 4 | Dashboard real data | OK (minor: totalGramsSold shows 0) |
| 5 | Telegram "Otevrit admin panel" | OK for registration |
| 6 | SalonsClient "Cekajici schvaleni" tab | OK — default tab, filters unapproved |
