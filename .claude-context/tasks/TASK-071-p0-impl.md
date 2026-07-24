# IMPL: TASK-071 P0 — Performance quick wins

## Status: DONE

## Změněné soubory (3)

### 1. src/app/(app)/layout.tsx
- `revalidate: 5` → `revalidate: 30` v `getCachedBadgeCounts`
- Snížení DB load 6x (4 COUNT queries každých 30s místo 5s)
- Tag-based invalidation (`revalidateTag("badges")`) stále funguje pro okamžitou aktualizaci

### 2. src/components/AppShell.tsx
- Smazán duplicitní notification polling useEffect (řádky 37-48)
- Odstraněn `useEffect` import (již nepotřeba)
- `liveUnread` state nahrazen přímým `unreadCount` z SSR badgeCounts
- Notifikace se nyní pollují pouze v NotificationBell (1x místo 2x za minutu)

### 3. src/app/(app)/dashboard/page.tsx
- `revalidate: 10` → `revalidate: 30` v dashboard cache
- Méně cache misses, dashboard data se mění zřídka

## Dopad
- -50% API calls na /api/notifications (odstraněn duplicitní polling)
- -6x DB load na badge counts (revalidate 5→30)
- -3x cache misses na dashboard (revalidate 10→30)
- Tag-based invalidation zachována — data se aktualizují okamžitě při změnách

## Validace
- TypeScript: `npx tsc --noEmit` — PASS
