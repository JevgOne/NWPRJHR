# TASK-088 Implementation: Category change updates name/slug/variant prices

**Status:** Implemented
**Author:** Implementer
**Date:** 2026-07-19

---

## Changes

**File:** `src/app/api/products/[id]/route.ts`

### What was added:

1. **CATEGORY_NAMES map** (lines 9-14) — same as in `deliveries/route.ts`, maps category enum to localized names (cs/uk/ru)

2. **slugify function** (lines 16-21) — same as in `deliveries/route.ts`, converts text to URL-safe slug

3. **Category-change logic in PUT handler** (lines 57-124) — when `parsed.data.category` is present and differs from current:
   - Fetches current product with texture, origin, and active variants
   - Regenerates `name`, `nameUk`, `nameRu` using pattern `"{CatName} — {Texture}"`
   - Regenerates `slug` using pattern `{category}-{origin}-{texture}-{color}-{lengthCm}cm`
   - Fetches `PriceSettings` for new category's `markupPercent`
   - Recalculates `retailPricePerGram` for all active variants (skips `retailManualOverride = true`)
   - Also recalculates `retailPricePerPiece` for BY_PIECE variants
   - All variant updates run in parallel via `Promise.all`

### Edge cases handled:
- Same category (no change) — skips all side effects
- No active variants — skips price recalculation, uses shorter slug pattern
- Manual price overrides — respected (not overwritten)
- Missing texture — gracefully degrades to empty string in name/slug
- Missing PriceSettings — falls back to 100% markup

## Verification
- TypeScript compilation: no errors
- Logic matches deliveries/route.ts product creation pattern exactly
