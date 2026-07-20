# TASK-011: Bug — Fotky i videa se neukládají při naskladnění

**Status:** HOTOVO (analýza v3 — zaměřená na stock-in)
**Autor:** Plánovač
**Datum:** 2026-07-14
**Update 1:** Uživatel doplnil "video taky ne"
**Update 2:** Uživatel upřesnil — problém je **při naskladnění** (stock-in wizard), ne při editaci produktu

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
