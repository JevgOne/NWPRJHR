# TASK-036: VAT/DPH kalkulace — ceny již zahrnují DPH

**Status:** Plán hotový
**Autor:** Planner
**Datum:** 2026-07-15

---

## Kontext

User: "ceny na webu jsou konečné (včetně DPH). Systém NESMÍ přidávat DPH na vrch."

Aktuální stav: `retailPricePerGram` a `retailPricePerPiece` v DB jsou **konečné ceny s DPH**.
Systém ale počítá DPH jako: `totalAmount = totalBeforeVat + 21%` — tím vzniká **cena 121% z toho co zákazník vidí na webu**.

---

## Root cause

### Aktuální (ŠPATNÝ) výpočet

```
subtotal = sum(lineTotal)              // např. 10 000 Kč (cena s DPH)
totalBeforeVat = subtotal - discount   // 10 000 Kč
vatAmount = totalBeforeVat * 21%       // 2 100 Kč  ← CHYBA: přidává DPH navíc
totalAmount = totalBeforeVat + vatAmount // 12 100 Kč ← zákazník platí o 21% víc!
```

### Správný výpočet (reverse-calculate z ceny s DPH)

```
subtotal = sum(lineTotal)              // 10 000 Kč (cena s DPH)
totalAmount = subtotal - discount      // 10 000 Kč  ← TO je konečná cena
vatAmount = totalAmount * 2100/12100   // 1 735,54 Kč (DPH obsažená v ceně)
totalBeforeVat = totalAmount - vatAmount // 8 264,46 Kč (základ bez DPH)
```

Vzorec: `vatAmount = totalAmount * vatRate / (10000 + vatRate)`
Pro 21%: `vatAmount = totalAmount * 2100 / 12100`

---

## Soubory k úpravě

### 1. KRITICKÉ — hlavní výpočet

| # | Soubor | Řádky | Změna | Priorita |
|---|--------|-------|-------|----------|
| 1 | `src/lib/sales.ts` | 114-118 | Reverse-calc VAT z inclusive ceny | **CRITICAL** |
| 2 | `src/app/(app)/sales/new/NewSaleWizard.tsx` | 88-90 | Mirror fix — client-side preview | **CRITICAL** |

#### `src/lib/sales.ts` — řádky 114-118

**AKTUÁLNÍ (špatně):**
```typescript
const totalBeforeVat = roundHalereUp(subtotal - discountAmount);
const vatRate = 2100; // 21%
const vatAmount = roundHalereUp((totalBeforeVat * vatRate) / 10000);
const totalAmount = roundHalereUp(totalBeforeVat + vatAmount);
```

**NOVÉ (správně):**
```typescript
const vatRate = 2100; // 21% in basis points
const totalAmount = roundHalereUp(subtotal - discountAmount);
const vatAmount = roundHalereUp((totalAmount * vatRate) / (10000 + vatRate));
const totalBeforeVat = totalAmount - vatAmount;
```

#### `src/app/(app)/sales/new/NewSaleWizard.tsx` — řádky 88-90

**AKTUÁLNÍ (špatně):**
```typescript
const totalBeforeVat = roundUp(subtotal - discountAmount);
const vatAmount = roundUp((totalBeforeVat * 2100) / 10000);
const totalAmount = roundUp(totalBeforeVat + vatAmount);
```

**NOVÉ (správně):**
```typescript
const totalAmount = roundUp(subtotal - discountAmount);
const vatAmount = roundUp((totalAmount * 2100) / 12100);
const totalBeforeVat = totalAmount - vatAmount;
```

### 2. SEKUNDÁRNÍ — credit notes

| # | Soubor | Řádky | Změna | Priorita |
|---|--------|-------|-------|----------|
| 3 | `src/lib/credit-note.ts` | 26 | Reverse-calc VAT | **HIGH** |

**AKTUÁLNÍ (špatně):**
```typescript
const vatAmount = -roundHalereUp((itemsTotal * original.vatRate) / 10000);
```

**NOVÉ (správně):**
```typescript
const vatAmount = -roundHalereUp((itemsTotal * original.vatRate) / (10000 + original.vatRate));
```

### 3. SEKUNDÁRNÍ — grossMargin v Sale create

| # | Soubor | Řádky | Změna | Priorita |
|---|--------|-------|-------|----------|
| 4 | `src/lib/sales.ts` | 176 | grossMargin by měla být z totalBeforeVat | **MEDIUM** |

**AKTUÁLNÍ:**
```typescript
grossMargin: totalBeforeVat - totalCostOfGoods,
```

Toto je SPRÁVNÉ — grossMargin se počítá ze základu bez DPH. Ale po fixu bude `totalBeforeVat` nižší (správný základ), takže gross margin bude přesnější. **Žádná změna kódu není potřeba**, jen upozornění že historické záznamy mají špatný grossMargin.

### 4. DISPLAY ONLY — UI komponenty

Tyto soubory NEPOTŘEBUJÍ změnu kódu — pouze zobrazují data z DB/props:

| # | Soubor | Důvod proč neměnit |
|---|--------|-------------------|
| - | `src/components/sales/SaleSummary.tsx` | Zobrazuje props, logiku nemá |
| - | `src/app/(app)/sales/[id]/SaleDetailClient.tsx` | Zobrazuje data z DB |
| - | `src/lib/invoice-pdf.ts` | Generuje PDF z DB dat |
| - | `src/lib/export-excel.ts` | Exportuje DB data do Excelu |
| - | `src/lib/export-pohoda.ts` | Exportuje DB data do Pohody |

### 5. INVOICING — při vytváření faktury

| # | Soubor | Řádky | Změna | Priorita |
|---|--------|-------|-------|----------|
| 5 | `src/lib/invoicing.ts` | 101-104 | Přečte `sale.totalBeforeVat` a `sale.vatAmount` — OK | **NONE** |

Fakturace čte hodnoty ze Sale záznamu (`sale.totalBeforeVat`, `sale.vatAmount`) — NEpočítá je znovu. Po fixu v `sales.ts` budou v DB správné hodnoty a faktury se automaticky opraví.

**Ale pozor:** `invoicing.ts` řádky 97, 212 — `vatRate: 2100` je jen label/metadata zapsaný na řádek faktury. Toto je správné.

---

## Dopad na existující data

### Historické Sale záznamy mají špatné hodnoty

Všechny historické prodeje mají:
- `totalAmount` o 21% vyšší než měl být
- `vatAmount` = 21% z "základu" (ale základ = cena s DPH → double VAT)
- `grossMargin` vypočítaná ze špatného totalBeforeVat

### Doporučení pro data migration

**Volitelné, ale doporučené** — jednorázový SQL skript pro opravu historických záznamů:

```sql
-- Přepočet: totalAmount JE cena s DPH (= subtotal - discountAmount)
-- vatAmount = totalAmount * 2100 / 12100
-- totalBeforeVat = totalAmount - vatAmount
UPDATE "sales" SET
  "totalAmount" = "subtotal" - "discountAmount",
  "vatAmount" = ROUND(("subtotal" - "discountAmount") * 2100.0 / 12100.0),
  "totalBeforeVat" = ("subtotal" - "discountAmount") - ROUND(("subtotal" - "discountAmount") * 2100.0 / 12100.0),
  "grossMargin" = (("subtotal" - "discountAmount") - ROUND(("subtotal" - "discountAmount") * 2100.0 / 12100.0)) - "totalCostOfGoods"
WHERE "status" = 'COMPLETED';
```

**Pozor:** Faktury navázané na tyto Sale záznamy budou mít staré hodnoty. Pokud je potřeba i oprava faktur:

```sql
UPDATE "invoices" SET
  "subtotal" = s."totalBeforeVat",
  "vatAmount" = s."vatAmount",
  "total" = s."totalAmount"
FROM "sales" s
WHERE "invoices"."saleId" = s."id"
  AND "invoices"."type" = 'INVOICE';
```

**DŮLEŽITÉ:** Před spuštěním migration skriptu nejdřív zjistit od uživatele:
1. Kolik historických prodejů existuje
2. Zda byly faktury odeslány zákazníkům (pokud ano, nelze je zpětně měnit)
3. Zda chce opravit historická data nebo jen budoucí prodeje

---

## Implementační postup

1. Změnit výpočet v `src/lib/sales.ts` (řádky 114-118)
2. Mirror fix v `NewSaleWizard.tsx` (řádky 88-90)
3. Fix credit-note.ts (řádek 26)
4. Otestovat:
   - Vytvořit testovací prodej (RETAIL, BY_GRAM)
   - Ověřit že `totalAmount` = cena na webu (ne +21%)
   - Ověřit že `vatAmount` = správně extrahovaná DPH
   - Ověřit že faktura má správné hodnoty
   - Ověřit credit note
5. Zeptat se uživatele na data migration

---

## Shrnutí

| Co | Stav | Fix |
|----|------|-----|
| `sales.ts` — completeSale() | Přidává 21% navíc | Reverse-calc: `totalAmount * 2100 / 12100` |
| `NewSaleWizard.tsx` — client preview | Přidává 21% navíc | Mirror fix |
| `credit-note.ts` — dobropis | Přidává 21% navíc | Reverse-calc s `original.vatRate` |
| `invoicing.ts` — faktura | Čte z DB, OK | Žádná změna |
| UI komponenty | Zobrazují data, OK | Žádná změna |
| Exporty (Excel, Pohoda) | Čtou z DB, OK | Žádná změna |
| Historická data | Špatné hodnoty | Volitelná SQL migrace |

**Počet souborů k editaci: 3** (`sales.ts`, `NewSaleWizard.tsx`, `credit-note.ts`)
