# TASK-035: QR scan "nedostatek zásob" — stock check + flow bugs

**Status:** Analýza hotová (UPDATED s routing flow analýzou)
**Autor:** Plánovač
**Datum:** 2026-07-15

---

## Kontext

User naskenoval QR kód produktu (BY_PIECE varianta, 1 ks na skladě):
1. Otevře se admin panel (layout), pak teprve "Nový prodej"
2. Musí reloadnout stránku aby se obsah načetl
3. Po načtení řekne "nedostatek zásob" i když varianta má 1 ks

**Dva problémy:** flow/routing bug + stock check bug.

---

## PROBLÉM 1: Stock check — "nedostatek zásob"

### Root cause A: FIFO SQL filtr vylučuje BY_PIECE záznamy

**Soubor:** `src/lib/fifo.ts` řádky 40-46

```sql
SELECT * FROM "deliveries"
WHERE "variantId" = ${variantId}
  AND "remainingGrams" > 0    -- ← VYLUČUJE záznamy kde remainingGrams=0 ale remainingPieces>0
ORDER BY "stockedAt" ASC
FOR UPDATE
```

Pro BY_PIECE produkty může `remainingGrams` být 0 i když `remainingPieces > 0`. FIFO pak nenajde stock → InsufficientStockError při submitu prodeje.

### Root cause B: Price-preview selhání → availableGrams=0 na klientu

**Soubor:** `src/app/(app)/sales/new/NewSaleWizard.tsx` řádky 123-158

Když `addItemFromVariantId()` zavolá `fetchPricePreview()` a ten selže (vrátí null):
- `preview = null`
- `isByPiece = null?.sellingMode === "BY_PIECE"` → `false`
- Kód jde do BY_GRAM větve (řádek 143-158)
- Nastaví `grams: 50, availableGrams: 0` (protože `null?.availableStock?.grams ?? 0`)
- `SaleItemRow` check: `50 > 0` → **"nedostatek zásob"**

**Kdy preview selže:**
- `fetchPricePreview` vrátí `null` pokud `!res.ok` (řádek 106)
- Auth error, server error, network error

### Proč inventory ukazuje "1 ks" ale sale říká "nedostatek"

| Systém | Query | Filtr | Výsledek |
|--------|-------|-------|----------|
| Inventory (`getStockNumbers`) | `delivery.aggregate({where: {variantId}})` | žádný | **1 ks** (správně) |
| Sale client (`SaleItemRow`) | z `price-preview` API | žádný | **1 ks** (správně, pokud API funguje) |
| Sale server (`fifoDeduct`) | `WHERE remainingGrams > 0` | **ANO** | **0 ks** (ŠPATNĚ) |

---

## PROBLÉM 2: QR flow — pomalé, musí reloadnout

### Routing flow

```
QR scan → browser navigates to /sales/new?variantId=XXX
    ↓
Middleware (src/proxy.ts):
  - /sales/* je v PROTECTED_PREFIXES
  - Kontrola session cookie
  - Pokud nemá cookie → redirect /login?callbackUrl=/sales/new
  - Pokud má cookie → NextResponse.next()
    ↓
Layout (src/app/(app)/layout.tsx):
  - auth() (session check)
  - 4× DB query pro badge counts (pendingReg, newInquiry, unread, pendingReview)
  - Renderuje AppShell (sidebar + nav)
    ↓
Page (sales/new/page.tsx):
  - auth() (DRUHÝ session check!)
  - prisma.product.findMany s variants (HEAVY query)
  - Renderuje NewSaleWizard
    ↓
Client (NewSaleWizard):
  - useEffect detekuje variantId
  - Nastaví customerType="RETAIL"
  - Re-render → addItemFromVariantId()
  - Volá /api/sales/price-preview
  - Přidá položku do items
```

### Proč "musí reloadnout"

Možné příčiny:
1. **Double auth check** — layout + page obě volají `auth()` → 2× round-trip na session
2. **Heavy page query** — `product.findMany` s ALL variants je pomalé
3. **useEffect race** — efekt závisí na `addItemFromVariantId` v dependency array, který se rekreuje při změně `customerType` → může nastat race condition kde ref `initialVariantHandled` se nastaví na true ale callback ještě neproběhl
4. **RSC streaming** — layout se streamuje první (user vidí admin panel), page content přijde později

### "Otevře se admin panel, pak teprve Nový prodej"

Toto je NORMÁLNÍ Next.js streaming behavior:
- Layout (AppShell) se renderuje OKAMŽITĚ (cached badge counts)  
- Page server component se renderuje POTOM (heavy DB query)
- User vidí sidebar + prázdný content area → pak se obsah načte

Není to bug — je to slow server component. Ale pro QR flow to je špatný UX.

---

## Doporučené fixy

### Fix 1: FIFO SQL filtr (KRITICKÝ)

**Soubor:** `src/lib/fifo.ts` řádek 43

```sql
-- PŘED:
AND "remainingGrams" > 0
-- PO:
AND ("remainingGrams" > 0 OR "remainingPieces" > 0)
```

### Fix 2: Fallback při selhání price-preview (HLAVNÍ)

**Soubor:** `src/app/(app)/sales/new/NewSaleWizard.tsx`

V `addItemFromVariantId()` — pokud `preview` je null, nezobrazovat item s `availableGrams: 0`. Místo toho buď:
- **A)** Zobrazit error: "Nepodařilo se načíst cenu" a nepřidávat item
- **B)** Zkusit volání znovu (retry)
- **C)** Přidat item ale bez stock check erroru (s pending stavem)

Doporučuji **A)** — nejbezpečnější:

```typescript
const preview = await fetchPricePreview(variantId, 50, 0);
if (!preview) {
  setError("Nepodařilo se načíst informace o variantě. Zkuste to znovu.");
  return;
}
```

### Fix 3: Odstranit duplikátní auth check (NICE-TO-HAVE)

**Soubor:** `src/app/(app)/sales/new/page.tsx`

Layout `(app)/layout.tsx` už volá `auth()` a redirectuje na login. Page nemusí volat `auth()` znovu — session je dostupná z layout contextu. ALE: page potřebuje `session.user.role` pro redirect SALON/HAIRDRESSER. To by šlo řešit jinak.

### Fix 4: Přidat Loading UI pro QR flow (NICE-TO-HAVE)

Přidat `src/app/(app)/sales/new/loading.tsx`:

```tsx
export default function NewSaleLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-rose border-t-transparent rounded-full" />
    </div>
  );
}
```

Toto zobrazí spinner místo prázdné stránky zatímco page.tsx server component se renderuje.

---

## Soubory k úpravě

| # | Soubor | Řádek | Změna | Priorita |
|---|--------|-------|-------|----------|
| 1 | `src/lib/fifo.ts` | 43 | `AND ("remainingGrams" > 0 OR "remainingPieces" > 0)` | KRITICKÁ |
| 2 | `src/app/(app)/sales/new/NewSaleWizard.tsx` | 123 | Přidat null check na preview, zobrazit error | HLAVNÍ |
| 3 | `src/app/(app)/sales/new/loading.tsx` | nový | Loading spinner pro QR flow UX | NICE-TO-HAVE |

---

## Shrnutí

**Stock bug:** Dva problémy — (A) FIFO SQL filtr `WHERE remainingGrams > 0` vylučuje BY_PIECE záznamy, (B) selhání price-preview API tiše nastaví `availableGrams: 0` → "nedostatek zásob" i pro BY_GRAM.

**Flow bug:** Není bug ale pomalý server component + chybějící loading state. Layout se renderuje první (user vidí admin panel), page content přijde se zpožděním. Řešení: loading.tsx.

**Hlavní fix:** Jednořádková změna v `fifo.ts` + null check v `NewSaleWizard.tsx`.
