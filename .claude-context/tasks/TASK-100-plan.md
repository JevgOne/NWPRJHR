# PLAN: TASK-100 — Blog nahravani obrazku nefunguje

## Kontext

Uzivatel: "proc zase nejde nahrat obrazek do blogu?"

Blog editor pouziva `handleCoverUpload` v `BlogEditorClient.tsx:116-129` ktery vola `/api/upload/photos`.
Existuje predchozi analyza v `TASK-033-photo-upload-plan.md` ktera popisuje 5 potencialnich pricin selhani.

---

## Analyza kodu

### Upload flow

```
BlogEditorClient.tsx:handleCoverUpload (radek 116-129)
  → FormData s jednim souborem (field name: "files")
  → POST /api/upload/photos
  → upload/photos/route.ts:
     1. addWatermark(buffer) → WebP
     ↓ pokud selze
     2. sharp(buffer).jpeg({quality: 85}) → JPEG bez watermarku
     ↓ pokud selze
     3. raw buffer → originalní format
     → put() na Vercel Blob
  → vraci { photoUrls: [...], videoUrl: null }
```

### NALEZENE PROBLEMY

#### PROBLEM 1: Zadny error feedback uzivateli (CRITICAL)

**Soubor:** `src/app/(app)/posts/[id]/BlogEditorClient.tsx:116-129`

```typescript
const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploading(true);
  const formData = new FormData();
  formData.append("files", file);
  const res = await fetch("/api/upload/photos", { method: "POST", body: formData });
  if (res.ok) {                           // ← !res.ok → TICHY FAIL
    const data = await res.json();
    const url = data.photoUrls?.[0] ?? data.urls?.[0];
    if (url) setCoverImage(url);           // ← url undefined → TICHY FAIL
  }
  setUploading(false);                     // ← uploading skonci, uzivatel nevi co se stalo
};
```

**Problémy:**
1. Pokud `res.ok` je `false` (500, 400, 413) → nic se nestane, zadna chybova zprava
2. Pokud `url` je `undefined` → nic se nestane
3. Pokud `fetch` hodi exception (network error) → UNHANDLED EXCEPTION, `uploading` zustane `true` navzdy
4. Chybi `try-catch` wrapper

**FIX:**
```typescript
const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploading(true);
  setError("");
  try {
    const formData = new FormData();
    formData.append("files", file);
    const res = await fetch("/api/upload/photos", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Upload selhal (${res.status})`);
    }
    const data = await res.json();
    const url = data.photoUrls?.[0] ?? data.urls?.[0];
    if (!url) throw new Error("Server nevrátil URL obrázku");
    setCoverImage(url);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Nahrávání obrázku selhalo");
  } finally {
    setUploading(false);
  }
};
```

**Obtiznost:** Jednoducha — ~15 radku

---

#### PROBLEM 2: Sharp selhava na Vercel (ZNAMY PROBLEM)

**Z TASK-033 analyzy:**
- Git history ukazuje opakovaná selhání sharpu na Vercel: `803edd0 Fix: remove auto-watermark from upload (sharp crashes on Vercel serverless)`
- Verze sharp v projektu (0.35.2) vs Next.js built-in (0.34.5) — potencialni konflikt
- `serverExternalPackages: ["sharp"]` v `next.config.ts` — nutne pro spravne fungovani

**Existujici mitigace:**
- Upload route ma 3-urovnovy fallback (watermark → sharp bez watermarku → raw buffer)
- `maxDuration = 60` (zvyseno z puvodních 30)

**PROBLEM:** Fallback chain funguje pro products upload, ALE pokud selze i 3. fallback (raw buffer upload na Vercel Blob) → API vraci 400/500 a blog editor to tichy ignoruje (viz Problem 1).

**FIX:** Reseni je uz v Problem 1 — pridat error handling do klienta. Samotny fallback chain na serveru je dostatecne robustni.

---

#### PROBLEM 3: Vercel Blob token (POTENCIALNI)

**`@vercel/blob`** vyzaduje `BLOB_READ_WRITE_TOKEN` environment variable. Toto NENI v zadnem `.env` souboru v projektu (overeno grep). Token je nastaven v Vercel Dashboard.

**Scénáře selhání:**
- Token expiroval
- Token nebyl nastaven po novém deploymentu
- Token ma spatna prava

**PROBLEM:** Kód NEVALIDUJE existenci tokenu pred pokusem o upload. `put()` hodi exception ktera je chycena generic catch blokem.

**FIX:** Pridat validaci na zacatek upload route:

```typescript
// Na zacatku POST handleru, po auth check
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("[upload/photos] BLOB_READ_WRITE_TOKEN not configured");
  return NextResponse.json(
    { error: "Upload není nakonfigurován. Kontaktujte administrátora." },
    { status: 500 }
  );
}
```

**Obtiznost:** Jednoducha — 5 radku

---

#### PROBLEM 4: Vercel plan timeout limit (INFO)

- Vercel Hobby plan: `maxDuration` limit je 10s (ignoruje config!)
- Vercel Pro plan: limit 60s

Pokud je projekt na Hobby plan → `maxDuration = 60` v kódu se NEAPLIKUJE. Sharp processing velkeho HEIC souboru (15MB) muze trvat 10-20s → timeout.

**FIX:** Zjistit Vercel plan. Pokud Hobby:
- Bud upgradnout na Pro
- Nebo client-side resize pred uploadem (nemeni server kod)

**Obtiznost:** N/A — zavisi na planu

---

## SHRNUTY — PRIORITIZOVANE OPRAVY

| # | Problem | Dopad | Obtiznost | Priorita |
|---|---------|-------|-----------|----------|
| 1 | Zadny error feedback v BlogEditorClient | Uzivatel nevi proc upload selhal | Jednoducha | P0 |
| 2 | Chybi BLOB token validace | Crypticky error pri chybejicim tokenu | Jednoducha | P0 |
| 3 | Sharp crashes na Vercel | Uz mitigovano fallback chainem | Existujici | INFO |
| 4 | Vercel plan timeout | Zavisi na planu | N/A | INFO |

---

## SOUBORY K UPRAVE

| # | Soubor | Zmena |
|---|--------|-------|
| 1 | `src/app/(app)/posts/[id]/BlogEditorClient.tsx:116-129` | Pridat try-catch, error zpravy, finally block |
| 2 | `src/app/api/upload/photos/route.ts:19-25` | Pridat BLOB token check pred uploadem |

---

## PORADI IMPLEMENTACE

1. **BlogEditorClient.tsx** — refaktorovat `handleCoverUpload` s try-catch a error zpravami (~15 radku)
2. **upload/photos/route.ts** — pridat `BLOB_READ_WRITE_TOKEN` validaci (~5 radku)

**Celkem: 2 soubory, ~20 radku zmeny**

---

## VERIFIKACE

1. Nahrat obrazek v blog editoru → overit ze se zobrazi cover image
2. Nahrat prilis velky soubor (>15MB) → overit ze se zobrazi chybova zprava
3. Nahrat nepodporovany format → overit ze se zobrazi chybova zprava
4. Simulovat selhani (developer tools → block request) → overit ze uploading se resetne a zobrazi se error

---

## RIZIKA

- **Nizke** — zmeny jsou ciste UI error handling, nemeni logiku uploadu
- Pokud problem je na strane Vercel Blob tokenu nebo planu → oprava kodu nepomuze, ale uzivatel alespon uvidí chybovou zpravu misto tichého selhání
