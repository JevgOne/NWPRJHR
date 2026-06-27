# Task #3: Fix Registration System -- Differentiate Salon vs Hairdresser

**Date:** 2026-06-27
**Status:** Plan ready for implementation

---

## Problem Analysis

Task description mentions 5 sub-issues. Let me assess each against the codebase:

### Issue 1: Registration as "Kadernice" should clearly show it's a hairdresser

**STATUS: ALREADY WORKING**

- `RegisterForm.tsx` (line 14): has type selector `"SALON" | "HAIRDRESSER"`
- Line 57: for hairdressers, `salonName` is set to `contactPerson` (the person's name)
- Line 176: shows different section header for hairdresser vs salon
- Line 177-189: hides salon name field for hairdressers
- Line 193-199: ICO field shows as optional for hairdressers

The registration form properly differentiates. **No changes needed.**

### Issue 2: Telegram notification must say type correctly

**STATUS: ALREADY WORKING**

- `register-salon/route.ts` line 104: `typeLabel = type === "HAIRDRESSER" ? "Kadernice" : "Salon"`
- Line 152-159: passes `type: typeLabel` to `notifySalonRegistration()`
- `telegram.ts` line 197: receives `type` param, uses it in message
- Line 199-201: message includes "Typ:" field with correct label

**No changes needed.**

### Issue 3: Admin "Cekajici schvaleni" tab must work

**STATUS: ALREADY WORKING**

- `SalonsClient.tsx` line 43: tab state includes `"pending"`
- Lines 51-55: when `tab === "pending"`, sends `approved=false` and `archived=false` to API
- `api/salons/route.ts` lines 26-28: filters by `approved` param
- `SalonDetailClient.tsx` line 170-173: shows approve button for unapproved salons

The pending tab works. **No changes needed to make it functional.**

### Issue 4: Salon approval flow must work end-to-end

**STATUS: ALREADY WORKING**

- Registration creates salon with `approved: false` (route.ts line 83)
- User is created with role `SALON` or `HAIRDRESSER` (route.ts line 95)
- Auth blocks unapproved salons/hairdressers (confirmed in TASK-001-impl.md)
- Admin can approve via `SalonDetailClient.tsx` -> `PUT /api/salons/[id]` with `{ approved: true }`
- `updateSalonSchema` includes `approved: z.boolean().optional()`

**No changes needed.**

### Issue 5: Languages on stylist profiles are "random"

**STATUS: LEGITIMATE BUG**

The problem:
- Salon model has `language String @default("cs")` -- single language (cs/uk/ru), selected at registration
- Stylist model has `languages String @default("[]")` -- JSON array of languages
- These are separate models with NO automatic connection
- When a salon registers, it picks a language. But if a Stylist is created for that salon, `languages` defaults to empty `[]`
- The stylist profile page might show random/empty languages

**Root cause:** There is no mechanism to auto-populate `Stylist.languages` from `Salon.language` during registration or salon creation. These are independent fields on different models.

---

## Implementation Steps (Only for Issue #5)

### Step 1: Check how Stylists are created

**Investigate:** `src/app/(app)/stylists/StylistForm.tsx` -- how does the admin create a stylist? Does it allow setting languages?

### Step 2: Auto-populate stylist language from salon (if linked)

If a Stylist is linked to a Salon (`salonId`), the Stylist creation form/API should pre-populate `languages` with the Salon's `language` as the default.

**File:** `src/app/api/stylists/route.ts` (or wherever stylists are created)

In the POST handler, if `salonId` is provided:
```typescript
if (data.salonId && (!data.languages || data.languages === "[]")) {
  const salon = await prisma.salon.findUnique({
    where: { id: data.salonId },
    select: { language: true },
  });
  if (salon) {
    data.languages = JSON.stringify([salon.language]);
  }
}
```

### Step 3: Fix the approve button label for hairdressers

**File:** `src/app/(app)/salons/[id]/SalonDetailClient.tsx` line 172

Currently hardcoded to "Schvalit salon". Should show "Schvalit kadernici" when `salon.type === "HAIRDRESSER"`.

```tsx
// Line 172 - change:
{salon.type === "HAIRDRESSER" ? "Schválit kadeřnici" : "Schválit salon"}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/api/stylists/route.ts` | Auto-populate languages from salon |
| `src/app/(app)/salons/[id]/SalonDetailClient.tsx` | Dynamic approve button label |

## Files to Investigate First

| File | What to Check |
|------|--------------|
| `src/app/api/stylists/route.ts` | POST handler -- how stylists are created |
| `src/app/(app)/stylists/StylistForm.tsx` | Whether language input exists |
| `src/app/(public)/kadernice/[slug]/page.tsx` | How languages are displayed |

## Dependencies

None. Independent of other tasks.

## Risk

- LOW: Minor UI text change + optional default value logic
- The language auto-populate only applies to NEW stylists; existing ones need manual fix or a one-time script
