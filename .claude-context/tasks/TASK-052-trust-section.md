# TASK-052: Trust sekce "Proč neretušujeme fotky" na product detail

## Goal

Add a trust-building section to the public product detail page explaining why Hairland
deliberately does NOT retouch product photos, plus 3 actionable CTAs. Localized in CS/UK/RU.
Visually pleasant, visible but not aggressive.

---

## Current Page Structure

The public product detail page (`src/app/[locale]/(public)/offer/[...slug]/page.tsx`)
has this layout:

```
┌─ 2-column grid (lg) ──────────────────────────────┐
│ LEFT (sticky):          │ RIGHT:                    │
│   PhotoGallery          │   H1 + badges             │
│                         │   Price                   │
│                         │   Description             │
│                         │   Specs grid              │
│                         │   Category features       │
│                         │   AddToInquiryForm ← CTA1,3 scroll here │
│                         │   Delivery strip          │
│                         │   Trust guarantees (existing 3 items) │
└─────────────────────────┴───────────────────────────┘
Full width below:
  - Care tips (3 columns)
  - Reviews
  - Related products
  - Recently viewed
  - FAQ accordion
```

---

## Placement

**Inside the right column, between the existing trust guarantees and the closing `</div>` of
the right column.** This places it:
- Below the delivery strip and existing trust block
- Above the fold boundary on desktop (right column, within purchase context)
- Still visible alongside the sticky photo gallery

**Why not full-width?** The lead specified "pod cenu/nad inquiry form" — keeping it in the right
column keeps it in the purchase decision flow. The existing trust block (quality, returns, contact)
is also in the right column.

**Insert point:** After the existing trust guarantees `</div>` (line ~1031), still inside the
right column `<div className="space-y-4">`, before its closing `</div>` (line 1032).

---

## Approved Content (CS)

**Title:** "Proč neretušujeme fotky"

**Description:** "Záměrně nepoužíváme studiové nasvícení ani úpravy fotografií. S vlasy bohužel
platí, že každé světlo mění odstín — co na obrazovce vypadá jako teplá blond, může naživo být
o tón chladnější. Nechceme, abyste byly překvapené."

**3 CTAs:**
1. **Vyfotíme váš konkrétní kus** — pošleme reálnou fotku přesně toho svazku, který byste dostaly
2. **Přijedeme ukázat zdarma** — osobně po Praze, uvidíte odstín na vlastní oči
3. **Pošlete fotku svých vlasů** — najdeme ideální shodu a doporučíme

---

## CTA Link Targets

| CTA | Action | Target |
|---|---|---|
| Vyfotíme váš konkrétní kus | Link to inquiry/contact with pre-filled note | Scroll up to `AddToInquiryForm` (already on page, uses `id="inquiry-form"` anchor) or link to `/contact` |
| Přijedeme ukázat zdarma | Link to contact/WhatsApp | `https://wa.me/420608553103` (existing WhatsApp, used in footer) |
| Pošlete fotku svých vlasů | Link to inquiry with photo upload | Scroll up to `AddToInquiryForm` or link to `/contact` where ContactForm has upload |

**Recommendation:** Use `<Link href="/contact">` for CTA 1 and 3 (contact form supports file upload
and notes). Use WhatsApp link for CTA 2 (direct personal scheduling). All links open in the same
context — no new tabs for internal links, `target="_blank"` for WhatsApp.

**Alternative:** If the team prefers, CTAs 1 and 3 can be anchor scrolls to the `AddToInquiryForm`
higher on the page. This requires adding an `id` attribute to that form's container. The advantage
is keeping the user on-page; the disadvantage is the inquiry form doesn't have a "notes" or
"photo upload" field — it's just a variant picker + quantity + add-to-cart.

**Best approach:** CTA 1 → `/contact` (contact form allows free-text message).
CTA 2 → `https://wa.me/420608553103` with pre-filled text.
CTA 3 → `/contact` (contact form has or can have file upload).

---

## Implementation Plan

### Step 1: Add i18n translation keys

**Files:** `messages/cs.json`, `messages/uk.json`, `messages/ru.json`

Add keys under `public.productDetail` namespace:

**Czech (`cs.json`):**
```json
"noRetouchTitle": "Proč neretušujeme fotky",
"noRetouchDesc": "Záměrně nepoužíváme studiové nasvícení ani úpravy fotografií. S vlasy bohužel platí, že každé světlo mění odstín — co na obrazovce vypadá jako teplá blond, může naživo být o tón chladnější. Nechceme, abyste byly překvapené.",
"noRetouchCta1Title": "Vyfotíme váš konkrétní kus",
"noRetouchCta1Desc": "Pošleme reálnou fotku přesně toho svazku, který byste dostaly.",
"noRetouchCta2Title": "Přijedeme ukázat zdarma",
"noRetouchCta2Desc": "Osobně po Praze — uvidíte odstín na vlastní oči.",
"noRetouchCta3Title": "Pošlete fotku svých vlasů",
"noRetouchCta3Desc": "Najdeme ideální shodu a doporučíme správný odstín a délku."
```

**Ukrainian (`uk.json`):**
```json
"noRetouchTitle": "Чому ми не ретушуємо фото",
"noRetouchDesc": "Ми свідомо не використовуємо студійне освітлення та обробку фотографій. З волоссям, на жаль, кожне світло змінює відтінок — те, що на екрані виглядає як тепла блонда, наживо може бути на тон холоднішим. Ми не хочемо, щоб ви були здивовані.",
"noRetouchCta1Title": "Сфотографуємо ваш конкретний пучок",
"noRetouchCta1Desc": "Надішлемо реальне фото саме того пучка, який ви отримаєте.",
"noRetouchCta2Title": "Приїдемо показати безкоштовно",
"noRetouchCta2Desc": "Особисто по Празі — побачите відтінок на власні очі.",
"noRetouchCta3Title": "Надішліть фото свого волосся",
"noRetouchCta3Desc": "Знайдемо ідеальний збіг та порекомендуємо правильний відтінок і довжину."
```

**Russian (`ru.json`):**
```json
"noRetouchTitle": "Почему мы не ретушируем фото",
"noRetouchDesc": "Мы сознательно не используем студийное освещение и обработку фотографий. С волосами, к сожалению, каждый свет меняет оттенок — то, что на экране выглядит как теплый блонд, вживую может быть на тон холоднее. Мы не хотим, чтобы вы были разочарованы.",
"noRetouchCta1Title": "Сфотографируем ваш конкретный пучок",
"noRetouchCta1Desc": "Пришлём реальное фото именно того пучка, который вы получите.",
"noRetouchCta2Title": "Приедем показать бесплатно",
"noRetouchCta2Desc": "Лично по Праге — увидите оттенок своими глазами.",
"noRetouchCta3Title": "Пришлите фото своих волос",
"noRetouchCta3Desc": "Найдём идеальное совпадение и порекомендуем правильный оттенок и длину."
```

---

### Step 2: Add the section to the product detail page

**File:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx`

Insert after the existing trust guarantees block (after line ~1031), still inside the right column.

**Visual design:**
- Soft background: `bg-amber-50/50 rounded-2xl p-5` (subtly different from the existing
  `bg-nude-50` trust block to distinguish it, but still warm/on-brand)
- No heavy border — just background differentiation
- Title with camera-off icon (Heroicons `camera` with a slash, or eye icon)
- Description: `text-sm text-muted leading-relaxed`
- 3 CTAs as compact items with icon + title + description
- Each CTA is a clickable `<a>` or `<Link>` — subtle, not button-like
- Use `hover:bg-white/60 rounded-lg p-2 -m-2 transition-colors` for interactive feel

**Layout:**
```
┌─────────────────────────────────────────┐
│ [camera icon]                           │
│ Proč neretušujeme fotky                 │
│                                         │
│ Záměrně nepoužíváme studiové            │
│ nasvícení ani úpravy fotografií...      │
│                                         │
│ 📸 Vyfotíme váš konkrétní kus          │
│    Pošleme reálnou fotku přesně...      │
│                                         │
│ 🚗 Přijedeme ukázat zdarma             │
│    Osobně po Praze — uvidíte...         │
│                                         │
│ 💇 Pošlete fotku svých vlasů           │
│    Najdeme ideální shodu...             │
└─────────────────────────────────────────┘
```

(Icons are inline SVGs, not emoji — the emoji above is just for plan readability)

**JSX structure:**
```tsx
{/* No-retouch trust section */}
<div className="rounded-2xl bg-amber-50/50 p-5 space-y-3">
  <div className="flex items-start gap-2.5">
    <svg className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {/* camera icon */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
    <div>
      <h3 className="text-sm font-bold text-ink">{t("productDetail.noRetouchTitle")}</h3>
      <p className="text-xs text-muted mt-1 leading-relaxed">{t("productDetail.noRetouchDesc")}</p>
    </div>
  </div>

  <div className="space-y-2 pt-1">
    {/* CTA 1: Photo request → contact */}
    <Link href="/contact" className="flex items-start gap-2.5 hover:bg-white/60 rounded-lg p-2 -m-2 transition-colors">
      <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" ...photo-icon... />
      <div>
        <p className="text-xs font-semibold text-ink">{t("productDetail.noRetouchCta1Title")}</p>
        <p className="text-xs text-muted">{t("productDetail.noRetouchCta1Desc")}</p>
      </div>
    </Link>

    {/* CTA 2: Personal visit → WhatsApp */}
    <a href="https://wa.me/420608553103" target="_blank" rel="noopener noreferrer"
       className="flex items-start gap-2.5 hover:bg-white/60 rounded-lg p-2 -m-2 transition-colors">
      <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" ...car/map-pin-icon... />
      <div>
        <p className="text-xs font-semibold text-ink">{t("productDetail.noRetouchCta2Title")}</p>
        <p className="text-xs text-muted">{t("productDetail.noRetouchCta2Desc")}</p>
      </div>
    </a>

    {/* CTA 3: Send your photo → contact */}
    <Link href="/contact" className="flex items-start gap-2.5 hover:bg-white/60 rounded-lg p-2 -m-2 transition-colors">
      <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" ...upload-icon... />
      <div>
        <p className="text-xs font-semibold text-ink">{t("productDetail.noRetouchCta3Title")}</p>
        <p className="text-xs text-muted">{t("productDetail.noRetouchCta3Desc")}</p>
      </div>
    </Link>
  </div>
</div>
```

**Icons (Heroicons outline, 24x24 viewBox):**
1. CTA 1 (photo request): `camera` icon
2. CTA 2 (personal visit): `truck` or `map-pin` icon
3. CTA 3 (send your photo): `arrow-up-tray` (upload) icon

**Note:** This page is a server component — `Link` from `@/i18n/navigation` is already imported
(line 2). The WhatsApp link uses a plain `<a>` tag.

---

## File Change Summary

| File | Action | Lines |
|---|---|---|
| `messages/cs.json` | MODIFY — add 7 keys in `public.productDetail` | +7 |
| `messages/uk.json` | MODIFY — add 7 keys in `public.productDetail` | +7 |
| `messages/ru.json` | MODIFY — add 7 keys in `public.productDetail` | +7 |
| `src/app/[locale]/(public)/offer/[...slug]/page.tsx` | MODIFY — add section after existing trust block | +40 |

**Total: 4 modified files, ~61 lines added**

---

## What NOT to Do

- **Do NOT extract to a separate component** — inline in page.tsx, consistent with all other
  sections (trust guarantees, care tips, category features, FAQ)
- **Do NOT use emoji in the rendered output** — use inline SVG icons
- **Do NOT make the CTAs into big buttons** — they should be subtle, link-like items
  with hover state, not aggressive call-to-action buttons
- **Do NOT place outside the right column** — keep in purchase decision context
- **Do NOT add new pages or routes** — link to existing `/contact` and WhatsApp

---

## Testing Checklist

- [ ] Section visible on product detail page below existing trust block, in right column
- [ ] Czech text matches the approved copy exactly
- [ ] Switch to UK locale → Ukrainian text renders
- [ ] Switch to RU locale → Russian text renders
- [ ] CTA 1 "Vyfotíme" links to `/contact` (correct locale prefix applied by Link)
- [ ] CTA 2 "Přijedeme" opens WhatsApp in new tab (`wa.me/420608553103`)
- [ ] CTA 3 "Pošlete fotku" links to `/contact`
- [ ] Hover state on CTAs shows subtle background change
- [ ] Responsive: section flows naturally in mobile single-column layout
- [ ] Visual style is consistent — amber tones differentiate from existing nude trust block
- [ ] No hydration errors (server component)
- [ ] Section does not push AddToInquiryForm too far down (check mobile scroll)
