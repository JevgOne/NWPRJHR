# QA Report — Task #33: Upload parallelization (commit 18576ee)

**Datum:** 2026-07-15  
**Výsledek: PASS (1 minor finding)**

---

## Ověření změn v media/route.ts

### maxDuration=30 — PASS
```ts
export const maxDuration = 30;  // řádek 8 ✅
```

### Validace souborů PŘED zpracováním — PASS
Fáze 1: `for` loop přes všechny soubory — validuje typ, velikost, počet fotek.
```ts
// 1. Validate all files before processing
let photoCount = 0;
for (const file of files) {
  // ... type check → return 400 při chybě
  // ... size check → return 400 při chybě
  if (isPhoto) photoCount++;
}
if (existingPhotos.length + photoCount > 6) → return 400
```
Všechny soubory validovány dříve než začne zpracování. ✅

### Promise.all místo for loop — PASS
```ts
// 2. Process all files in parallel
const uploads = files.map(async (file) => { ... });
try {
  results = await Promise.all(uploads);
} catch (e) {
  return NextResponse.json({ error: ... }, { status: 500 });
}
```
For loop → Promise.all. ✅

### Try/catch kolem Promise.all — PASS
```ts
try {
  results = await Promise.all(uploads);
} catch (e) {
  return NextResponse.json(
    { error: e instanceof Error ? e.message : "Upload failed" },
    { status: 500 }
  );
}
```
✅

### DB update jednou na konci — PASS
```ts
const allPhotos = [...existingPhotos, ...newPhotoUrls];
const updated = await prisma.product.update({ ... });  // jednou, po Promise.all
```
✅

### Watermark fallback — zlepšeno oproti předchozí verzi
Nový double-fallback:
1. `addWatermark()` → WebP
2. catch → `sharp().jpeg()` → JPEG (nový pokus bez watermarku)
3. catch → original buffer s `application/octet-stream`

Robustnější než předchozí verze. ✅

---

## Minor finding

`revalidateTag("products", "max")` — druhý argument stále přítomen (řádek na konci souboru). Next.js `revalidateTag` přijímá jen 1 string. Jde o kosmetickou chybu bez funkčního dopadu (tag "products" se invaliduje správně, "max" se ignoruje). TypeScript to nepřeloží jako error kvůli loose typing. Nízká priorita.

---

## TypeScript: 0 chyb ✅
