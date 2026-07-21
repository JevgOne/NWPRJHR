# TASK-4: Upload fotek do produktu nefunguje — analýza a plán

## Problém
Upload fotek na stránce produktu (`/products/[id]`) nefunguje.

## Analýza

### Upload flow na product detail stránce

```
1. PhotoUpload component (src/components/products/PhotoUpload.tsx)
   → POST /api/products/{productId}/media (FormData with files)

2. media/route.ts:processPhoto()
   → addWatermark() z src/lib/watermark.ts
   → Fallback: sharp().jpeg()
   → Fallback: raw passthrough

3. @vercel/blob put() → URL uložena do DB

4. Odpověď { photos: [...], video: ... }
   → PhotoUpload volá onChange(allPhotos)
   → handlePhotosChange() → PUT /api/products/{id} (redundantní save)
```

### Identifikované problémy

#### 1. HLAVNÍ PODEZŘELÝ: watermark.png NEEXISTUJE

`public/watermark.png` **neexistuje v projektu** (ověřeno glob).

`src/lib/watermark.ts:getWatermarkPng()` flow:
1. `readFileSync("public/watermark.png")` → **FAIL** (soubor neexistuje)
2. `fetch("https://www.hairland.cz/watermark.png")` → **pravděpodobně FAIL** (soubor není v public/)
3. `throw new Error("Cannot load watermark PNG")` → caught v `processPhoto()`

**Fallback chain v media/route.ts:processPhoto():**
1. `addWatermark()` → **FAIL** (no watermark.png)
2. `sharp().jpeg()` → mělo by fungovat **ALE** sharp dynamic import může selhat na Vercel Edge
3. Raw passthrough → poslední záchrana

Pokud sharp dynamic import selže (řádek 54: `const sharp = (await import("sharp")).default`), celý `processPhoto()` vrátí `Buffer.alloc(0)` (řádek 41). Pak v upload logice:
- `buffer.length > 0` → false → skip
- Raw file upload (řádky 163-170) → `file.stream()` → **mělo by fungovat**

**ALE:** Existuje scénář kde `file.stream()` je už vyčerpaný po `fileToBuffer()` v processPhoto.

`processPhoto()` řádky 35-36:
```typescript
inputBuffer = await fileToBuffer(file);  // čte file.arrayBuffer()
```

Po přečtení `file.arrayBuffer()`, stream souboru může být **vyčerpaný**. Pak `file.stream()` na řádku 166 vrátí prázdný stream → upload prázdného souboru → Vercel Blob uloží 0-byte soubor → broken URL.

**TOTO JE PRAVDĚPODOBNÝ ROOT CAUSE na Vercel.**

#### 2. SEKUNDÁRNÍ: watermark.ts používá logo PNG místo SVG textu

Předchozí plán (TASK-PHOTOS-BUG-plan.md) doporučoval přepsat watermark na SVG text "www.hairland.cz", ale to nebylo implementováno. Stávající kód:
- Hledá `public/watermark.png` (logo soubor) → neexistuje
- Používá brightness detection + tiled logo pattern → zbytečně komplexní

#### 3. SEKUNDÁRNÍ: next.config.ts referencuje neexistující soubor

`next.config.ts:12`:
```typescript
outputFileTracingIncludes: {
  "/**": ["./public/fonts/**", "./public/logo-invoice.png", "./public/watermark.png"],
}
```
`./public/watermark.png` neexistuje. Nemělo by to crashnout build, ale způsobí warning.

#### 4. INFO: Double save (redundantní ale ne škodlivý)

Když `productId` je set v PhotoUpload:
1. Media endpoint uloží fotky do DB (řádky 195-201)
2. `handlePhotosChange` pošle PUT s fotkami znovu

Redundantní ale neškodný — PUT přepíše stejnými daty.

## Plán opravy

### Krok 1: PŘEPSAT watermark.ts na SVG text (hlavní fix)

Smazat celou stávající implementaci (logo loading, brightness detection, tiled pattern).
Nahradit jednoduchým SVG text watermarkem dle předchozího plánu:

```typescript
export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const w = metadata.width ?? 800;
  const h = metadata.height ?? 600;

  const fontSize = Math.max(Math.round(Math.min(w, h) * 0.05), 14);
  const gap = fontSize * 5;
  const texts: string[] = [];
  for (let y = -h; y < h * 2; y += gap) {
    for (let x = -w; x < w * 2; x += gap) {
      texts.push(
        `<text x="${x}" y="${y}" font-size="${fontSize}" ` +
        `font-family="Arial,Helvetica,sans-serif" font-weight="600" ` +
        `fill="white" fill-opacity="0.22" ` +
        `transform="rotate(-30,${x},${y})">www.hairland.cz</text>`
      );
    }
  }
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${texts.join("")}</svg>`
  );

  return image
    .composite([{ input: svg, top: 0, left: 0 }])
    .webp({ quality: 82 })
    .toBuffer();
}
```

Toto eliminuje závislost na watermark.png a řeší root cause.

### Krok 2: Opravit processPhoto v media/route.ts — vyčerpaný stream

Opravit fallback logiku aby nepoužívala `file.stream()` po `file.arrayBuffer()`:

```typescript
async function processPhoto(file: File): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(new Uint8Array(arrayBuffer));

  // 1. Try watermark (WebP output)
  try {
    const buffer = await addWatermark(inputBuffer);
    return { buffer, contentType: "image/webp", ext: "webp" };
  } catch (e) {
    console.error("[media] watermark failed:", e);
  }

  // 2. Try Sharp JPEG (no watermark)
  try {
    const sharp = (await import("sharp")).default;
    const buffer = await sharp(inputBuffer).jpeg({ quality: 85 }).toBuffer();
    return { buffer, contentType: "image/jpeg", ext: "jpg" };
  } catch (e) {
    console.error("[media] sharp fallback failed:", e);
  }

  // 3. Raw passthrough — use inputBuffer, NOT file.stream()
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  return { buffer: inputBuffer, contentType: file.type || "application/octet-stream", ext };
}
```

Klíčová změna: fallback raw passthrough vrací `inputBuffer` (už načtený), NE `Buffer.alloc(0)`.
Upload logika pak vždy dostane nenulový buffer.

### Krok 3: Upravit upload logiku — vždy použít buffer

V media/route.ts upload sekce (řádky 148-171): zjednodušit — vždy použít buffer z processPhoto:
```typescript
const { buffer, contentType, ext } = await processPhoto(file);
const safeName = `products/${id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
const blob = await put(safeName, buffer, { access: "public", contentType });
return { url: blob.url, isVideo: false };
```

Smazat větev `if (buffer.length > 0)` a raw file.stream() fallback.

### Krok 4: Smazat outputFileTracingIncludes reference na watermark.png

V `next.config.ts:12` odebrat `"./public/watermark.png"` z pole (soubor neexistuje, není potřeba po přepsání na SVG).

## Soubory k editaci

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `src/lib/watermark.ts` | PŘEPSAT: SVG text "www.hairland.cz" místo logo PNG |
| 2 | `src/app/api/products/[id]/media/route.ts` | Opravit processPhoto fallback, smazat file.stream() |
| 3 | `next.config.ts` | Odebrat watermark.png z outputFileTracingIncludes |

## Priorita
Střední — produkty se nedají vizuálně spravovat.
