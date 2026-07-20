# TASK-030: QR kód persistentně dostupný v inventáři

**Status:** UŽ IMPLEMENTOVÁNO — QR per-row je v kódu
**Autor:** Plánovač
**Datum:** 2026-07-15

---

## Analýza inventory sekce

### Stránky v `/app/(app)/inventory/`:

| Stránka | Soubor | Účel | Role |
|---------|--------|------|------|
| `/inventory` | `page.tsx` + `InventoryClient.tsx` | Seznam variant se stavem skladu | OWNER, EMPLOYEE |
| `/inventory/stock-in` | `stock-in/page.tsx` | Naskladnění nového zboží | OWNER only |
| `/inventory/movements` | `movements/page.tsx` + `MovementsClient.tsx` | Historie pohybů skladu | OWNER only |
| `/inventory/deliveries/[id]` | `deliveries/[id]/page.tsx` + `DeliveryDetailClient.tsx` | Detail dodávky | OWNER only |

### Neexistuje detail varianty — inventory je flat list.

---

## Kde byl QR dříve (jen dočasně)

`StockInForm.tsx` řádky 326-333 — QR se generoval v `handleSubmit` po úspěšném naskladnění:
```typescript
const QRCode = await import("qrcode");
const dataUrl = await QRCode.toDataURL(saleUrl, { width: 200, margin: 2 });
setQrDataUrl(dataUrl);
```
- Uloženo v React state → zmizí po navigaci
- Není v DB, není perzistentní

---

## NÁLEZ: QR per-row UŽ IMPLEMENTOVÁNO

Implementátor již přidal QR per-row do `InventoryClient.tsx`:

### Co bylo přidáno:

1. **State pro QR modal** (řádek 53):
```typescript
const [qrModal, setQrModal] = useState<{ variantId: string; dataUrl: string } | null>(null);
```

2. **`openQr()` funkce** (řádky 55-64) — generuje QR on-demand z variantId:
```typescript
const openQr = async (variantId: string) => {
    const QRCode = await import("qrcode");
    const url = `${window.location.origin}/sales/new?variantId=${variantId}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 300, errorCorrectionLevel: "M", margin: 2 });
    setQrModal({ variantId, dataUrl });
};
```

3. **`downloadQr()` funkce** (řádky 66-80) — Blob URL download (iOS kompatibilní)

4. **QR sloupec v tabulce** (řádek 267) — nový `<th>` pro QR

5. **QR ikona per-row** (řádky 335-346) — SVG QR ikona, kliknutí → `openQr(item.variantId)`

6. **QR modal** (řádky 362-378) — overlay s QR obrázkem + download button

### Hodnocení implementace:

| Aspekt | Stav | Poznámka |
|--------|------|----------|
| QR generování on-demand | OK | Nepotřebuje DB, deterministická URL |
| iOS download | OK | Blob URL místo data URL |
| Try/catch | OK | Řádek 61: `catch (e)` |
| Modal UX | OK | Kliknutí mimo modal zavře, × button |
| Download button | OK | Blob URL + `link.click()` |
| Accessibility | OK | `title="QR"` na buttonu, `sr-only` na headeru |

---

## Závěr

**Task #30 je UŽ HOTOVÝ.** Implementátor přidal QR ikonu per-row do inventory tabulky s on-demand generováním a iOS-kompatibilním downloadem.

Pokud user stále "nemůže najít QR", možné příčiny:
1. **Nasazení ještě neproběhlo** — nový kód není na produkci
2. **User hledá QR jinde** (na product detail stránce, ne na inventory)
3. **User nerozpoznal QR ikonu** — malá SVG ikona v posledním sloupci

### Volitelné vylepšení:
Pokud user potřebuje QR i na **product detail stránce** (admin), přidat QR ikonu do `VariantTable.tsx` variant karet — stejný princip jako v inventory.
