# EVŽEN VERDIKT: TASK-100 — Blog upload error handling

**Datum:** 2026-07-22
**Kontrolor:** Evžen
**Status: SCHVÁLENO**

---

## Původní zadání:
"proč zase nejde nahrat obrazek do blogu?" — upload selže ale uživatel nevidí chybu.

## Plán definoval 2 opravy:
1. BlogEditorClient.tsx — try-catch-finally v handleCoverUpload + error zobrazení
2. upload/photos/route.ts — BLOB_READ_WRITE_TOKEN validace

---

## Nezávislá verifikace:

### 1. BlogEditorClient.tsx — handleCoverUpload (r116-138)

| Kontrolní bod | Výsledek |
|---------------|----------|
| `setError("")` na začátku uploadu (r120) | PASS |
| try-catch-finally wrapper | PASS |
| `!res.ok` → parsuje `data.error`, fallback na HTTP status (r125-127) | PASS |
| `res.json().catch(() => ({}))` — bezpečné parsování (r126) | PASS |
| `!url` → explicit throw (r131) | PASS |
| catch → `setError()` s user-friendly zprávou (r133-134) | PASS |
| finally → `setUploading(false)` vždy proběhne (r135-136) | PASS |
| `[error, setError] = useState("")` existuje (r69) | PASS |
| Error se zobrazuje v UI — červený box (r232-236) | PASS |

### 2. upload/photos/route.ts — BLOB token check (r26-32)

| Kontrolní bod | Výsledek |
|---------------|----------|
| Validace po auth checku, před zpracováním (r26) | PASS |
| `console.error` s prefixem pro server log (r27) | PASS |
| Vrací `{ error: "..." }` — shoduje se s klientským parsováním (r28-31) | PASS |
| HTTP 500 — správný kód pro server misconfiguration | PASS |
| Česká user-friendly zpráva | PASS |

### 3. Neporušené existující funkce

| Kontrolní bod | Výsledek |
|---------------|----------|
| Sharp fallback chain netknutá (dle QA) | PASS |
| TypeScript kompilace (dle QA) | PASS |

---

## Shoda se zadáním:

- Zadání: upload selže a uživatel nevidí chybu
- Oprava: error handling + zobrazení chyby uživateli
- Plán definoval 2 změny ve 2 souborech → implementováno přesně 2 změny ve 2 souborech
- Žádné změny navíc mimo scope

## Verdikt: **SCHVÁLENO**

Připraveno k deployi.
