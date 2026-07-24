# TASK-114: Tlacitko "Pridat dalsi produkt" v prodeji — Implementace

**Stav:** HOTOVO
**Datum:** 2026-07-24
**TypeScript:** 0 chyb

---

## Zmeny

### 1. `src/app/(app)/sales/new/NewSaleWizard.tsx`

**Pridano** tlacitko "Pridat dalsi" za seznam polozek (po `items.map`):
- Zobrazuje se pouze kdyz `items.length > 0`
- Dashed border (`border-2 border-dashed border-line`) pro vizualni odliseni
- Dve tlacitka: "Naskenovat dalsi QR" (otevre scanner) + "Pridat dalsi rucne" (otevre product picker)
- Pouziva existujici `setScannerOpen(true)` a `setShowProductPicker` — zadne nove state

**CO NEBYLO ZMENENO** (dle pozadavku uzivatele "jenom to pridej, nic nemen"):
- Scanner chovani — stale se zavre po kazdem scanu (zadny continuous mode)
- Stavajici flow pro prvni produkt — beze zmeny
- Backend — nepotrebuje zmenu (jiz podporuje vice polozek)
- `handleBarcodeScan` — beze zmeny

### 2. `messages/cs.json`
```json
"addAnotherQr": "Naskenovat další QR",
"addAnotherManual": "Přidat další ručně"
```

### 3. `messages/uk.json`
```json
"addAnotherQr": "Сканувати інший QR",
"addAnotherManual": "Додати ще вручну"
```

### 4. `messages/ru.json`
```json
"addAnotherQr": "Сканировать другой QR",
"addAnotherManual": "Добавить ещё вручную"
```

## Rozsah
- 4 soubory
- ~15 radku novych
- Zadne nove zavislosti, zadna DB migrace
