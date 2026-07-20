# QA Pre-check: TASK-087 — Photos/video not displaying on product detail

**Status:** Pre-implementation code analysis (no impl file yet)
**Date:** 2026-07-19
**Reviewer:** QA Kontrolor

---

## Code Flow Analysis

### Data path: DB → PhotoGallery

1. `getCachedProductBySlug` (page.tsx:118–139)
   - Fetches product with `productSelect` (includes `photos: true`, `video: true`)
   - Transforms: `photos: JSON.parse(product.photos || "[]") as string[]` ✅
   - `video` is included via `...product` spread — passed as `string | null` ✅

2. `PhotoGallery` is called at page.tsx:754:
   ```tsx
   <PhotoGallery photos={product.photos} video={product.video} alt={...} />
   ```
   - Props type: `photos: string[]`, `video?: string | null` — matches component interface ✅

3. Upload path (media/route.ts):
   - Photos uploaded → Vercel Blob → URL stored as JSON array in `product.photos`
   - Video uploaded → Vercel Blob → URL stored in `product.video`
   - `revalidateTag("products", "max")` called after upload ✅

---

## Identified Issues

### ISSUE 1 — CRITICAL: `<button>` with `h-full` inside aspect-ratio container

**File:** `PhotoGallery.tsx:113–129`

```tsx
<div className="relative w-full aspect-[3/4] bg-nude-50 rounded-2xl overflow-hidden group">
  <button type="button" onClick={...} className="w-full h-full cursor-zoom-in">
    <img src={photos[selected]} ... className="w-full h-full object-cover ..." />
  </button>
```

`<button>` is `display: inline-block` by default (even after Tailwind preflight). The `h-full` class requires the parent to have an explicit height. CSS `aspect-ratio` creates an implicit/computed height — children using `h-full` inside an aspect-ratio container often don't inherit the height correctly without `position: absolute` or `display: block` / `flex` on the button.

**Effect:** The button collapses to 0 height, the `<img>` collapses, photos appear invisible (container background color shows instead).

**Fix:** Add `block` class to the button, or use `absolute inset-0` positioning:
```tsx
<button type="button" onClick={...} className="block w-full h-full cursor-zoom-in">
```
or
```tsx
<button type="button" onClick={...} className="absolute inset-0 cursor-zoom-in">
  <img ... className="w-full h-full object-cover ..." />
</button>
```

### ISSUE 2 — Minor: `<img>` warnings (no functional impact)

ESLint reports 3 warnings for `<img>` vs `<Image />` from next/image (lines 124, 194, 264). These are performance warnings only — not the cause of photos not displaying.

### ISSUE 3 — Minor: Lightbox arrows overlap with main image click

The arrow buttons inside the photo container call `e.stopPropagation()` to prevent the lightbox from opening. This is correct. No bug here.

---

## Conditional Rendering Verification

| Condition | Expected | Verdict |
|-----------|----------|---------|
| `photos = []`, `video = null` | Placeholder SVG | ✅ Correct (line 69–77) |
| `photos = []`, `video = URL` | Inline video (no tabs) | ✅ Correct (lines 221–233) |
| `photos = [URL]`, `video = null` | Photo only, no tabs | ✅ Correct (tab=photo, no hasVideo) |
| `photos = [URL]`, `video = URL` | Tabs shown, photo default | ✅ Correct |
| `photos.length > 1` | Arrows + dots + thumbnails | ✅ Correct |

---

## Cache Invalidation

- `revalidateTag("products", "max")` — correct for this Next.js version (second arg required)
- Called in: `media/route.ts:203`, `products/[id]/route.ts:58,86` ✅
- Cache TTL: `revalidate: 60` for product-by-slug — so even without explicit invalidation, cache expires in 60s ✅

---

## Summary

**Root cause of bug:** `<button className="w-full h-full">` collapses to zero height inside an `aspect-[3/4]` container because `h-full` on a non-positioned, inline-block element does not inherit the implicit height from CSS `aspect-ratio`.

**Recommended fix:** Add `block` to the button's className, or use `absolute inset-0`.

**No issues found in:**
- Data fetching/passing
- URL handling (Vercel Blob URLs stored and served correctly)
- Cache invalidation logic
- TASK-088 related code (CATEGORY_NAMES map, slugify — both exist in deliveries/route.ts:60–72, needed for TASK-088 impl in products/[id]/route.ts PUT handler)
