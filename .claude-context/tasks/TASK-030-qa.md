# QA Report — Task #30: QR v inventory tabulce (commit 296329a)

**Datum:** 2026-07-15  
**Výsledek: PASS**

---

## 1. QR tlačítko v inventory tabulce — InventoryClient.tsx

### QR ikona na každém řádku
```tsx
// řádek 337
onClick={() => openQr(item.variantId)}
title="QR"
```
Tlačítko přítomno v každém řádku varianty. Sloupec má SR label (`<span className="sr-only">QR</span>`). ✅

### openQr funkce — try/catch + správný URL pattern
```ts
const openQr = async (variantId: string) => {
  try {
    const QRCode = await import("qrcode");
    const url = `${window.location.origin}/sales/new?variantId=${variantId}`;  // ✅ správný pattern
    const dataUrl = await QRCode.toDataURL(url, { width: 300, errorCorrectionLevel: "M", margin: 2 });
    setQrModal({ variantId, dataUrl });
  } catch (e) {
    console.error("QR generation failed:", e);  // ✅ try/catch
  }
};
```
- URL pattern: `${origin}/sales/new?variantId=${variantId}` ✅
- try/catch: selhání QR generování neblokuje UI ✅
- width: 300, errorCorrectionLevel: "M" ✅

### Modal s QR kódem
```tsx
{qrModal && (
  <div className="fixed inset-0 z-50 ..." onClick={() => setQrModal(null)}>
    <img src={qrModal.dataUrl} alt="QR" className="w-full max-w-[250px] mx-auto" />
    <button onClick={downloadQr}>{t("downloadQr")}</button>
  </div>
)}
```
Modal se otevře po kliknutí na QR ikonu. Zavírá se klikem na backdrop nebo `×`. ✅

### Download — Blob URL (iOS Safari kompatibilní)
```ts
const downloadQr = () => {
  if (!qrModal) return;
  const [header, b64] = qrModal.dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const blob = new Blob([arr], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `qr-${qrModal.variantId}.png`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);  // ✅ cleanup
};
```
- data URL → Blob → ObjectURL → `<a download>` → revokeObjectURL ✅
- Filename: `qr-{variantId}.png` ✅
- iOS Safari kompatibilní (nepřímý `href="data:..."`) ✅

---

## 2. i18n — stock.downloadQr

| Locale | Řádek | Hodnota |
|--------|-------|---------|
| cs.json | 250 | `"Stáhnout QR kód"` ✅ |
| uk.json | 250 | `"Завантажити QR код"` ✅ |
| ru.json | 250 | `"Скачать QR код"` ✅ |

Klíč přítomen ve všech 3 jazycích. ✅

---

## 3. TypeScript

```
npx tsc --noEmit → 0 chyb ✅
```

---

## Závěr

PASS. QR funkce v inventory tabulce implementována správně — každý řádek má tlačítko, modal se zobrazí, download používá Blob URL, i18n kompletní.
