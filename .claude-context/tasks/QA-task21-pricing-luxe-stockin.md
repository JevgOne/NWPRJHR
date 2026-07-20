# QA Report — Task #21: Cenová politika + LUXE rename + stock-in pricing

**Commity:** dcff775 (pricing merge), 3bdfaf3 (LUXE rename), 51d50e1 + c450758 + 020a6ad (stock-in)
**Datum QA:** 2026-07-14
**QA provedl:** Kontrolor

---

## ✅ Co je hotové a odpovídá zadání

### 1. /settings/pricing — sloučený Marže + B2B, live preview, jedno Uložit

- `PricingSettingsClient.tsx` — jediná stránka se sekcemi: Markup, B2B, Preview ✅
- Načítá data z `/api/price-settings` + `/api/b2b-settings` paralelně ✅
- Markup: "stejné pro všechny" checkbox, fallback per-category ✅
- B2B: hairdresser + salon discount v plain % (konverze na basis points při uložení) ✅
- Live preview: výpočet retail + B2B cen v reálném čase dle vzorce `sale-pricing.ts` ✅
- Jedno tlačítko "Uložit vše" — ukládá pricing i B2B najednou ✅
- Feedback "Uloženo" po save ✅

### 2. /settings/b2b → redirect na /settings/pricing

- `src/app/(app)/settings/b2b/page.tsx` obsahuje pouze `redirect("/settings/pricing")` ✅

### 3. AppShell — B2B odkaz odebrán

- `src/components/AppShell.tsx` obsahuje pouze `/settings/pricing` v Settings skupině ✅
- `/settings/b2b` odkaz **není přítomen** v navigaci ✅

### 4. TypeScript check

- `npx tsc --noEmit` → 0 chyb ✅

---

## ❌ Co chybí nebo neodpovídá

### BUG: LUXE rename nedokončen — homepage kategorie stále používá "premium"

**Soubor:** `src/app/[locale]/(public)/page.tsx:277`

```tsx
{ key: "premium" as const, img: `...`, descKey: "landing.categoryDescPremium" as const }
```

Generuje:
- `href="/offer?category=PREMIUM"` — URL filtr posílá `PREMIUM`, ale DB má `LUXE` → **0 produktů zobrazeno**
- `tCategory("premium")` — překlad klíče `category.premium` **neexistuje** v žádném messages souboru (cs.json, uk.json, ru.json mají pouze `category.luxe`)
- `t("landing.categoryDescPremium")` — tento klíč v messages existuje (není přejmenován) → text se zobrazí, ale je zavádějící

**Dopad:** Karta "LUXE/Premium" na homepage nefunguje správně — buď zobrazí fallback text nebo prázdný překlad pro `tCategory("premium")`, a URL filtr nenajde produkty kategorie LUXE.

---

## ⚠️ Co potřebuje pozornost

### messages/cs.json + uk.json + ru.json — categoryDescPremium stále "Premium"

Klíč `landing.categoryDescPremium` existuje se starým textem ("Prémiová kvalita" apod.). Po rename by měl být přejmenován na `categoryDescLuxe` nebo aktualizován obsah.

---

## Verdikt

**NESCHVÁLENA — blocker bug** ❌

Cenová politika (pricing merge): ✅ SCHVÁLENA
B2B redirect: ✅ SCHVÁLENA
AppShell: ✅ SCHVÁLENA
TypeScript: ✅ 0 chyb

**Blocker:** LUXE rename není dokončen na homepage — `src/app/[locale]/(public)/page.tsx:277` stále používá `key: "premium"`. Nutno změnit na `key: "luxe"` a `descKey: "landing.categoryDescLuxe"` (nebo přejmenovat klíč v messages).
