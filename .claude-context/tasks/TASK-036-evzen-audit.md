# TASK-036 Evžen Audit — DPH fix (VAT inclusive reverse calculation)

**Datum:** 2026-07-15
**Auditor:** Evžen the King
**Commit:** 5e2b5bf

---

## Doslovne zadani od uzivatele

1. "na webu ta částka je s DPH už finální tak to nemůže zvlášť dopočítat DPH"
2. "faktura atd kamo"
3. "na prodejní stránce třeba"

---

## Overeni implementace

### Matematika (KRITICKE)
- Stary vzorec (SPATNY): vatAmount = totalBeforeVat * 2100 / 10000 (pridava 21% NA VRCH)
- Novy vzorec (SPRAVNY): vatAmount = totalAmount * 2100 / 12100 (zpetny vypocet z ceny vcetne DPH)
- ✅ Matematicky spravne: 12100 = 10000 + 2100 (zaklad + 21% DPH)
- ✅ Priklad: cena 1000 Kc vcetne DPH → vat=173.55, zaklad=826.45. Overeni: 826.45 * 1.21 = 1000

### Opravene soubory:
1. **src/lib/sales.ts:114-116** ✅
   - `totalAmount = subtotal - discount` (finalni cena = cena z webu)
   - `vatAmount = totalAmount * 2100 / 12100` (zpetny vypocet)
   - `totalBeforeVat = totalAmount - vatAmount`

2. **src/app/(app)/sales/new/NewSaleWizard.tsx:88-90** ✅
   - Stejny vzorec v preview -- konzistentni s backend

3. **src/lib/credit-note.ts:25-27** ✅
   - Credit note take pouziva / 12100 -- spravne

### Soubor s CHYBEJICIM fixem:
4. **src/lib/invoicing.ts:277-278** ❌ NEOPRAVENO!
   - `vatAmount = -roundHalereUp((itemsTotal * original.vatRate) / 10000)` -- stale STARY vzorec
   - Tato funkce `createCreditNote()` je volana z `api/credit-notes/route.ts:74`
   - To znamena ze dobropisy vytvorene pres API endpoint stale pouzivaji SPATNY vzorec

### Overeni pouziti:
- `createCreditNoteInTx()` (credit-note.ts) -- OPRAVENA, pouzivaji complaints.ts + returns.ts
- `createCreditNote()` (invoicing.ts) -- NEOPRAVENA, pouziva api/credit-notes/route.ts

---

## Verdikt

**CASTECNE SCHVALENO — VRACIM K DOPRACOVANI** ❌

Hlavni fix (sales.ts, NewSaleWizard.tsx, credit-note.ts) je SPRAVNY a odpovida zadani.

**ALE: `src/lib/invoicing.ts:277-278` stale pouziva stary spatny vzorec `/ 10000` misto `/ 12100`!**
Funkce `createCreditNote()` je volana z API endpointu -- dobropisy vytvorene pres tento endpoint budou mit spatnou DPH castku.

**Pozadovana oprava:** Zmenit radek 278 v invoicing.ts z:
```
(itemsTotal * original.vatRate) / 10000
```
na:
```
(itemsTotal * original.vatRate) / 12100
```
A prepocitat subtotal/total stejne jako v credit-note.ts.
