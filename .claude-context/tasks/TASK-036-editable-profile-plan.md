# Task #36 — Make Hairdresser Profile Editable

## Current State

### Database
The `Stylist` model (`prisma/schema.prisma:1209-1234`) ALREADY has all needed fields:
- `specializations` (JSON string, default `"[]"`)
- `languages` (JSON string, default `"[]"`)
- `certifications` (JSON string, default `"[]"`)
- `active` (Boolean, default `true`) — used as "published on web" toggle
- `bio`, `bioUk`, `bioRu`, `photo`, `phone`, `email`, `instagram`, `telegram`, `whatsapp`, `city`, `experience`, `portfolio`, `featured`
- `salonId` — links to Salon

**NO DB MIGRATION NEEDED.** All fields already exist.

### Current Architecture
- `Stylist` is a SEPARATE model from `User`/`Salon`
- `Salon` has `stylists: Stylist[]` (one-to-many)
- Admin creates/edits stylists via `/stylists/` pages + `StylistForm.tsx`
- Admin stylist form already has language toggles, specialization/certification text inputs
- Public `/kadernice` page queries `Stylist { active: true }` and shows cards
- Public `/kadernice/[slug]` shows individual stylist profile

### Current Profile Page
- `ProfileClient.tsx` — shows Salon data (name, contact, tier, discount). READ-ONLY.
- PUT endpoint at `/api/salon-portal/profile` only updates `language` field.
- NO connection to Stylist model at all.

### Key Relationship Gap
- A `User` with role `HAIRDRESSER` has `salonId` → `Salon`
- `Salon` has `stylists: Stylist[]`
- But there's NO direct `User` → `Stylist` link
- A Salon could have multiple stylists
- For HAIRDRESSER role: likely 1 stylist per salon (the hairdresser IS the stylist)

---

## Implementation Plan

### STEP 1: New API Endpoint — `GET/PUT /api/salon-portal/stylist-profile`

**Create file: `src/app/api/salon-portal/stylist-profile/route.ts`**

```typescript
// GET: Find stylist linked to user's salon
// - Query: prisma.stylist.findFirst({ where: { salonId: session.user.salonId } })
// - If no stylist exists, return { exists: false } (or auto-create one)
// - If exists, return all editable fields

// PUT: Update stylist profile
// - Auth: SALON or HAIRDRESSER role required
// - Validate fields with Zod schema
// - Update: prisma.stylist.update({ where: { id }, data: { ... } })
// - Or upsert if auto-creating

// Editable fields:
// - name, bio, bioUk, bioRu
// - phone, email, instagram, telegram, whatsapp
// - city, experience
// - specializations (JSON string array)
// - languages (JSON string array)
// - certifications (JSON string array)
// - photo (string URL)
// - active (Boolean — "Zveřejnit profil na webu" toggle)
//
// NOT editable by user (admin-only):
// - slug (auto-generated or admin-set)
// - featured (admin decision)
// - salonId (set at creation)
```

**Zod validation schema** (add to `src/lib/validations/salon.ts` or new file):
```typescript
export const updateStylistProfileSchema = z.object({
  name: z.string().min(1).max(200),
  bio: z.string().max(2000).optional(),
  bioUk: z.string().max(2000).nullable().optional(),
  bioRu: z.string().max(2000).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  email: z.string().email().nullable().optional(),
  instagram: z.string().max(200).nullable().optional(),
  telegram: z.string().max(200).nullable().optional(),
  whatsapp: z.string().max(200).nullable().optional(),
  city: z.string().max(200).nullable().optional(),
  experience: z.number().int().min(0).max(50).nullable().optional(),
  specializations: z.array(z.string()).max(20),
  languages: z.array(z.string()).max(10),
  certifications: z.array(z.string()).max(20),
  active: z.boolean(),  // "publish on web" toggle
});
```

### STEP 2: New Editable Profile Component

**Create file: `src/app/(salon)/salon/profile/StylistProfileEditor.tsx`**

A form component similar to admin `StylistForm.tsx` but:
- Fetches from `GET /api/salon-portal/stylist-profile`
- Saves via `PUT /api/salon-portal/stylist-profile`
- Shows "Zveřejnit profil na webu" toggle prominently at the top
- Language multi-select with flag buttons (cs, uk, ru, en) — same UI as admin form
- Specialization tags (multi-select or comma-separated input)
- Certifications list (comma-separated input)
- Contact fields (phone, email, instagram, telegram, whatsapp)
- City + experience fields
- Bio fields (cs + optionally uk/ru)
- Save button with success/error feedback
- Does NOT include: slug, featured, salonId, portfolio (admin-only fields)

**UI structure:**
```
┌─────────────────────────────────────┐
│ Profil kadeřnice                    │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔘 Zveřejnit profil na webu    │ │  ← toggle (maps to `active`)
│ │    Váš profil bude viditelný    │ │
│ │    na stránce /kadernice        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Jméno: [_____________]              │
│ Bio:   [_____________]              │
│                                     │
│ Jazyky: 🇨🇿 🇺🇦 🇷🇺 🇬🇧  (toggles)   │
│                                     │
│ Specializace:                       │
│ [Prodlužování] [Barvení] [Střihy]   │
│ [Keratin] [Tape-in] [Clip-in] ...   │
│                                     │
│ Certifikáty: [_____________]        │
│                                     │
│ Kontakt:                            │
│ Telefon:  [_____]                   │
│ Email:    [_____]                   │
│ Instagram:[_____]                   │
│ Telegram: [_____]                   │
│ WhatsApp: [_____]                   │
│                                     │
│ Město: [_____]  Praxe: [__] let    │
│                                     │
│ [    Uložit profil    ]             │
└─────────────────────────────────────┘
```

### STEP 3: Update Profile Page

**Modify file: `src/app/(salon)/salon/profile/ProfileClient.tsx`**

Option A (recommended): Keep existing `ProfileClient` for salon info (loyalty, discount, tier) and ADD the `StylistProfileEditor` below it. The profile page becomes two sections:
1. **Salon info** (read-only) — current `ProfileClient` content (tier, discount, revenue)
2. **Stylist profile** (editable) — new `StylistProfileEditor`

**Modify file: `src/app/(salon)/salon/profile/page.tsx`**

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileClient } from "./ProfileClient";
import { StylistProfileEditor } from "./StylistProfileEditor";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="space-y-6">
      <ProfileClient />
      {/* Show stylist editor for HAIRDRESSER role, or for SALON if they have stylists */}
      <StylistProfileEditor />
    </div>
  );
}
```

### STEP 4: Auto-Create Stylist (if needed)

In the GET endpoint, if no Stylist exists for the user's salon:
- **Option A**: Return `{ exists: false }` and show "Create your profile" button in the UI
- **Option B**: Auto-create a Stylist with the salon's name and link to salon

**Recommendation**: Option B (auto-create) for better UX. The hairdresser shouldn't need to know about the Stylist model — they just fill in their profile.

Auto-create logic in GET endpoint:
```typescript
let stylist = await prisma.stylist.findFirst({ where: { salonId } });
if (!stylist) {
  stylist = await prisma.stylist.create({
    data: {
      name: salon.name,
      slug: slugify(salon.name),  // need to handle uniqueness
      salonId,
      active: false,  // not published until they explicitly toggle
    },
  });
}
```

---

## Predefined Specialization Options

Based on the business context (hair extensions), suggested options for multi-select:
```typescript
const SPECIALIZATIONS = [
  "Prodlužování vlasů",
  "Clip-in",
  "Tape-in",
  "Keratin",
  "Micro ring",
  "Tresa / Weft",
  "Barvení",
  "Melír",
  "Střihy",
  "Styling",
  "Péče o vlasy",
];
```

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/salon-portal/stylist-profile/route.ts` | **NEW** | GET/PUT endpoint for stylist profile |
| `src/lib/validations/salon.ts` | MODIFY | Add `updateStylistProfileSchema` |
| `src/app/(salon)/salon/profile/StylistProfileEditor.tsx` | **NEW** | Editable form component |
| `src/app/(salon)/salon/profile/page.tsx` | MODIFY | Add StylistProfileEditor below ProfileClient |

**NO DB migration needed** — all fields exist in the Stylist model.

---

## What NOT to Change

- Admin stylist management (`/stylists/*`) — stays as-is, admin creates/manages all stylists
- Public `/kadernice` page — already reads from Stylist model with `active: true`
- `slug` field — admin-only (or auto-generated at creation)
- `featured` field — admin-only decision
- `portfolio` field — skip for now (file upload is complex, can be follow-up)
- `photo` field — skip for now (file upload, can be follow-up) OR allow URL input
