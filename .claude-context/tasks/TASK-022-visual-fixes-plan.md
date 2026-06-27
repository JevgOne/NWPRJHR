# TASK-022: Visual Fixes Plan — Brand Consistency

## Brand Color Palette (from `src/app/globals.css`)

| Token        | Hex       | Tailwind class    | Use for                    |
|-------------|-----------|-------------------|----------------------------|
| `rose`       | `#c98b88` | `bg-rose`, `text-rose` | Primary actions, active states |
| `rose-deep`  | `#a96d6c` | `bg-rose-deep`    | Hover states               |
| `espresso`   | `#3a2c2a` | `bg-espresso`, `text-espresso` | Text, headings, links |
| `mauve`      | `#7d5a5c` | `text-mauve`      | Secondary accents          |
| `gold`       | `#c2a36b` | `bg-gold`, `text-gold` | Premium/luxury accents |
| `nude-50`    | `#fdfaf7` | `bg-nude-50`      | Page backgrounds           |
| `nude-100`   | `#f7efe8` | `bg-nude-100`     | Card backgrounds, sidebar  |
| `nude-200`   | `#efe0d6` | `border-nude-200` | Borders                    |
| `blush-*`    | warm pinks | —                | Light accents              |
| `line`       | `#ead9cf` | `border-line`     | Subtle borders             |
| `ink`        | `#2a201f` | `text-ink`        | Body text                  |

---

## SECTION 1: Already Fixed (No Action Needed)

These items were identified in initial analysis but have already been corrected:

| Component | Current State | Status |
|-----------|--------------|--------|
| `Button.tsx` primary variant | `bg-rose text-white hover:bg-rose-deep` | OK |
| `AppShell.tsx` active sidebar item | `bg-rose text-white` | OK |
| `SalonShell.tsx` header "Hairland" | `text-espresso` | OK |
| `SalonShell.tsx` active nav | `bg-rose/10 text-espresso` | OK |
| `NotificationBell.tsx` mark all read | `text-espresso hover:text-espresso` | OK |

---

## SECTION 2: Blue/Indigo Buttons → Brand Colors

### Finding: NO remaining blue/indigo action BUTTONS

Grepped for `<button.*bg-(indigo|blue)` — **zero results**. All action buttons either use the `<Button>` component (which uses `bg-rose`) or use neutral `bg-white` secondary style. The original report of blue buttons has been resolved.

---

## SECTION 3: Remaining Indigo Instances

### 3a. Dashboard QuickBadge — Active Salons (CHANGE)

**File**: `src/app/(app)/dashboard/page.tsx`
**Lines**: 290, 311-312

Current:
```typescript
// Line 290
<QuickBadge label={t("activeSalons")} value={activeSalonsCount} color="indigo" />

// Lines 311-312
const badgeColors: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
```

**Fix**: Replace `color="indigo"` with `color="espresso"` and add espresso color:
```typescript
// Line 290
<QuickBadge label={t("activeSalons")} value={activeSalonsCount} color="espresso" />

// Add to badgeColors:
espresso: "bg-nude-50 text-espresso border-line",
// Remove unused "indigo" entry
```

### 3b. PREMIUM Category Badges (KEEP AS-IS)

These use `bg-indigo-500` / `bg-indigo-100` for the PREMIUM product category:

| File | Line | Usage |
|------|------|-------|
| `dashboard/page.tsx` | 23 | `PREMIUM: { bg: "bg-indigo-100", text: "text-indigo-800", bar: "bg-indigo-500" }` |
| `HeroProductSlider.tsx` | 77 | `PREMIUM: "bg-indigo-500 text-white"` |
| `ProductsShowcase.tsx` | 65 | `PREMIUM: { base: "bg-indigo-500 text-white", hover: "hover:bg-indigo-600" }` |

**Recommendation: KEEP**. These are semantic category colors used to distinguish PREMIUM from VIRGIN (amber), STANDARD (emerald), and SALE (rose). Changing to brand colors would:
1. Make PREMIUM and SALE look too similar (both rosé-ish)
2. Reduce visual distinction between categories
3. Break the semantic color coding system

---

## SECTION 4: "Hairora" Text Remnants (CHANGE)

Found 7 instances of "hairora" in code:

| File | Line | Current | Fix |
|------|------|---------|-----|
| `CookieBanner.tsx` | 6 | `"hairora_cookie_consent"` | Change to `"hairland_cookie_consent"` — **NOTE: will reset all users' cookie consent** |
| `export-pohoda.ts` | 43 | `id: \`hairora-${formatDate(...)}\`` | Change to `hairland-...` |
| `ExportClient.tsx` | 101 | `\`hairora-export.${type}\`` | Change to `hairland-export...` |
| `cron/backup/route.ts` | 12 | `"/var/backups/hairora"` | Change to `"/var/backups/hairland"` — **NOTE: needs matching server directory** |
| `export/pohoda/route.ts` | 40 | `"hairora-pohoda-..."` | Change to `"hairland-pohoda-..."` |
| `export/excel/route.ts` | 43 | `"hairora-export-..."` | Change to `"hairland-export-..."` |
| `export/excel/route.ts` | 52 | `"hairora-export-..."` | Change to `"hairland-export-..."` |

**Priority**: LOW — these are internal identifiers and download filenames, not user-facing brand text. The cookie consent key change will reset consent for existing users.

---

## SECTION 5: Grey/Neutral UI Elements Assessment

### Header bar
- `AppShell.tsx:201` — `bg-white border-b border-gray-200` — standard, OK
- Hamburger icon uses `text-gray-600` — neutral icon, OK

### Tables and cards
- All admin tables use standard `bg-white`, `bg-gray-50` headers, `border-gray-200` — this is correct, standard admin UI. Brand colors should NOT be used for table backgrounds.

### Status badges (blue-100 instances)
All `bg-blue-100 text-blue-700` instances are semantic status indicators:
- `CategoryBadge.tsx` — STANDARD category
- `InvoiceStatusBadge.tsx` — ISSUED status  
- `OrdersClient.tsx` — NEW order status
- `SamplesClient.tsx` — REQUESTED status
- Various others

**Recommendation: KEEP**. Status colors follow UX conventions and should not be branded.

---

## SECTION 6: Login Page Branding (CHANGE)

**File**: `src/app/login/page.tsx`

Current (line 8):
```tsx
<h1 className="text-3xl font-bold text-gray-900">Hairland</h1>
```

**Fix**:
```tsx
<img src="/icons/icon-192x192.png" alt="Hairland" className="w-12 h-12 rounded-lg mx-auto mb-2" />
<h1 className="text-3xl font-bold text-espresso">Hairland</h1>
```

---

## SECTION 7: "Admin Hairora" in Sidebar (DB FIX)

**File**: `src/components/AppShell.tsx:186` — displays `session.user.name`
**This is NOT a code change** — the admin user record in the database has `name = "Admin Hairora"`.

**Fix**: Run SQL against Turso production DB:
```sql
UPDATE User SET name = 'Hairland Admin' WHERE role = 'OWNER' AND name LIKE '%Hairora%';
```

Or via Prisma script:
```typescript
await prisma.user.updateMany({
  where: { role: 'OWNER', name: { contains: 'Hairora' } },
  data: { name: 'Hairland Admin' }
});
```

---

## Implementation Summary

### Code Changes (3 files, ~10 lines):

| # | File | Change | Priority |
|---|------|--------|----------|
| 1 | `src/app/(app)/dashboard/page.tsx` | Replace `color="indigo"` → `color="espresso"`, add espresso to badgeColors, remove indigo | P2 |
| 2 | `src/app/login/page.tsx` | Add logo, change `text-gray-900` → `text-espresso` | P3 |
| 3 | 5 export/cookie files | Replace "hairora" → "hairland" in identifiers | P4 |

### Database Change:
| # | Action | Priority |
|---|--------|----------|
| 4 | UPDATE admin user name from "Hairora" to "Hairland Admin" | P3 |

### NOT Changed (intentional):
- Category badge colors (indigo for PREMIUM) — semantic
- Status badge colors (blue for various statuses) — semantic UX
- Table/card backgrounds (gray/white) — standard admin patterns
- Button component — already uses brand colors
- Sidebar/nav — already uses brand colors
