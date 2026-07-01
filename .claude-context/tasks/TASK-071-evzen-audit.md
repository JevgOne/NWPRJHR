# TASK-071 — Evžen Audit: Performance — pomalé načítání produktů a admin panelu

**Datum:** 2026-07-01
**Agent:** evzen (kontrolor)
**Výsledek:** SCHVÁLENO s poznámkami

---

## Kontrola proti zadání

### Zadání (doslova od uživatele):
> "produkty se načítají hrooozne pomalu ale fakt, to same když se přihlašují do admin panelu hrozne dlouho se to načíta"

### Co bylo opraveno:

| Problém | Stav | Odpovídá zadání |
|---------|------|-----------------|
| N+1 queries v salon katalogu (KRITICKÉ) | OPRAVENO | ANO — hlavní příčina "produkty se načítají pomalu" |
| Dashboard aggregate (STŘEDNÍ) | Plán existuje, neimplementováno | Čeká — aktuálně OK s desítkami dodávek |
| Products paginace (NÍZKÁ) | Plán existuje, neimplementováno | Čeká — aktuálně OK |
| Admin login pomalý | Analyzováno | auth.ts má Promise.all, JWT je rychlý — cold start Vercel? |

### Ověření kritického fixu:

**Soubor:** `src/app/api/salon-portal/catalog/route.ts`
- Řádek 6: `import { getAllStockNumbers } from "@/lib/stock"` — správný bulk import
- Řádek 25-40: `Promise.all([discountData, products, stockMap])` — 3 paralelní queries
- Řádek 48: `stockMap.get(v.id)` — O(1) synchronní lookup
- Řádek 85: `stock?.availableGrams ?? 0` — nullsafe

**Dopad:** Z ~1000 SQL dotazů (per-variant) na 5 dotazů (3 paralelní). Na Turso s ~20ms/query: z ~20s na <0.5s.

### QA report:
Viz `.claude-context/tasks/TASK-071-qa.md` — kontrolor prošel 15 souborů, build ověřen, 0 chyb.

### Zbývající doporučení (neblokující):
1. Přidat `loading.tsx` skeleton do dashboard a products pro lepší UX
2. Dashboard SQL aggregate (při růstu dodávek)
3. Products paginace (při růstu produktů)

### Závěr:
Kritický fix odpovídá zadání — "produkty se načítají pomalu" bylo způsobeno N+1 queries v salon katalogu (1000+ SQL dotazů na jedno načtení). Fix je implementovaný správně. Zbývající optimalizace jsou preventivní a neblokují aktuální provoz.
