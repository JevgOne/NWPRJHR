# TASK-060 QA Report — Length buttons s cenou a dostupnosti

**Date:** 2026-06-28
**QA:** Kontrolor
**Verdict: PASS** (1 minor observation)

---

## 1. TypeScript — tsc --noEmit

**PASS** — zadne chyby.

---

## 2. AddToInquiryForm.tsx — length buttons

**PASS** — implementovano spravne.

Kontrolovane body:

| Pozadavek | Stav | Detail |
|---|---|---|
| Delka zobrazena | PASS | `{v.lengthCm} cm` — line 139 |
| Cena/g zobrazena | PASS | `{formatPrice(v.pricePerGram)} Kc/g` — line 141 |
| Dostupne gramy zobrazeny | PASS | `{v.availableGrams}g` — line 144 |
| Nedostupne varianty disabled | PASS | `disabled={!inStock}` — line 130 |
| Nedostupne varianty muted | PASS | `opacity-50 cursor-not-allowed` — line 136 |
| Out-of-stock text z prekladu | PASS | `t("inquiry.outOfStock")` — line 144 |
| `availableLengths` vraci `PickerVariant[]` | PASS | lines 51-56 |
| `formatPrice` helper pouzit | PASS | line 24-29, vraci cela cisla (bez desetinnych mist) |

---

## 3. Step 3 "Price + availability display" smazan

**PASS** — blok neexistuje. Vyhledavani `"Step 3.*Price"` nenaslo zadne shody.

Nove cislovan: Step 3 = "Quantity + add button" (line 155). Spravne.

---

## 4. Preklady — inquiry.outOfStock

**PASS** — klic pritomny ve vsech 3 jazycich.

| Soubor | Radka | Hodnota |
|---|---|---|
| messages/cs.json | 659 | `"Vyproda\u0301no"` |
| messages/uk.json | 659 | `"\u041d\u0435\u043c\u0430\u0454 \u0432 \u043d\u0430\u044f\u0432\u043d\u043e\u0441\u0442\u0456"` |
| messages/ru.json | 659 | `"\u041d\u0435\u0442 \u0432 \u043d\u0430\u043b\u0438\u0447\u0438\u0438"` |

Hodnoty odpovidaji existujicim hodnotam v `stock.outOfStock` a `salonPortal.outOfStock` — konzistentni.

---

## 5. ProductVariantPicker.tsx smazan

**PASS** — soubor neexistuje.

`ls src/app/(public)/offer/[id]/` vraci:
- AddToInquiryForm.tsx
- ColorCircles.tsx
- page.tsx
- PhotoGallery.tsx
- ProductReviews.tsx
- WriteReviewForm.tsx

---

## 6. page.tsx — broken imports

**PASS** — zadne broken imports.

- `import { AddToInquiryForm } from "./AddToInquiryForm"` — soubor existuje.
- `ProductVariantPicker` neni importovan.
- TSC prosel bez chyb.

---

## Observation (minor, neni blocker)

`AddToInquiryFormProps` interface obsahuje `tierBadge: string | null` (line 21), ale component ho nedestrukturuje ani nepouziva (line 31). Prop je predavan z `page.tsx` (line 364). Nejedna se o chybu — TypeScript to akceptuje, prop je pouze nevyuzity. Muzete zvazit bud odebrani z interface nebo pridani `tierBadge` badge zpet do UI — ale neni to blocker pro tuto task.

---

## Zaver

Implementace je **kompletni a spravna**. Vsechny pozadavky z TASK-060 splneny. Pripraveno pro Evzena (task #4).
