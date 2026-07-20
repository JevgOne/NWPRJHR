# TASK-053: Photo Inquiry Form for Trust Section CTAs

## Existing System Analysis

### What exists

**1. Inquiry System (poptávka) — full pipeline:**
- **Cart UI:** `src/app/[locale]/(public)/inquiry-cart/InquiryCartClient.tsx`
  - Has photo upload (max 3 files, JPG/PNG/WebP)
  - Has contact fields (name, email, phone, salon, message)
  - Has promo code + referral code support
  - Requires at least 1 product in cart to submit
- **Cart state:** `src/lib/inquiry-cart.tsx` (localStorage context)
- **Upload API:** `POST /api/public/inquiry/upload` → saves to local filesystem (`public/uploads/inquiries/`)
  - Note: uses `writeFile` to local fs, NOT Vercel Blob. Product photos use `@vercel/blob` (`src/app/api/upload/photos/route.ts`).
- **Submit API:** `POST /api/public/inquiry` → saves to `Inquiry` + `InquiryItem` in DB
  - Zod validation: `items: z.array(inquiryItemSchema).min(1).max(50)` — **BLOCKS submission without products**
  - Sends email + Telegram + in-app notification to OWNER
  - Sends confirmation email to customer
- **DB model:** `Inquiry` has `customerPhotos String?` (JSON array of URLs)
- **Admin display:** `src/app/(app)/inquiries/InquiriesClient.tsx` — shows customer photos as thumbnails with lightbox links

**2. Contact Form — simple text-only:**
- **UI:** `src/app/[locale]/(public)/contact/ContactForm.tsx` — name, email, phone, salon, message
- **API:** `POST /api/public/contact` → saves to `ContactMessage` table
- **No photo upload.** No `customerPhotos` field in ContactMessage model.

### The gap

The trust section CTAs need a form where customers can:
1. Upload photos of their hair (for color matching)
2. Write what they need (free text)
3. Submit without selecting specific products

Neither form supports this: inquiry requires products, contact has no photos.

---

## Recommended Solution: Allow product-free inquiries

**Modify the inquiry system to accept submissions without products** by making the `items` array
optional (min 0 instead of min 1). This is the simplest approach because:

1. The inquiry pipeline already handles photos, notifications, admin display — everything works
2. No new tables, no new API endpoints, no new pages needed
3. A "photo matching request" IS a type of inquiry — it will eventually lead to a product sale
4. Admin already shows customer photos for inquiries — no admin changes needed

### Alternative approaches considered

| Approach | Verdict |
|---|---|
| Add photos to ContactForm + ContactMessage | Creates parallel system, admin would need ContactMessage photo display, notification duplication |
| New standalone page + table | Maximum effort, duplicates inquiry pipeline |
| Modal/drawer on product detail | Complex client-side, still needs API changes |

---

## Implementation Plan

### Step 1: Allow product-free inquiries

**File: `src/app/api/public/inquiry/route.ts`** (line 27)

Change:
```typescript
items: z.array(inquiryItemSchema).min(1).max(50),
```
To:
```typescript
items: z.array(inquiryItemSchema).max(50).default([]),
```

Also update the empty-cart guard in the email (line 138-140) to handle empty items gracefully:
```typescript
const itemLines = items.length > 0
  ? items.map((i) => `  • ${i.productName} — ${i.lengthCm} cm, ${i.color}, ${i.quantity}${i.unit}`).join("\n")
  : "  (žádné produkty — žádost o poradenství / fotky)";
```

Update the notification title (line 144) for photo-only inquiries:
```typescript
subject: `[Hairland] ${items.length > 0 ? "Nová poptávka" : "Žádost o poradenství"}: ${name}${salonName ? ` (${salonName})` : ""}`,
```

### Step 2: Allow InquiryCartClient to submit without items

**File: `src/app/[locale]/(public)/inquiry-cart/InquiryCartClient.tsx`**

The empty cart currently shows "Your cart is empty, browse products" (lines 157-172).
This needs to change: when the user arrived via a trust CTA (detected via query param),
show the contact form even with an empty cart.

**Option A (simpler):** Don't change InquiryCartClient at all. Instead, create a lightweight
standalone page that reuses the upload + submit logic.

**Option B (recommended):** Add a query param `?mode=consult` that bypasses the empty cart
check and shows just the contact form + photo upload (no cart items section).

Changes to InquiryCartClient:
1. Accept `mode` prop: `mode?: "cart" | "consult"`
2. When `mode === "consult"`:
   - Skip the empty cart check (don't show "empty cart" state)
   - Hide the cart items section
   - Show a header like "Poradíme vám s výběrem" instead of "Vaše poptávka"
   - Show just: photo upload + contact fields + message + submit
   - Submit to same `/api/public/inquiry` with `items: []`
3. Pre-fill message placeholder based on query param `reason`:
   - `?reason=real-photo` → "Ráda bych viděla reálnou fotku konkrétního kusu, který máte skladem."
   - `?reason=photo-match` → "Posílám fotku svých vlasů — prosím o doporučení správného odstínu a délky."

**Changes to `src/app/[locale]/(public)/inquiry-cart/page.tsx`:**
Pass `mode` from searchParams:
```typescript
const sp = await searchParams;
return <InquiryCartClient mode={sp.mode === "consult" ? "consult" : "cart"} reason={sp.reason} />;
```

### Step 3: Update trust section CTA links

**File: `src/app/[locale]/(public)/offer/[...slug]/page.tsx`**

Update the trust section CTA links (from TASK-052):
- CTA 1 "Vyfotíme váš konkrétní kus" → `<Link href="/inquiry-cart?mode=consult&reason=real-photo">`
- CTA 2 "Přijedeme ukázat zdarma" → `<a href="https://wa.me/420608553103">` (keep WhatsApp)
- CTA 3 "Pošlete fotku svých vlasů" → `<Link href="/inquiry-cart?mode=consult&reason=photo-match">`

### Step 4: i18n keys

**Files: `messages/{cs,uk,ru}.json`** — add under `public.inquiry`:

**Czech:**
```json
"consultTitle": "Poradíme vám s výběrem",
"consultSubtitle": "Nahrajte fotku svých vlasů nebo nám napište, co potřebujete. Ozveme se do 24 hodin.",
"reasonRealPhoto": "Ráda bych viděla reálnou fotku konkrétního kusu, který máte skladem.",
"reasonPhotoMatch": "Posílám fotku svých vlasů — prosím o doporučení správného odstínu a délky.",
"submitConsult": "Odeslat"
```

**Ukrainian:**
```json
"consultTitle": "Допоможемо з вибором",
"consultSubtitle": "Завантажте фото свого волосся або напишіть, що потрібно. Відповімо протягом 24 годин.",
"reasonRealPhoto": "Хотіла б побачити реальне фото конкретного пучка, який є на складі.",
"reasonPhotoMatch": "Надсилаю фото свого волосся — прошу допомогти з вибором правильного відтінку та довжини.",
"submitConsult": "Надіслати"
```

**Russian:**
```json
"consultTitle": "Поможем с выбором",
"consultSubtitle": "Загрузите фото своих волос или напишите, что вам нужно. Ответим в течение 24 часов.",
"reasonRealPhoto": "Хотела бы увидеть реальное фото конкретного пучка, который есть на складе.",
"reasonPhotoMatch": "Отправляю фото своих волос — прошу помочь с выбором правильного оттенка и длины.",
"submitConsult": "Отправить"
```

### Step 5 (optional): Migrate inquiry upload to Vercel Blob

**File: `src/app/api/public/inquiry/upload/route.ts`**

Currently saves to local filesystem (`public/uploads/inquiries/`). On Vercel deployment,
this won't persist across deploys. Should use `@vercel/blob` like product photos do.

Change:
```typescript
import { writeFile, mkdir } from "fs/promises";
// ...
const buffer = Buffer.from(await file.arrayBuffer());
await writeFile(filePath, buffer);
urls.push(`/uploads/inquiries/${safeName}`);
```

To:
```typescript
import { put } from "@vercel/blob";
// ...
const blob = await put(`inquiries/${safeName}`, file, { access: "public" });
urls.push(blob.url);
```

**This is a separate concern** but important for production. Can be a separate task.

---

## File Change Summary

| # | File | Action | Lines |
|---|---|---|---|
| 1 | `src/app/api/public/inquiry/route.ts` | MODIFY — `items` min(0), handle empty items in notifications | ~10 |
| 2 | `src/app/[locale]/(public)/inquiry-cart/InquiryCartClient.tsx` | MODIFY — add `mode="consult"` support, reason pre-fill | ~30 |
| 3 | `src/app/[locale]/(public)/inquiry-cart/page.tsx` | MODIFY — pass mode/reason from searchParams | ~5 |
| 4 | `src/app/[locale]/(public)/offer/[...slug]/page.tsx` | MODIFY — update CTA links (if not yet done) | ~3 |
| 5 | `messages/cs.json` | MODIFY — add consult i18n keys | +5 |
| 6 | `messages/uk.json` | MODIFY — add consult i18n keys | +5 |
| 7 | `messages/ru.json` | MODIFY — add consult i18n keys | +5 |

**Total: 7 modified files, ~63 lines changed, no schema changes**

---

## Where Data is Stored

Inquiry model (`inquiries` table) — same as regular product inquiries:
- `customerPhotos` — JSON array of photo URLs (already exists)
- `message` — free text describing what the customer needs
- `items` — empty array for consult-only inquiries
- `status` — NEW → tracked in admin like any other inquiry

Admin already displays customer photos for inquiries — **no admin changes needed.**

---

## Testing Checklist

- [ ] Submit inquiry with items → works as before (regression)
- [ ] Submit inquiry without items + with photos → saves to DB, admin shows photos
- [ ] Submit inquiry without items + without photos + with message → saves
- [ ] `/inquiry-cart?mode=consult` → shows consult form (no empty cart message)
- [ ] `/inquiry-cart?mode=consult&reason=real-photo` → message pre-filled
- [ ] `/inquiry-cart?mode=consult&reason=photo-match` → message pre-filled
- [ ] Trust CTA 1 → navigates to consult form with real-photo reason
- [ ] Trust CTA 3 → navigates to consult form with photo-match reason
- [ ] Email notification for photo-only inquiry → shows "žádost o poradenství"
- [ ] Telegram notification fires for photo-only inquiry
- [ ] Admin inquiry list shows photo-only inquiries with photos visible
- [ ] Photo upload works (max 3 files, size limit)
- [ ] All 3 locales (CS/UK/RU) render correctly
