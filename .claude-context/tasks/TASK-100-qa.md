# QA: TASK-100 — Blog upload error handling

**Datum:** 2026-07-22
**Kontrolor:** kontrolor
**Status: PASS — vše správně implementováno**

---

## 1. BlogEditorClient.tsx — try-catch-finally

**Soubor:** `src/app/(app)/posts/[id]/BlogEditorClient.tsx:116-138`

```typescript
const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploading(true);
  setError("");           // ← čistí předchozí chyby
  try {
    const res = await fetch("/api/upload/photos", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Upload selhal (${res.status})`);  // ← parsuje server error
    }
    const url = data.photoUrls?.[0] ?? data.urls?.[0];
    if (!url) throw new Error("Server nevrátil URL obrázku");  // ← null URL
    setCoverImage(url);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Nahrávání obrázku selhalo");  // ← user-friendly
  } finally {
    setUploading(false);  // ← vždy proběhne
  }
};
```

✅ `setError("")` na začátku — čistí předchozí chyby
✅ `!res.ok` → parsuje `data.error` ze server response, fallback na HTTP status
✅ `!url` → explicit throw s popisnou zprávou
✅ `catch` → `setError()` zobrazí uživateli popisnou zprávu
✅ `finally` → `setUploading(false)` garantováno i při network error
✅ `res.json().catch(() => ({}))` — bezpečné parsování (nepřidá další error pokud body není JSON)

---

## 2. upload/photos/route.ts — BLOB_READ_WRITE_TOKEN validace

**Soubor:** `src/app/api/upload/photos/route.ts:26-32`

```typescript
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("[upload/photos] BLOB_READ_WRITE_TOKEN not configured");
  return NextResponse.json(
    { error: "Upload není nakonfigurován. Kontaktujte administrátora." },
    { status: 500 }
  );
}
```

✅ Validace po auth checku (správná pozice — nejprve auth, pak env check)
✅ `console.error` s prefixem pro server log
✅ `status: 500` — správný HTTP kód pro server misconfiguration
✅ `error` klíč v response — shoduje se s tím co `handleCoverUpload` parsuje (`data.error`)
✅ User-friendly česká zpráva

---

## 3. TypeScript kompilace

```
npx tsc --noEmit → PASS (žádné chyby)
```

✅

---

## 4. Sharp fallback chain — netknutá

**Soubor:** `src/app/api/upload/photos/route.ts:69-91`

Původní fallback chain zachována beze změn:
1. `addWatermark(inputBuffer)` → WebP
2. catch → `sharp().jpeg()` → JPEG bez watermarku
3. catch → raw `inputBuffer` jako fallback

✅ `console.error` na r78 a r85 — netknuté
✅ Logika watermaku a konverze beze změny

---

## SOUHRN

| Kontrola | Výsledek |
|----------|----------|
| handleCoverUpload: try-catch-finally | ✅ |
| setError("") na začátku uploadu | ✅ |
| !res.ok parsuje server error | ✅ |
| !url → explicit throw | ✅ |
| catch → setError() user-friendly | ✅ |
| finally → setUploading(false) | ✅ |
| BLOB_READ_WRITE_TOKEN check | ✅ |
| Token check po auth, před zpracováním | ✅ |
| Server vrací { error: "..." } pro data.error parsing | ✅ |
| Sharp fallback chain netknutá | ✅ |
| TypeScript kompilace | ✅ PASS |

**Implementace kompletní a správná. Připraveno k deployi.**
