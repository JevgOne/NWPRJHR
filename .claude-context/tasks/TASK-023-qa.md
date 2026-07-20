# QA Report — Task #23: Photo upload fix (commit c9ee2e3)

**Datum:** 2026-07-15  
**Výsledek: PARTIAL PASS — 1 kritický finding zbývá**

---

## 1. Simplify kontrola

### PhotoUpload.tsx — PASS

Diff je čistý. Změny:
- Endpoint routing `productId ? /api/products/{id}/media : /api/upload/photos` — logika jasná, správně oddělená
- Response handling rozdělen na 2 větve (media vs. generic) — odůvodněné, různé response formáty
- `useCallback` deps array opraven — přidán `productId` (předtím chyběl → stale closure bug)
- Komentáře vysvětlují záměr — OK

Žádné duplicity. Kód čistý.

### media/route.ts — PASS

Přidán pouze `export const maxDuration = 30;`. Žádné duplicity.

### upload/photos/route.ts — PASS

Přidán pouze `export const maxDuration = 30;`. Žádné duplicity.

---

## 2. Debug (TypeScript)

```
npx tsc --noEmit → 0 chyb
```

**PASS.**

---

## 3. Reverzní kontrola

| Bod | Výsledek | Detail |
|-----|----------|--------|
| PhotoUpload uploaduje na /api/products/{id}/media (single-trip) | ✅ | Ano — `productId ? /api/products/${productId}/media : /api/upload/photos` |
| maxDuration=30 na obou upload routes | ✅ | Přidáno v obou: media/route.ts i upload/photos/route.ts |
| HEIC→WebP fallback funguje (sharp → jpeg fallback) | ✅ | watermark.ts catch → fallback na original buffer + jpg ext |
| Chybové hlášky se zobrazují uživateli | ✅ | `setUploadError(err.error \|\| "Upload selhal (${res.status})")` zobrazeno v UI |

---

## KRITICKÝ FINDING — serverExternalPackages: ["sharp"] stále chybí

**Příčina z auditu #23 NEBYLA opravena v tomto commitu.**

```
grep "serverExternalPackages" next.config.ts → žádný výsledek
```

`next.config.ts` stále neobsahuje:
```ts
serverExternalPackages: ["sharp"],
```

**Dopad:** Sharp je nativní Node.js binárka. Na Vercel serverless bez `serverExternalPackages` Webpack pokusí bundlovat sharp a selže za runtime → `addWatermark()` crashuje → watermark catch blok zachytí error → nahraje original HEIC buffer s `contentType=""` → Vercel Blob PUT může selhat nebo vrátit broken URL.

Commit c9ee2e3 přidal `maxDuration=30` a single-trip upload (správně), ale **kořenová příčina selhání watermarku zůstává**.

**Výsledek na Vercel:** Upload formulář možná zobrazí progress (fetch dosáhne serveru), ale fotky se stále nemusí uložit správně pokud sharp za runtime selže.

---

## Závěr

Commit c9ee2e3 je kvalitní a řeší single-trip save + timeout. Ale bez `serverExternalPackages: ["sharp"]` v next.config.ts bude upload na Vercel stále nestabilní.

**Doporučení pro implementátora:** Přidat do `next.config.ts`:
```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  // ... zbytek
};
```
