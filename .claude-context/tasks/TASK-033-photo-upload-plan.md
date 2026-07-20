# TASK-033: Photo upload failure — analýza

**Status:** Analýza hotová
**Autor:** Plánovač
**Datum:** 2026-07-15

---

## Kontext

User hlásí: "upload selhal při fotkách". Potřeba zjistit kde a proč selhává.

---

## Architektura photo uploadu

### Upload flow (2 cesty)

```
1. Product detail (edit) → PhotoUpload.tsx → /api/products/{id}/media → sharp/watermark → Vercel Blob
2. New product create  → PhotoUpload.tsx → /api/upload/photos        → sharp/watermark → Vercel Blob
3. Stock-in form       → StockInForm.tsx → /api/products/{id}/media → sharp/watermark → Vercel Blob
```

Všechny cesty nakonec používají:
- `addWatermark()` z `src/lib/watermark.ts` (sharp → WebP + watermark)
- `@vercel/blob` pro uložení na Vercel Blob Storage
- `maxDuration = 30` na obou API routách

### Fallback chain (robustní)

```
1. addWatermark(buffer) → WebP s watermarkem
   ↓ pokud selže
2. sharp(buffer).jpeg({quality: 85}) → JPEG bez watermarku
   ↓ pokud selže
3. raw buffer → originální formát (pass-through)
```

---

## Potenciální příčiny selhání

### Příčina 1: SHARP VERSION CONFLICT (PRAVDĚPODOBNÁ)

**Kritický nález:** V `package-lock.json` existují DVĚ verze sharp:
- `sharp@0.35.2` — top-level dependency (project)
- `sharp@0.34.5` — nested v `node_modules/next/` (Next.js built-in)

`serverExternalPackages: ["sharp"]` v `next.config.ts` říká Next.js aby NEBANOVAL sharp do serverless function. Ale na Vercel to může způsobit:
- Špatná nativní binárka (linuxmusl vs linux) 
- Conflict mezi 0.34.x a 0.35.x

**Důkaz z git history:**
```
803edd0 Fix: remove auto-watermark from upload (sharp crashes on Vercel serverless)
41006db Fix: watermark crashes on Vercel — fallback to HTTP fetch + graceful error handling
```

Sharp na Vercel serverless OPAKOVANĚ crashovalo. Bylo to fixováno fallback chainem, ale může znovu selhat.

### Příčina 2: VERCEL BLOB TOKEN MISSING/EXPIRED

`@vercel/blob` vyžaduje `BLOB_READ_WRITE_TOKEN` env var na Vercel. Toto NENÍ v `.env.example`. Pokud token expiroval nebo nebyl nastaven po redeploymentu → upload selže s 500 error.

**Kontrola:** Token se neověřuje v kódu — `put()` prostě hodí exception.

### Příčina 3: TIMEOUT na velkých souborech

- `maxDuration = 30` sekund
- Max photo size: 15MB (HEIC soubory)
- Max video size: 50MB
- Sharp processing HEIC → WebP na Vercel lambda může trvat 10-20s pro jeden velký soubor
- Pokud user nahraje 6 fotek najednou → sequential `for` loop v media route → může překročit 30s

**Kód (`media/route.ts` řádky 76-129):**
```typescript
for (const file of files) {  // SEQUENTIAL, ne parallel!
  // ... processPhoto → sharp → put ...
}
```

### Příčina 4: HEIC formát bez správného MIME type

iPhone fotky mají MIME type `""` (prázdný string) a extension `.heic`. Kód má fallback na extension check, ale:

```typescript
const isHeic = fileExt === "heic" || fileExt === "heif" || fileType === "image/heic" || fileType === "image/heif";
```

Toto by mělo fungovat. ALE: pokud iPhone posílá `.HEIC` (uppercase) → `toLowerCase()` to ošetří. Toto vypadá OK.

### Příčina 5: Vercel FREE plan limit

Vercel Hobby plan: `maxDuration` limit je 10 sekund (ignoruje config!). Pokud je projekt na Hobby plan, `maxDuration = 30` se NEAPLIKUJE a funkce timoutuje po 10s.

Vercel Pro plan: `maxDuration` limit je 60 sekund.

---

## Diagnostika — co potřebujeme vědět

1. **Kde selhává?** — production (hairland.cz) nebo localhost?
2. **Jaký error?** — 500, timeout, network error?
3. **Vercel plan** — Hobby nebo Pro? (determines maxDuration limit)
4. **Vercel Function logs** — console.error výstupy z fallback chain
5. **Jaký typ fotek?** — HEIC z iPhone? Velké soubory? Kolik najednou?

---

## Doporučený fix

### Fix 1: Paralelizovat photo processing (HLAVNÍ)

V `src/app/api/products/[id]/media/route.ts` je processing SEQUENTIAL (`for` loop). Měl by být PARALLEL:

**Soubor:** `src/app/api/products/[id]/media/route.ts` řádky 76-129

```typescript
// SOUČASNÝ KÓD (sequential):
for (const file of files) {
  // ... processPhoto + put ...
}

// NAVRHOVANÝ FIX (parallel):
const results = await Promise.all(files.map(async (file) => {
  // ... processPhoto + put ...
}));
```

Stejný pattern jako v `upload/photos/route.ts` (ten už je parallel — `Promise.all(uploads)`).

### Fix 2: Lepší error reporting na klientu

V `PhotoUpload.tsx` řádek 55: error response se čte ale neloguje detailně.

```typescript
// Přidat:
console.error("[PhotoUpload] upload failed:", res.status, err);
```

### Fix 3: Ověřit BLOB_READ_WRITE_TOKEN

Přidat do `.env.example`:
```
BLOB_READ_WRITE_TOKEN=
```

A v upload routě přidat early check:
```typescript
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 });
}
```

### Fix 4: Zvážit zvýšení maxDuration

Pokud je Vercel Pro plan, zvýšit `maxDuration` na 60 pro upload routy. Pokud je Hobby plan, nedá se nic dělat — musíme optimalizovat processing.

---

## Soubory k úpravě

| # | Soubor | Změna | Priorita |
|---|--------|-------|----------|
| 1 | `src/app/api/products/[id]/media/route.ts` | Paralelizovat file processing (for→Promise.all) | HLAVNÍ |
| 2 | `src/app/api/products/[id]/media/route.ts` | Přidat BLOB_READ_WRITE_TOKEN check | STŘEDNÍ |
| 3 | `src/components/products/PhotoUpload.tsx` | Lepší error logging na klientu | NICE-TO-HAVE |
| 4 | `.env.example` | Přidat BLOB_READ_WRITE_TOKEN | NICE-TO-HAVE |

---

## Shrnutí

Photo upload má robustní 3-level fallback (watermark → JPEG → raw). Nejpravděpodobnější příčiny selhání:

1. **Sharp crash na Vercel** — opakovaný problém (git history), fallback chain by to měl chytit ale může selhat kompletně
2. **Timeout** — sequential processing v media route, 6 HEIC fotek najednou může překročit 30s (nebo 10s na Hobby plan)
3. **Blob token** — missing/expired BLOB_READ_WRITE_TOKEN

Hlavní fix: paralelizovat processing v media route (konzistentně s upload/photos route).

Bez přístupu k Vercel logům nelze potvrdit přesnou příčinu — implementátor by měl zkontrolovat Vercel Function logs na production.
