# EVŽEN VERDIKT: TASK-079 + TASK-027

**Datum:** 2026-07-22
**Kontrolor:** Evžen
**Status: SCHVÁLENO — oba tasky odpovídají původnímu zadání**

---

## TASK-079 — Prodejní karta chybí info o produktu

### Původní zadání:
"nejsou tam puvod vlasu, atd všechny informace + není tam videt kolik je skladem G."

### Nezávislá verifikace:

| Kontrolní bod | Výsledek |
|---------------|----------|
| SaleItemRow.tsx:23 — `processingType?: string` v interface | PASS |
| SaleItemRow.tsx:73 — podmíněné zobrazení `{item.processingType && <span>...}` | PASS |
| SaleItemRow.tsx:71 — origin/category zobrazení (již existovalo) | PASS |
| SaleItemRow.tsx:72 — texture zobrazení (již existovalo) | PASS |
| NewSaleWizard.tsx:43 — `processingType?: string` v SaleItem interface | PASS |
| NewSaleWizard.tsx:20 — `processingType: string` v ProductOption (existovalo) | PASS |
| NewSaleWizard.tsx:142 — `let processingType: string | undefined` inicializace | PASS |
| NewSaleWizard.tsx:151 — `processingType = p.processingType` extrakce z produktu | PASS |
| NewSaleWizard.tsx:195 — předání v BY_PIECE větvi | PASS |
| NewSaleWizard.tsx:215 — předání v BY_GRAM větvi | PASS |

### Poznámka k zadání:
Uživatel zmiňoval "kolik je skladem G" — `availableGrams` se zobrazuje (SaleItemRow r128+). Origin, texture, SKU se zobrazovaly již dříve. Chybělo pouze `processingType` — to bylo doplněno. Plán toto správně identifikoval.

---

## TASK-027 — Dashboard cache phantom data

### Původní zadání:
Dashboard ukazuje neexistující pohyby.

### Nezávislá verifikace:

| Kontrolní bod | Výsledek |
|---------------|----------|
| db.ts:23 — `syncInterval: 10` (bylo 60) | PASS |
| returns/[id]/approve/route.ts:31 — `revalidateTag("dashboard", "max")` | PASS |
| returns/[id]/reject/route.ts:31 — `revalidateTag("dashboard", "max")` | PASS |
| reservations/[id]/route.ts:182 — complete → `revalidateTag("dashboard", "max")` | PASS |
| reservations/[id]/route.ts:211 — cancel → `revalidateTag("dashboard", "max")` | PASS |
| cron/expire-reservations/route.ts:79-81 — podmíněný `revalidateTag` | PASS |
| Podmínka `expiredCount > 0 \|\| expiredOrderCount > 0` — správná optimalizace | PASS |
| TypeScript kompilace (dle QA) | PASS |

---

## Shoda se zadáním:

**TASK-079:**
- Zadání: chybí informace o produktu v prodejní kartě
- Oprava: přidán processingType do zobrazení + datového flow
- Ostatní info (origin, texture, SKU, availableGrams) již existovalo
- Scope dodržen — 2 soubory

**TASK-027:**
- Zadání: dashboard ukazuje neexistující pohyby (phantom data)
- Oprava: syncInterval 60→10 + chybějící revalidateTag ve 4 routes
- Scope dodržen — 4 soubory

## Verdikt: **SCHVÁLENO**

Připraveno k deployi.
