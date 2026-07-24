# IMPL: TASK-100 — Blog upload error handling

## Status: DONE

## Změněné soubory (2)

### 1. src/app/(app)/posts/[id]/BlogEditorClient.tsx
- `handleCoverUpload` refaktorován s try-catch-finally
- `setError("")` na začátku uploadu (vyčistí předchozí chyby)
- `!res.ok` → parsuje error z response a throwne Error s popisem
- `!url` → throwne Error "Server nevrátil URL obrázku"
- catch blok → `setError()` s popisnou zprávou
- finally blok → `setUploading(false)` vždy proběhne (i při network error)

### 2. src/app/api/upload/photos/route.ts
- Přidána validace `BLOB_READ_WRITE_TOKEN` env variable po auth checku
- Pokud token chybí → vrací 500 s popisnou chybovou zprávou + console.error pro server log

## Validace
- TypeScript: `npx tsc --noEmit` — PASS
