# QA Report — Task #19/21: Cenová politika merge (commit dcff775)

**Commit:** dcff775 (pricing page merge)  
**Datum:** 2026-07-14  
**Výsledek: PASS**

---

## 1. /settings/pricing — sloučený Pricing + B2B — PASS

`src/app/(app)/settings/pricing/PricingSettingsClient.tsx`:

- **Sekce Marže**: `sameForAll` checkbox — při zaškrtnutí jedna hodnota pro všechny kategorie, při odškrtnutí grid per-category (VIRGIN/LUXE/STANDARD/SALE)
- **Sekce B2B**: `hairdresserDiscount` + `salonDiscount` v plain % (ne basis points)
- **Sekce Preview**: live kalkulace s editovatelnou nákupní cenou (Kč/g), zobrazuje ceny pro zákazník/kadeřnice/salon
- **Jedno tlačítko Uložit** (`saveAll`): `Promise.all` pro pricing všech kategorií + fetch pro B2B — vše v jednom kliknutí

Načítání: `Promise.all([/api/price-settings, /api/b2b-settings])` — paralelní, bez waterfalls.

B2B round-trip: načte basis points → vydělí 100 → zobrazí plain %; při uložení plain % × 100 → basis points. Konzistentní.

## 2. /settings/b2b → redirect — PASS

```ts
// src/app/(app)/settings/b2b/page.tsx
import { redirect } from "next/navigation";
export default function B2BSettingsPage() {
  redirect("/settings/pricing");
}
```

Redirect implementován. `B2BSettingsClient.tsx` zůstala jako mrtvý soubor (neni importována), nezpůsobuje build error.

## 3. AppShell navigace — B2B odkaz odebrán — PASS

Settings nav v `src/components/AppShell.tsx`:
- `/settings/loyalty`
- `/settings/pricing` ← přítomen
- `/settings/companies`
- `/settings/homepage`

Žádný `/settings/b2b` odkaz — OK.

## 4. Překlady cs/uk/ru — pricingSettings namespace — PASS

Všechny klíče přítomny ve všech 3 jazycích:

| Klíč | CS | UK | RU |
|------|----|----|-----|
| `title` | Cenova politika | Цiнова полiтика | Ценовая политика |
| `markupSection` | Marze (nakup -> prodej) | Маржа (закупка -> продаж) | Маржа (закупка -> продажа) |
| `markup` | Marze | Маржа | Маржа |
| `sameForAll` | Stejna marze pro vsechny kategorie | Однакова маржа для всiх категорiй | Одинаковая маржа для всех категорий |
| `b2bSection` | B2B slevy | B2B знижки | B2B скидки |
| `hairdresserDiscount` | Sleva pro kadernice | Знижка для майстрiв | Скидка для мастеров |
| `salonDiscount` | Sleva pro salony | Знижка для салонiв | Скидка для салонов |
| `discountFromMargin` | z marze | з маржi | с маржи |
| `previewSection` | Priklad cen | Приклад цiн | Пример цен |
| `previewCost` | Nakupni cena | Закупiвельна цiна | Закупочная цена |
| `saveAll` | Ulozit vse | Зберегти все | Сохранить все |
| `saved` | Ulozeno | Збережено | Сохранено |

## 5. TypeScript check — PASS

```
npx tsc --noEmit → 0 chyb
```

## 6. Reverzní kontrola: "zjednodušit cenovou politiku pro admina" — PASS

**Zadání:** Sloučit oddělené stránky Pricing + B2B do jedné, jeden formulář, jedno Uložit.

**Skutečnost:**
- Dříve: `/settings/pricing` (marže) + `/settings/b2b` (B2B slevy) = dvě stránky, dvě tlačítka
- Nyní: `/settings/pricing` obsahuje oboje = jedna stránka, jedno tlačítko, live preview
- `/settings/b2b` přesměrovává na `/settings/pricing`
- AppShell neobsahuje duplicitní B2B odkaz

Cíl splněn — admin má vše na jednom místě.

---

## Závěr

PASS. Merge cenové politiky proběhl správně. Všechny jazyky OK. TypeScript čistý. Redirect funguje. Mrtvý soubor `B2BSettingsClient.tsx` nezpůsobuje problém, ale může být odstraněn.
