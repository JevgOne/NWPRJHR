# TASK-052: Trust sekce "Proč neretušujeme fotky" na product detail

## Goal

Add a trust-building section to the public product detail page explaining why Hairland
deliberately does NOT retouch product photos, plus 3 CTA options for customers who want
more assurance. Localized in CS/UK/RU. Visually pleasant, visible but not aggressive.

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
│                         │   AddToInquiryForm        │
│                         │   Delivery strip          │
│                         │   Trust guarantees ←exist │
└─────────────────────────┴───────────────────────────┘
Full width:
  - Care tips (3 columns)
  - Reviews
  - Related products
  - Recently viewed
  - FAQ accordion
```

The existing trust guarantees section (lines 1008-1031) shows 3 items:
quality guarantee, 14-day return, "we'll help you choose". Uses `bg-nude-50 rounded-xl p-4`.

---

## Placement Decision

**Place the new "Proč neretušujeme fotky" section in the full-width area, between the
2-column grid and the care tips section.** Rationale:

1. It's a content/trust piece, not a purchase-flow element — doesn't belong in the right column
2. It relates to the gallery photos (left column) but is informational — full width gives it breathing room
3. Placed right after the product grid closes, before care tips — natural reading flow
4. Visually separated with `border-t border-line` like other full-width sections

**Insert point:** After line 1033 (`</div>` closing the 2-column grid), before the care tips
section (line 1036).

---

## Implementation Plan

### Step 1: Add i18n translation keys

**Files:** `messages/cs.json`, `messages/uk.json`, `messages/ru.json`

Add keys under `public.productDetail` namespace:

**Czech (`cs.json`):**
```json
"noRetouchTitle": "Proč neretušujeme fotky",
"noRetouchDesc": "Naše produktové fotky jsou záměrně bez retuše. Chceme, abyste viděli vlasy přesně tak, jak vypadají — skutečný lesk, strukturu i barvu. Žádné filtry, žádná zklamání při doručení.",
"noRetouchCta1Title": "Vyžádejte si reálnou fotku",
"noRetouchCta1Desc": "Pošleme vám aktuální fotku konkrétního kusu, který máme skladem.",
"noRetouchCta2Title": "Přijedeme ukázat osobně",
"noRetouchCta2Desc": "Domluvte si osobní ukázku — přivezeme vlasy přímo k vám. Po Praze zdarma.",
"noRetouchCta3Title": "Pošlete fotku svých vlasů",
"noRetouchCta3Desc": "Pošlete nám fotku svých vlasů a poradíme vám s výběrem ideálního odstínu a délky."
```

**Ukrainian (`uk.json`):**
```json
"noRetouchTitle": "Чому ми не ретушуємо фото",
"noRetouchDesc": "Наші фото продуктів навмисно без ретуші. Ми хочемо, щоб ви бачили волосся саме таким, яке воно є — справжній блиск, структуру та колір. Жодних фільтрів, жодних розчарувань при отриманні.",
"noRetouchCta1Title": "Запросіть реальне фото",
"noRetouchCta1Desc": "Надішлемо вам актуальне фото конкретного товару, який є на складі.",
"noRetouchCta2Title": "Приїдемо показати особисто",
"noRetouchCta2Desc": "Домовтеся на особисту зустріч — привеземо волосся прямо до вас. По Празі безкоштовно.",
"noRetouchCta3Title": "Надішліть фото свого волосся",
"noRetouchCta3Desc": "Надішліть нам фото свого волосся, і ми допоможемо з вибором ідеального відтінку та довжини."
```

**Russian (`ru.json`):**
```json
"noRetouchTitle": "Почему мы не ретушируем фото",
"noRetouchDesc": "Наши фото продуктов намеренно без ретуши. Мы хотим, чтобы вы видели волосы именно такими, какие они есть — настоящий блеск, структуру и цвет. Никаких фильтров, никаких разочарований при получении.",
"noRetouchCta1Title": "Запросите реальное фото",
"noRetouchCta1Desc": "Пришлём вам актуальное фото конкретного товара, который есть на складе.",
"noRetouchCta2Title": "Приедем показать лично",
"noRetouchCta2Desc": "Договоритесь на личную встречу — привезём волосы прямо к вам. По Праге бесплатно.",
"noRetouchCta3Title": "Пришлите фото своих волос",
"noRetouchCta3Desc": "Пришлите нам фото своих волос, и мы поможем с выбором идеального оттенка и длины."
```

---

### Step 2: Add the section to the product detail page

**File:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx`

Insert a new `<section>` between the closing `</div>` of the 2-column grid (line 1033)
and the care tips section (line 1036).

**Visual design:**
- Full width, `border-t border-line` separator at top
- Soft background: `bg-gradient-to-br from-nude-50 to-blush-50` (warm, on-brand)
- Rounded container: `rounded-2xl p-6`
- Title with a camera/eye icon (inline SVG, no emoji)
- Description text in `text-muted` with `max-w-2xl` for readability
- 3 CTAs in a responsive grid (`grid-cols-1 sm:grid-cols-3 gap-4`)
- Each CTA card: `bg-white rounded-xl p-4 border border-line/50` with subtle shadow
- Each CTA has an icon, title (font-semibold text-ink), and description (text-xs text-muted)
- No buttons/links — these are informational CTAs encouraging contact (contact info is already
  in the header/footer and inquiry form)

**Layout:**
```
──────────────── border-t ────────────────
  [camera icon] Proč neretušujeme fotky

  Naše produktové fotky jsou záměrně bez
  retuše. Chceme, abyste viděli vlasy
  přesně tak, jak vypadají...

  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ [photo]  │ │ [car]    │ │ [camera] │
  │ Vyžádej- │ │ Přijedeme│ │ Pošlete  │
  │ te si    │ │ ukázat   │ │ fotku    │
  │ reálnou  │ │ osobně   │ │ svých    │
  │ fotku    │ │          │ │ vlasů    │
  │ desc...  │ │ desc...  │ │ desc...  │
  └──────────┘ └──────────┘ └──────────┘
──────────────────────────────────────────
```

**Icons for each CTA (inline SVG, Heroicons style):**
1. Photo request → camera icon (photo)
2. Personal visit → car/map-pin icon (truck or map-pin)
3. Send your photo → upload/arrow-up-tray icon

**JSX structure:**
```tsx
{/* No-retouch trust section */}
<section className="mt-10 pt-8 border-t border-line">
  <div className="bg-gradient-to-br from-nude-50 to-blush-50 rounded-2xl p-6">
    <div className="flex items-start gap-3 mb-4">
      <svg ...camera icon... className="w-6 h-6 text-rose shrink-0 mt-0.5" />
      <div>
        <h2 className="text-lg font-bold text-ink">
          {t("productDetail.noRetouchTitle")}
        </h2>
        <p className="text-sm text-muted mt-1 max-w-2xl leading-relaxed">
          {t("productDetail.noRetouchDesc")}
        </p>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="bg-white/80 rounded-xl p-4 border border-line/30">
          <div className="flex items-center gap-2 mb-1.5">
            <svg ...per-cta-icon... className="w-5 h-5 text-rose" />
            <h3 className="text-sm font-semibold text-ink">
              {t(`productDetail.noRetouchCta${n}Title`)}
            </h3>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            {t(`productDetail.noRetouchCta${n}Desc`)}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>
```

**Note:** Since the CTA titles/descriptions follow a pattern, use a loop with `[1,2,3].map()`
like the existing care tips pattern (line 1039-1047). Use `as any` for the translation key
template string, same as the care tips do.

---

## File Change Summary

| File | Action | Estimated lines |
|---|---|---|
| `messages/cs.json` | MODIFY — add 7 keys under `public.productDetail` | +7 |
| `messages/uk.json` | MODIFY — add 7 keys under `public.productDetail` | +7 |
| `messages/ru.json` | MODIFY — add 7 keys under `public.productDetail` | +7 |
| `src/app/[locale]/(public)/offer/[...slug]/page.tsx` | MODIFY — add section between grid and care tips | +35 |

**Total: 4 modified files, ~56 lines added**

---

## What NOT to Do

- **Do NOT make this a separate component** — it's a small static section, inline in page.tsx
  is consistent with all other sections (care tips, FAQ, trust guarantees, etc.)
- **Do NOT add buttons or links** to the CTAs — they're informational. The user already has
  the inquiry form (AddToInquiryForm) and contact in the header/footer
- **Do NOT use emoji** — use inline SVG icons, consistent with the rest of the page
- **Do NOT place this inside the 2-column grid** — it's full-width trust content
- **Do NOT make it too large or aggressive** — soft colors, moderate padding, subtle border

---

## Testing Checklist

- [ ] Section visible on product detail page below the main grid, above care tips
- [ ] Title and descriptions render correctly in Czech
- [ ] Switch locale to UK → Ukrainian text renders correctly
- [ ] Switch locale to RU → Russian text renders correctly
- [ ] Responsive: 3 CTA cards stack vertically on mobile, 3 columns on desktop
- [ ] Visual style is consistent with existing sections (nude/blush tones, same typography scale)
- [ ] Section does not interfere with the sticky photo gallery on desktop
- [ ] No hydration errors (server component, no interactivity needed)
