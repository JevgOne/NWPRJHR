# TASK-011: Bug — Fotky i videa se neukládají při naskladnění

**Status:** HOTOVO (analýza v4 — rozšířeno o WebP konverzi + automatický vodoznak)
**Autor:** Plánovač
**Datum:** 2026-07-14
**Update 1:** Uživatel doplnil "video taky ne"
**Update 2:** Uživatel upřesnil — problém je **při naskladnění** (stock-in wizard), ne při editaci produktu
**Update 3:** Uživatel chce: auto WebP konverze + automatický vodoznak na VŠECH upload cestách

---

## Shrnutí

Bug: "fotky se neukládají" + "video taky ne" — konkrétně v stock-in wizardu (`/inventory/stock-in`).

Analyzoval jsem celý tok od výběru souboru po uložení do DB. Identifikoval jsem **3 problémy**, z nichž jeden je pravděpodobný hlavní root cause.

---

## Tok dat ve stock-in wizardu

### `src/components/inventory/StockInForm.tsx`

```
1. Uživatel vyplní formulář (kategorie, původ, textura, barva, délka, cena...)
2. Vybere fotky/video přes file input (řádky 730-779)
   → soubory se uloží do state `selectedFiles` (File[])
   → preview přes URL.createObjectURL()
3. Klikne "Naskladnit" → handleSubmit()

4. POST /api/deliveries → vytvoří product + variant + delivery
   → vrátí { productId, variantId, barcode, productName }

5. if (selectedFiles.length > 0):
   → POST /api/products/{productId}/media s FormData
   → media endpoint: @vercel/blob put() → prisma.product.update({ photos })
   → response: { photos: [...], video: ... }
   → setUploadedPhotos(mediaData.photos)
   → setUploadedVideo(mediaData.video)

6. Generuje QR kód, zobrazí success screen
7. Success screen ukáže nahraný obsah NEBO fallback upload
```

---

## Identifikované problémy

### Problem 1: HLAVNÍ PODEZŘELÝ — HEIC/HEIF formát z iPhone

**Soubory:**
- `StockInForm.tsx:774` — `accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"`
- `media/route.ts:9` — `PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"]`

**Problém:**
iPhone od iOS 11 fotí v **HEIC formátu** (High Efficiency Image Coding). Android od verze 9+ také podporuje HEIF.

- `accept` atribut na `<input type="file">` **neobsahuje** `image/heic` ani `image/heif`
- iOS Safari **obvykle** automaticky konvertuje HEIC→JPEG při výběru přes file input, ale:
  - Toto závisí na nastavení telefonu ("Most Compatible" vs "High Efficiency" v Settings > Camera > Formats)
  - Při drag & drop nebo přenosu přes AirDrop konverze NEPROBĚHNE
  - Některé verze iOS Safari mají bug kde konverze nefunguje v PWA/webview
- Server (`media/route.ts:42-48`) kontroluje `VIDEO_TYPES.includes(file.type)` a `PHOTO_TYPES.includes(file.type)` — HEIC file vrátí `{ error: "Nepodporovaný formát: photo.heic" }` (400)

**Toto by vysvětlovalo proč "fotky se neukládají"** — uživatel vybere fotky z telefonu, submit projde (delivery se vytvoří), ale upload fotek failne na nepodporovaný formát. Error se zobrazí v `setUploadError`, ale uživatel ho nemusí vidět pokud success screen scrollne dolů.

**Ověření:** Zkontrolovat Vercel logs pro POST `/api/products/*/media` — hledat 400 response s "Nepodporovaný formát".

**Fix:**
1. Přidat `image/heic,image/heif` do `accept` atributu v StockInForm
2. V `media/route.ts`: přidat HEIC do PHOTO_TYPES, nebo lépe — konvertovat HEIC→JPEG přes `sharp` (sharp podporuje HEIC)
3. Alternativně: přidat `image/*` do accept (přijme vše, validace na serveru)

### Problem 2: SEKUNDÁRNÍ — Upload error je snadno přehlédnutelný

**Soubor:** `StockInForm.tsx:212-217`

```typescript
if (mediaRes.ok) {
  setUploadedPhotos(mediaData.photos ?? []);
  if (mediaData.video) setUploadedVideo(mediaData.video);
} else {
  setUploadError(mediaData.error || "Upload selhal");
}
```

Error se nastaví do `uploadError`, ale na success screen se `uploadError` zobrazuje **pouze ve fallback upload sekci** (řádek 337-338), která se zobrazí jen pokud `uploadedPhotos.length === 0 && !uploadedVideo`. To znamená:

- Pokud upload failne → `uploadedPhotos` zůstane `[]` → fallback sekce se zobrazí → chyba JE viditelná
- ALE: chybová hláška je malý červený text pod tlačítkem upload, snadno přehlédnutelný

**Fix:** Zobrazit upload error prominentněji — např. jako alert box na success screen, ne schovaný v fallback sekci.

### Problem 3: POTENCIÁLNÍ — Video QuickTime MIME type mismatch

**Soubor:** `media/route.ts:10` — `VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"]`

iPhone nahrává video jako `.mov` (QuickTime, MIME `video/quicktime`). Ale některé browsery reportují `.mov` soubory s MIME type `video/x-quicktime` místo `video/quicktime`.

**Fix:** Přidat `video/x-quicktime` do VIDEO_TYPES, nebo lepší: kontrolovat file extension jako fallback.

### Problem 4: VYŘEŠENO — Chyběl revalidateTag

Implementátor (task #13) už přidal `revalidateTag("products")` na řádek 91 v `media/route.ts`. Tento problém je vyřešen.

---

## Nejpravděpodobnější scénář

Uživatel (majitelka salonu) fotí produkty na **iPhone**:
1. Otevře stock-in wizard na telefonu
2. Vyplní formulář, vybere fotky z galerie
3. iPhone pošle HEIC soubory (závisí na nastavení)
4. Klikne naskladnit → delivery se vytvoří OK
5. Upload fotek → server vrátí 400 "Nepodporovaný formát: IMG_1234.heic"
6. `setUploadError("Nepodporovaný formát: IMG_1234.heic")`
7. Success screen se zobrazí, uživatel vidí zelený check + QR kód
8. Chybová hláška je schovaná dole ve fallback upload sekci
9. Uživatel: "fotky se neukládají"

Pro videa: `.mov` soubory z iPhone mohou mít `video/x-quicktime` MIME type, který není v seznamu.

---

## Fix plán (pro implementátora)

### Krok 1: Přidat HEIC/HEIF podporu (10 min)

**`src/app/api/products/[id]/media/route.ts`:**
```typescript
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
```

Plus konverze HEIC→JPEG přes sharp:
```typescript
if (file.type === "image/heic" || file.type === "image/heif") {
  const arrayBuffer = await file.arrayBuffer();
  uploadBuffer = await sharp(Buffer.from(arrayBuffer)).jpeg({ quality: 90 }).toBuffer();
  contentType = "image/jpeg";
}
```

**Stejně tak v `src/app/api/upload/photos/route.ts`** (cesta A).

### Krok 2: Rozšířit accept atribut (2 min)

**`src/components/inventory/StockInForm.tsx` řádky 348 a 774:**
```
accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/x-quicktime,video/webm"
```

Nebo jednoduše: `accept="image/*,video/*"`

### Krok 3: Přidat QuickTime MIME fallback (2 min)

**`media/route.ts` a `upload/photos/route.ts`:**
```typescript
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-quicktime", "video/webm"];
```

### Krok 4: Zviditelnit upload error na success screen (5 min)

**`StockInForm.tsx`** — přidat error alert na success screen (ne jen ve fallback sekci):
```typescript
{uploadError && (
  <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
    {uploadError}
  </div>
)}
```

### Krok 5: Test (5 min)
- Upload HEIC fotky z iPhone → ověřit konverzi
- Upload .mov videa → ověřit přijetí
- Zkontrolovat Vercel logs pro 400 errors na media endpoint

---

## Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `src/app/api/products/[id]/media/route.ts` | HEIC/HEIF podpora + video/x-quicktime |
| 2 | `src/app/api/upload/photos/route.ts` | HEIC/HEIF podpora + video/x-quicktime |
| 3 | `src/components/inventory/StockInForm.tsx` | Rozšířit accept atribut + prominentní error display |

**Celkový odhad: 25 minut**

---

## Jak ověřit hypotézu

Před implementací fixu — zkontrolovat Vercel dashboard → Function Logs:
- Filtr: POST `/api/products/*/media`
- Hledat: 400 response, "Nepodporovaný formát"
- Pokud najdete HEIC/HEIF mentions → potvrzená hypotéza
- Pokud ne → problém je jinde (síťové chyby, Blob token)

---

## UPDATE 3: Auto WebP konverze + TEXT vodoznak "www.hairland.cz"

**Zadání (uživatel explicitně):**
- "automaticky to kovertuj na ten webp to tam ma bejt" — VŠECHNY fotky WebP
- "udelej jenom www.hairland.cz s trochou prusvitnosti a je to" — TEXT vodoznak, NE logo

**DŮLEŽITÉ:** Uživatel NECHCE logo/obrázek. Chce jednoduchý text "www.hairland.cz" s průsvitností.

### Audit: Co už implementátor udělal (task #15)

Implementátor **už implementoval** HEIC+WebP+watermark na stock-in cestě (`media/route.ts`), ale použil logo soubory. To je ŠPATNĚ — uživatel chce text.

| Cesta | Soubor | HEIC | WebP | Vodoznak | Stav |
|-------|--------|------|------|----------|------|
| Stock-in upload | `src/app/api/products/[id]/media/route.ts` | **OK** | **OK** | **ŠPATNĚ** — logo PNG v rohu, má být text | PŘEPSAT watermark |
| Product edit upload | `src/app/api/upload/photos/route.ts` | **NE** (jen jpeg/png/webp) | **NE** (output JPEG) | **SKORO OK** — SVG text "hairland.cz", ale chybí "www." prefix | PŘEPSAT celé |
| Batch re-watermark | `src/app/api/products/[id]/watermark/route.ts` | N/A | **NE** (JPEG) | **ŠPATNĚ** — volá lib/watermark.ts s logo | PŘEPSAT |
| Client filter | `src/components/products/PhotoUpload.tsx` řádek 6 | **NE** (HEIC vyfiltrováno!) | N/A | N/A | FIX |

### Existující watermark implementace — 3 různé, všechny špatně

| Implementace | Kde | Co dělá | Problém |
|-------------|-----|---------|---------|
| `src/lib/watermark.ts` (134 řádků) | Sdílená knihovna | Tiled diagonal LOGO (auto dark/light, brightness detection) | Logo místo textu, overcomplicated |
| `media/route.ts:processPhoto()` | Stock-in upload | Single LOGO bottom-right, 40% opacity | Logo místo textu |
| `upload/photos/route.ts:addWatermark()` | Product edit upload | SVG tiled text "hairland.cz" diagonal | Nejblíž tomu co chce uživatel! Ale: chybí "www.", output JPEG, chybí HEIC |

### Co uživatel chce

Jednoduchý text "www.hairland.cz" s průsvitností. Nic víc.

Nejlepší přístup = SVG text overlay přes sharp. Podobný jako stávající `upload/photos/route.ts:createWatermarkSvg()`, ale:
- Text: **"www.hairland.cz"** (ne "hairland.cz")
- Opakovaný diagonálně přes celou fotku (tiled)
- Semi-transparentní bílý text (~20-25% opacity)
- Čitelný ale neruší

### Plán oprav (pro implementátora)

#### Krok 1: PŘEPSAT `src/lib/watermark.ts` — SVG text místo logo (15 min)

Smazat celou stávající implementaci (134 řádků s brightness detection, logo loading, tiled logo pattern). Nahradit jednoduchým SVG text watermarkem:

```typescript
import sharp from "sharp";

/**
 * Create SVG watermark overlay with "www.hairland.cz" text
 * repeated diagonally across the entire image.
 */
function createWatermarkSvg(width: number, height: number): Buffer {
  const fontSize = Math.max(Math.round(Math.min(width, height) * 0.05), 14);
  const gap = fontSize * 5;

  const texts: string[] = [];
  for (let y = -height; y < height * 2; y += gap) {
    for (let x = -width; x < width * 2; x += gap) {
      texts.push(
        `<text x="${x}" y="${y}" font-size="${fontSize}" ` +
        `font-family="Arial, Helvetica, sans-serif" font-weight="600" ` +
        `fill="white" fill-opacity="0.22" ` +
        `transform="rotate(-30, ${x}, ${y})">www.hairland.cz</text>`
      );
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${texts.join("")}</svg>`;
  return Buffer.from(svg);
}

/**
 * Add text watermark "www.hairland.cz" and convert to WebP.
 * Accepts any sharp-supported input (JPEG, PNG, WebP, HEIC, HEIF).
 */
export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const w = metadata.width ?? 800;
  const h = metadata.height ?? 600;

  const watermarkSvg = createWatermarkSvg(w, h);

  return image
    .composite([{ input: watermarkSvg, top: 0, left: 0 }])
    .webp({ quality: 82 })
    .toBuffer();
}
```

**Klíčové vlastnosti:**
- Text "www.hairland.cz" (ne logo)
- Diagonální opakování (-30°) přes celou fotku
- Bílý text, ~22% opacity (jemně viditelný, neruší)
- Font size: 5% z menší strany obrázku (min 14px)
- Spacing: 5× fontSize (dostatečná pokrytí bez přehlcení)
- Output: **WebP quality 82**
- Žádné file loading, žádná brightness detection — čistý SVG

**Smazat:** `loadWatermark()`, `averageBrightness()`, celý tiled logo pattern. ~134 → ~40 řádků.

**Watermark assets (`public/watermark*.png`) se už nepoužívají.** Nemazat (nezaberou místo), ale nejsou potřeba.

#### Krok 2: `src/app/api/upload/photos/route.ts` — import z lib + HEIC + WebP (10 min)

**Smazat:** Inline `createWatermarkSvg()` a `addWatermark()` (řádky 16-46).
**Přidat:** Import z `src/lib/watermark.ts`.

```typescript
import { addWatermark } from "@/lib/watermark";

const PHOTO_TYPES = [
  "image/jpeg", "image/png", "image/webp",
  "image/heic", "image/heif"       // ← přidat HEIC
];
const VIDEO_TYPES = [
  "video/mp4", "video/quicktime",
  "video/x-quicktime", "video/webm"  // ← přidat x-quicktime
];

// V upload logic (řádek 87-91 po smazání inline funkcí):
if (isPhoto) {
  const arrayBuffer = await file.arrayBuffer();
  uploadBuffer = await addWatermark(Buffer.from(arrayBuffer));
  contentType = "image/webp";  // addWatermark vrací WebP
}

const ext = isPhoto ? "webp" : (file.name.split(".").pop() ?? "mp4");
```

#### Krok 3: `src/app/api/products/[id]/media/route.ts` — import z lib (10 min)

**Smazat:** `processPhoto()`, `getWatermark()`, `watermarkBuffer` cache (řádky 27-86).
**Přidat:** Import z `src/lib/watermark.ts`.

```typescript
import { addWatermark } from "@/lib/watermark";

async function processPhoto(
  file: File
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = await addWatermark(Buffer.from(arrayBuffer));
  return { buffer, contentType: "image/webp", ext: "webp" };
}
```

Smazat `import path from "path"` a `import { readFile } from "fs/promises"` — už nepotřeba.

#### Krok 4: `src/app/api/products/[id]/watermark/route.ts` — WebP output (5 min)

Tento endpoint už volá `addWatermark` z `src/lib/watermark.ts` — po kroku 1 bude automaticky vracet WebP + text. Jen změnit contentType + extension při uploadu:

Řádek 54-56:
```typescript
const safeName = `products/${id}-wm-${Date.now()}-${...}.webp`;
const blob = await put(safeName, watermarked, {
  access: "public",
  contentType: "image/webp",
});
```

#### Krok 5: `src/components/products/PhotoUpload.tsx` — client-side HEIC fix (2 min)

Řádek 6:
```typescript
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
```

Plus extension fallback v filtru (některé browsery hlásí HEIC s prázdným MIME):
```typescript
const fileArray = Array.from(files).filter((f) => {
  if ([...PHOTO_TYPES, ...VIDEO_TYPES].includes(f.type)) return true;
  const ext = f.name.split(".").pop()?.toLowerCase();
  return ext === "heic" || ext === "heif";
});
```

#### Krok 6: Test (5 min)
- Upload JPEG přes stock-in → ověřit WebP output + TEXT watermark "www.hairland.cz"
- Upload HEIC přes product edit → ověřit WebP + TEXT watermark
- Zkontrolovat že watermark je jemně viditelný (ne přehlcený, ne neviditelný)
- Ověřit že logo watermark se NIKDE neobjevuje
- Zkontrolovat Vercel Blob: `.webp` extension, `image/webp` content-type

### Soubory k úpravě (doplnění)

| # | Soubor | Změna |
|---|--------|-------|
| 4 | `src/lib/watermark.ts` | PŘEPSAT: smazat logo logiku (134→~40 řádků), SVG text "www.hairland.cz", output WebP |
| 5 | `src/app/api/upload/photos/route.ts` | PŘEPSAT: import z lib/watermark, přidat HEIC, WebP output, smazat inline watermark |
| 6 | `src/app/api/products/[id]/media/route.ts` | PŘEPSAT: smazat processPhoto()/getWatermark(), import z lib/watermark |
| 7 | `src/app/api/products/[id]/watermark/route.ts` řádky 54-56 | Výstup .jpg→.webp, contentType image/webp |
| 8 | `src/components/products/PhotoUpload.tsx` řádek 6 | HEIC/HEIF do PHOTO_TYPES + extension fallback |

### Flow po opravě (všechny upload cesty):

```
Upload (jakýkoliv formát: JPEG/PNG/HEIC/HEIF/WebP)
  ↓
sharp: načte obrázek (auto-detekce formátu, HEIC included)
  ↓
sharp: SVG overlay — text "www.hairland.cz" diagonálně, bílý, ~22% opacity
  ↓
sharp: .webp({ quality: 82 }) konverze
  ↓
@vercel/blob: upload jako image/webp
  ↓
DB: URL s .webp extension
```

**Výhody WebP:**
- ~25-35% menší soubory než JPEG při stejné kvalitě
- Podporováno všemi moderními browsery (Chrome, Firefox, Safari 14+, Edge)
- Lepší loading performance na webu

### Celkový odhad doplnění: ~45 minut (+ původních 25 min = celkem ~1.25h)
