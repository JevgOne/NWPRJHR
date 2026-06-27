# Task #35 — Hairdresser Catalog: Analysis

## Result: ALREADY FULLY IMPLEMENTED — NO CHANGES NEEDED

The hairdresser catalog is **the same page** as the salon catalog (`/salon/catalog`), and it already handles both roles with role-specific pricing. Here's the proof:

---

## 1. Access Control — HAIRDRESSER already has access

**`src/app/(salon)/salon/layout.tsx` line 12:**
```tsx
if (session.user.role !== "SALON" && session.user.role !== "HAIRDRESSER") redirect("/dashboard");
```
Both SALON and HAIRDRESSER roles can access `/salon/*` pages.

**`src/app/api/salon-portal/catalog/route.ts` line 12-13:**
```tsx
if (session.user.role !== "SALON" && session.user.role !== "HAIRDRESSER" || !session.user.salonId)
```
API allows both roles.

---

## 2. Pricing — Already role-specific

**`src/app/api/salon-portal/catalog/route.ts` lines 22-65:**

```
isHairdresser = session.user.role === "HAIRDRESSER"

IF hairdresser:
  price = retailPricePerGram * (10000 - hairdresserDiscountPct) / 10000
  (default hairdresserDiscountPct = 2000 = 20%)

IF salon:
  price = wholesalePricePerGram * (10000 - loyaltyDiscount) / 10000
  (loyaltyDiscount from salon's tier)
```

So:
- **SALON** sees wholesale prices with loyalty discount applied
- **HAIRDRESSER** sees retail prices with B2B hairdresser discount applied

These are completely different price bases — wholesale vs retail.

---

## 3. Discount Banner — Already role-aware

**`CatalogClient.tsx` lines 180-188:**

```tsx
role === "HAIRDRESSER"
  ? "bg-nude-50 text-espresso"   // Nude banner for hairdresser
  : "bg-rose/5 text-rose"        // Rose banner for salon

role === "HAIRDRESSER"
  ? `${tB2B("tierHairdresser")} — ${discountPct}% discount`
  : `${tB2B("tierSalon")} — ${discountPct}% discount`
```

---

## 4. B2B Settings API — Already role-filtered

**`/api/b2b-settings` GET (lines 28-33):**
- HAIRDRESSER → returns `{ discountPct: hairdresserDiscountPct }` (default 2000 = 20%)
- SALON → returns `{ discountPct: salonDiscountPct }` (default 3600 = 36%)

---

## 5. Order Creation — Already works for both roles

**`/api/orders` POST (lines 76-77):**
```tsx
if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
  salonId = session.user.salonId!;
}
```

Both roles can create orders. The `salonId` is auto-filled from the session.

---

## Conclusion

**Zero code changes needed.** The entire flow already works for hairdressers:

1. HAIRDRESSER logs in → redirected to `/salon/catalog` (same portal as SALON)
2. Sees catalog with **retail prices minus hairdresser discount** (not wholesale)
3. Sees nude-colored banner saying "Kadeřnice — 20% sleva"
4. Can add items to cart and submit order
5. Admin receives order notification

The only difference between SALON and HAIRDRESSER in the catalog:
| Aspect | SALON | HAIRDRESSER |
|--------|-------|-------------|
| Base price | `wholesalePricePerGram` | `retailPricePerGram` |
| Discount source | Loyalty tier (`getLoyaltyDiscount`) | B2B settings (`hairdresserDiscountPct`) |
| Default discount | 36% (salonDiscountPct) | 20% (hairdresserDiscountPct) |
| Banner color | Rose | Nude |
| Banner text | "Salon" | "Kadeřnice" |
