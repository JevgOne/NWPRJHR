# TASK-070 — Evžen Audit: Slevový kód při objednávce/poptávce

**Datum:** 2026-07-01
**Agent:** evzen (kontrolor)
**Výsledek:** NESCHVÁLENO — VRÁCENO K PŘEPRACOVÁNÍ

---

## Kontrola proti zadání

### Zadání (doslova od uživatele):
> "slevovy kod muže bejt vložet při objednavce/poptávce"

### Rozklad zadání:
1. Slevový kód musí jít zadat v **B2B objednávce** (salon/kadeřnice)
2. Slevový kód musí jít zadat v **poptávce** (koncový zákazník)

---

## Výsledek kontroly

### Backend (API) — OK

| Komponenta | Stav | Poznámka |
|-----------|------|----------|
| `prisma/schema.prisma` Order.promoCode | OK | Pole existuje (řádek 816) |
| `prisma/schema.prisma` Inquiry.promoCode | OK | Pole existuje (řádek 1028) |
| `src/lib/order-workflow.ts` createOrder() | OK | Validuje promo, počítá slevu, inkrementuje usedCount (řádky 132-167) |
| `src/app/api/orders/route.ts` | OK | Předává promoCode do createOrder (řádek 92) |
| `src/app/api/public/inquiry/route.ts` | OK | Validuje promo, inkrementuje usedCount, ukládá do DB (řádky 65-95) |
| `src/app/api/promo-codes/validate/route.ts` | OK | Validační endpoint funguje |

### Frontend (UI) — CHYBÍ

| Komponenta | Stav | Problém |
|-----------|------|---------|
| `src/app/(salon)/salon/catalog/CatalogClient.tsx` | ČÁSTEČNĚ | State + logika existují (řádky 73-146), promoCode se posílá v submitOrder (řádek 163), ALE **žádný input element v JSX** — uživatel NEMÁ jak kód zadat! |
| `src/app/(public)/inquiry-cart/InquiryCartClient.tsx` | CHYBÍ | **Žádná integrace** — žádný state, žádný input, žádné volání validate, promoCode se NEPOSÍLÁ v handleSubmit (řádek 31) |

---

## Co konkrétně chybí

### 1. CatalogClient.tsx — chybí UI element pro promo kód

Existuje:
- `promoCode` state (řádek 73)
- `promoValidating` state (řádek 74) 
- `promoResult` state (řádky 75-83)
- `validatePromoCode()` funkce (řádky 125-141)
- `removePromoCode()` funkce (řádky 143-146)
- Předání v `submitOrder` (řádek 163)

**CHYBÍ:** Input pole + tlačítko "Ověřit" v košíku (floating cart bar, řádky 386-435). Bez viditelného UI je celá logika mrtvý kód.

### 2. InquiryCartClient.tsx — chybí kompletně

**CHYBÍ VŠE:**
- Žádný `promoCode` state
- Žádný input element
- Žádné volání `/api/promo-codes/validate`
- `handleSubmit` neposílá `promoCode` v body (řádek 31)
- API endpoint `promoCode` očekává (route.ts řádek 22), ale klient ho neposílá

---

## Verdikt

**NESCHVÁLENO.** Zadání říká "slevový kód musí jít vložit při objednávce I poptávce". Backend je kompletní, ale uživatel NEMÁ jak slevový kód zadat — v obou formulářích chybí viditelné input pole.

### Požadované opravy:

1. **CatalogClient.tsx:** Přidat do floating cart baru (před/nad submit button):
   - Input pole pro slevový kód
   - Tlačítko "Ověřit" (volá existující `validatePromoCode()`)
   - Zobrazení výsledku (platný/neplatný, výše slevy)
   - Tlačítko "Odebrat" pokud je kód aplikovaný (volá existující `removePromoCode()`)
   
2. **InquiryCartClient.tsx:** Přidat:
   - `promoCode` state
   - Input pole pro slevový kód (nad submit button)
   - Předat `promoCode` v `handleSubmit` body
   - Nemusí volat validate endpoint (inquiry nemá cenu k přepočtu), stačí poslat kód a backend ho zpracuje
