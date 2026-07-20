# Audit: Fotky se nepřidávají — příčina (Task #23)

**Datum:** 2026-07-15  
**Soubory:** PhotoUpload.tsx, /api/upload/photos/route.ts, /api/products/[id]/media/route.ts, watermark.ts

---

## HLAVNÍ PŘÍČINY (seřazeny dle pravděpodobnosti)

### 1. KRITICKÉ — sharp není nakonfigurovaný pro Vercel serverless

`next.config.ts` **neobsahuje** `serverExternalPackages: ["sharp"]`.

Sharp je nativní Node.js binárka. Na Vercel serverless funkcích se musí explicitně označit jako external package, jinak se Webpack pokusí ho bundlovat a selže za runtime.

**Správná konfigurace:**
```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],  // CHYBÍ
  ...
}
```

Bez toho `addWatermark()` hodí runtime error → watermark catch blok zachytí chybu → nahraje original buffer → ale `contentType` zůstane `file.type` (může být prázdný string pro HEIC) → Vercel Blob PUT může selhat nebo vrátit nevalidní URL.

### 2. KRITICKÉ — `revalidateTag("products", "max")` v media/route.ts

```ts
revalidateTag("products", "max");  // CHYBA — revalidateTag bere jen 1 argument
```

Next.js `revalidateTag(tag: string)` — druhý argument `"max"` je TypeScript chyba (typ `string` neakceptuje druhý arg). Toto samo o sobě upload neblokuje, ale způsobuje TypeScript warning a nesprávnou cache invalidaci.

### 3. STŘEDNÍ — handleRemove volá onChange ale nevolá API

V `PhotoUpload.tsx`:
```ts
function handleRemove(index: number) {
  onChange(photos.filter((_, i) => i !== index));
}
```

`onChange` v `ProductDetailClient.tsx` volá PUT `/api/products/{id}` s novým polem fotek — to **funguje**. Ale `handleRemove` nezavolá DELETE na Vercel Blob — fotka zůstane v blob storage navždy. Není to příčina "fotky nejdou přidat", ale způsobuje blob storage leak.

### 4. NÍZKÉ — PhotoUpload client-side filter

```ts
const fileArray = Array.from(files).filter((f) => {
  if ([...PHOTO_TYPES, ...VIDEO_TYPES].includes(f.type)) return true;
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  return PHOTO_EXTS.includes(ext) || VIDEO_EXTS.includes(ext);
});
```

Filtr je správný — HEIC se zachytí přes extension fallback. Toto není problém.

---

## FLOW ANALÝZA

```
User vybere foto (iPhone HEIC)
  ↓
PhotoUpload.uploadFiles() → formData → POST /api/products/{id}/media
  ↓
media/route.ts: isHeic = true, isPhoto = true
  ↓
processPhoto(file) → addWatermark(buffer)
  ↓
watermark.ts: sharp(buffer)
  ↓
VERCEL RUNTIME: sharp nativní binárka → CRASH (pokud není serverExternalPackages)
  ↓
catch block: uploadBuffer = original buffer, contentType = "" (HEIC nemá MIME v iOS)
  ↓
put(safeName, buffer, { contentType: "" }) → Vercel Blob: může odmítnout nebo uložit s chybným content-type
  ↓
Response: { photos: [...], video: null } → ale URL nefunguje nebo foto se nezobrazí
```

---

## CO ZKONTROLOVAT NA VERCEL

V Vercel → Project → Functions → `/api/products/[id]/media` logs hledat:
- `[media] watermark failed` → potvrdí sharp crash
- `Error: Cannot find module 'sharp'` nebo `sharp is not a function`
- HTTP 500 nebo 400 response

---

## DOPORUČENÁ OPRAVA (pro implementátora)

**Priorita 1 — next.config.ts:**
```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  ...
}
```

**Priorita 2 — media/route.ts revalidateTag:**
```ts
revalidateTag("products");  // odstranit druhý argument
```

**Priorita 3 (volitelné) — blob cleanup při remove:**
Při `handleRemove` zavolat DELETE na blob URL přes `/api/upload/photos?url=...` endpoint.

---

## ZÁVĚR

Nejpravděpodobnější příčina: **sharp nefunguje na Vercel bez `serverExternalPackages`** → watermark selže → upload pokračuje s původním souborem a prázdným content-type → Vercel Blob odmítne nebo vrátí broken URL. Oprava je jednořádková změna v `next.config.ts`.
