# QA: TASK-071 P0 — Performance quick wins

**Datum:** 2026-07-22
**Kontrolor:** kontrolor
**Status: PASS — vše správně implementováno**

---

## 1. layout.tsx — badge revalidate

**Soubor:** `src/app/(app)/layout.tsx:27`

```
{ revalidate: 30, tags: ["badges"] }
```

✅ `revalidate: 30` (bylo 5) — snížení DB load 6x
✅ Tag `"badges"` zachován — tag-based invalidation přes `revalidateTag("badges")` stále funguje

---

## 2. AppShell.tsx — duplicitní polling smazán

**Soubor:** `src/components/AppShell.tsx`

Import řádek 3:
```
import { useState } from "react";
```

✅ `useEffect` odstraněn z importů — pouze `useState` zůstal
✅ Žádný `useEffect`, `setInterval` ani polling kód v souboru
✅ `unreadCount` přichází z `badgeCounts` props (SSR z layout.tsx), ne z client-side fetch
✅ `liveUnread` state odstraněn — `unreadCount` použit přímo z destructurovaného `badgeCounts`

Navigační badge (`/notifications`) správně zobrazuje `unreadCount` z SSR:
```
{ href: "/notifications", ..., badge: unreadCount, badgeColor: "bg-red-500" }
```

---

## 3. dashboard/page.tsx — revalidate 30

**Soubor:** `src/app/(app)/dashboard/page.tsx:172`

```
{ revalidate: 30, tags: ["dashboard"] }
```

✅ `revalidate: 30` (bylo 10) — 3x méně cache misses

---

## 4. TypeScript kompilace

```
npx tsc --noEmit → PASS (žádné chyby)
```

✅

---

## 5. Vedlejší efekty — notifikace stále fungují

**NotificationBell.tsx** — vlastní nezávislý polling zachován:
- `useEffect` + `setInterval(fetchCount, 60000)` — polluje každých 60s
- Vlastní `unreadCount` state v NotificationBell (nezávislý na AppShell)
- Komponenta renderována v AppShell (`<NotificationBell />` na r213)

✅ Notifikace v zvonečku fungují nezávisle na odstraněném AppShell pollingu
✅ AppShell badge (nav položka /notifications) používá SSR data — aktualizuje se při page load + při `revalidateTag("badges")`
✅ Žádné duplicate polling — API `/api/notifications` voláno 1x za 60s (pouze NotificationBell), ne 2x

---

## SOUHRN

| Kontrola | Výsledek |
|----------|----------|
| layout.tsx revalidate: 30 | ✅ |
| layout.tsx tags: ["badges"] zachován | ✅ |
| AppShell: useEffect odstraněn z importu | ✅ |
| AppShell: duplicitní polling smazán | ✅ |
| AppShell: unreadCount z SSR props | ✅ |
| dashboard/page.tsx revalidate: 30 | ✅ |
| NotificationBell polling zachován (60s) | ✅ |
| TypeScript kompilace | ✅ PASS |

**Implementace kompletní a správná. Připraveno k deployi.**
