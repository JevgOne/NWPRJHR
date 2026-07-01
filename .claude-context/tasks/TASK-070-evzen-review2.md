# TASK-070 — Evžen Kontrola: Slevový kód při objednávce/poptávce

**Datum:** 2026-07-01
**Agent:** evzen (kontrolor)
**Výsledek:** SCHVÁLENO (po přepracování)

---

## Zadání od uživatele (doslovně):
> "slevovy kod muže bejt vložet při objednavce/poptávce"

---

## Předchozí audit (NESCHVÁLENO):
Viz `.claude-context/tasks/TASK-070-evzen-audit.md` — backend byl kompletní, ale frontend UI chybělo v obou formulářích.

---

## Re-review po opravě

### 1. B2B objednávka (CatalogClient.tsx) — SPLNĚNO

| Požadavek | Stav | Řádky |
|-----------|------|-------|
| Input pole pro promo kód | ANO | 416-422 — text input s auto-uppercase, placeholder z i18n |
| Tlačítko "Použít" | ANO | 424-430 — volá validatePromoCode(), disabled stavy |
| Validace přes API | ANO | 125-141 — fetch `/api/promo-codes/validate` |
| Zobrazení platného kódu (badge) | ANO | 397-413 — emerald badge s checkmark, kód, sleva |
| Zobrazení slevy (přeškrtnutá cena) | ANO | 447-454 — line-through + emerald cena |
| Odeslání kódu s objednávkou | ANO | 163 — `promoCode: promoResult?.valid ? promoResult.code : undefined` |
| Odebrání kódu | ANO | 408-412 — X button volá removePromoCode() |
| Enter klávesa | ANO | 422 — onKeyDown Enter triggeru validaci |
| Reset po odeslání | ANO | 173-174 — setPromoCode(""), setPromoResult(null) |

### 2. Poptávka (InquiryCartClient.tsx) — SPLNĚNO

| Požadavek | Stav | Řádky |
|-----------|------|-------|
| Input pole pro promo kód | ANO | 164-171 — label + text input s auto-uppercase |
| Odeslání kódu s poptávkou | ANO | 14, 31 — promoCode v form state, spread do JSON body |
| Server-side validace | ANO | API route řádky 65-95 — validuje, inkrementuje usedCount, ukládá |

### 3. Backend — SPLNĚNO

| Komponenta | Stav |
|-----------|------|
| DB schema: Order.promoCode, Order.promoDiscount | ANO (řádky 816-817) |
| DB schema: Inquiry.promoCode | ANO (řádek 1028) |
| order-workflow.ts: validace + sleva + usedCount++ v transakci | ANO (řádky 132-167) |
| inquiry/route.ts: validace + usedCount++ | ANO (řádky 65-95) |
| Admin order detail: zobrazení promo slevy | ANO (QA potvrzeno) |
| i18n: cs/uk/ru překlady | ANO (QA potvrzeno) |
| Build: 0 TS chyb, next build OK | ANO (QA potvrzeno) |

---

## Kontrola proti doslovnému zadání

> "slevovy kod muže bejt vložet při objednavce"

ANO — CatalogClient.tsx má viditelný input v cart baru s live validací, slevou a odesláním.

> "/poptávce"

ANO — InquiryCartClient.tsx má viditelný input s labelem a placeholderem, promoCode se posílá v body.

---

## Poznámky (neblokující)

1. **Inquiry validace je pouze server-side** — zákazník nevidí zda je kód platný před odesláním. Odpovídá záměru (inquiry nemá cenu k přepočtu), ale UX by šlo zlepšit informativní hláškou.
2. **Chybové hlášky** — CatalogClient zobrazuje jen `promoInvalid` bez rozlišení důvodu (expired, max_uses, min_order). Nízká priorita.

---

## Závěr

**SCHVÁLENO.** Obě části zadání jsou splněny — slevový kód lze zadat v B2B objednávce (s live validací a zobrazením slevy) i v poptávce (s server-side validací). Backend správně validuje, počítá slevu, inkrementuje usedCount a ukládá. Předchozí problémy (chybějící UI) jsou opraveny.
