# QA Report: Tasks #2–#5

**Datum:** 2026-06-27
**Kontrolor:** KONTROLOR agent

---

## Task #5 — Verify navbar dropdown "Spolupráce" ✅ PASS

**Kód:** `/Users/zen/hairora/src/components/public/PublicNavbar.tsx`

**Simplify:** Čistá implementace, žádné duplicity. `NavDropdown` komponenta je jednoznačná.

**Debug:** Build prochází (`✓ Compiled successfully`, 118 stránek). Navbar se sestavuje správně.

**Reverzní kontrola:**
| Požadavek | Stav |
|-----------|------|
| Dropdown se otevírá na click | ✅ `onClick={() => setOpen(!open)}` |
| Zavírá se po kliknutí na link | ✅ `onClick={() => setOpen(false)}` |
| Zavírá se na outside click | ✅ `mousedown` event listener v `useEffect` |
| Mobile menu zobrazuje linky flat | ✅ `allMobileLinks` array zahrnuje cooperation items |
| Linky vedou na správné stránky | ✅ /pro, /kadernice, /vykup, /registrace existují |

**Verdikt: PASS** — Viz TASK-005-test-report.md pro detailní test.

---

## Task #2 — Dashboard badges — real data ✅ PASS

**Kód:** `/Users/zen/hairora/src/app/(app)/dashboard/page.tsx`

**Simplify:** Dashboard je server component s jedním `Promise.all()` dotazem. Žádné duplicity, čistý kód.

**Debug:** Build prochází. Stránka `/dashboard` je dynamická (server-rendered on demand).

**Reverzní kontrola — každý badge:**

| Badge | Data source | Stav |
|-------|------------|------|
| Skladem (stock) | `deliveriesWithProduct` → `totalStockGrams` z Prisma | ✅ reálná data |
| Prodeje tento měsíc | `salesThisMonth._count.id` (where completedAt ≥ monthStart) | ✅ reálná data |
| Prodáno celkem | `totalSalesEver._sum.totalAmount` | ✅ reálná data |
| Otevřené faktury | `openInvoices._count.id` + `_sum.total` | ✅ reálná data |
| Aktivní salony | `activeSalonsCount` = `prisma.salon.count({ archived: false })` | ✅ reálná data |
| Čekající registrace | `pendingRegistrations` = `count({ approved: false, archived: false })` | ✅ reálná data |
| Nové objednávky | `newOrders` = `prisma.order.count({ status: "NEW" })` | ✅ reálná data |
| Nepřečtená oznámení | `unreadNotifications` = `notification.count({ recipientId, read: false })` | ✅ reálná data |

**Linky:**
- Aktivní salony → `/salons` ✅
- Čekající registrace → `/salons` ✅
- Nové objednávky → `/orders` ✅
- Nepřečtená oznámení → `/notifications` ✅

**Verdikt: PASS** — Všechny badges zobrazují reálná data z databáze. Žádné placeholdery.

---

## Task #3 — Registration system — salon vs hairdresser ✅ PASS (s 1 Low issue)

**Kódy:**
- `/Users/zen/hairora/src/app/api/public/register-salon/route.ts`
- `/Users/zen/hairora/src/app/(app)/salons/SalonsClient.tsx`
- `/Users/zen/hairora/src/lib/telegram.ts`

**Simplify:** Logika je čistá, žádné duplicity.

**Reverzní kontrola:**

| Požadavek | Stav | Detail |
|-----------|------|--------|
| Kadeřnice vs salon rozlišení | ✅ | `type: z.enum(["SALON", "HAIRDRESSER"])` ve schema |
| User role správně přiřazena | ✅ | `role: type === "HAIRDRESSER" ? "HAIRDRESSER" : "SALON"` |
| Telegram notification říká správný typ | ✅ | `typeLabel = type === "HAIRDRESSER" ? "Kadeřnice" : "Salon"` |
| Admin panel zobrazuje typ | ✅ | SalonsClient: badge `typeHairdresser` u HAIRDRESSER záznamu |
| Čekající schválení tab | ✅ | Tab "pending" volá API s `approved=false&archived=false` |
| Salon approval flow | ✅ | `approved: false` při registraci, admin může schválit přes `/salons/[id]` |
| Email notification | ✅ | Obsahuje `Typ: ${typeLabel}` |

**Issue [Low]:** `SalonsClient.tsx:43` — Výchozí tab při načtení stránky je `"pending"`, což je dobré. Ale text v tabulce "Čekající registrace" na dashboardu je badge bez odkazu na správný tab — pouze `/salons` bez `?tab=pending`. Uživatel musí ručně vybrat tab. Není blocker, je to UX improvement.

**Issue [Low]:** `Salon.language` (String) a `Stylist.languages` (JSON array) jsou skutečně oddělené modely bez přímé vazby. Registrace ukládá `Salon.language` (single string z form pole `language`). Stylisté jsou samostatné záznamy. Toto není bug, je to záměrná separace dat — Stylist.languages jsou editovány přes admin, ne přes registraci. Zadání říká "are separate models with no connection" — to je popsaná situace, ne bug.

**Verdikt: PASS** — Všechny kritické požadavky splněny.

---

## Task #4 — Phone number +420 728 729 666 ❌ NOT DONE

**Zadání:** "Store and display salon contact phone number +420 728 729 666 where relevant (contact page, footer, etc.)"

**Reverzní kontrola:**

| Místo | Stav |
|-------|------|
| Contact page (`/contact`) | ❌ CHYBÍ — stránka zobrazuje jen email `info@hairland.cz`, žádné telefonní číslo |
| Footer | ❌ CHYBÍ — footer (pokud existuje) neobsahuje číslo |
| messages/cs.json | ❌ Klíč `contact.phone` nebo telefon není přítomen |
| Kód | ❌ String "+420 728 729 666" se nikde v src/ nevyskytuje |

**Kontaktní stránka** (`src/app/(public)/contact/page.tsx:53`) zobrazuje pouze `info@hairland.cz`. Žádné telefonní číslo.

**Verdikt: ❌ NOT DONE** — Telefon +420 728 729 666 není nikde zobrazený. Task nebyl implementován.

---

## Task #1 — Fix inquiry table (Turso DB) ⏳ IN PROGRESS (planner)

**Status:** Planner má task `in_progress`. Prism schema má `Inquiry` model s `@@map("inquiries")` a `InquiryItem` s `@@map("inquiry_items")`. API route `/api/public/inquiry/route.ts` je správně implementovaná — problém je pouze chybějící tabulka v Turso DB (runtime, ne kód).

**Kód je správný** — build prochází, schema je definované. Pouze DB setup chybí.

---

## Celkový Build Status

```
✓ Compiled successfully in 4.8s
✓ Generating static pages (118/118)
```

**0 TypeScript errors, 0 build warnings.**

---

## Souhrn

| Task | Verdict | Priorita |
|------|---------|----------|
| #1 Fix inquiry table | ⏳ Planner řeší | CRITICAL |
| #2 Dashboard badges | ✅ PASS | — |
| #3 Registration system | ✅ PASS | — |
| #4 Phone number | ❌ NOT DONE | Implementovat |
| #5 Navbar dropdown | ✅ PASS | — |

**Doporučení:**
1. Task #4 — přidat telefon na `/contact` page (přidat do `messages/cs.json` klíč `contact.phone` = "+420 728 729 666" a zobrazit vedle emailu)
2. Task #1 — pokračovat s Turso DB fix (kód je OK)
