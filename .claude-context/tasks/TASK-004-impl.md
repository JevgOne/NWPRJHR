# TASK-004: Hair Texture + Color Tones System — Implementation

**Date:** 2026-06-27
**Status:** Implemented

---

## Changes Summary

### New Files (3)

| File | Purpose |
|------|---------|
| `src/lib/hair-textures.ts` | TEXTURE_OPTIONS (4 defaults: Rovne, Mirne vlnite, Vlnite, Kudrnate) + getTextureInfo() lookup |
| `src/lib/hair-tones.ts` | TONE_OPTIONS (4 defaults: Blond, Hneda, Tmave hneda, Zrzava) + getToneInfo() lookup |
| `src/app/api/products/options/route.ts` | GET endpoint returning DISTINCT texture/tone values from DB for combo-box |

### Modified Files (15)

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Added `texture String?` and `tone String?` to Product model |
| `src/lib/validations/product.ts` | Added `texture: z.string().max(200).optional()` and `tone` to createProductSchema |
| `src/lib/api/product-serializer.ts` | Added texture + tone to base object in serializeProductForRole() |
| `src/app/api/public/products/route.ts` | Added texture + tone to select + filtering params |
| `src/app/api/products/route.ts` | Added texture + tone filtering params |
| `src/app/(public)/offer/ProductsShowcase.tsx` | Added texture/tone filter panels, active filter badges, product card badges |
| `src/app/(public)/offer/[id]/page.tsx` | Added texture/tone to getProduct select, specs grid, SEO metadata |
| `src/components/public/HeroProductSlider.tsx` | Added texture to SliderProduct interface + badge in ProductCard |
| `src/app/(app)/products/new/CreateProductForm.tsx` | Added texture/tone combo-boxes (same pattern as origin autocomplete) |
| `src/app/(app)/products/[id]/ProductDetailClient.tsx` | Added texture/tone to interface + badge display |
| `src/app/(app)/products/ProductListClient.tsx` | Added texture/tone badges in product list cards |
| `src/components/inventory/StockInForm.tsx` | Added texture/tone to ProductOption interface + info display |
| `messages/cs.json` | Added texture/tone translations (product, offer filters, productDetail) |
| `messages/uk.json` | Added texture/tone translations (Ukrainian) |
| `messages/ru.json` | Added texture/tone translations (Russian) |

### Key Decisions

- **String fields, not enums** — texture and tone are stored as plain strings in DB, allowing admin to add custom values
- **Combo-box pattern** — same as origin autocomplete: dropdown merges hardcoded defaults with DISTINCT values from DB
- **DB values stored in Czech** — translations handled via i18n lookup
- **SEO** — texture included in page title, both texture and tone in meta description

### DB Migration Required

```sql
ALTER TABLE products ADD COLUMN texture TEXT;
ALTER TABLE products ADD COLUMN tone TEXT;
```

Run via Turso CLI: `turso db shell hairora-db`
