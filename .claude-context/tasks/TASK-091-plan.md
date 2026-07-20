# TASK-091: Top info bar with contacts above navigation

**Status:** Plan ready
**Author:** Planner
**Date:** 2026-07-19

---

## Summary

Add a colored top info bar above the main `PublicNavbar`. Contains phone, email, address, and social media icons. Similar to profibeauty.cz style. Dark background from brand palette (espresso).

---

## Current Architecture

- Public layout: `src/app/[locale]/(public)/layout.tsx`
  - Renders `<PublicNavbar />` directly (line 22)
- Navbar: `src/components/public/PublicNavbar.tsx`
  - `<nav className="sticky top-0 z-50 ...">` (line 177)
  - Height: `h-16`
- Footer already has all contact info: `src/components/public/PublicFooter.tsx`
  - Email: info@hairland.cz
  - Phone: +420 608 553 103
  - WhatsApp: wa.me/420608553103
  - Telegram: t.me/+420608553103
  - Instagram: instagram.com/hairland.cz/
  - Facebook: facebook.com/profile.php?id=61591480246246
  - Location: Praha, Ceska republika (from i18n key `public.footer.locationCity`)

---

## Implementation Plan

### Option A (recommended): Add TopInfoBar as a separate component

Create a new `TopInfoBar` component and render it above `PublicNavbar` in the layout.

### Step 1: Create TopInfoBar component

**New file: `src/components/public/TopInfoBar.tsx`**

```tsx
import { useTranslations } from "next-intl";

export function TopInfoBar() {
  const t = useTranslations("public");

  return (
    <div className="bg-espresso text-nude-200/80 text-[11px] hidden lg:block">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-8">
        {/* Left: contact info */}
        <div className="flex items-center gap-4">
          <a href="tel:+420608553103" className="flex items-center gap-1 hover:text-white transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            +420 608 553 103
          </a>
          <a href="mailto:info@hairland.cz" className="flex items-center gap-1 hover:text-white transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            info@hairland.cz
          </a>
          <span className="flex items-center gap-1 text-nude-200/50">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t("footer.locationCity")}
          </span>
        </div>

        {/* Right: social icons */}
        <div className="flex items-center gap-3">
          <a href="https://wa.me/420608553103" target="_blank" rel="noopener noreferrer"
             className="text-nude-200/50 hover:text-white transition-colors" aria-label="WhatsApp">
            {/* WhatsApp SVG icon (same as footer, scaled to w-3.5 h-3.5) */}
          </a>
          <a href="https://www.instagram.com/hairland.cz/" target="_blank" rel="noopener noreferrer"
             className="text-nude-200/50 hover:text-white transition-colors" aria-label="Instagram">
            {/* Instagram SVG icon */}
          </a>
          <a href="https://www.facebook.com/profile.php?id=61591480246246" target="_blank" rel="noopener noreferrer"
             className="text-nude-200/50 hover:text-white transition-colors" aria-label="Facebook">
            {/* Facebook SVG icon */}
          </a>
        </div>
      </div>
    </div>
  );
}
```

Key design decisions:
- `bg-espresso` — same as footer, maintains brand consistency
- `text-nude-200/80` — subtle light text on dark bg
- `text-[11px]` — very small, utility text
- `hidden lg:block` — **hidden on mobile/tablet**, only shows on desktop (lg+)
- `h-8` — compact 32px height
- `max-w-6xl` — matches navbar/footer container width
- Social icons use same SVGs from footer, scaled down to `w-3.5 h-3.5`

### Step 2: Add to public layout

**File: `src/app/[locale]/(public)/layout.tsx`**

```tsx
// Add import:
import { TopInfoBar } from "@/components/public/TopInfoBar";

// In the JSX, before PublicNavbar:
<TopInfoBar />
<PublicNavbar />
```

### Step 3: Adjust PublicNavbar sticky behavior

The navbar currently uses `sticky top-0`. With the TopInfoBar above it, the navbar will scroll away with the page initially but stick at the top when the TopInfoBar scrolls out of view. This is the **desired behavior** (same as profibeauty.cz) — no code change needed!

If instead we want BOTH the top bar and navbar to stay sticky, we would need to change the navbar to `sticky top-8 lg:top-8`. But this is NOT recommended — the top bar should scroll away to save vertical space.

### Step 4: Consider "use client" vs server component

The TopInfoBar only uses `useTranslations` for the location city text. In next-intl with Next.js 16, `useTranslations` requires "use client". However, since the text is essentially static, we could use server-side translation instead. But since the parent layout already imports client components and the overhead is minimal, keeping it as a client component is fine.

**Alternative**: Make it a server component using `getTranslations`:
```tsx
import { getTranslations } from "next-intl/server";

export async function TopInfoBar() {
  const t = await getTranslations("public");
  // ... same JSX but no "use client"
}
```

This is slightly better for performance (no client JS). The implementor can choose.

---

## Files to modify

| # | File | Change |
|---|------|--------|
| 1 | `src/components/public/TopInfoBar.tsx` | **NEW**: TopInfoBar component |
| 2 | `src/app/[locale]/(public)/layout.tsx` | Import and render TopInfoBar above PublicNavbar |

---

## Design Reference

Like profibeauty.cz:
- Thin strip at very top of page
- Dark background (they use teal; we use espresso for brand consistency)
- Contact info on left (phone, email, address)
- Social icons on right
- Hidden on mobile (saves vertical space)
- Scrolls away when user scrolls down (navbar remains sticky)

---

## Testing

1. Desktop (lg+): top bar visible with phone, email, address on left; social icons on right
2. Mobile/tablet: top bar hidden
3. Scroll down: top bar scrolls out of view, navbar stays sticky at top
4. Links work: phone opens dialer, email opens mail client, socials open in new tab
5. Locales: location city text translates correctly (cs/uk/ru)
