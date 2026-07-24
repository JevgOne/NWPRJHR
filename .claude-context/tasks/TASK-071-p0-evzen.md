# EVŽEN VERDIKT: TASK-071 P0 — Performance quick wins

**Datum:** 2026-07-22
**Kontrolor:** Evžen
**Status: SCHVÁLENO**

---

## Původní zadání (shrnutí):
Zrychlit admin panel — snížit zbytečné DB requesty a API calls. P0 = 3 quick wins:
1. Layout badge revalidate 5→30
2. Smazat duplicitní notification polling v AppShell
3. Dashboard revalidate 10→30

---

## Nezávislá verifikace:

### 1. layout.tsx — badge revalidate

| Kontrolní bod | Výsledek |
|---------------|----------|
| layout.tsx:27 `revalidate: 30` (bylo 5) | PASS |
| Tag `"badges"` zachován pro tag-based invalidation | PASS |
| Logika getCachedBadgeCounts netknutá | PASS |

### 2. AppShell.tsx — duplicitní polling smazán

| Kontrolní bod | Výsledek |
|---------------|----------|
| Import: pouze `useState`, žádný `useEffect` | PASS |
| Žádný `setInterval`, `fetch`, `liveUnread` v souboru | PASS |
| `unreadCount` pochází z SSR `badgeCounts` props | PASS |
| NotificationBell.tsx: vlastní polling zachován (60s interval) | PASS |
| Notifikační zvoneček funguje nezávisle na AppShell | PASS |

### 3. dashboard/page.tsx — revalidate 30

| Kontrolní bod | Výsledek |
|---------------|----------|
| dashboard/page.tsx:172 `revalidate: 30` (bylo 10) | PASS |
| Tag `"dashboard"` zachován | PASS |

### 4. Kontrola vedlejších efektů

| Kontrolní bod | Výsledek |
|---------------|----------|
| TypeScript kompilace (dle QA) | PASS |
| API `/api/notifications` voláno pouze 1x/60s (jen NotificationBell) | PASS |
| Sidebar badge aktualizace při navigaci (SSR revalidate) | PASS |

---

## Shoda se zadáním:

- Plán definoval P0 jako 3 quick wins → implementováno přesně 3 změny
- Žádné změny navíc mimo scope
- Implementace je minimální a cílená — žádná nadbytečnost
- Riziko nízké — jen změna cache intervalů a smazání duplicitního kódu

## Verdikt: **SCHVÁLENO**

Připraveno k deployi.
