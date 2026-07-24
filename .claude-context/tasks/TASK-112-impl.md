# IMPL: TASK-112 — Zásilkovna widget fix

## Status: DONE

## Změněný soubor (1)

### src/components/public/PacketaWidget.tsx
- **Race condition fix:** `openWidget()` refaktorován — pokud `window.Packeta` není dostupná, čeká na `load` event scriptu místo okamžitého returnu
- **Loading stav:** přidán `useState(false)` — tlačítko je disabled s textem "Načítání..." během načítání scriptu
- **Error handling:** přidán `useState("")` — chyby se zobrazují uživateli pod tlačítkem (červený text) místo jen console.error
- **Script error handling:** přidán `error` event listener na script element — zobrazí chybu pokud se script nepodaří načíst
- **Fallback:** setTimeout(100ms) check pro případ kdy je script cached a load event se už nefiruje
- **apiKey validace:** přesunuta na začátek funkce (před window.Packeta check)

## Detaily změn
- Import: přidán `useState`
- Nové state: `loading`, `error`
- `openWidget`: kompletní refaktor s `pickPoint()` helper funkcí
- Button: přidány `disabled` a `disabled:opacity-50 disabled:cursor-wait` třídy
- Nový loading text stav v button
- Error message: `<p className="text-xs text-red-500 mt-1">`

## Validace
- TypeScript: `npx tsc --noEmit` — PASS
