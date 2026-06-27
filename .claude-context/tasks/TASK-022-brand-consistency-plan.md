# TASK-022: Fix Visual Issues — Brand Consistency Plan

## Summary

Most blue/indigo button issues have already been fixed. The `<Button>` component already uses brand colors (`bg-rose`). SalonShell and NotificationBell already use brand colors. What remains are **category badge colors** (indigo for PREMIUM — intentional semantic color) and a few minor items.

## Brand Color Palette (from globals.css)

| Token        | Hex       | Use for                    |
|-------------|-----------|----------------------------|
| `rose`       | `#c98b88` | Primary actions, active states |
| `rose-deep`  | `#a96d6c` | Hover states               |
| `espresso`   | `#3a2c2a` | Text, headings, links      |
| `mauve`      | `#7d5a5c` | Secondary accents          |
| `gold`       | `#c2a36b` | Premium/luxury accents     |
| `nude-*`     | warm beiges | Backgrounds, borders      |
| `blush-*`    | warm pinks  | Light accents             |

---

## Changes Required

### PRIORITY 1: Category Badge Colors (PREMIUM uses indigo → should use brand)

The PREMIUM category uses `bg-indigo-500` / `bg-indigo-100` across multiple files. Since this is a premium hair brand, PREMIUM should use `gold` (the luxury brand color) instead of generic indigo.

**Files to change:**

#### 1. `src/app/(app)/dashboard/page.tsx`
- **Line 23**: `PREMIUM: { bg: "bg-indigo-100", text: "text-indigo-800", bar: "bg-indigo-500" }`
- **Change to**: `PREMIUM: { bg: "bg-amber-100", text: "text-amber-800", bar: "bg-gold" }`
  - Note: Using `bg-gold` for the bar (our custom brand color) and `amber-100`/`amber-800` for bg/text since we don't have `gold-100`/`gold-800` shades defined.
  - Alternative: `{ bg: "bg-yellow-100", text: "text-yellow-800", bar: "bg-gold" }` to differentiate from VIRGIN (which already uses amber).

**DECISION NEEDED**: VIRGIN already uses amber. Options for PREMIUM:
  - Option A: Use `gold` bar + `yellow-100`/`yellow-800` bg/text (distinct from VIRGIN amber)
  - Option B: Use `mauve` — `{ bg: "bg-pink-100", text: "text-pink-800", bar: "bg-mauve" }` (brand color, premium feel)
  - Option C: Keep indigo as-is (it's a semantic color for categorization, not a brand element)

**Recommendation**: Option C — keep as-is. Category badges use semantic colors to distinguish categories visually. Using brand colors would make PREMIUM and SALE (which uses rose) look too similar. The indigo is NOT a button or brand element — it's a data visualization color.

#### 2. `src/components/public/HeroProductSlider.tsx`
- **Line 77**: `PREMIUM: "bg-indigo-500 text-white"`
- Same decision as above — keep for category differentiation or change to brand color.

#### 3. `src/app/(public)/offer/ProductsShowcase.tsx`
- **Line 65**: `PREMIUM: { base: "bg-indigo-500 text-white", hover: "hover:bg-indigo-600" }`
- Same decision as above.

### PRIORITY 2: Dashboard Quick Badge (Active Salons)

#### `src/app/(app)/dashboard/page.tsx`
- **Line 290**: `<QuickBadge label={t("activeSalons")} value={activeSalonsCount} color="indigo" />`
- **Line 312**: `indigo: "bg-indigo-50 text-indigo-700 border-indigo-200"`
- **Change**: Replace `color="indigo"` with `color="espresso"` and add espresso to badgeColors:
  ```typescript
  espresso: "bg-nude-50 text-espresso border-line",
  ```
- Then change line 290 to: `color="espresso"`

### PRIORITY 3: Login Page Branding

#### `src/app/login/page.tsx`
- **Line 8**: `<h1 className="text-3xl font-bold text-gray-900">Hairland</h1>`
- **Change to**: `<h1 className="text-3xl font-bold text-espresso">Hairland</h1>`
- **Optional enhancement**: Add logo image like sidebar does:
  ```tsx
  <img src="/icons/icon-192x192.png" alt="Hairland" className="w-12 h-12 rounded-lg mx-auto mb-2" />
  ```

### PRIORITY 4: Status Badge Colors (blue-100 for statuses — KEEP AS-IS)

These `bg-blue-100 text-blue-700` instances are **semantic status colors** (NEW, REQUESTED, ISSUED, STANDARD, etc.) used consistently across the app for meaning, not branding:
- `CategoryBadge.tsx` — STANDARD category
- `InvoiceStatusBadge.tsx` — ISSUED status
- `OrdersClient.tsx` — NEW order status
- `SamplesClient.tsx` — REQUESTED status
- `DiscountsClient.tsx` — STANDARD discount
- `ReviewsClient.tsx` — GOOGLE source
- `RegistrationsClient.tsx` — conditional status
- `SalonSamplesClient.tsx` — REQUESTED status
- Various other status indicators

**Recommendation**: DO NOT CHANGE. These are semantic colors that convey meaning (status, type). Changing them to brand colors would reduce visual distinction and confuse users. This is standard practice — status badges use semantic colors, brand colors are for interactive elements and branding.

### PRIORITY 5: "Admin Hairora" in Sidebar

#### `src/components/AppShell.tsx`
- **Line 186**: `{session.user.name || session.user.email}` — displays whatever `name` is in the DB
- **This is NOT a code fix** — the user record in the database needs updating
- **Action**: Run SQL to update the admin user's name:
  ```sql
  UPDATE User SET name = 'Hairland Admin' WHERE role = 'OWNER' AND name = 'Admin Hairora';
  ```
  Or use Prisma:
  ```typescript
  await prisma.user.updateMany({
    where: { role: 'OWNER', name: 'Admin Hairora' },
    data: { name: 'Hairland Admin' }
  });
  ```
- **Note**: This requires access to the production database (Turso/LibSQL). Cannot be done via code change alone.

---

## Files Changed Summary

| File | Change | Priority |
|------|--------|----------|
| `src/app/(app)/dashboard/page.tsx` | Replace `indigo` QuickBadge color with `espresso` brand color, add espresso to badgeColors | P2 |
| `src/app/login/page.tsx` | Change heading color to `text-espresso`, optionally add logo | P3 |
| Database (not code) | Update admin user name from "Admin Hairora" to "Hairland Admin" | P5 |

## Files NOT Changed (intentional)

| File | Reason |
|------|--------|
| `src/components/ui/Button.tsx` | Already uses `bg-rose` brand colors |
| `src/components/AppShell.tsx` | Active sidebar already uses `bg-rose text-white` |
| `src/components/SalonShell.tsx` | Already uses `text-espresso` and `bg-rose/10` |
| `src/components/NotificationBell.tsx` | Already uses `text-espresso` |
| Category badges (indigo for PREMIUM) | Semantic color for category differentiation — not a brand element |
| Status badges (blue for various statuses) | Semantic colors for status indication — standard UX practice |
| `HeroProductSlider.tsx` | Category badge color — same as above |
| `ProductsShowcase.tsx` | Category badge color — same as above |

## Estimated Effort

- Code changes: 2 files, ~5 lines total
- Database: 1 UPDATE query
- Very small scope — most indigo/blue issues were already fixed
