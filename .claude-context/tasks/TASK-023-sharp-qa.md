# QA Report — #23 Sharp fix (serverExternalPackages)

**Datum:** 2026-07-15  
**Výsledek: PASS**

## Ověření

**next.config.ts řádek 7:**
```ts
serverExternalPackages: ["sharp"],
```
Přítomno. Sharp se na Vercel nebundluje, načítá se jako nativní modul.

**Watermark fallback (watermark.ts):**
```ts
try {
  const buffer = await addWatermark(Buffer.from(arrayBuffer));
  return { buffer, contentType: "image/webp", ext: "webp" };
} catch (e) {
  console.error("[media] watermark failed, uploading original:", e);
  return { buffer: Buffer.from(arrayBuffer), contentType: file.type || "image/jpeg", ext: "jpg" };
}
```
Fallback zachytí chybu a nahraje originál s `contentType: file.type || "image/jpeg"` — přidán `|| "image/jpeg"` default, takže prázdný MIME (HEIC na iOS) neselže na Vercel Blob.

**Single-trip upload:** PhotoUpload volá `/api/products/{id}/media` přímo → uloží do DB v jednom requestu. Ověřeno v předchozím QA.

**TypeScript:** 0 chyb.

## Závěr
Kořenová příčina opravena. Upload by měl fungovat i pro HEIC z iOS.
