# QA Report — Task #34: QR na VariantTable (commit acc11ab)

**Datum:** 2026-07-15  
**Výsledek: PASS**

---

## Ověření změn v VariantTable.tsx

### State + funkce
```ts
const [qrModal, setQrModal] = useState<{ variantId: string; dataUrl: string } | null>(null);
```
✅

### openQr — try/catch + správný URL pattern
```ts
const openQr = async (variantId: string) => {
  try {
    const QRCode = await import("qrcode");
    const url = `${window.location.origin}/sales/new?variantId=${variantId}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 300, errorCorrectionLevel: "M", margin: 2 });
    setQrModal({ variantId, dataUrl });
  } catch (e) {
    console.error("QR generation failed:", e);
  }
};
```
- URL: `${origin}/sales/new?variantId=${variantId}` ✅
- try/catch: selhání neblokuje UI ✅
- width 300, errorCorrectionLevel "M" ✅

### downloadQr — Blob URL (iOS Safari)
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
  URL.revokeObjectURL(url);
};
```
- data URL → Blob → ObjectURL → `<a download>` → revokeObjectURL ✅
- iOS Safari kompatibilní ✅

### QR tlačítko — OWNER only
```tsx
{/* QR button (owner only) */}
{isOwner && (
  <button onClick={() => openQr(variant.id)} title="QR">
    <svg .../>
    QR
  </button>
)}
```
Správně obaleno `{isOwner && ...}` — B2B role QR nevidí. ✅

### Modal
```tsx
{qrModal && (
  <div className="fixed inset-0 z-50 ..." onClick={() => setQrModal(null)}>
    <img src={qrModal.dataUrl} alt="QR" className="w-full max-w-[250px] mx-auto" />
    <button onClick={downloadQr}>{t("stock.downloadQr")}</button>
  </div>
)}
```
- Zavírání backdropem i × tlačítkem ✅
- i18n klíč `stock.downloadQr` (ověřeno v předchozím QA: cs/uk/ru přítomno) ✅

---

## TypeScript: 0 chyb ✅

---

## Závěr

Oba PASS. #33: parallelní upload správně implementován s validací před zpracováním. #34: QR v VariantTable funkční, OWNER-only, iOS Safari safe download.
