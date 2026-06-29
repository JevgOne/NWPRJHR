# TASK-049 Evzen Audit — 3 Fixes (inventory, salonId, processingType)
**Date:** 2026-06-28
**Reviewer:** evzen-the-king (READ-ONLY kontrolor)
**Status:** COMPLETED

---

## 1. InventoryClient.tsx — "SKLAD MUSI OBSAHOVAT JEN TO CO MAME"
**Verdict: ✅ OK**

Soubor: `src/app/(app)/inventory/InventoryClient.tsx`

- `showSoldOut` state defaults to `false` (line 39)
- Filter logic (lines 41-46): `(showSoldOut || item.availableGrams > 0)` — hides 0-stock items by default
- Toggle checkbox (lines 58-66): label `t("showSoldOut")` = "Zobrazit vyprodane" (cs), translations in all 3 locales
- Checkbox uses brand styling: `text-rose focus:ring-rose` (line 63)
- Color coding for stock levels (lines 22-26): red <=0, amber <100, green >=100

**Matches user requirement:** "SKLAD MUSI OBSAHOVAT JEN TO CO MAME" — default view shows only items with stock >0. Toggle allows admin to see sold-out if needed (no data is hidden permanently, just filtered by default).

---

## 2. Order API — salonId validation fix
**Verdict: ✅ OK**

Soubor: `src/lib/validations/salon.ts`
- `createOrderSchema` (lines 27-40): `salonId: z.string().optional()` — salonId is OPTIONAL in validation
- This prevents "The string did not match the expected pattern" error when salon sends empty string

Soubor: `src/app/api/orders/route.ts`
- POST handler (lines 61-85):
  - SALON/HAIRDRESSER roles (lines 76-77): `salonId = session.user.salonId!` — taken from session, NOT from request body
  - OWNER/EMPLOYEE roles (lines 78-82): requires salonId from body (staff creating order on behalf of salon)
  - Other roles: 403 Forbidden
- CatalogClient sends `salonId: ""` (line 123) — this is now valid because Zod accepts optional string
- API ignores the empty string for SALON/HAIRDRESSER and uses session salonId instead

**Matches user requirement:** Order from salon catalog no longer fails with pattern mismatch error. The salonId is safely derived from session for salon users.

---

## 3. ProductsShowcase.tsx — No processingType rendered
**Verdict: ✅ OK**

Soubor: `src/app/(public)/offer/ProductsShowcase.tsx`

- `processingType` is in the interface (line 28) but is **NEVER rendered** in JSX
- Grep confirms: only 1 occurrence at line 28 (type definition), zero rendering references
- Product cards show: category badge, origin, texture, name, lengths, colors, price — NO processing type
- Category badges have correct distinct colors (lines 64-69):
  - VIRGIN: `bg-amber-600 text-white` (amber = visible, distinct)
  - PREMIUM: `bg-mauve text-white` (mauve = visible, distinct)
  - STANDARD: `bg-emerald-600 text-white`
  - SALE: `bg-red-500 text-white`

**Matches user requirement:** "my prodavame JENOM SUROVE VLASY" + "to zpracovani se dela zvlast" — processing type is not shown on the public offer page. Customers see hair category (Virgin/Premium/Standard/Sale) but not processing type (Clip-in/Tape-in etc.) because that's a separate service.

**NOTE:** CatalogClient (B2B salon portal) still renders processingType (lines 218-219). This might be intentional — salon/hairdresser customers may need to know the raw hair processing type for their work. However, if the user's statement "my prodavame JENOM SUROVE VLASY" applies globally, this should also be removed from CatalogClient. Flagging for team lead decision.

---

## SUMMARY

| # | Check | Verdikt |
|---|-------|---------|
| 1 | Inventory hides 0-stock by default | ✅ OK — `showSoldOut=false`, toggle "Zobrazit vyprodane" |
| 2 | Order salonId fix | ✅ OK — optional in Zod, API uses session for salon roles |
| 3 | ProductsShowcase no processingType | ✅ OK — field in interface only, never rendered |

**All 3 fixes match user requirements. APPROVED.**

**Minor observation:** CatalogClient.tsx (B2B) still shows processingType — may need separate decision.
