# TASK-023: Fotky se nepřidávají — proč upload stále nefunguje

**Status:** Analýza v2 — AKTUALIZOVÁNO po Vercel log nálezu
**Autor:** Plánovač
**Datum:** 2026-07-14
**Update v2:** 2026-07-15 — Vercel logy neobsahují ŽÁDNÝ POST → problém je 100% client-side

---

## Co už implementátor opravil (a funguje správně v kódu)

1. **HEIC podpora** — přidána na všech cestách (client + server)
2. **WebP konverze** — přes `lib/watermark.ts` → `sharp .webp({ quality: 82 })`
3. **TEXT vodoznak** — SVG "www.hairland.cz", 30% opacity, bottom-right corner
4. **Extension fallback** — client-side filter kontroluje i příponu souboru, ne jen MIME
5. **Try/catch na watermark** — obě API routes mají fallback na originál při selhání

Kód vypadá korektně. Všechny soubory jsou aktualizované.

---

## Audit kódu — co jsem zkontroloval

| Soubor | Stav | Poznámka |
|--------|------|----------|
| `src/lib/watermark.ts` | OK | 45 řádků, SVG text, WebP output, žádné závislosti na soubory |
| `src/app/api/upload/photos/route.ts` | OK | HEIC v PHOTO_TYPES, `addWatermark` import, try/catch fallback |
| `src/app/api/products/[id]/media/route.ts` | OK | HEIC, `addWatermark` import, `processPhoto()` s try/catch |
| `src/components/products/PhotoUpload.tsx` | OK | HEIC v PHOTO_TYPES + PHOTO_EXTS, extension fallback ve filtru |
| `src/components/inventory/StockInForm.tsx` | OK | Accept atribut má HEIC, extension fallback na HEIC/HEIF |
| `src/lib/validations/product.ts` | OK | `photos: z.string().optional()` — přijme JSON string |
| `src/app/api/products/[id]/route.ts` PUT | OK | Uloží `parsed.data` → `photos` se zapíše |
| `next.config.ts` | OK | `sharp` je v auto-externalized seznamu Next.js 16 |
| `vercel.json` | OK | Jen region + crons, žádné function overrides |
| `package.json` | OK | `sharp: ^0.35.2`, podporuje HEIC |

---

## Identifikované potenciální příčiny (ranking)

### 1. NEJPRAVDĚPODOBNĚJŠÍ: sharp HEIC na Vercel runtime — tichý fallback

**Problém:**
sharp 0.35+ přidává HEIC podporu přes `libvips` s `heif-loader`. Ale na Vercel serverless runtime (Amazon Linux 2023) může chybět `libheif` systémová knihovna. Pokud `sharp` nedokáže načíst HEIC soubor, hodí chybu.

**Co se pak stane:**
- `addWatermark(Buffer.from(arrayBuffer))` vyhodí exception
- try/catch zachytí → `console.error("[upload/photos] watermark failed, uploading original:", e)`
- Fallback: **upload ORIGINÁLNÍHO HEIC souboru** do Vercel Blob
- Blob URL: `products/1720xxx-abc123.jpg` (s příponou `.jpg`!) ale obsahem je HEIC
- Browser **nedokáže zobrazit HEIC** (Safari ano, Chrome NE)
- Uživatel vidí: prázdný/rozbitý obrázek → "fotky nefungují"

**Klíčový problém v kódu (`upload/photos/route.ts` řádky 66-70):**
```typescript
catch (e) {
    console.error("[upload/photos] watermark failed, uploading original:", e);
    uploadBuffer = Buffer.from(arrayBuffer);
    outputExt = "jpg";  // ← ŠPATNĚ! Soubor je HEIC, ale přípona je "jpg"
}
```

Stejný problém v `media/route.ts` řádky 31-33:
```typescript
catch (e) {
    console.error("[media] watermark failed, uploading original:", e);
    return { buffer: Buffer.from(arrayBuffer), contentType: file.type || "image/jpeg", ext: "jpg" };
}
```

Výsledek: HEIC soubor nahraný s příponou `.jpg` a (v media route) s contentType `image/heic`. Browser nedokáže zobrazit.

**Ověření:**
1. Zkontrolovat **Vercel Function Logs** pro errors typu `[upload/photos] watermark failed` nebo `[media] watermark failed`
2. Zkontrolovat **Vercel Blob storage** — najít soubory s `.jpg` příponou ale nestandardní velikostí (HEIC jsou větší než JPEG)
3. Otevřít nahrané blob URL přímo v Chrome → pokud se nezobrazí, je to HEIC s .jpg příponou

### 2. MOŽNÉ: Chybí `maxDuration` — function timeout

**Problém:**
Vercel hobby plan má **default 10s timeout** pro serverless functions. Zpracování velkého HEIC souboru (10-15 MB) přes sharp (decode HEIC → composite SVG → encode WebP) může trvat **15-30 sekund**.

**Co se stane:**
- Funkce timeoutne uprostřed zpracování
- Client dostane 504 Gateway Timeout nebo FUNCTION_INVOCATION_TIMEOUT
- Fotka se nezobrazí

**Fix:**
Přidat export do obou route handlers:
```typescript
export const maxDuration = 30; // 30 sekund (Vercel Pro: max 300s, Hobby: max 60s)
```

Soubory:
- `src/app/api/upload/photos/route.ts`
- `src/app/api/products/[id]/media/route.ts`

**Poznámka:** Nikde v projektu není `maxDuration` exportovaný — ŽÁDNÁ API route nemá explicitní timeout. To je potenciální problém i pro jiné endpointy, ale upload s image processing je nejnáchylnější.

### 3. MOŽNÉ: JPEG upload z iPhone funguje, ale watermark selže z jiného důvodu

I když soubory NEJSOU HEIC (iPhone na "Most Compatible" posílá JPEG), sharp může selhat z jiných důvodů:
- Malý memory limit na serverless (1024 MB default)
- Velký obrázek (iPhone 15 Pro: 48 MP = 8064×6048 = ~145 MB uncompressed)
- SVG rendering s příliš mnoha text elementy (ale current verze má jen 1 text element, ne tiled)

### 4. MÉNĚ PRAVDĚPODOBNÉ: Chyba v ProductDetailClient onChange flow

Flow pro product edit page:
1. PhotoUpload uploads to `/api/upload/photos` → gets blob URLs
2. Calls `onChange([...photos, ...newPhotos])`
3. `handlePhotosChange` calls `PUT /api/products/${id}` with `{ photos: JSON.stringify(newPhotos) }`

Pokud `PUT` vrátí error (např. validace selže), `console.error` to zaloguje ale neukáže uživateli. Uživatel vidí: fotka zmizí po refreshi → "fotky se neukládají". Ale toto je nepravděpodobné protože `updateProductSchema` přijme `photos: z.string().optional()`.

### 5. NEJMÉNĚ PRAVDĚPODOBNÉ: `productId` prop se nepoužívá v PhotoUpload

`PhotoUpload` přijímá `productId` prop ale **nikde ho nepoužívá**. Vždy uploaduje na `/api/upload/photos` (generic endpoint), nikdy na `/api/products/${productId}/media`. To znamená:
- Product edit: fotky se uploadnou do blob, URL se vrátí, parent zavolá PUT → OK
- Stock-in: StockInForm má vlastní upload logiku (řádky 304-323) → volá `/api/products/${productId}/media` přímo → OK

Toto NENÍ bug, jen nevyužitý prop.

---

## Doporučený fix plan (pro implementátora)

### Priorita 1: Opravit try/catch fallback — NESMÍ uploadovat surový HEIC

**`src/app/api/upload/photos/route.ts`** (řádky 60-70):
```typescript
if (isPhoto) {
    const arrayBuffer = await file.arrayBuffer();
    try {
        uploadBuffer = await addWatermark(Buffer.from(arrayBuffer));
        contentType = "image/webp";
        outputExt = "webp";
    } catch (e) {
        console.error("[upload/photos] watermark failed:", e);
        // Fallback: konvertovat na JPEG bez watermarku (ne uploadovat surový HEIC!)
        try {
            const { default: sharp } = await import("sharp");
            uploadBuffer = await sharp(Buffer.from(arrayBuffer))
                .jpeg({ quality: 85 })
                .toBuffer();
            contentType = "image/jpeg";
            outputExt = "jpg";
        } catch (e2) {
            console.error("[upload/photos] sharp fallback also failed:", e2);
            // Pokud i JPEG konverze selže, uploadovat originál ALE s SPRÁVNOU příponou
            uploadBuffer = Buffer.from(arrayBuffer);
            contentType = file.type || "image/jpeg";
            outputExt = fileExt || "jpg";
        }
    }
}
```

**`src/app/api/products/[id]/media/route.ts`** (processPhoto, řádky 24-35):
```typescript
async function processPhoto(
    file: File
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
    const arrayBuffer = await file.arrayBuffer();
    try {
        const buffer = await addWatermark(Buffer.from(arrayBuffer));
        return { buffer, contentType: "image/webp", ext: "webp" };
    } catch (e) {
        console.error("[media] watermark failed:", e);
        // Fallback: konvertovat na JPEG bez watermarku
        try {
            const { default: sharp } = await import("sharp");
            const buffer = await sharp(Buffer.from(arrayBuffer))
                .jpeg({ quality: 85 })
                .toBuffer();
            return { buffer, contentType: "image/jpeg", ext: "jpg" };
        } catch (e2) {
            console.error("[media] sharp fallback also failed:", e2);
            const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
            return { buffer: Buffer.from(arrayBuffer), contentType: file.type || "image/jpeg", ext };
        }
    }
}
```

### Priorita 2: Přidat `maxDuration` export

**`src/app/api/upload/photos/route.ts`** — přidat na začátek (po importech):
```typescript
export const maxDuration = 30;
```

**`src/app/api/products/[id]/media/route.ts`** — stejně:
```typescript
export const maxDuration = 30;
```

### Priorita 3: Diagnostika — zkontrolovat Vercel logs

Před implementací fixů zkontrolovat Vercel dashboard:
1. **Runtime Logs** → filtr POST `/api/upload/photos` a `/api/products/*/media`
2. Hledat: `[upload/photos] watermark failed` nebo `[media] watermark failed`
3. Hledat: `FUNCTION_INVOCATION_TIMEOUT`
4. Hledat: 400/500 status codes

Pokud vidíme `watermark failed` → sharp nemůže zpracovat soubor → příčina #1 potvrzena.
Pokud vidíme timeout → příčina #2 potvrzena.
Pokud nevidíme žádné chyby → problém je jinde (client-side nebo DB save).

---

## Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `src/app/api/upload/photos/route.ts` | Opravit try/catch fallback + `maxDuration = 30` |
| 2 | `src/app/api/products/[id]/media/route.ts` | Opravit try/catch fallback + `maxDuration = 30` |

---

## Shrnutí (v1 — PŘEKONÁNO)

~~Kód vypadá správně na první pohled, ale skrytý problém je v try/catch fallback logu.~~
~~Sekundární problém je chybějící maxDuration.~~

**Tato analýza předpokládala že požadavky dorazí na server. Vercel logy prokázaly opak — viz UPDATE v2 níže.**

---

## UPDATE v2: Vercel logy — ŽÁDNÝ POST upload request

**Nový nález (2026-07-15):** Team-lead zkontroloval Vercel runtime logy a nenašel ŽÁDNÝ POST request na `/api/upload/photos` ani `/api/products/*/media`. Jediné chyby v logech: `CredentialsSignin` (neúspěšné pokusy o přihlášení).

**To znamená: problém je 100% na klientské straně. Fetch se VŮBEC neodesílá.**

### Re-analýza: Proč se fetch neodesílá?

#### Hypotéza A: NEJPRAVDĚPODOBNĚJŠÍ — PhotoUpload se NERENDRUJE (role check)

**`src/app/(app)/products/[id]/ProductDetailClient.tsx` řádek 399:**
```typescript
{isOwner && (
    <Card>
        <PhotoUpload ... />
    </Card>
)}
```

PhotoUpload se zobrazuje **POUZE pro OWNER** role. Pokud je uživatel EMPLOYEE:
- Vidí product detail stránku (variants, popis, SEO)
- **NEVIDÍ upload komponentu** → nemůže vybrat soubory → žádný fetch
- Na řádku 488: `{!isOwner && (parsedPhotos.length > 0 || product.video) && (` — non-owners vidí EXISTUJÍCÍ fotky ale nemůžou přidat nové

**Pro stock-in cestu (StockInForm):**
Stock-in formulář JE přístupný pro EMPLOYEE (stránka kontroluje `session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE"` → redirect). Ale:
1. Uživatel vybere soubory → `selectedFiles` se naplní
2. Klikne "Naskladnit" → `handleSubmit()` runs
3. POST `/api/deliveries` se odešle → vytvoří delivery
4. **ALE:** API endpoint kontroluje `session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE"` → vrátí 403 Forbidden?

Počkat — ne, `/api/deliveries` taky přijímá EMPLOYEE. Problém by mohl být jinde.

**KLÍČOVÝ MOMENT:** Řádek 304: `if (selectedFiles.length > 0)`. Pokud uživatel NEVYBRAL žádné soubory před odesláním formuláře → upload se nikdy nespustí. Ale to by znamenalo že user si myslí že fotky by se měly nahrát automaticky.

#### Hypotéza B: MOŽNÁ — User vybírá fotky AŽ PO naskladnění (fallback upload)

Na success screen (řádky 560-583) je **fallback upload** sekce, která se zobrazí jen pokud `uploadedPhotos.length === 0 && !uploadedVideo`. Tato sekce má vlastní `<input type="file">` s `handleMediaUpload()`.

`handleMediaUpload()` (řádky 346-370):
```typescript
async function handleMediaUpload(files: FileList | null) {
    if (!files || files.length === 0 || !successData) return;
    ...
    const res = await fetch(`/api/products/${successData.productId}/media`, {
        method: "POST",
        body: formData,
    });
    ...
}
```

Tato funkce kontroluje `!successData` — pokud by `successData` byl null, funkce by vrátila silently. Ale `successData` se nastaví v `handleSubmit` (řádek 334) a fallback upload se zobrazí JEN v success screen (řádek 492: `if (successData)`), takže `successData` je vždy nenull zde.

**ALE:** Co když `handleMediaUpload` selže na `!files || files.length === 0`? Pokud file picker vrátí prázdný FileList (uživatel klikne "Cancel" v dialogu), funkce vrátí silently.

#### Hypotéza C: MOŽNÁ — CredentialsSignin naznačuje session problém

Vercel logy obsahují `CredentialsSignin` chyby. Možné scénáře:
1. Uživatel se pokouší přihlásit ale heslo nefunguje → nikdy se nedostane k upload stránce
2. Uživatel MÁ platnou session ale je to EMPLOYEE role → nevidí PhotoUpload
3. JWT token expiroval → session je null → redirect na /login → user se zkouší přihlásit ale selhává

#### Hypotéza D: MÉNĚ PRAVDĚPODOBNÁ — Client-side filter eliminuje soubory

V PhotoUpload.tsx řádky 29-33:
```typescript
const fileArray = Array.from(files).filter((f) => {
    if ([...PHOTO_TYPES, ...VIDEO_TYPES].includes(f.type)) return true;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    return PHOTO_EXTS.includes(ext) || VIDEO_EXTS.includes(ext);
});
if (fileArray.length === 0) return;  // ← TICHÝ RETURN
```

Pokud `f.type` je prázdný string A přípona není v PHOTO_EXTS — soubor se vyfiltruje. Ale HEIC je v PHOTO_EXTS a JPEG/PNG projdou přes MIME check. Toto by vysvětlovalo problém jen pro exotické formáty, ne pro všechny fotky.

### Závěr v2

**Nejpravděpodobnější vysvětlení (v pořadí):**

1. **User je EMPLOYEE** → PhotoUpload se nerendruje na product edit stránce → nemůže uploadovat fotky → "fotky nefungují". Stock-in fotky ale fungují (jiný upload flow).

2. **User vybírá fotky AŽ PO naskladnění** (v fallback sekci) ale z nějakého důvodu file picker selhává nebo soubory nejsou vybrány.

3. **Session/login problém** — CredentialsSignin chyby naznačují že se user nemůže přihlásit → nikdy nevidí admin stránku.

### Doporučení pro implementátora

1. **ZJISTIT ROLI UŽIVATELE** — zkontrolovat v Prisma DB: `SELECT role FROM User WHERE email = 'user@email'`. Pokud EMPLOYEE → PhotoUpload se nerendruje = root cause.

2. **Pokud je EMPLOYEE → rozšířit PhotoUpload i pro EMPLOYEE:**
   ```typescript
   // ProductDetailClient.tsx řádek 399
   {(isOwner || session.user.role === "EMPLOYEE") && (
       <Card>
           <PhotoUpload ... />
       </Card>
   )}
   ```
   A na serveru: `upload/photos/route.ts` řádek 22 už přijímá EMPLOYEE: `session.user.role !== "OWNER" && session.user.role !== "EMPLOYEE"`.

3. **Přidat console.log do PhotoUpload pro debug:**
   ```typescript
   const uploadFiles = useCallback(async (files: FileList | File[]) => {
       console.log("[PhotoUpload] uploadFiles called with", files.length, "files");
       const fileArray = ...;
       console.log("[PhotoUpload] after filter:", fileArray.length, "files");
       if (fileArray.length === 0) {
           console.warn("[PhotoUpload] all files filtered out!");
           return;
       }
       ...
   });
   ```

4. **Zkontrolovat CredentialsSignin** — pokud user nemůže přihlásit, všechno ostatní je irelevantní.

### Soubory k úpravě (v2)

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `src/app/(app)/products/[id]/ProductDetailClient.tsx` řádek 399 | Zobrazit PhotoUpload i pro EMPLOYEE (pokud je to root cause) |
| 2 | `src/app/api/upload/photos/route.ts` | `maxDuration = 30` (stále platí) + opravit HEIC fallback (stále platí) |
| 3 | `src/app/api/products/[id]/media/route.ts` | `maxDuration = 30` + opravit HEIC fallback |

### Priorita diagnózy

1. Zjistit roli uživatele v DB
2. Ověřit zda user vidí upload komponentu (screenshot / browser DevTools)
3. Ověřit zda se fetch odesílá (Network tab v DevTools)
