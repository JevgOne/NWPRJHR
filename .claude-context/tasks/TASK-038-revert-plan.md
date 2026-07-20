# TASK-038: CreateProductForm comparison — before vs after commit 0ac20f6

**Status:** Analysis complete
**Author:** Planner
**Date:** 2026-07-15

---

## What commit 0ac20f6 changed

Commit: `0ac20f6 Overhaul product creation form: auto-name, no processingType, inline variants`
This commit was created by our implementor based on my TASK-038 plan.

---

## Side-by-side comparison

### BEFORE (0ac20f6^) — Original form

Fields in order:
1. **Name (CZ)** — `<Input>` text field, required
2. **Name (UK)** — `<Input>` text field
3. **Name (RU)** — `<Input>` text field
4. **Description** — `<Input>` text field
5. **Category** dropdown — VIRGIN/LUXE/STANDARD/SALE
6. **Processing Type** dropdown — CLIP_IN/TAPE_IN/KERATIN/WEFT/MICRO_RING/OTHER
7. **Origin** — autocomplete with flags
8. **Texture** — autocomplete with icons
9. **Color Tone** — autocomplete with color circles
10. **Photos** — PhotoUpload component
11. **Slug** — `<Input>` text field
12. **Save/Cancel** buttons

### AFTER (0ac20f6 = current) — New form

Fields in order:
1. **Category** dropdown — VIRGIN/LUXE/STANDARD/SALE (moved up)
2. **Origin** — autocomplete with flags (same)
3. **Texture** — autocomplete with icons (same)
4. **Color Tone** — autocomplete with color circles (same)
5. **Name preview** — read-only box showing auto-generated name (NEW)
6. **Photos** — PhotoUpload component (same)
7. **Variants** — inline rows: lengthCm input + color dropdown + remove button (NEW)
8. **Save/Cancel** buttons

---

## Detailed diff

### REMOVED
| Field | What it was | Why removed |
|-------|------------|-------------|
| Name (CZ/UK/RU) | 3 manual text inputs | Auto-generated from category + texture |
| Description | Manual text input | Auto-generated via product-bio |
| Processing Type | Dropdown (CLIP_IN etc.) | Business sells RAW hair, hardcoded "OTHER" |
| Slug | Manual text input | Auto-generated from name via slugify() |

### ADDED
| Field | What it is | Purpose |
|-------|-----------|---------|
| Name preview | Read-only box: `"Panenske Vlasy — Mirne vlnite"` | Shows auto-generated name before submit |
| Variants section | Repeatable rows: `lengthCm` number + `color` dropdown | Create product WITH variants in one step |

### MOVED
| Field | Before | After |
|-------|--------|-------|
| Category | Position 5 (after name/desc) | Position 1 (first field) |

### UNCHANGED
| Field | Notes |
|-------|-------|
| Origin | Same autocomplete with flags |
| Texture | Same autocomplete with icons |
| Color Tone | Same autocomplete with color circles |
| Photos | Same PhotoUpload component |
| Save/Cancel buttons | Same |

---

## Visual/structural impact

### Layout changes
- **Header** unchanged: `"Pridat — Produkty"` with same styling
- **Card wrapper** unchanged: same `<Card>` component
- **Form spacing** unchanged: `space-y-4`
- **Field styling** unchanged: same border/rounded-lg classes

### What looks "different" to the user
1. **Top of form is different** — category is now first (was 5th), name fields are gone
2. **Middle section shorter** — no name/description/processingType = 5 fewer fields
3. **New section at bottom** — variants with number input + color dropdown + add/remove buttons
4. **Name preview box** — new light-background box with generated name
5. **Slug field gone** — auto-generated

### What looks THE SAME
- Origin/Texture/ColorTone autocompletes look identical
- Photos section unchanged
- Save/Cancel buttons unchanged
- Overall Card layout unchanged

---

## Assessment: Is the new form correct?

**YES, the changes match what the user asked for:**
1. "Nazev se ma generovat automaticky" -> auto-name from category + texture (DONE)
2. "Typ zpracovani NEMA tam byt" -> processingType removed (DONE)
3. "Chybi delky/varianty" -> inline variant creator added (DONE)

**The user's "TO TAKHLE NEBYLO" likely refers to:**
- The visual difference of having fewer fields at the top (no name/desc) and a new variants section at the bottom
- This is EXPECTED — the form was redesigned per their requirements

---

## If user wants to revert

If the user truly wants the OLD form back:
```bash
git revert 0ac20f6
```

But this would bring back all the problems they complained about (manual name, processingType, no variants).

**More likely scenario:** The user may want specific adjustments to the NEW form rather than a full revert. Ask what specifically looks wrong.

---

## Possible refinements to the NEW form

If user is unhappy with specific aspects:

1. **Add slug field back** — some users want manual control over URLs
2. **Add description field back** — for manual product descriptions  
3. **Move name preview higher** — make it more prominent (currently after colorTone)
4. **Improve variants UI** — add color swatches to dropdown, show price fields
5. **Add validation feedback** — highlight which variant rows are incomplete

None of these require reverting the entire commit.
