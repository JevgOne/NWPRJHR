# EVŽEN VERDIKT: TASK-114 — Multi-QR prodej (přidání více produktů)

**Datum:** 2026-07-24
**Verdikt:** SCHVÁLENO

---

## Shoda se zadáním

**Původní zadání od uživatele:**
1. "když prodáváme salonu vlasy a on si chce vzít 2-3 druhy jiných, tak se tam nedá přidat nic po tom co načtu QR"
2. "jenom to přidej, nic neměň"
3. "s každým přidaným produktem tam jde upravit gramáž atd ať se to ukazuje stejně všechno"
4. "na fakturu se napíše každý ten produkt zvlášť každá gramáž"
5. "nebudeme muset posílat 2 faktury" — JEDNA faktura

**Ověření:**

| Požadavek | Splněno | Důkaz |
|-----------|---------|-------|
| Přidat další produkt po prvním QR | ANO | Tlačítko "Naskenovat další QR" + "Přidat další ručně" za items (r677-696) |
| "Jenom to přidej, nic neměň" | ANO | Stávající flow nedotčen — `handleBarcodeScan`, `addItemFromVariantId` beze změny |
| Každý produkt má gramáž/úpravy | ANO | Každý item má vlastní `SaleItemRow` s `onGramsChange`, `onPiecesChange`, `onToggleSellByGrams`, `onRemove` (r666-674) |
| Na fakturu každý produkt zvlášť | ANO | `invoicing.ts:88` — `sale.items.map()` generuje samostatnou řádku per item |
| Jedna faktura | ANO | Backend nepotřeboval změnu — `completeSaleSchema` akceptuje `items: array.min(1).max(100)` (sale.ts:30) |

## Implementace — ověřeno v kódu

### Tlačítko "Přidat další" (NewSaleWizard.tsx:677-696)
- Zobrazuje se pouze když `items.length > 0`
- Dashed border pro vizuální odlišení
- "Naskenovat další QR" → `setScannerOpen(true)`
- "Přidat další ručně" → `setShowProductPicker(!showProductPicker)`
- Používá existující state, žádné nové závislosti

### I18n — ověřeno (3 soubory)
- `messages/cs.json:1543-1544` — "Naskenovat další QR", "Přidat další ručně"
- `messages/uk.json:1543-1544` — ukrajinské překlady
- `messages/ru.json:1543-1544` — ruské překlady

### Backend — beze změny (správně)
- `sale.ts:30` — `items: z.array(saleItemSchema).min(1).max(100)` existovalo před tasem
- Multi-item prodej fungoval na backendu vždy, chybělo jen UI

## Poznámka: Continuous scan vynechán

Plán navrhoval continuous scan mód (scanner zůstane otevřený po scanu). Implementace to záměrně vynechala — scanner se stále zavírá po každém scanu (r280: `setScannerOpen(false)`). Uživatel klikne "Naskenovat další QR" pro další sken.

**Hodnocení:** Přijatelné. Uživatel řekl "jenom to přidej, nic neměň" — continuous scan by měnil chování scanneru. Tlačítko "Přidat další" řeší jádro problému.

## Závěr

Implementace přesně odpovídá zadání: přidává viditelné tlačítko pro další produkty, každý produkt má plné ovládání (gramáž, kusy, toggle), faktura generuje řádku per produkt, backend nepotřeboval změnu. Stávající flow nedotčen.

**SCHVÁLENO.**
