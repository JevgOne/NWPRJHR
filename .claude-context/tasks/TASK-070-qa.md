# TASK-070 QA Report — Promo kódy ve formulářích

**Datum:** 2026-07-01
**Agent:** kontrolor

---

## Co bylo zkontrolováno

1. `src/app/(salon)/salon/catalog/CatalogClient.tsx` — promo input v cart baru
2. `src/app/(public)/inquiry-cart/InquiryCartClient.tsx` — promo input v inquiry formuláři
3. `src/app/(app)/orders/[id]/OrderDetailClient.tsx` — admin zobrazení slevy
4. `src/app/(app)/orders/[id]/page.tsx` — předávání dat do klienta
5. `src/app/api/orders/[id]/route.ts` — API vrací `promoCode`/`promoDiscount`
6. `src/app/api/orders/route.ts` — POST předává `promoCode` do `createOrder`
7. `src/lib/order-workflow.ts` — validace, výpočet a uložení promo kódu
8. `src/app/api/public/inquiry/route.ts` — server-side validace pro inquiry
9. `src/app/api/promo-codes/validate/route.ts` — validate endpoint (auth required)
10. `src/lib/validations/salon.ts` — schema s `promoCode`
11. `prisma/schema.prisma` — Order.promoCode, Order.promoDiscount, Inquiry.promoCode
12. `messages/cs.json`, `messages/uk.json`, `messages/ru.json` — i18n překlady
13. TypeScript build — `npx tsc --noEmit`
14. Next.js build — `npx next build`

---

## Výsledky kontroly

### 1. CatalogClient.tsx — B2B cart bar

**PASS**

- Promo input pole s auto-uppercase (`toUpperCase()`) — ✅
- Tlačítko "Použít" (`t("applyPromo")`) se stavy loading a disabled — ✅
- Validace voláním `/api/promo-codes/validate` (authenticated) — ✅
- Zobrazení zeleného badge při platném kódu (emerald-50 border + checkmark icon) — ✅
- Zobrazení slevy: PERCENT jako `-X%`, FIXED jako `-X Kč` — ✅
- Přeškrtnutá původní cena + zelená cena po slevě — ✅ (`line-through` + `text-emerald-600`)
- Tlačítko "×" pro odebrání kódu — ✅
- Chybový text `t("promoInvalid")` při neplatném kódu — ✅
- Odeslání `promoCode: promoResult?.valid ? promoResult.code : undefined` — ✅
- Reset kódu po úspěšném odeslání objednávky — ✅
- Klávesa Enter trigguje validaci — ✅

### 2. InquiryCartClient.tsx — public inquiry formulář

**PASS**

- Input pole pro promo kód s `t("promoCodeLabel")` a `t("promoCodePlaceholder")` — ✅
- Auto-uppercase input (`toUpperCase()`) — ✅
- Odeslání `promoCode` jako součást form state v JSON body — ✅
- Validace probíhá server-side v `/api/public/inquiry` — ✅

**Poznámka:** InquiryCartClient používá jednoduchý text input bez live validace (záměrně — inquiry nemá přesnou cenu v halere). Kód se jen přenese a server ho validuje a uloží. Toto odpovídá záměru z plánu.

### 3. Admin order detail — zobrazení promo slevy

**PASS**

- Interface `OrderDetail` obsahuje `promoCode?: string` a `promoDiscount?: number` — ✅
- Podmíněné zobrazení: `{order.promoCode && order.promoDiscount ? (...) : (...)}` — ✅
- Zobrazuje: mezisoučet (original cena), promo kód s `-X Kč`, finální cenu — ✅
- `t("subtotal")` a `t("promoCode")` namespace `orderManagement` — ✅
- API `GET /api/orders/[id]` vrací `prisma.order.findUnique` bez select filtrace → vrací i `promoCode`/`promoDiscount` — ✅

### 4. Backend — DB a validace

**PASS**

- `prisma/schema.prisma` Order model: `promoCode String?` (r.816), `promoDiscount Int?` (r.817) — ✅
- `prisma/schema.prisma` Inquiry model: `promoCode String?` (r.1028) — ✅
- `src/lib/validations/salon.ts`: `promoCode: z.string().max(50).optional()` — ✅
- `order-workflow.ts`: validace (active, validFrom/To, maxUses, minOrderValue), výpočet slevy, `usedCount` increment v transakci — ✅
- `inquiry/route.ts`: validace, `usedCount` increment, uložení na `inquiry.promoCode` — ✅
- `orders/route.ts`: předává `parsed.data.promoCode` do `createOrder()` — ✅

### 5. i18n překlady

**PASS**

Všechny 3 jazyky (cs/uk/ru) mají:

| Klíč | Namespace | cs | uk | ru |
|------|-----------|----|----|-----|
| `promoCodePlaceholder` | `salonPortal` | ✅ | ✅ | ✅ |
| `applyPromo` | `salonPortal` | ✅ | ✅ | ✅ |
| `promoInvalid` | `salonPortal` | ✅ | ✅ | ✅ |
| `promoCodeLabel` | `public.inquiry` | ✅ | ✅ | ✅ |
| `promoCodePlaceholder` | `public.inquiry` | ✅ | ✅ | ✅ |
| `subtotal` | `orderManagement` | ✅ | ✅ | ✅ |
| `promoCode` | `orderManagement` | ✅ | ✅ | ✅ |

### 6. Build

**PASS**

- `npx tsc --noEmit` — 0 chyb
- `npx next build` — čistý build, všechny routes OK

---

## Nalezené problémy

### PROBLÉM 1 — NÍZKÁ: Validate endpoint vyžaduje auth, ale error message není i18n

**Soubor:** `src/app/(salon)/salon/catalog/CatalogClient.tsx:431`

```tsx
{promoResult && !promoResult.valid && (
  <span className="text-xs text-red-500">{t("promoInvalid")}</span>
)}
```

Zobrazuje vždy stejný text `promoInvalid` bez ohledu na `reason` (expired, max_uses, min_order, not_yet_valid). Uživatel tak neví proč je kód neplatný.

**Dopad:** Nízký — kód funguje, ale UX horší.

**Doporučení:** Přidat specifické hlášky podle `promoResult.reason`.

---

### PROBLÉM 2 — INFORMAČNÍ: Inquiry kód se validuje/počítá server-side bez visual feedback

**Soubor:** `src/app/(public)/inquiry-cart/InquiryCartClient.tsx:163`

Input pole je čistý text bez live validace. Zákazník neví zda je kód platný před odesláním. Odpovídá záměru z plánu ("Kód bude aplikován"), ale plán zmiňoval možnost přidat badge "Kód bude aplikován".

**Dopad:** Informační — funkčnost OK, UX neoptimální.

---

### PROBLÉM 3 — INFORMAČNÍ: usedCount se inkrementuje i při selhání inquiry vytvoření

**Soubor:** `src/app/api/public/inquiry/route.ts:79-84`

Promo kód `usedCount` se inkrementuje **před** `prisma.inquiry.create()`. Pokud inquiry vytvoření selže (DB error, r.88+), kód je spotřebován ale inquiry nevznikl.

**Dopad:** Minimální (inquiry vytvoření selhává výjimečně), ale technický dluh. B2B order-workflow to řeší správně — inkrementuje uvnitř transakce spolu s `order.create`.

---

## Souhrn

| Oblast | Verdikt |
|--------|---------|
| CatalogClient — UI | ✅ PASS |
| InquiryCartClient — UI | ✅ PASS |
| Admin order detail | ✅ PASS |
| Backend validace + DB | ✅ PASS |
| i18n (cs/uk/ru) | ✅ PASS |
| TypeScript build | ✅ PASS |
| Next.js build | ✅ PASS |

## Verdikt

**PASS**

Implementace je funkční a kompletní. Všechny požadované části z task assignmentu jsou přítomny a správně implementovány. Nalezené problémy jsou nízké priority a neblokují nasazení.
