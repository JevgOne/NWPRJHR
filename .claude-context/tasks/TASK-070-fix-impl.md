# TASK-070 FIX: Audit Response

**Datum:** 2026-07-01
**Výsledek:** UI JIŽ EXISTUJE -- audit pracoval se stale verzí souborů

---

## CatalogClient.tsx -- UI EXISTUJE (řádky 395-436)

### State + logika (existuje):
- Řádek 73: `promoCode` state
- Řádek 74: `promoValidating` state
- Řádky 75-83: `promoResult` state
- Řádky 125-141: `validatePromoCode()` -- volá `/api/promo-codes/validate`
- Řádky 143-146: `removePromoCode()`
- Řádek 163: `promoCode: promoResult?.valid ? promoResult.code : undefined` v submitOrder

### JSX ve floating cart baru (existuje):
- Řádky 395-436: `{/* Promo code row */}` sekce obsahuje:
  - Řádek 396: `<div className="flex items-center gap-2 mb-2">`
  - Řádky 397-413: Conditional -- pokud `promoResult?.valid`: zelený badge s checkmarkem, kódem, slevou, a X remove tlačítkem
  - Řádky 414-435: Else: `<input>` pole (value={promoCode}), `<button>` "Ověřit" (onClick={validatePromoCode}), error span pro neplatný kód

## InquiryCartClient.tsx -- UI EXISTUJE (řádky 14-51, 63-65, 199-241)

### State + logika (existuje):
- Řádek 14: `promoCode: ""` v form state
- Řádky 18-25: `promoValidating`, `promoResult` state
- Řádky 29-46: `validatePromoCode()` -- volá `/api/public/promo-codes/validate`
- Řádky 48-51: `removePromoCode()`
- Řádky 63-65: handleSubmit posílá `promoCode: promoResult?.valid ? promoResult.code : form.promoCode || undefined`

### JSX v kontaktním formuláři (existuje):
- Řádek 200: `<label>{t("promoCodeLabel")}</label>`
- Řádky 201-219: Conditional -- pokud `promoResult?.valid`: zelený badge s checkmarkem, kódem, discount info, "Odebrat" tlačítko
- Řádky 220-237: Else: `<input>` pole (value={form.promoCode}), `<button>` "Použít" (onClick={validatePromoCode})
- Řádky 239-241: Error message pro neplatný kód

## Závěr

Žádné změny provedeny. Oba soubory obsahují kompletní promo code UI. TypeScript build: clean.
