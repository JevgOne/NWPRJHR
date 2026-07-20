# TASK-058: User Color Badges in Admin Panel

## Goal

Each admin user gets a unique color for visual identification. When a user's name appears anywhere in the admin panel (assigned inquiries, sales, complaints, discount history, sidebar), show a colored circle/badge next to their name.

**Specific colors:**
- **Inna** = pink (ruzova)
- **Jevgenij** = red (cervena)
- **Martin** = blue (modra)

---

## 1. Current State

### User model
```prisma
model User {
  id             String    @id @default(cuid())
  name           String?
  email          String    @unique
  hashedPassword String
  role           Role      @default(EMPLOYEE)
  // ... no color field
}
```

### Where user names appear in admin

| Location | How user is referenced | Display |
|----------|----------------------|---------|
| **Inquiries list** (`InquiriesClient.tsx`) | `assignedTo` (plain string) | Text: "Prirazeno: Inna" |
| **Inquiry detail** (same file) | `assignedTo` (plain string) | Text with date |
| **Complaints list** (`ComplaintsClient.tsx`) | `assignedTo` (plain string) | Text |
| **Sale detail** (`SaleDetailClient.tsx`) | `userName` (string from join) | Text: user name |
| **Discount history** (`DiscountHistoryClient.tsx`) | `userName` (string from summary) | Text per user card |
| **AppShell sidebar** | `session.user.name` | Text at bottom of nav |

**Key observation:** `assignedTo` is stored as a **plain string** (user name), not a user ID. This means we can match by name for color assignment.

---

## 2. Design Approach

### Option A: Add `color` field to User model (DB)
- Pros: Flexible, admin-configurable
- Cons: Migration, new admin UI to set colors, overkill for 3 users

### Option B: Static color map in code (RECOMMENDED)
- Pros: Zero DB changes, instant, simple
- Cons: Adding a new user requires a code change
- This is the right approach for a 3-person team

### Implementation: `src/lib/user-colors.ts`

```typescript
/** User color map — name (lowercase) → tailwind color config */
export const USER_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  inna:     { bg: "bg-pink-500",  text: "text-pink-700",  ring: "ring-pink-300" },
  jevgenij: { bg: "bg-red-500",   text: "text-red-700",   ring: "ring-red-300" },
  martin:   { bg: "bg-blue-500",  text: "text-blue-700",  ring: "ring-blue-300" },
};

/** Fallback for unknown users */
const FALLBACK = { bg: "bg-gray-400", text: "text-gray-600", ring: "ring-gray-200" };

export function getUserColor(name: string | null | undefined) {
  if (!name) return FALLBACK;
  const key = name.trim().toLowerCase();
  // Match by first name (handles "Inna Surname" or just "Inna")
  for (const [userName, colors] of Object.entries(USER_COLORS)) {
    if (key === userName || key.startsWith(userName + " ")) {
      return colors;
    }
  }
  return FALLBACK;
}

export function getUserInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
```

---

## 3. Shared Component: `UserBadge`

### File: `src/components/ui/UserBadge.tsx`

A small colored circle with initials, used everywhere a user name appears.

```tsx
interface UserBadgeProps {
  name: string | null | undefined;
  showName?: boolean;  // show name text next to badge (default true)
  size?: "sm" | "md";  // sm=20px, md=24px
}
```

Renders:
```
[IN] Inna          ← pink circle with white initials + name text
[JE] Jevgenij      ← red circle
[MA] Martin        ← blue circle
```

When `showName={false}`, only the colored circle is shown (useful in compact views).

---

## 4. Integration Points

### 4.1 Inquiries List & Detail

**File:** `src/app/(app)/inquiries/InquiriesClient.tsx`

**Line 201-204** (list view, assigned indicator):
```tsx
// BEFORE:
{inq.assignedTo && (
  <span className="text-xs text-green-700 font-medium">
    · {t("assignedTo")}: {inq.assignedTo}
  </span>
)}

// AFTER:
{inq.assignedTo && (
  <span className="text-xs font-medium flex items-center gap-1">
    · <UserBadge name={inq.assignedTo} size="sm" />
  </span>
)}
```

**Lines 256-259** (detail view, assigned field):
Replace plain text with `<UserBadge name={inq.assignedTo} />`.

**Lines ~115** (edit form, assignedTo input):
Currently a free-text input. Could optionally become a dropdown of known users, but this is a stretch goal — keep as text input for now.

### 4.2 Complaints

**File:** `src/app/(app)/complaints/ComplaintsClient.tsx`

Wherever `assignedTo` is displayed, wrap with `<UserBadge>`.

### 4.3 Sale Detail

**File:** `src/app/(app)/sales/[id]/SaleDetailClient.tsx`

**Line ~130** where `sale.userName` is displayed — wrap with `<UserBadge name={sale.userName} />`.

### 4.4 Discount History

**File:** `src/app/(app)/finance/discounts/DiscountHistoryClient.tsx`

**Line ~153** where `s.userName` is displayed — wrap with `<UserBadge name={s.userName} />`.

### 4.5 AppShell Sidebar

**File:** `src/components/AppShell.tsx`

**Line ~197-199** (current user at bottom of sidebar):
```tsx
// BEFORE:
<div className="text-sm text-nude-200 mb-2">
  {session.user.name || session.user.email}
</div>

// AFTER:
<div className="flex items-center gap-2 mb-2">
  <UserBadge name={session.user.name} size="md" showName={false} />
  <span className="text-sm text-nude-200">
    {session.user.name || session.user.email}
  </span>
</div>
```

---

## 5. Files Summary

### New files (2)
| File | Purpose |
|------|---------|
| `src/lib/user-colors.ts` | Color map + `getUserColor()` + `getUserInitials()` |
| `src/components/ui/UserBadge.tsx` | Reusable colored badge component |

### Modified files (5)
| File | Change |
|------|--------|
| `src/app/(app)/inquiries/InquiriesClient.tsx` | Use `<UserBadge>` for assignedTo display |
| `src/app/(app)/complaints/ComplaintsClient.tsx` | Use `<UserBadge>` for assignedTo display |
| `src/app/(app)/sales/[id]/SaleDetailClient.tsx` | Use `<UserBadge>` for userName display |
| `src/app/(app)/finance/discounts/DiscountHistoryClient.tsx` | Use `<UserBadge>` for userName display |
| `src/components/AppShell.tsx` | Add colored circle next to current user in sidebar |

### No schema/migration needed
Colors are a static map in code. No DB changes required.

---

## 6. Implementation Order

1. Create `src/lib/user-colors.ts` with color map and helpers
2. Create `src/components/ui/UserBadge.tsx` component
3. Integrate into InquiriesClient (highest visibility)
4. Integrate into ComplaintsClient
5. Integrate into SaleDetailClient
6. Integrate into DiscountHistoryClient
7. Integrate into AppShell sidebar

---

## 7. Future Considerations

- If the team grows beyond 3 people, consider adding a `color` field to the User model with an admin settings UI to pick colors
- The `assignedTo` field being a plain string (not FK) is a design debt — a future task could normalize this to `assignedToId` FK pointing to User, which would also enable the color lookup more reliably
