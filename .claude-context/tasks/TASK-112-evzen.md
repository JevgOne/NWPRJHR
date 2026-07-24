# EVŽEN VERDIKT: TASK-112 — Zásilkovna widget fix

**Datum:** 2026-07-22
**Kontrolor:** Evžen
**Status: SCHVÁLENO**

---

## Původní zadání:
Widget se neotevírá při výběru Zásilkovny v checkoutu.

## Plán identifikoval hlavní příčinu:
Race condition — `openWidget()` kontroluje `window.Packeta`, ale script ještě nedoběhl → okamžitý return bez otevření widgetu.

---

## Nezávislá verifikace (celý soubor PacketaWidget.tsx přečten):

### 1. Race condition fix (r52-104)

| Kontrolní bod | Výsledek |
|---------------|----------|
| Pokud `window.Packeta` dostupná → okamžitý `pickPoint()` (r75-78) | PASS |
| Pokud ne → `setLoading(true)` + hledá existující script (r81-82) | PASS |
| Nevytváří duplicitní script tag (r83-87) | PASS |
| `addEventListener("load", onLoad, { once: true })` — čeká na script (r94) | PASS |
| `addEventListener("error", onError, { once: true })` — CDN failure handling (r95) | PASS |
| `setTimeout(100)` fallback pro cached script (r98-103) | PASS |
| `removeEventListener` v setTimeout aby nedošlo k dvojímu volání (r100) | PASS |

### 2. Loading stav (r49, r81, r63, r111, r115, r117-118)

| Kontrolní bod | Výsledek |
|---------------|----------|
| `useState(false)` pro loading (r49) | PASS |
| `setLoading(true)` při čekání na script (r81) | PASS |
| `setLoading(false)` v `pickPoint()` před widgetem (r63) | PASS |
| Button `disabled={loading}` (r111) | PASS |
| `disabled:opacity-50 disabled:cursor-wait` třídy (r115) | PASS |
| "Načítání..." text v loading stavu (r118) | PASS |

### 3. Error handling (r50, r55, r57-60, r70-72, r90-93, r129)

| Kontrolní bod | Výsledek |
|---------------|----------|
| `useState("")` pro error (r50) | PASS |
| `setError("")` na začátku každého kliknutí (r55) | PASS |
| `!apiKey` → user-friendly error, ne jen console.error (r57-59) | PASS |
| `!window.Packeta` po load → user-friendly error (r70-72) | PASS |
| CDN error → `setLoading(false)` + `setError(...)` (r90-93) | PASS |
| Error zobrazen pod tlačítkem: `text-red-500` (r129) | PASS |

### 4. Ostatní

| Kontrolní bod | Výsledek |
|---------------|----------|
| Layout Script tag stále existuje (layout.tsx:32) | PASS |
| `useCallback` dependencies správné: `[apiKey, onSelect, language]` (r104) | PASS |
| TypeScript kompilace (dle QA) | PASS |
| Jen 1 soubor změněn — scope dodržen | PASS |

---

## Shoda se zadáním:

- Zadání: widget se neotevírá
- Příčina: race condition (script nenačtený při kliknutí)
- Oprava: `openWidget()` čeká na `load` event + loading/error UI stavy
- Plán definoval 3 problémy → všechny 3 opraveny v 1 souboru
- Žádné změny mimo scope

## Verdikt: **SCHVÁLENO**

Připraveno k deployi.
