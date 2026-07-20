# TASK-095: FAQ Expansion — Implementation Plan

**Status:** Done (implemented)
**File:** `src/app/[locale]/(public)/offer/[...slug]/page.tsx` (lines 563-608)

---

## Overview

Expanded product page FAQ from ~10 to 17-18 questions per page. Two layers:
1. **Category-specific FAQ** (VIRGIN/LUXE/STANDARD) — expanded with coloring, care, origin
2. **General FAQ** — texture questions, RAW vlasy explainer, ordering, payments, consultation, returns, B2B

Texture questions are in general FAQ (not a separate category) per team-lead's direction.

## Key messaging: RAW vlasy

Hairland sells **RAW unprocessed hair**. Clip-in/tape-in is custom processing on order (~7 days). This is emphasized throughout — especially in the new "Co jsou RAW vlasy" and "Jak probíhá objednávka" questions.

## Category FAQ (expanded)

### VIRGIN: 4 → 6 questions
- Kept: what are virgin, longevity, can I color, general care
- Added: **care after coloring** (sulfate-free shampoo, hydrating mask 1x/week, 6-8 week intervals)
- Added: **origin** (RAW virgin from eastern Europe — Ukraine, Belarus, Moldova)

### LUXE: 3 → 5 questions
- Kept: difference from virgin, longevity, styling options
- Added: **coloring luxe hair** (darken by 2-3 tones max, regeneration mask)
- Added: **who is it for** (premium quality at reasonable price, salon applications)

### STANDARD: 3 → 4 questions
- Kept: who it's for, advantage over expensive, longevity
- Added: **coloring standard hair** (toning/darkening only, no bleaching)

## General FAQ (expanded 3 → 12)

### Texture (3 questions in general section):
1. **Rozdíl mezi texturami** — rovné vs vlnité vs kudrnaté, all as RAW
2. **Péče o rovné vlasy** — brush technique, serum, blow-dry direction
3. **Péče o vlnité/kudrnaté** — wet comb only, hydrating masks, air dry / diffuser

### RAW vlasy & objednávka (3 questions):
4. **Co jsou RAW vlasy** — unprocessed natural hair, custom processing on order
5. **Objednávka na míru** — choose RAW hair + processing type, ~7 days, contact info
6. **Kolik gramů** — 100g light, 150g medium, 200g+ full volume

### Konzultace & doručení (2 questions):
7. **Osobní konzultace** — free in Prague, see/feel hair, phone/WhatsApp
8. **Doručení** — free Prague delivery, Česká pošta for rest of CZ

### Platby & vrácení (2 questions):
9. **Platební metody** — bank transfer, cash, B2B invoicing
10. **Vrácení** — 14 days, unused, original packaging

### B2B (1 question):
11. **Spolupráce s kadeřníky** — wholesale prices, regular supply, invoicing

## SEO Keywords in Answers

- "RAW vlasy", "přírodní nezpracované vlasy", "neporušená kutikula"
- "vlasy k prodloužení", "prodloužení vlasů", "prodloužené vlasy"
- "clip-in", "tape-in", "keratin", "micro ring" (as processing options, not products)
- "Praha", "kadeřník", "salon", "konzultace"
- "průvodce gramáží"

## Composition (line 607-608)

```typescript
const categoryFaq = faqByCategory[product.category] ?? [];
const allFaq = [...categoryFaq, ...generalFaq];
```

No separate `faqByTexture` — texture questions are part of `generalFaq`.
FAQPage JSON-LD automatically picks up all entries.

## FAQ Count Per Product

| Category   | Category Qs | General Qs | Total |
|------------|-------------|------------|-------|
| VIRGIN     | 6           | 12         | 18    |
| LUXE       | 5           | 12         | 17    |
| STANDARD   | 4           | 12         | 16    |
