# TASK-100: Blog — nahrávání obrázků nefunguje

**Priorita:** P1
**Stav:** čeká

## Popis problému
Nahrávání obrázků v blog editoru nefunguje.

## Analýza
- Blog editor: `src/app/(app)/posts/[id]/BlogEditorClient.tsx` (handleCoverUpload)
- Upload API: `src/app/api/upload/photos/route.ts` — @vercel/blob + sharp watermark
- Watermark: `src/lib/watermark.ts` — může selhat na Vercelu (sharp)

## Plán opravy
1. Ověřit BLOB token v env
2. Zkontrolovat error handling v upload API
3. Ověřit sharp kompatibilitu na Vercelu (serverless)
4. Testovat upload flow end-to-end
