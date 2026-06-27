# Task #4: Store and Display Salon Contact Phone Number

**Date:** 2026-06-27
**Status:** Plan ready for implementation

---

## Problem

User provided salon WA/Telegram phone number: `+420 728 729 666`. This needs to be displayed on the public-facing site where relevant (contact page, footer).

---

## Current State

### Footer (`src/components/public/PublicFooter.tsx`)

Contact section (lines 106-123) currently shows:
- Email: `info@hairland.cz`
- Location: city from translation

**Missing: phone number, WhatsApp, Telegram links**

### Contact Page (`src/app/(public)/contact/page.tsx`)

Contact info section (lines 33-59) currently shows:
- Email: `info@hairland.cz`
- Language banner

**Missing: phone number**

---

## Implementation Steps

### Step 1: Add phone number to the footer

**File:** `src/components/public/PublicFooter.tsx`

After the email `<li>` (line 117), add:

```tsx
<li className="flex items-center gap-2">
  <span>📞</span>
  <a href="tel:+420728729666" className="hover:text-white transition-colors">
    +420 728 729 666
  </a>
</li>
<li className="flex items-center gap-2">
  <span>💬</span>
  <a href="https://wa.me/420728729666" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
    WhatsApp
  </a>
</li>
```

### Step 2: Add phone number to the contact page

**File:** `src/app/(public)/contact/page.tsx`

After the email div (line 53), add:

```tsx
<div className="flex items-center gap-3">
  <svg className="w-5 h-5 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
  <div>
    <a href="tel:+420728729666" className="hover:text-ink transition-colors">+420 728 729 666</a>
    <div className="flex gap-2 mt-0.5">
      <a href="https://wa.me/420728729666" target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">WhatsApp</a>
      <a href="https://t.me/+420728729666" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Telegram</a>
    </div>
  </div>
</div>
```

### Step 3: Consider translation keys (optional)

The phone number is a constant, not language-dependent. Hardcoding it is acceptable and simpler. If internationalization of contact format is desired later, it can be moved to a config or env variable.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/public/PublicFooter.tsx` | Add phone + WhatsApp link |
| `src/app/(public)/contact/page.tsx` | Add phone + WhatsApp + Telegram links |

## Dependencies

None. Independent of other tasks.

## Risk

- VERY LOW: purely additive, no logic changes
- Hardcoded phone number is fine for a single-business site
