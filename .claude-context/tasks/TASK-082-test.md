# TEST REPORT: Rezervační systém — Browser Test (finální)
**Datum:** 2026-07-16  
**Tester:** TEST-CHROME  
**Dev server:** http://localhost:3030  
**Login:** owner@hairora.cz / owner123

---

## VÝSLEDKY SCÉNÁŘŮ

| # | Scénář | Stav | Detail |
|---|--------|------|--------|
| S0 | Login jako OWNER | **OK** | Přihlášení funguje, redirect /dashboard |
| S8 | Sidebar — "Rezervace" odkaz | **OK** | Viditelný v sekci PRODEJ, href=/reservations |
| S1 | GET /reservations | **OK** | HTTP 200, heading "Rezervace" |
| S1 | API /api/reservations | **OK** | HTTP 200, `{"data":[],"total":0}` — prázdné pole |
| S1 | Empty state | **OK** | "Žádné rezervace" zobrazeno správně |
| S1 | Status filtry | **OK** | Filtrační tlačítka přítomná |
| S2 | Tlačítko "Nová rezervace" | **OK** | Viditelné, klikatelné |
| S2 | Navigace na /reservations/new | **OK** | URL správná |
| S3 | Tlačítka Salon / Koncový zákazník | **OK** | Obě viditelná |
| S3 | Klik "Salon" | **OK** | Funguje po fix (f781aa0) — search input se zobrazí, žádné JS errory |
| S3 | Klik "Koncový zákazník" | **OK** | Formulářová pole se zobrazí |
| S4-S7 | Vytvoření + akce | **SKIP** | Přeskočeno — žádné produkty v dev DB, submit zůstává disabled |

**VÝSLEDEK: 11 OK, 0 FAIL, 4 SKIP**

---

## OPRAVENÉ BUGY

### Bug #1 — CustomerSelect crash při výběru "Salon" — OPRAVENO (f781aa0)

**Závažnost:** Vysoká  
**Kde:** `/reservations/new` → klik na "Salon"  
**Error (původní):** `TypeError: salons.filter is not a function`  
**Příčina:** `CustomerSelect` fetchoval `/api/salons?archived=false` a volal `.filter()` přímo na response objektu `{data:[], total:0, ...}` místo na `.data` poli.  
**Fix:** `setSalons(res.data ?? [])` — commit f781aa0  
**Ověřeno:** Po klik "Salon" se zobrazí search input "Hledat", žádné JS errory, žádná error boundary.

---

## KOMPLETNÍ STAV

| Oblast | Stav |
|--------|------|
| Auth + session | OK |
| Middleware /reservations guard | OK (proxy.ts opravena) |
| /reservations seznam | OK — HTTP 200, API 200, empty state |
| /reservations/new načtení | OK |
| Výběr "Salon" | OK — search input se zobrazí, žádný crash |
| Výběr "Koncový zákazník" | OK — pole se zobrazí |
| Vytvoření rezervace (S4-S7) | SKIP (žádné produkty v dev DB) |

---

## SCREENSHOTS

- `/tmp/final-dashboard.png` — dashboard s navigací
- `/tmp/final-s1-list.png` — seznam rezervací (empty state)
- `/tmp/final-s2-new.png` — /reservations/new výchozí
- `/tmp/salon-fix-confirmed.png` — Salon výběr po fix (funguje)
- `/tmp/salon-search.png` — search input po klik Salon
