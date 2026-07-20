# TASK-025: QR kód musí být vidět a ke stažení po naskladnění

**Status:** Analýza hotová
**Autor:** Plánovač
**Datum:** 2026-07-14

---

## Audit kódu

### QR generování (`StockInForm.tsx` řádky 326-333)

```typescript
const saleUrl = `${window.location.origin}/sales/new?variantId=${result.variantId}`;
const QRCode = await import("qrcode");
const dataUrl = await QRCode.toDataURL(saleUrl, {
    errorCorrectionLevel: "M",
    width: 200,
    margin: 2,
});
setQrDataUrl(dataUrl);
```

- `qrcode` v1.5.4 — má browser build, `toDataURL` používá `<canvas>`
- Dynamic import v `handleSubmit` — NE v try/catch! Pokud selže, `setSuccessData()` se nezavolá a success screen se nezobrazí.
- `result.variantId` pochází z Delivery objektu (Prisma) — bude vždy definovaný

### QR zobrazení (řádky 520-528)

```typescript
{qrDataUrl && (
    <img src={qrDataUrl} alt="QR" width={200} height={200} className="mx-auto" />
)}
```

- OK — podmíněné zobrazení, pokud `qrDataUrl` je neprázdný string
- 200x200px, data URL z canvas

### Download tlačítko (řádky 586-599)

```typescript
<Button
    type="button"
    variant="secondary"
    onClick={() => {
        if (!qrDataUrl) return;
        const link = document.createElement("a");
        link.download = `qr-${successData.barcode || successData.productId}.png`;
        link.href = qrDataUrl;
        link.click();
    }}
>
    {t("downloadQr")}
</Button>
```

---

## Identifikované problémy

### Problem 1: HLAVNÍ — Download nefunguje na iOS Safari

**Problém:**
Technika `document.createElement("a"); link.download = ...; link.href = dataUrl; link.click()` **NEFUNGUJE na iOS Safari** pro data URLs!

iOS Safari ignoruje atribut `download` na `<a>` elementech s data URL. Kliknutí buď:
- Neudělá nic
- Otevře obrázek v nové záložce (bez možnosti stáhnout)

Uživatelka nejspíš používá **iPhone** (viz task #23 — fotky z iPhonu). Na iPhonu klikne "Stáhnout QR" a nic se nestane.

**Fix:**
Použít alternativní metodu pro iOS:
1. Konvertovat data URL na Blob
2. Vytvořit `URL.createObjectURL(blob)`
3. Na iOS: otevřít v novém okně (uživatel pak long-press → "Save Image")
4. Na non-iOS: standardní download přes Blob URL (funguje lépe než data URL)

```typescript
onClick={() => {
    if (!qrDataUrl) return;
    // Convert data URL to Blob
    const byteString = atob(qrDataUrl.split(",")[1]);
    const mimeString = qrDataUrl.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.download = `qr-${successData.barcode || successData.productId}.png`;
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
}}
```

Alternativa (jednodušší, funguje na iOS): **zobrazit QR jako normální obrázek s instrukcí "podržte prst na obrázku → Uložit obrázek"**. Na iOS je to nejspolehlivější způsob.

### Problem 2: Chybí try/catch kolem QR generování

**Problém:**
Řádky 326-333 jsou v `handleSubmit()` ale NEJSOU v try/catch. Pokud `import("qrcode")` selže (bundling error, network issue):
1. Unhandled exception
2. `setSuccessData()` se nezavolá → success screen se nezobrazí
3. `setSubmitting(false)` se nezavolá → submit button zůstane v loading stavu

Delivery a upload proběhnou OK, ale uživatel vidí: formulář zamrzne, žádné potvrzení.

**Fix:**
Obalit v try/catch:
```typescript
// After photo upload...

try {
    const saleUrl = `${window.location.origin}/sales/new?variantId=${result.variantId}`;
    const QRCode = await import("qrcode");
    const dataUrl = await QRCode.toDataURL(saleUrl, {
        errorCorrectionLevel: "M",
        width: 200,
        margin: 2,
    });
    setQrDataUrl(dataUrl);
} catch (e) {
    console.error("QR generation failed:", e);
    // QR is optional — show success screen without it
}

setSuccessData({ ... });
setSubmitting(false);
```

### Problem 3: Download tlačítko je viditelné i bez QR

**Problém:**
Tlačítko "Stáhnout QR" (řádek 586) se zobrazuje VŽDY na success screenu, i když `qrDataUrl` je prázdný (QR generování selhalo). Click handler obsahuje `if (!qrDataUrl) return` — tlačítko neudělá nic. Matoucí pro uživatele.

**Fix:**
Obalit tlačítko podmínkou:
```typescript
{qrDataUrl && (
    <Button type="button" variant="secondary" onClick={...}>
        {t("downloadQr")}
    </Button>
)}
```

### Problem 4: QR je malý na mobilu (200x200)

QR se generuje s `width: 200` (řádek 330) a zobrazuje se jako `width={200}` na řádku 524. Na retina iPhone (3x) je to efektivně 67 logických pixelů — malý obrázek. Pro tisk/scan by měl být větší.

**Fix:** Zvětšit na 300px:
- Generování: `width: 300`
- Display: stáhnout s vyšším rozlišením, zobrazit s CSS `max-w-[200px]`

---

## Doporučený fix plan

### Krok 1: Fix download pro iOS Safari (10 min)

`src/components/inventory/StockInForm.tsx` řádky 586-599 — nahradit click handler:
- Data URL → Blob → `URL.createObjectURL()` → download link → cleanup
- Přidat `document.body.appendChild(link)` před `link.click()` (nutné pro Firefox)
- Po kliknutí: `document.body.removeChild(link); URL.revokeObjectURL(blobUrl)`

### Krok 2: Try/catch kolem QR generování (5 min)

`src/components/inventory/StockInForm.tsx` řádky 326-333 — obalit v try/catch, aby failure neblokoval success screen.

### Krok 3: Podmíněné zobrazení download tlačítka (2 min)

Řádek 586 — přidat `{qrDataUrl && ...}` wrapper kolem download buttonu.

### Krok 4: Zvětšit QR rozlišení (2 min)

Řádek 330: `width: 200` → `width: 300`
Řádek 524: přidat `className="mx-auto max-w-[200px]"` aby se zobrazil ve správné velikosti ale stáhl ve vyšším rozlišení.

---

## Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `src/components/inventory/StockInForm.tsx` | Fix download (Blob URL), try/catch QR, podmíněný button, větší QR |

---

## Shrnutí

Hlavní problém je download tlačítko — **nefunguje na iOS Safari** kvůli `download` atributu s data URL. Sekundárně chybí try/catch kolem QR generování. Vše je v jednom souboru (`StockInForm.tsx`).
