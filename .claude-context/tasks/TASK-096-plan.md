# Dashboard zobrazuje smazané/stornované prodeje — Analýza

**Task:** #96
**Datum:** 2026-07-20

---

## Diagnóza: PROČ se smazané prodeje zobrazují

### Příčina 1 (HLAVNÍ): Cache invalidace chybí při stornu prodeje

**Dashboard cache:**
- `src/app/(app)/dashboard/page.tsx:39-141`
- Používá `unstable_cache` s `revalidate: 60` a tagem `"dashboard"`
- Data se načtou z DB, uloží do cache, a servírují 60 sekund bez DB dotazu

**Co invaliduje cache:**
| Akce | Volá `revalidateTag("dashboard")`? |
|------|------|
| Vytvoření prodeje (`sales/route.ts:139`) | ANO |
| Naskladnění (`deliveries/route.ts:263,313`) | ANO |
| Úprava delivery (`deliveries/[id]/route.ts:203`) | ANO |
| **Storno prodeje (`sales/[id]/route.ts`)** | **NE — CHYBÍ** |
| Smazání přes DB (Turso console, Prisma Studio) | NE (nelze) |

**Důsledek:** Po stornu prodeje dashboard stále zobrazuje starý aggregate. Cache se invaliduje až za 60 sekund (time-based revalidation), nebo při dalším prodeji/naskladnění.

### Příčina 2 (DOPLŇKOVÁ): Neexistuje hard-delete prodejů

- `sales/[id]/route.ts` má POUZE akci `"cancel"` — soft delete (status → CANCELLED)
- Neexistuje `DELETE` handler ani `deleteSale` funkce v celé codebase
- Uživatel tedy "maže" prodeje stornováním (cancel)

### Příčina 3 (EDGE CASE): Direct DB delete

Pokud uživatel smazal záznamy přímo v Turso console:
- `unstable_cache` o tom NEVÍ — cache je stale
- Neexistuje žádný mechanismus jak ručně invalidovat dashboard cache bez API call
- Time-based revalidation (60s) nakonec data obnoví, ale uživatel to pozoruje jako "pořád se zobrazují"

---

## Dashboard dotazy — filtrace

Dashboard korektně filtruje `status: "COMPLETED"`:

| Metrika | Where klauzule | Filtruje cancelled? |
|---------|---------------|---------------------|
| Prodeje tento měsíc (ř. 58-62) | `status: "COMPLETED", completedAt >= monthStart` | ANO |
| Nezaplacené faktury (ř. 78-82) | `status: "COMPLETED", paymentType: "TRANSFER"` | ANO |
| Celkové prodeje (ř. 86-89) | `status: "COMPLETED"` | ANO |
| Prodané gramy (ř. 92-95) | `sale: { status: "COMPLETED" }` | ANO |

**Takže:** Stornované prodeje by se po invalidaci cache NEMĚLY zobrazovat. Problém je čistě cache timing.

---

## Fix — implementační plán

### Krok 1: Přidat `revalidateTag("dashboard")` do cancel akce

**Soubor:** `src/app/api/sales/[id]/route.ts`

**Změna:** Na řádku ~1-2 přidat import, po úspěšném stornu (ř. 155) přidat:

```ts
import { revalidateTag } from "next/cache";

// ... v POST handleru, po logAudit (ř. 155):
revalidateTag("dashboard", "max");
```

**To je celá oprava. 2 řádky.**

### Krok 2 (volitelný): Snížit revalidate interval

Aktuální: `revalidate: 60` (60 sekund)

Možnosti:
- **30 sekund** — kompromis mezi čerstvostí a výkonem
- **0** — žádná cache, vždy čerstvé (ale pomalejší dashboard load)
- **Nechat 60** — OK pokud Krok 1 je implementován (tag invalidace je okamžitá)

**Doporučení:** Nechat 60 sekund. S opravou cache invalidace v Kroku 1 bude dashboard čerstvý po každé relevantní akci. 60s fallback je jen pro případ přímého DB zásahu.

### Krok 3 (volitelný): Audit dalších chybějících invalidací

Operace které mění dashboard data ale NEVOLAJÍ `revalidateTag("dashboard")`:

| Operace | Soubor | Dopad |
|---------|--------|-------|
| Storno prodeje | `sales/[id]/route.ts` | VYSOKÝ — opravit v Kroku 1 |
| Completion order → sale | `orders/[id]/route.ts` | STŘEDNÍ — nový prodej z objednávky |
| Comgate callback → sale | `comgate/callback/route.ts` | STŘEDNÍ — platba kartou |
| Expire reservations (cron) | `cron/expire-reservations/route.ts` | NÍZKÝ — nemění prodeje |

**Doporučení:** Přidat `revalidateTag("dashboard")` i do:
- `orders/[id]/route.ts` — po `createSaleFromOrder` (case "complete")
- `comgate/callback/route.ts` — po `createSaleFromOrder` (PAID callback)

---

## Shrnutí

| Co | Stav |
|----|------|
| Dashboard filtruje cancelled? | ANO — `status: "COMPLETED"` |
| Hard delete existuje? | NE — jen soft cancel |
| Cache invalidace při stornu? | **NE — CHYBÍ** (root cause) |
| Fix | 2 řádky: import + `revalidateTag("dashboard")` v sales/[id]/route.ts |
| Další chybějící invalidace | orders/[id] complete, comgate callback |
