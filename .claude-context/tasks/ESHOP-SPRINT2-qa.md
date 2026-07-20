# QA Report: E-shop Sprint 2 — Checkout frontend

**Datum:** 2026-07-20
**QA:** KONTROLOR
**Status: SCHVÁLEN S DROBNÝMI NÁLEZY**

---

## Výsledky kontroly

| # | Oblast | Status | Detail |
|---|--------|--------|--------|
| 1 | InquiryCartItem pricePerUnit field | PASS | Přidáno jako `pricePerUnit?: number` (zpětně kompatibilní) |
| 2 | AddToInquiryForm retailPricePerPiece korekce | PASS | BY_PIECE: `retailPricePerPiece ?? pricePerPiece ?? 0`, BY_GRAM: `retailPricePerGram` |
| 3 | stock-check API rozšíření | PASS | Akceptuje `variantId` NEBO `productId+lengthCm+color` |
| 4 | Checkout 4-step wizard | PASS | Kroky contact→shipping→payment→summary implementovány |
| 5 | PacketaWidget integrace | PASS | Correct language mapping (uk/ru→en, cs→cs) |
| 6 | Comgate redirect flow | NÁLEZ (minor) | Viz bod #1 níže |
| 7 | TRANSFER zobrazení (Thank You) | PASS | Zobrazuje číslo účtu, IBAN, VS, částku |
| 8 | Překlady cs/uk/ru | PASS | ~30 klíčů per jazyk, metadata klíče přítomny |
| 9 | Build check | PASS | `npx next build` — compiled successfully, 0 errors |
| 10 | CZECH_POST disabled | NÁLEZ (minor) | Viz bod #2 níže |

---

## Nálezy

### Nález #1: clearCart() se volá PŘED kontrolou redirect (minor)

**Soubor:** `CheckoutClient.tsx:226-232`

```ts
setOrderResult(orderData);
clearCart();                          // ← clearCart zde
if (orderData.redirect) {
  window.location.href = orderData.redirect;
  return;
}
```

**Popis:** Pro CARD platbu se volá `clearCart()` ještě před `window.location.href` redirectem. Pokud by redirect selhal (chyba sítě, uživatel zastaví navigaci), košík je smazán ale zákazník není přesměrován. Objednávka nicméně v DB existuje — prakticky akceptovatelné, ale drobná race condition.

**Doporučení:** Přesunout `clearCart()` za redirect, nebo akceptovat (při selhání navigace zákazník zaplatit může přes URL objednávky).

**Závěr:** Neblokující — plán to tak popisoval, chování je konzistentní.

---

### Nález #2: CZECH_POST není disabled v checkout UI (minor)

**Soubor:** `CheckoutClient.tsx:433-438`

```ts
{ value: "CZECH_POST", label: tInquiry("shippingPost"), price: "119 Kc" },
```

**Popis:** Plán (sekce 1.4) explicitně uvádí `disabled: true` pro Českou poštu "jako v InquiryCartClient:376". V implementaci CZECH_POST selectable je — zákazník ho může vybrat.

**Závěr:** Drobná odchylka od plánu. Neblokující (backend to podporuje), ale mělo by být konzistentní s inquiry-cart UI.

---

### Nález #3: Ceny zobrazeny jako "Kc" místo "Kč" (minor cosmetic)

**Soubor:** `CheckoutClient.tsx` — více míst (řádky 300, 436, 437, 620, 625, 631, 636, 724)

```tsx
{formatPrice(total)} Kc   // ← chybí háček
```

**Popis:** Celý checkout zobrazuje ceny s "Kc" místo "Kč". Přitom překlady v `messages/cs.json` správně používají "Kč" (řádek 1020: `"freeShippingApplied": "Doprava zdarma nad 2 000 Kč"`).

**Závěr:** Kosmetický nález — je to jen v hardcoded strings v komponentě, ne v překladech.

---

### Nález #4: Terms checkbox je v kroku 3 (Platba), ne v kroku 4 (Shrnutí)

**Soubor:** `CheckoutClient.tsx:586-599`

**Popis:** Plán (sekce 1.6) umísťuje checkbox "Souhlasím s obchodními podmínkami" do Shrnutí (step 4). Implementátor ho přesunul do kroku Platba (step 3). `canProceed()` pro krok 3 vyžaduje `termsAccepted`.

**Závěr:** Odchylka od plánu, ale UX spíše lepší — zákazník vidí podmínky před shrnutím. Akceptovatelné.

---

## Ověřené body

### InquiryCartItem + AddToInquiryForm (PASS)
- `pricePerUnit?: number` správně přidáno v `src/lib/inquiry-cart.tsx:13`
- `PickerVariant` interface rozšířen o `retailPricePerPiece?: number` (řádek 18)
- `handleAdd()` správně rozlišuje BY_PIECE vs BY_GRAM (řádky 117-119)
- Reviewer korekce z ESHOP-SPRINT2-review.md plně aplikována

### stock-check API (PASS)
- Schema akceptuje optional `variantId` NEBO `productId+lengthCm+color` (řádky 10-13)
- Lookup přes `@@unique([productId, lengthCm, color])` — deterministický
- Response vrací `variantId` pro každý item — checkout ho správně extrahuje
- Not-found varianta vrací `variantId: ""` — checkout to zachytí přes `variantIds.some(v => !v)` a zobrazí chybu

### Checkout 4-step wizard (PASS)
- Stepper inline v CheckoutClient.tsx (bez separátní CheckoutStepper komponenty — zjednodušení je OK)
- Kroky back/next správně implementovány (`goBack()`, `goNext()`, `canProceed()`)
- Packeta point required validation: `form.shippingMethod !== "PACKETA" || !!packetaPoint`
- Prázdný košík: redirect-equivalent (zobrazí empty state s linkem na nabídku)

### Submit flow (PASS)
- Stock check → extrakce variantIds → POST /api/public/orders s resolved variantIds
- CARD: `setOrderResult(orderData)` → `clearCart()` → `window.location.href = orderData.redirect`
- TRANSFER: zobrazí Thank You s platebními údaji (bankAccount, IBAN, variableSymbol, amount)
- Confetti efekt pro úspěšné TRANSFER objednávky ✓

### Překlady (PASS)
- cs.json: 30 klíčů v `public.checkout`, `checkoutTitle`/`checkoutDescription` v `metadata`
- uk.json: kompletní překlad (Замовлення, Замовити та оплатити переказом...)
- ru.json: kompletní překlad (Заказ, Заказать и оплатить переводом...)
- `proceedToCheckout` + `orSendInquiry` přidány do `public.inquiry` ve všech 3 jazycích

### InquiryCartClient checkout button (PASS)
- Zobrazuje se pouze když `items.some(i => i.pricePerUnit && i.pricePerUnit > 0)`
- Link na `/checkout`
- Subtitle "nebo odešlete nezávaznou poptávku níže" zachovává inquiry flow

### Build (PASS)
```
✓ Compiled successfully in 12.6s
✓ Generating static pages using 7 workers (450/450)
├ ƒ /[locale]/checkout  ← nová stránka přítomna
```
TypeScript: 0 errors.

---

## Promo kód — výpočet discount (PASS)

`discountValue` je v basis points (3000 = 30%) — ověřeno v `schema.prisma:1708`.
Výpočet: `Math.round((itemsTotal * discountValue) / 10000)` je správný.
Zobrazení: `-(discountValue / 100)%` je správné.

---

## Bezpečnostní kontrola (PASS)

- Checkout neobsahuje XSS zranitelnosti — veškerý user input přes React state
- `promoCode` se posílá jako server-side lookup (neovlivňuje cenu klientsky)
- Finální cena je vždy počítána server-side (Sprint 1 orders API)

---

## Závěr

**Implementace SCHVÁLENA.** Všechny klíčové body z plánu a review jsou implementovány.

Tři drobné nálezy (#1 clearCart timing, #2 CZECH_POST enabled, #3 "Kc" vs "Kč") jsou neblokující a mohou být opraveny v follow-up tasku. Nález #4 (terms v step 3 vs step 4) je UX zlepšení oproti plánu.

**Doporučuji opravit v Sprint 3 nebo follow-up:**
1. `"Kc"` → `"Kč"` ve všech price display místech v CheckoutClient.tsx
2. CZECH_POST disabled (přidat `pointer-events-none opacity-50` nebo `disabled` atribut na radio)
