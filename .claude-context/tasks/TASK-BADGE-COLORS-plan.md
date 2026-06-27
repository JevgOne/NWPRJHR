# Task #9: Fix Badge Colors -- Category Badges Need Unique Colors

**Date:** 2026-06-27
**Status:** Plan ready for implementation

---

## Problem

All category badges (Virgin, Premium, Standard, Sale) on product cards use the SAME style: `bg-rose text-white`. They need visual differentiation matching the dashboard color scheme.

---

## Target Colors (matching dashboard `categoryColors` in `dashboard/page.tsx`)

| Category | Background | Text | Badge style |
|----------|-----------|------|-------------|
| VIRGIN | bg-amber-100 | text-amber-800 | amber/gold theme |
| PREMIUM | bg-indigo-100 | text-indigo-800 | indigo/purple theme |
| STANDARD | bg-emerald-100 | text-emerald-800 | green theme |
| SALE | bg-rose-100 | text-rose-800 | rose/red theme (or keep bg-rose text-white for sale emphasis) |

---

## Implementation Steps

### Step 1: Create a shared category badge color map

Since these colors are used in multiple places (dashboard, product cards, offer page), define them once.

**Option A (simpler):** Define inline in each file where needed.
**Option B (better):** Create a shared constant.

Given that the dashboard already has `categoryColors` hardcoded, the simplest fix is to add the same map to the product card components.

### Step 2: Fix HeroProductSlider.tsx

**File:** `src/components/public/HeroProductSlider.tsx`

Line 91 -- change from:
```tsx
<span className="absolute top-2 left-2 px-2 py-1 rounded-md text-[11px] font-bold bg-rose text-white shadow-sm">
```

To use a category-based color:
```tsx
const categoryBadgeColors: Record<string, string> = {
  VIRGIN: "bg-amber-100 text-amber-800",
  PREMIUM: "bg-indigo-100 text-indigo-800",
  STANDARD: "bg-emerald-100 text-emerald-800",
  SALE: "bg-rose text-white",
};
```

Then on line 91:
```tsx
<span className={`absolute top-2 left-2 px-2 py-1 rounded-md text-[11px] font-bold shadow-sm ${categoryBadgeColors[product.category] ?? "bg-rose text-white"}`}>
```

### Step 3: Fix ProductsShowcase.tsx

**File:** `src/app/(public)/offer/ProductsShowcase.tsx`

Line 442 -- same pattern. Change from:
```tsx
className="absolute top-2 left-2 px-2 py-1 rounded-md text-[11px] font-bold bg-rose text-white shadow-sm hover:bg-rose-deep cursor-pointer"
```

To:
```tsx
const badgeColor = categoryBadgeColors[p.category] ?? "bg-rose text-white";
// ...
className={`absolute top-2 left-2 px-2 py-1 rounded-md text-[11px] font-bold shadow-sm cursor-pointer ${badgeColor}`}
```

Note: The hover effect (`hover:bg-rose-deep`) should also be adapted per category. For simplicity, add `hover:opacity-80` as a universal hover effect.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/public/HeroProductSlider.tsx` | Line 91: dynamic category badge color |
| `src/app/(public)/offer/ProductsShowcase.tsx` | Line 442: dynamic category badge color |

## Dependencies

None.

## Risk

- VERY LOW: purely visual CSS class changes
