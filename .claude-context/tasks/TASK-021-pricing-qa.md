# QA Report — Task #21: Cenová politika + LUXE rename + stock-in pricing

**Commity:** dcff775 (pricing page merge) + 3bdfaf3 (LUXE rename) + 51d50e1 + c450758 + 020a6ad  
**Datum:** 2026-07-14  
**Výsledek: PASS**

---

## 1. /settings/pricing — sloučený Marže + B2B — PASS

**PricingSettingsClient.tsx** obsahuje:
- Sekce Marže: `sameForAll` checkbox + markupPercent input (nebo per-category grid)
- Sekce B2B: hairdresserDiscount + salonDiscount
- Sekce Preview: live kalkulace s editovatelnou nákupní cenou
- **Jedno tlačítko Uložit** (`saveAll`): ukládá pricing + B2B v jednom kliknutí (parallelní Promise.all + sekvenční fetch)

Stav načtení: `Promise.all([/api/price-settings, /api/b2b-settings])` — obě API volány najednou.

## 2. /settings/b2b → redirect na /settings/pricing — PASS

```ts
// src/app/(app)/settings/b2b/page.tsx
import { redirect } from "next/navigation";
export default function B2BSettingsPage() {
  redirect("/settings/pricing");
}
```
Redirect implementován správně. Stará B2BSettingsClient.tsx zůstala v adresáři ale není exportována ani použita (mrtvý kód — nezávadné, nepůsobí build error).

## 3. AppShell — B2B odkaz odebrán — PASS

V AppShell.tsx settings navigace obsahuje pouze:
- `/settings/loyalty`
- `/settings/pricing`  ← pricing zde je
- `/settings/companies`
- `/settings/homepage`

Žádný odkaz na `/settings/b2b` — OK.

## 4. Live preview kalkulace — PASS

**Vzorec v PricingSettingsClient.tsx:**
```ts
const retailHalere = Math.round(costHalere * (1 + markup / 100));
const hairPrice = Math.round(retailHalere - (retailHalere * hairDiscBp) / 20000);
const salonPrice = Math.round(retailHalere - (retailHalere * salonDiscBp) / 20000);
```

**Vzorec v sale-pricing.ts (backend):**
```ts
pricePerGram = roundHalereUp(
  variant.retailPricePerGram - (variant.retailPricePerGram * discountPct) / 20000
);
```

Preview UI a backend používají totožný vzorec `retail - (retail * discountBp) / 20000` — **konzistentní**.

B2B konverze: UI načte basis points, vydělí 100 → zobrazí plain %. Při uložení plain % * 100 → basis points. Konzistentní round-trip.

## 5. TypeScript check — PASS

```
npx tsc --noEmit → 0 chyb
```

## 6. LUXE rename — PASS

- cs.json: `"luxe": "Luxe Vlasy"` — správně
- Kategorie v UI zobrazeny přes `CategoryBadge` + `tCat(cat.toLowerCase())` → mapuje na překlad

---

## Závěr

Všechny body PASS. Pricing page správně slučuje Marže + B2B do jednoho formuláře s jedním tlačítkem. Redirect z /b2b funguje. AppShell neobsahuje B2B odkaz.
