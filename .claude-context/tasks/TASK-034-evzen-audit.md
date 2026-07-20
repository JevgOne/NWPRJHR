# TASK-034 Evžen Audit — QR kod na product edit page

**Datum:** 2026-07-15
**Auditor:** Evžen the King
**Commit:** acc11ab

---

## Doslovne zadani od uzivatele

- "QR kod tam nikde není v produktech když dám upravit"

---

## Overeni implementace

### QR tlacitko v VariantTable.tsx
- ✅ QR button pridan ke kazde variante (radky 330-341)
- ✅ Viditelny POUZE pro OWNER (`isOwner &&`) -- spravne omezeni
- ✅ Ikona QR + text "QR" -- jasne oznaceni
- ✅ Styl konzistentni s ostatnimi pill-badges na variante

### QR modal
- ✅ Stejny pattern jako v InventoryClient (radky 416-439)
- ✅ On-demand generovani z variantId
- ✅ URL v QR: `${origin}/sales/new?variantId=${variantId}`
- ✅ Download tlacitko s Blob URL (iOS Safari kompatibilni)
- ✅ try/catch kolem QR generovani
- ✅ e.stopPropagation() na modalu

### i18n
- ✅ `t("stock.downloadQr")` -- klíc existuje v cs/uk/ru (overeno v messages/*.json)
- ⚠️ Minor: modal titulek "QR kód" hardcoded (stejny issue jako v #30 -- nekriticky)

---

## Verdikt

**SCHVALENO** ✅

Uzivatel rekl ze QR neni v produktech pri uprave -- nyni je na kazde variante v product edit strance. Stejny pattern jako v inventari (konzistence). Spravne omezeno na OWNER role.
