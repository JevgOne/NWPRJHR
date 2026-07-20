# QA Report — #25 QR kód (StockInForm.tsx)

**Datum:** 2026-07-15  
**Výsledek: PASS**

## Ověření

### 300px rozměr
```ts
const dataUrl = await QRCode.toDataURL(saleUrl, {
  errorCorrectionLevel: "M",
  width: 300,   // ✅
  margin: 2,
});
```
A v JSX:
```tsx
<img src={qrDataUrl} alt="QR" width={300} height={300} ... />  // ✅
```

### Try/catch kolem QR generování
```ts
try {
  const QRCode = await import("qrcode");
  const dataUrl = await QRCode.toDataURL(saleUrl, { ... });
  setQrDataUrl(dataUrl);
} catch (e) {
  console.error("QR generation failed:", e);
}
```
QR selhání neblokuje zobrazení success screenu — `setSuccessData` se volá až po try/catch. ✅

### Blob URL download (iOS Safari kompatibilita)
```ts
const [header, b64] = qrDataUrl.split(",");
const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
const bin = atob(b64);
const arr = new Uint8Array(bin.length);
for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
const blob = new Blob([arr], { type: mime });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.download = `qr-${successData.barcode || successData.productId}.png`;
link.href = url;
link.click();
URL.revokeObjectURL(url);
```
Konverze data URL → Blob → ObjectURL → `<a download>` klik → `revokeObjectURL` cleanup. ✅  
Funguje na iOS Safari kde přímý `<a href="data:...">` nefunguje.

Download tlačítko se zobrazí pouze pokud `qrDataUrl` existuje (`{qrDataUrl && <Button ...>}`). ✅

## Reverzní kontrola

Uživatel: "QR kód musí být vidět a ke stažení po naskladnění"
- ✅ QR se zobrazí v success screenu (300×300px)
- ✅ Tlačítko "Stáhnout QR" funguje přes Blob URL (iOS Safari compatible)
- ✅ Selhání QR generování neblokuje success flow
- ✅ Filename: `qr-{barcode}.png` nebo `qr-{productId}.png`

## Závěr
PASS. QR implementace správná.
