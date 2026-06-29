# TASK-003 QA: Pre-check report — Length buttons

**Date:** 2026-06-28
**Status:** BLOCKED — Implementation task #2 still in_progress
**QA:** Kontrolor

---

## Build & TypeScript

- **tsc --noEmit:** PASS (no errors)
- **next build:** PASS (no errors, no warnings)

---

## Implementation status (AddToInquiryForm.tsx)

### NOT YET IMPLEMENTED

The length buttons in `AddToInquiryForm.tsx` (lines 128-143) currently show ONLY `{cm} cm`.
They do NOT show price/g or availableGrams. Required changes from TASK-060 plan are NOT applied:

| Requirement | Status |
|---|---|
| Length buttons show price/g | NOT DONE — buttons show only `{cm} cm` |
| Length buttons show availableGrams | NOT DONE |
| Out-of-stock buttons disabled | NOT DONE |
| Out-of-stock text from translations | NOT DONE |
| Step 3 price block removed | NOT DONE — still present (lines 151-180) |
| `availableLengths` returns `PickerVariant[]` | NOT DONE — returns `number[]` |

---

## Translation keys — `inquiry.outOfStock`

`ProductVariantPicker.tsx` uses `t("inquiry.outOfStock")` (line 150).
This key is **MISSING** from all three message files:

| File | `inquiry.outOfStock` present? |
|---|---|
| messages/cs.json | **MISSING** |
| messages/uk.json | **MISSING** |
| messages/ru.json | **MISSING** |

The key exists in `stock.outOfStock` and `salonPortal.outOfStock` but NOT in `inquiry` section.

---

## Dead code

`ProductVariantPicker.tsx` is still present but NOT imported anywhere in `src/`.
Per TASK-060 plan, it should be deleted after implementation.

---

## What QA will verify AFTER implementation

Once task #2 is complete, QA will check:

1. tsc — no errors
2. next build — no errors
3. Length buttons show 3 lines: `{cm} cm`, price/g, stock indicator
4. Out-of-stock buttons: `disabled`, opacity-50, show translated "outOfStock" text
5. `inquiry.outOfStock` key present in cs/uk/ru
6. Step 3 price block removed (no duplicate info)
7. Color → length flow still works
8. `ProductVariantPicker.tsx` deleted (or confirmed unused)

---

## Summary

Implementation has NOT started yet on the UI side. TSC and build are clean. Pre-check complete.
QA will re-run after task #2 is marked completed.
