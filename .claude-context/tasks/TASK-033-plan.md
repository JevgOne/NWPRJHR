# TASK-033: Photo upload failure — analýza

**Status:** Analýza hotová (UPDATED s Vercel deploy data)
**Autor:** Plánovač
**Datum:** 2026-07-15

---

## Kontext

User hlásí: "upload selhal při fotkách" → dostává "Upload selhal (500)".

---

## Vercel deployment data (ověřeno z `vercel inspect`)

| Route | Timeout | Memory | Bundle size |
|-------|---------|--------|-------------|
| `api/products/[id]/media` | **30s** | 2048 MB | 15.5 MB |
| `api/upload/photos` | **30s** | 2048 MB | 15.5 MB |
| Ostatní routes | 300s | 2048 MB | 20.5 MB |

- **Projekt:** `jevg-ones-projects/nwprjhr`
- **Region:** `cdg1` (Paris)
- **Runtime:** `nodejs24.x`
- **Plan:** Pro (timeout default 300s, memory 2048MB)
- **Domain:** `www.hairland.cz`

---

## Architektura photo uploadu

### Upload flow (3 cesty)

```
1. Product detail (edit) → PhotoUpload.tsx → /api/products/{id}/media → sharp/watermark → Vercel Blob
2. New product create    → PhotoUpload.tsx → /api/upload/photos       → sharp/watermark → Vercel Blob
3. Stock-in form         → StockInForm.tsx → /api/products/{id}/media → sharp/watermark → Vercel Blob
```

Oba endpointy:
- Používají `addWatermark()` z `src/lib/watermark.ts` (sharp → WebP)
- `Promise.all` pro parallel processing (OBĚ routy jsou JIŽ parallel)
- 3-level fallback: watermark → sharp JPEG → raw pass-through
- `maxDuration = 30`
- Uložení na Vercel Blob (`@vercel/blob`)

### Fallback chain (robustní)

```
1. addWatermark(buffer) → WebP s watermarkem
   ↓ pokud selže
2. sharp(buffer).jpeg({quality: 85}) → JPEG bez watermarku
   ↓ pokud selže
3. raw buffer → originální formát (pass-through)
```

---

## Potenciální příčiny 500 erroru

### Příčina 1: SHARP TOP-LEVEL IMPORT CRASH (NEJPRAVDĚPODOBNĚJŠÍ)

V `package-lock.json` existují DVĚ verze sharp:
- `sharp@0.35.2` — top-level dependency (watermark)
- `sharp@0.34.5` — v `node_modules/next/` (Next.js image optimization)

**Kritický problém:** `src/lib/watermark.ts` řádek 1:
```typescript
import sharp from "sharp";  // TOP-LEVEL IMPORT
```

Pokud sharp nativní binárka selže při importu (ne při volání), celá route padne s 500. Fallback chain v `processPhoto()` NEPOMŮŽE — ten chytá runtime error, ne module-level import error.

Git history ukazuje sharp na Vercel **opakovaně crashovalo**:
```
803edd0 Fix: remove auto-watermark from upload (sharp crashes on Vercel serverless)
41006db Fix: watermark crashes on Vercel — fallback to HTTP fetch + graceful error handling
```

Fallback v `processPhoto()` (řádky 34-45 media/route.ts) dělá `await import("sharp")` — dynamic import, ten by mohl fungovat i když top-level selže. ALE: watermark.ts s top-level importem je importován celou routou → pokud ten selže, route se vůbec nenačte.

### Příčina 2: BLOB_READ_WRITE_TOKEN CHYBÍ NEBO EXPIROVAL

`@vercel/blob` vyžaduje `BLOB_READ_WRITE_TOKEN` env var. Pokud chybí nebo expiroval → `put()` hodí exception → 500.

Toto NENÍ v `.env.example`. Nelze ověřit z CLI — je potřeba zkontrolovat v Vercel dashboardu.

### Příčina 3: TIMEOUT 30s pro HEIC batch

- `maxDuration = 30s` (ověřeno z deploy data)
- Processing je parallel (Promise.all) — OK
- ALE: parallel sharp na 6 HEIC fotkách = CPU contention na single-core lambda
- Vercel Pro plan dovoluje až 300s — zvýšení na 60s by pomohlo

### Příčina 4: revalidateTag 2-arg volání

```typescript
revalidateTag("products", "max");  // řádek 170 media/route.ts
```

Pokud Next.js 16 `revalidateTag` nepřijímá 2 argumenty → crash PO úspěšném uploadu → 500 response, ale fotky se uložily do Blob (jen DB se neaktualizovalo?). Toto by ale mělo crashnout i jiné routes (reviews, products, etc.) — takže asi OK.

---

## Doporučený fix

### Fix 1: Změnit sharp import v watermark.ts na dynamic (HLAVNÍ)

**Soubor:** `src/lib/watermark.ts` řádek 1

```typescript
// SOUČASNÝ (crashne celý module):
import sharp from "sharp";

// NAVRHOVANÝ (graceful failure):
// Odstranit top-level import, použít dynamic import uvnitř funkce:
export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  // ... zbytek kódu
}
```

Toto zajistí že pokud sharp binárka selže, error se propaguje do `processPhoto()` fallback chain místo toho aby crashnul celý module.

### Fix 2: Zvýšit maxDuration na 60s (QUICK WIN)

Projekt je na Vercel Pro — může používat až 300s.

**Soubor:** `src/app/api/products/[id]/media/route.ts` řádek 8
```typescript
export const maxDuration = 60;  // bylo 30
```

**Soubor:** `src/app/api/upload/photos/route.ts` řádek 6
```typescript
export const maxDuration = 60;  // bylo 30
```

### Fix 3: Lepší error logging

**Soubor:** `src/components/products/PhotoUpload.tsx` řádek 55
```typescript
console.error("[PhotoUpload] upload failed:", res.status, err);
```

---

## Soubory k úpravě

| # | Soubor | Změna | Priorita |
|---|--------|-------|----------|
| 1 | `src/lib/watermark.ts` | Změnit top-level `import sharp` na dynamic import uvnitř funkce | HLAVNÍ |
| 2 | `src/app/api/products/[id]/media/route.ts` | Zvýšit maxDuration na 60 | HLAVNÍ |
| 3 | `src/app/api/upload/photos/route.ts` | Zvýšit maxDuration na 60 | HLAVNÍ |
| 4 | `src/components/products/PhotoUpload.tsx` | Lepší error logging | NICE-TO-HAVE |

---

## Vercel logy

Vercel CLI `logs` neukázal žádné POST/error záznamy v posledních 72h (runtime logs mají omezenou retenci na CLI). Pro detailní function error logy:
1. Vercel Dashboard → Function Logs → filtr na `/api/products/*/media`
2. Nebo přidat vlastní console.error do route

---

## Shrnutí

Upload route kód je správně napsaný (parallel Promise.all, 3-level fallback, HEIC support). Nejpravděpodobnější příčiny 500:

1. **Sharp top-level import crash** v watermark.ts — pokud nativní binárka selže při importu, fallback chain se nespustí
2. **Timeout 30s** — může být málo pro HEIC batch (zvýšit na 60s, Pro plan to dovoluje)
3. **Blob token** — missing/expired BLOB_READ_WRITE_TOKEN

Hlavní fix: změnit sharp import na dynamic v watermark.ts + zvýšit maxDuration na 60s.
