# Task #18: Setup Favicons for Google -- Proper Sizes and Manifest

**Date:** 2026-06-27
**Status:** Plan ready for implementation

---

## Current State Analysis

### What already exists:

1. **`src/app/favicon.ico`** -- Multi-size ICO (16x16, 32x32). Next.js auto-serves this at `/favicon.ico`.
2. **`src/app/icon.svg`** -- SVG icon (128x128, brown "H" on dark background). Next.js auto-serves at `/icon.svg`.
3. **`public/icons/icon-192x192.png`** -- 192x192 PNG (1.8KB). Valid PNG.
4. **`public/icons/icon-512x512.png`** -- 512x512 PNG (5.4KB). Valid PNG.
5. **`public/manifest.json`** -- References both PNG icons with `purpose: "any maskable"`.
6. **`src/app/layout.tsx`** line 24: `manifest: "/manifest.json"` in metadata.
7. **`src/app/layout.tsx`** line 70: `<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />`.

### What's missing for Google:

Google Search uses specific favicon requirements:
- A proper `apple-touch-icon` should be **180x180** (the 192x192 works but 180x180 is the Apple spec)
- The `manifest.json` description says "Interni system" which is wrong for public-facing site
- Google Search looks for favicons via:
  1. `<link rel="icon">` tags (Next.js handles via `favicon.ico` and `icon.svg`)
  2. `/favicon.ico` at domain root (exists)
  3. Web app manifest icons (exists)

### Issues found:

1. **manifest.json `description`** says "Interni system pro velkoobchod s vlasy k prodlouzeni" -- this is the internal admin description, not the public-facing brand description. Should match the public metadata.

2. **No explicit `icons` in Next.js metadata** -- Next.js auto-detects `favicon.ico` and `icon.svg` from `src/app/`, but explicit `icons` metadata gives more control and ensures Google picks up the right sizes.

3. **apple-touch-icon is 192x192** instead of the standard 180x180 -- works but not spec-compliant. Could create a 180x180 version.

4. **manifest `purpose: "any maskable"`** -- Google recommends using separate entries for `any` and `maskable` purposes, not combined.

---

## Implementation Steps

### Step 1: Add explicit `icons` to Next.js metadata

**File:** `src/app/layout.tsx`

In `generateMetadata()`, add `icons` field:

```typescript
icons: {
  icon: [
    { url: "/favicon.ico", sizes: "32x32" },
    { url: "/icon.svg", type: "image/svg+xml" },
  ],
  apple: [
    { url: "/icons/icon-192x192.png", sizes: "192x192" },
  ],
},
```

This generates the proper `<link>` tags that Google and browsers look for. The manual `<link rel="apple-touch-icon">` in the `<head>` (line 70) can then be removed since Next.js metadata handles it.

### Step 2: Fix manifest.json description

**File:** `public/manifest.json`

Change description from internal to public-facing:

```json
{
  "name": "Hairland — Prémiové vlasy k prodloužení",
  "short_name": "Hairland",
  "description": "Prémiové přírodní vlasy k prodloužení — clip-in, tape-in, micro ring. Skladem v Praze.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fdfaf7",
  "theme_color": "#3a2c2a",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

Key changes:
- `name` updated to public brand
- `description` updated to public-facing
- `background_color` changed to match site cream/nude color
- `theme_color` changed to match brand espresso color
- Split `purpose: "any maskable"` into separate entries per Google recommendation

### Step 3: Remove manual apple-touch-icon from head

**File:** `src/app/layout.tsx`

Remove line 70:
```tsx
<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
```

This is now handled by the `icons.apple` in metadata (Step 1).

### Step 4 (optional): Create apple-touch-icon at 180x180

The current 192x192 icon works for Apple devices, but the spec calls for 180x180. If pixel-perfect compliance is desired:

```bash
# Using sips (macOS built-in):
sips -z 180 180 public/icons/icon-192x192.png --out public/apple-touch-icon.png
```

Then update the metadata to reference it:
```typescript
apple: [
  { url: "/apple-touch-icon.png", sizes: "180x180" },
],
```

This step is optional -- the 192x192 works fine in practice.

---

## Google Favicon Requirements Checklist

After implementation, the site will satisfy all Google requirements:

- [x] `favicon.ico` at domain root (Next.js serves from `src/app/favicon.ico`)
- [x] SVG icon for modern browsers (Next.js serves from `src/app/icon.svg`)
- [x] 192x192 PNG in manifest (exists at `/icons/icon-192x192.png`)
- [x] 512x512 PNG in manifest (exists at `/icons/icon-512x512.png`)
- [x] Web app manifest linked in HTML (`<link rel="manifest">` via metadata)
- [x] Apple touch icon (via `icons.apple` metadata)
- [x] Explicit `<link rel="icon">` tags (via `icons.icon` metadata)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/layout.tsx` | Add `icons` to metadata, remove manual apple-touch-icon `<link>` |
| `public/manifest.json` | Fix name, description, colors, split icon purposes |

## Files NOT Modified

- `src/app/favicon.ico` -- keep as-is (valid multi-size ICO)
- `src/app/icon.svg` -- keep as-is (clean SVG)
- `public/icons/icon-192x192.png` -- keep as-is (valid 192x192 PNG)
- `public/icons/icon-512x512.png` -- keep as-is (valid 512x512 PNG)

## Dependencies

None.

## Risk

- VERY LOW: metadata and manifest changes only
- No visual changes to the site
- Favicon changes may take time to propagate in Google (they cache aggressively)
