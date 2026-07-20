# TASK-087: Fix photos/video not displaying on product detail

**Status:** Analysis complete — NO CODE BUG FOUND
**Author:** Planner
**Date:** 2026-07-19

---

## Summary

Photos and video uploaded to products don't display on the public product detail page.
The issue appeared after PhotoGallery.tsx was rewritten with swipe, lightbox, and 3:4 aspect ratio.

---

## Production verification (2026-07-19)

**Photos ARE displaying correctly on production:**

1. Checked `https://www.hairland.cz/api/public/products` — 34 products, 32 with photos
2. Checked `https://www.hairland.cz/offer/luxe-ukrajina-mirne-vlnite-2-55cm` — HTML contains:
   ```html
   <img src="https://usxv0mh0wvr3gzdk.public.blob.vercel-storage.com/products/illustrative/color-2.jpg" 
        alt="Luxe Vlasy — Mírně vlnité — ... — foto 1" 
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"/>
   ```
3. Image URL returns HTTP 200, content-type image/jpeg, 50KB — accessible
4. Products without photos show the placeholder SVG correctly
5. No TypeScript compilation errors

**Conclusion: The PhotoGallery component is working correctly on production. There is no code bug to fix.**

---

## What the implementor should verify

Since production appears to work, the reported issue may have been:
1. **Transient cache issue** — resolved after `revalidate: 60` timeout or redeploy
2. **Local dev issue** — local dev.db has 0 products (empty), so photos can't display locally
3. **Specific product issue** — only certain products may have had problems (e.g., HEIC upload failure)

The implementor should:
1. Ask the user to re-check if the issue still persists on production
2. If it does persist, identify which specific product URL shows the problem
3. Check browser DevTools console for JS errors and Network tab for failed requests

---

## Code analysis

### Data flow (verified correct)

1. **DB** → `photos` column is `String @default("[]")`, stores JSON array of Vercel Blob URLs
2. **Cache function** (`getCachedProductBySlug`, page.tsx:118-139) → `JSON.parse(product.photos || "[]") as string[]`
3. **Props** (page.tsx:754) → `<PhotoGallery photos={product.photos} video={product.video} alt={...} />`
4. **Component** (PhotoGallery.tsx:11) → receives `photos: string[]`, `video?: string | null`
5. **Render** (PhotoGallery.tsx:124-128) → `<img src={photos[selected]} ... />`

### PhotoGallery component (verified correct)

- `"use client"` directive present
- Props interface matches what's passed from page.tsx
- Conditional rendering logic correct (empty state, photo tab, video tab, tabs switcher)
- CSS chain valid: `aspect-[3/4]` container → `w-full h-full` button → `object-cover` img
- Touch/swipe/lightbox properly implemented
- No TypeScript errors (verified with `tsc --noEmit`)

### What I checked and ruled out

- ✓ `product.photos` is `string[]` (parsed from JSON in cache function), not raw JSON string
- ✓ `product.video` is `string | null` from Prisma
- ✓ Vercel Blob remote pattern configured in next.config.ts (not needed for raw `<img>`)
- ✓ No CSP headers blocking images
- ✓ `aspect-[3/4]` Tailwind class works (used elsewhere)
- ✓ Custom colors (nude-50, nude-100) defined in globals.css
- ✓ `revalidateTag("products", "max")` correct Next.js 16 API
- ✓ `unstable_cache` serialization safe (no DateTime/BigInt in selected fields)
- ✓ No middleware interfering
- ✓ No barrel export or import path issues
- ✓ Production HTML verified — `<img>` tags with correct URLs present
- ✓ Image URLs return HTTP 200 with correct content-type

---

## Files analyzed

| File | Status |
|------|--------|
| `src/app/[locale]/(public)/offer/[...slug]/PhotoGallery.tsx` | No bugs found |
| `src/app/[locale]/(public)/offer/[...slug]/page.tsx` | No bugs found |
| `src/app/api/products/[id]/media/route.ts` | No bugs found |
| `src/lib/validations/product.ts` | Correct schema |
| `src/lib/cached-products.ts` | Correct caching |
| `prisma/schema.prisma` | Correct model |
| `next.config.ts` | Remote patterns configured |
| `src/app/globals.css` | Custom colors defined |
| `src/proxy.ts` (middleware) | No interference |
