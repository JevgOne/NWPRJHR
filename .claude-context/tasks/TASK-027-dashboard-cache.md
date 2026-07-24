# TASK-027: Dashboard cache — phantom data

**Priorita:** P1
**Stav:** čeká

## Popis problému
Dashboard ukazuje neexistující pohyby (smazané/stornované).

## Analýza
- `src/app/(app)/dashboard/page.tsx:111-119` — recentMovements query
- Cached s `revalidate: 60, tags: ["dashboard"]`

## Plán
1. Ověřit query — filtruje smazané pohyby?
2. Cache invalidace po stornu/mazání
3. Přidat revalidateTag("dashboard") do relevantních API routes
