# QA Report: TASK-050 — BY_PIECE partial gram sales

**QA date:** 2026-07-15
**QA by:** Kontrolor

---

## Verdict: PASS (with 1 minor pre-existing note)

All 6 files from the plan are correctly implemented. TypeScript passes. Build compilation passes (DB error at static generation is environment-only, unrelated to this change).

---

## 1. Simplify check

No unnecessary complexity introduced. The toggle is per-item state (`sellByGrams?: boolean`) — minimal footprint. No new abstractions or helper layers added. The FIFO piece-decrement fix is 4 lines. Code is clean and consistent with existing patterns.

One note: `saleItemSchema` (line 3–7 of `validations/sale.ts`) allows `grams=0, pieces=0` simultaneously — but this is a **pre-existing issue**, not introduced by TASK-050. The UI already guards against submitting with `grams=0 AND pieces=0` via `canSubmit`.

---

## 2. Debug check (build + tsc)

### `npx tsc --noEmit`
**Result: PASS — 0 errors.**

### `npm run build`
**Compile result: PASS** — "Compiled successfully in 6.3s", TypeScript finished in 6.9s with no errors.

**Build-time DB error:** `SQLITE_ERROR: no such table: main.variants` at `/[locale]/offer/[...slug]` page data collection. This is a **pre-existing environment issue** (Turso DB not available in local build context) — not caused by TASK-050 changes. The same error would have occurred before this PR.

---

## 3. Reverse check — plan vs implementation (all 6 files)

### File 1: `src/components/sales/SaleItemRow.tsx`
| Plan requirement | Implemented? |
|---|---|
| `sellByGrams?: boolean` added to `SaleItemData` | YES (line 15) |
| `onToggleSellByGrams?: () => void` added to props | YES (line 25) |
| Toggle button "Prodat po gramech" / "Prodat po kusech" | YES (lines 67–75) |
| Gram input shown when `sellByGrams=true` | YES (lines 76–85) |
| Piece input shown when `sellByGrams=false` | YES (lines 86–95) |
| `insufficientStock` uses `availableGrams` in gram mode | YES (lines 47–51) |
| Available stock display switches grams/pieces based on mode | YES (lines 120–124) |
| Price display shows `pricePerGram` in gram mode | YES (lines 130–134) |

**Result: PASS — fully matches plan.**

### File 2: `src/app/(app)/sales/new/NewSaleWizard.tsx`
| Plan requirement | Implemented? |
|---|---|
| `sellByGrams?: boolean` in `SaleItem` interface | YES (line 31) |
| `addItemFromVariantId`: `pricePerGram` and `availableGrams` populated for BY_PIECE | YES (lines 136, 141) |
| `sellByGrams: false` default when adding BY_PIECE item | YES (line 139) |
| `toggleSellByGrams(index)` handler with quantity reset | YES (lines 202–217) |
| Toggle resets `grams=0, pieces=0` when going to gram mode | YES (line 211) |
| Toggle resets `pieces=1, grams=0` when going back to piece mode | YES (line 212) |
| `updateItem`: BY_PIECE gram mode uses `pricePerGram * grams` | YES (lines 226–230) |
| `handleSubmit`: sends `pieces=0, grams=X` when `sellByGrams=true` | YES (lines 300–303) |
| `canSubmit`: BY_PIECE gram mode validates `grams > 0` | YES (lines 343–347) |
| `onToggleSellByGrams` passed to `SaleItemRow` for BY_PIECE items | YES (line 441) |
| Summary section shows gram info when `sellByGrams=true` | YES (lines 525–527) |

**Result: PASS — fully matches plan.**

### File 3: `src/lib/sales.ts`
| Plan requirement | Implemented? |
|---|---|
| `lineTotal`: uses `pricePerGram * grams` when `isByPiece && pieces === 0` | YES (lines 86–88) |
| `fifoLineTotal`: uses `pricePerGram * grams` when `isByPiece && pieces === 0` | YES (lines 145–147) |

**Result: PASS — fully matches plan.**

### File 4: `src/lib/fifo.ts`
| Plan requirement | Implemented? |
|---|---|
| Gram-deduction path checks `delivery.remainingPieces > 0 && delivery.pieceWeightGrams` | YES (line 94) |
| When `gramsAfterDeduction <= 0`, sets `piecesFromThis = delivery.remainingPieces` | YES (lines 95–98) |
| `delivery.update` decrements both `remainingGrams` and `remainingPieces` | YES (lines 107–110) |

**Logic verified:** When selling 150g from a 150g BY_PIECE delivery: `gramsFromThis=150`, `gramsAfterDeduction = 150 - 150 = 0 <= 0`, so `piecesFromThis = delivery.remainingPieces`. Both counters go to 0. Correct.

**Multi-piece edge case:** Selling 100g from a delivery with 3 pieces at 50g each (150g total): `gramsFromThis=100`, `gramsAfterDeduction=50`. `50 > 0` so `piecesFromThis=0`. `remainingGrams` goes from 150→50, `remainingPieces` stays at 3. This means 3 pieces are still shown as available pieces but only 50g of grams remain — the system will show inflated piece count. This is the plan's documented limitation ("for partial gram sales, only decrement pieces when ALL grams reach 0 — this is the safest approach"). **Acceptable per plan.**

**Result: PASS — matches recommended plan approach.**

### File 5: `src/app/api/sales/price-preview/route.ts`
| Plan requirement | Implemented? |
|---|---|
| BY_PIECE with `pieces > 0`: returns `pricePerPiece * pieces` | YES (line 36–37) |
| BY_PIECE with `pieces = 0`: returns `pricePerGram * grams` | YES (line 38) |
| Both cases return `pricePerPiece`, `pricePerGram`, `availableStock` | YES (lines 39–45) |

**Result: PASS — fully matches plan.**

### File 6: i18n (`cs.json`, `uk.json`, `ru.json`)
| Key | cs.json | uk.json | ru.json |
|---|---|---|---|
| `sale.sellByGrams` | "Prodat po gramech" | "Продати по грамах" | "Продать по граммам" |
| `sale.sellByPieces` | "Prodat po kusech" | "Продати поштучно" | "Продать поштучно" |

All 3 locales present and correctly placed under the `sale` namespace (line 1283–1284 in each file).

**Result: PASS.**

---

## 4. Issues found

| # | Severity | Issue | Introduced by TASK-050? |
|---|---|---|---|
| 1 | INFO | `saleItemSchema` allows `grams=0, pieces=0` simultaneously — no server-side validation that at least one is > 0 | NO — pre-existing |
| 2 | INFO | Multi-piece BY_PIECE gram sale leaves inflated `remainingPieces` count when partial grams consumed | KNOWN — documented in plan, acceptable |
| 3 | LOW | `SaleItemRow.tsx` line 58: hardcoded `"ks"` badge string instead of `tStock("pieces")` — flagged by Evžen. The value is functionally correct for CZ (`stock.pieces = "ks"`) but breaks UK/RU locales which would still show "ks" instead of their locale's word for pieces. Pre-existing code, not introduced by TASK-050. | NO — pre-existing |

**No blocking issues. No regressions introduced by TASK-050.**

---

## Summary

TASK-050 implementation is **complete and correct**. All plan requirements fulfilled across all 6 files. TypeScript clean. No new bugs introduced.
