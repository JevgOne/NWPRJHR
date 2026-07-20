# TASK-089: Product detail premium design polish

**Status:** Plan ready
**Author:** Planner
**Date:** 2026-07-19
**Depends on:** TASK-087 (fix photo display first)

---

## Summary

Product detail page needs to feel premium/luxurious — like a high-end fashion/beauty e-shop. 
The gallery was already rewritten with 3:4 aspect, swipe, and lightbox. Now the surrounding layout, typography, spacing, and visual elements need polish.

---

## Current state analysis

**Color palette available:** nude-50/100/200, blush-100/200/300, rose, rose-deep, mauve, espresso, ink, muted, line, gold

**Current issues with premium feel:**
1. Container `max-w-5xl` is too narrow for luxury — premium sites use wider layouts
2. `py-8` padding is generic — needs more generous whitespace
3. Breadcrumb styling is utilitarian, not elegant
4. Product name `text-2xl font-bold` — needs more presence for luxury
5. Price section is compact and functional — needs luxury emphasis
6. Specs grid uses `bg-nude-50 rounded-2xl` — OK but could be more refined
7. Category features use `bg-amber-50` — generic amber, not on-brand
8. Delivery strip is dense `text-xs` — feels cluttered
9. Trust section uses generic icons — could use more refined styling
10. Sections (care, reviews, FAQ) have simple `border-t border-line` separators — functional but not premium

---

## Design plan

### File: `src/app/[locale]/(public)/offer/[...slug]/page.tsx`

#### 1. Layout & spacing (luxury breathability)

**Line 726** — Wider container + more padding:
```tsx
// FROM:
<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// TO:
<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
```

**Line 751** — More gap between gallery and info:
```tsx
// FROM:
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
// TO:
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
```

#### 2. Breadcrumb — elegant & minimal

**Lines 743-749** — Refined breadcrumb with smaller, more elegant styling:
```tsx
// FROM:
<nav className="flex items-center gap-1.5 text-sm text-muted mb-4">
// TO:
<nav className="flex items-center gap-2 text-xs tracking-wide uppercase text-muted/70 mb-6 lg:mb-8">
```
Change separators from `/` to `·` or thin SVG chevron for luxury feel.

#### 3. Product name — larger, more presence

**Line 762** — Larger heading for luxury:
```tsx
// FROM:
<h1 className="text-2xl font-bold text-ink">
// TO:
<h1 className="text-2xl lg:text-3xl font-bold text-ink tracking-tight">
```

#### 4. Price — premium emphasis

**Line 782-784** — Larger, more distinguished price:
```tsx
// FROM:
<span className="text-xl font-bold text-ink">
// TO:
<span className="text-2xl font-bold text-ink tracking-tight">
```

#### 5. Category subtitle — refined

**Lines 773-775** — More elegant category line:
```tsx
// FROM:
<p className="text-sm text-muted mt-1">
// TO:
<p className="text-sm text-muted mt-2 flex items-center gap-2 flex-wrap">
```
Use `<span>` separators with `·` instead of ` · ` raw text for consistent spacing.

#### 6. Specs grid — premium card feel

**Line 850** — Refined specs container:
```tsx
// FROM:
<div className="bg-nude-50 rounded-2xl p-4 grid grid-cols-2 gap-3">
// TO:
<div className="bg-nude-50/70 rounded-2xl p-5 grid grid-cols-2 gap-4 border border-line/30">
```
The subtle border and slightly more padding elevate the look.

#### 7. Category features — on-brand colors

**Lines 987-999** — Replace amber with brand colors:
```tsx
// FROM:
<div className="bg-amber-50 rounded-2xl p-4">
  <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">
  <li ... className="... text-sm text-amber-900">
    <span className="text-amber-600 mt-0.5">✓</span>
// TO:
<div className="bg-blush-100/40 rounded-2xl p-5 border border-blush-200/30">
  <div className="text-xs font-semibold text-rose-deep uppercase tracking-wider mb-3">
  <li ... className="... text-sm text-espresso/80">
    <span className="text-rose mt-0.5">✓</span>
```

#### 8. Delivery strip — cleaner layout

**Lines 1013-1017** — More spacious delivery info:
```tsx
// FROM:
<div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
// TO:
<div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted">
```
Grid layout instead of flex-wrap prevents cramped appearance.

#### 9. Trust guarantees — premium styling

**Lines 1021-1043** — More luxurious trust section:
```tsx
// FROM:
<div className="mt-4 rounded-xl bg-nude-50 p-4 space-y-3">
// TO:
<div className="mt-5 rounded-2xl bg-nude-50/50 p-5 space-y-4 border border-line/20">
```

#### 10. Section separators — luxury spacing

**Line 1084** (care tips), **line 1124** (FAQ) — More generous section spacing:
```tsx
// FROM:
<section className="mt-10 pt-8 border-t border-line">
// TO:
<section className="mt-14 pt-10 border-t border-line/50">
```
Lighter border color and more spacing between sections.

#### 11. No-retouch section — on-brand

**Line 1049** — Replace amber with brand palette:
```tsx
// FROM:
<div className="rounded-2xl bg-amber-50/50 p-5 space-y-3">
// TO:
<div className="rounded-2xl bg-nude-100/60 p-5 space-y-3 border border-line/30">
```
Replace `text-amber-700/800/600` → `text-espresso`, `text-rose-deep`, `text-rose` respectively.

### File: `src/app/[locale]/(public)/offer/[...slug]/PhotoGallery.tsx`

#### 12. Gallery — subtle refinements

**Line 114** — Slightly larger rounded corners for main image:
```tsx
// Already has rounded-2xl — good. No change needed.
```

**Line 132** — Zoom hint badge more elegant:
```tsx
// FROM:
<div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white/80 rounded-full p-2 ...">
// TO:
<div className="absolute bottom-3 right-3 bg-black/30 backdrop-blur-md text-white/70 rounded-full p-2.5 ...">
```

**Line 158** — Photo counter — more refined:
```tsx
// FROM:
<div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
// TO:
<div className="absolute top-3 left-3 bg-black/30 backdrop-blur-md text-white/90 text-[11px] font-medium px-3 py-1 rounded-full tracking-wide">
```

---

## Design principles applied

1. **Breathability**: More whitespace between sections, larger padding
2. **Consistency**: Replace off-brand amber with the existing blush/rose/espresso palette  
3. **Subtlety**: Lighter borders, lower-opacity backgrounds, backdrop-blur
4. **Typography**: Tracking-tight for headings, uppercase-tracking for labels
5. **Hierarchy**: Larger product name, clearer price emphasis
6. **Restraint**: No new colors or radical layout changes — polish what exists

---

## Files to modify

| # | File | Change |
|---|------|--------|
| 1 | `src/app/[locale]/(public)/offer/[...slug]/page.tsx` | Layout spacing, typography, color refinements (CSS class changes only) |
| 2 | `src/app/[locale]/(public)/offer/[...slug]/PhotoGallery.tsx` | Minor badge/overlay refinements (CSS class changes only) |

**Note:** All changes are CSS-only (Tailwind class modifications). No logic changes, no new components, no new dependencies.
