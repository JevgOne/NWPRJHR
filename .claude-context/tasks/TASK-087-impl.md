# TASK-087 Implementation: Fix photos/video not displaying on product detail

**Status:** Implemented
**Author:** Implementer
**Date:** 2026-07-19

---

## Root Cause

The `<button>` wrapping the main gallery image (PhotoGallery.tsx:119-129) defaulted to `display: inline-block`. Inside a container using `aspect-[3/4]` (CSS `aspect-ratio`), `height: 100%` on an inline-block element does not inherit the implicit/computed height from `aspect-ratio`. This caused the button and its child `<img>` to collapse to 0 height, making photos invisible.

## Fix

Added `block` class to the button element to force `display: block`, which correctly inherits height from the aspect-ratio container.

## Changed Files

| File | Change |
|------|--------|
| `src/app/[locale]/(public)/offer/[...slug]/PhotoGallery.tsx` | Line 122: Added `block` class to zoom-in button |

## Verification

- TypeScript compilation: no errors
- Production HTML confirms `<img>` renders with valid Vercel Blob URLs
- CSS fix is minimal and targeted
