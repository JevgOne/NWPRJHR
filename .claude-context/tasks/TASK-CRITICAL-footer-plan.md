# TASK: Prolinkovat reklamační řád a dopravu ve footeru

**Date:** 2026-07-01
**Status:** Plan ready for implementation

---

## Problem

Footer (PublicFooter.tsx) is missing links to `/reklamacni-rad` and `/doprava`. Also, obchodní podmínky page should link to reklamační řád (section 6 mentions complaints). Sitemap needs `/reklamacni-rad`.

---

## Current State

### Footer (`src/components/public/PublicFooter.tsx`):
- **Legal/Info column** (lines 66-92) has: Obchodní podmínky, Ochrana soukromí, Registrace salonu, Kontakt
- **Missing:** Reklamační řád, Doprava a platba

### Obchodní podmínky (`src/app/(public)/obchodni-podminky/page.tsx`):
- Section 6 = "Reklamace a záruka"
- Section 9 links to `/privacy` (Ochrana osobních údajů)
- **Missing:** No link to `/reklamacni-rad` from section 6

### Sitemap (`src/app/sitemap.ts`):
- Has `/doprava` (line 77)
- **Missing:** `/reklamacni-rad`

### Pages verified to exist:
- `/reklamacni-rad` — `src/app/(public)/reklamacni-rad/page.tsx` (exists)
- `/doprava` — exists (in sitemap, so page must exist)

---

## Implementation Steps

### Step 1: Add links to footer

**File:** `src/components/public/PublicFooter.tsx`

In the Legal/Info column (lines 70-91), add two new `<li>` entries:

```tsx
{/* After Obchodní podmínky (line 75) */}
<li>
  <Link href="/reklamacni-rad" className="text-nude-200/80 hover:text-white transition-colors">
    {t("footer.complaintsLink")}
  </Link>
</li>
<li>
  <Link href="/doprava" className="text-nude-200/80 hover:text-white transition-colors">
    {t("footer.shippingLink")}
  </Link>
</li>
```

Insert them after the "Obchodní podmínky" link and before "Ochrana soukromí":

Final order in Info column:
1. Obchodní podmínky
2. **Reklamační řád** (NEW)
3. **Doprava a platba** (NEW)
4. Ochrana soukromí
5. Registrace salonu
6. Kontakt

### Step 2: Add translation keys

**Files:** `messages/cs.json`, `messages/uk.json`, `messages/ru.json`

Add to `public.footer` section:

| Key | CS | UK | RU |
|-----|----|----|-----|
| `complaintsLink` | "Reklamační řád" | "Порядок рекламації" | "Порядок рекламации" |
| `shippingLink` | "Doprava a platba" | "Доставка та оплата" | "Доставка и оплата" |

### Step 3: Add link to reklamační řád from obchodní podmínky

**File:** `src/app/(public)/obchodni-podminky/page.tsx`

Currently section 9 has a link to `/privacy`. Add similar treatment for section 6 (Reklamace a záruka):

```tsx
{num === 6 && (
  <Link
    href="/reklamacni-rad"
    className="inline-block mt-2 text-sm text-rose hover:text-rose-deep underline"
  >
    {t("section6Link")}
  </Link>
)}
```

Add translation key:

| Key | CS | UK | RU |
|-----|----|----|-----|
| `section6Link` | "Kompletní reklamační řád →" | "Повний порядок рекламації →" | "Полный порядок рекламации →" |

### Step 4: Add `/reklamacni-rad` to sitemap

**File:** `src/app/sitemap.ts`

Add entry after `/doprava` (line 82):

```typescript
{
  url: `${BASE_URL}/reklamacni-rad`,
  lastModified: STATIC_DATE,
  changeFrequency: "yearly",
  priority: 0.5,
},
```

---

## Files Summary

| File | Changes |
|------|---------|
| `src/components/public/PublicFooter.tsx` | Add 2 new `<li>` links (reklamační řád, doprava) |
| `src/app/(public)/obchodni-podminky/page.tsx` | Add Link to `/reklamacni-rad` in section 6 |
| `src/app/sitemap.ts` | Add `/reklamacni-rad` entry |
| `messages/cs.json` | Add `footer.complaintsLink`, `footer.shippingLink`, `terms.section6Link` |
| `messages/uk.json` | Same keys in Ukrainian |
| `messages/ru.json` | Same keys in Russian |

---

## Risk

LOW — Adding static links and a sitemap entry. No API/data changes.
