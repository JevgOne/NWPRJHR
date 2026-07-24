# QA: TASK-112 — Zásilkovna widget

**Datum:** 2026-07-22
**Kontrolor:** kontrolor
**Status: PASS — vše správně implementováno**

---

## 1. openWidget čeká na script load event

**Soubor:** `src/components/public/PacketaWidget.tsx:75-103`

```typescript
if (window.Packeta) {
  pickPoint();   // ← script již načten, spusť hned
  return;
}

// Script not loaded yet — wait for it
setLoading(true);
let script = document.querySelector('script[src*="packeta"]') as HTMLScriptElement | null;
if (!script) {
  script = document.createElement("script");
  script.src = "https://widget.packeta.com/www/js/library.js";
  document.head.appendChild(script);
}

const onLoad = () => { pickPoint(); };
script.addEventListener("load", onLoad, { once: true });
```

✅ Race condition fix správně implementován
✅ Pokud `window.Packeta` dostupná — okamžitý volání `pickPoint()`
✅ Pokud ne — `setLoading(true)` + čeká na `load` event
✅ Hledá existující script před vytvořením nového (duplikace skriptů vyloučena)
✅ `{ once: true }` — listener se sám odstraní po prvním spuštění

---

## 2. Loading stav

**Soubor:** `src/components/public/PacketaWidget.tsx:49, 81, 111-118`

```typescript
const [loading, setLoading] = useState(false);
// ...
setLoading(true);   // ← při čekání na script
// pickPoint():
setLoading(false);  // ← po načtení, před otevřením widgetu
```

Button:
```tsx
disabled={loading}
className="... disabled:opacity-50 disabled:cursor-wait"
// ...
{loading ? (
  <span className="text-muted">Načítání...</span>
) : ...}
```

✅ `loading` state přidán (`useState(false)`)
✅ Button `disabled={loading}` — nelze kliknout dvakrát
✅ `disabled:opacity-50 disabled:cursor-wait` — vizuální feedback
✅ Text "Načítání..." zobrazen místo normálního obsahu
✅ `setLoading(false)` v `pickPoint()` před voláním widgetu (r63)

---

## 3. Error handling — chyby viditelné uživateli

**Soubor:** `src/components/public/PacketaWidget.tsx:50, 55-59, 70-72, 129`

```typescript
const [error, setError] = useState("");
// ...
setError("");  // ← čistí předchozí chyby při každém kliknutí (r55)

// apiKey chybí:
setError("Widget není nakonfigurován");   // r58

// window.Packeta nedostupná po loadu:
setError("Widget se nepodařilo načíst. Zkuste to znovu.");  // r71

// Zobrazení:
{error && <p className="text-xs text-red-500 mt-1">{error}</p>}  // r129
```

✅ `error` state přidán (`useState("")`)
✅ `setError("")` na začátku každého kliknutí — čistí staré chyby
✅ `!apiKey` → user-friendly error (ne jen console.error)
✅ `!window.Packeta` po load → user-friendly error
✅ Error zobrazen pod tlačítkem (`text-red-500`)
✅ Žádný `console.error` bez uživatelsky viditelné chyby

---

## 4. Script error listener pro CDN failure

**Soubor:** `src/components/public/PacketaWidget.tsx:90-95`

```typescript
const onError = () => {
  setLoading(false);
  setError("Nepodařilo se načíst Zásilkovna widget");
};
script.addEventListener("error", onError, { once: true });
```

✅ `error` event listener přidán na script element
✅ `setLoading(false)` — loading stav se ukončí i při CDN failure
✅ `setError(...)` — uživatel vidí chybu
✅ `{ once: true }` — listener se sám odstraní

---

## 5. Bonus: setTimeout fallback pro cached script

**Soubor:** `src/components/public/PacketaWidget.tsx:98-103`

```typescript
setTimeout(() => {
  if (window.Packeta) {
    script?.removeEventListener("load", onLoad);
    pickPoint();
  }
}, 100);
```

✅ Fallback pro případ kdy je script cached a `load` event se již nefiruje
✅ Odstraní `onLoad` listener aby nedošlo k dvojímu volání
✅ 100ms — dostatečné pro microtask queue bez zbytečného čekání

---

## 6. apiKey validace přesunuta na začátek

**Soubor:** `src/components/public/PacketaWidget.tsx:57-60`

```typescript
if (!apiKey) {
  setError("Widget není nakonfigurován");
  return;
}
```

✅ Validace před jakýmkoliv DOM manipulation nebo network requestem

---

## 7. TypeScript kompilace

```
npx tsc --noEmit → PASS (žádné chyby)
```

✅

---

## SOUHRN

| Kontrola | Výsledek |
|----------|----------|
| openWidget čeká na load event | ✅ |
| Neduplikuje script tagy | ✅ |
| { once: true } na listenery | ✅ |
| loading state + disabled button | ✅ |
| disabled:opacity-50 + cursor-wait | ✅ |
| "Načítání..." text v buttonu | ✅ |
| setError() místo jen console.error | ✅ |
| setError("") čistí na začátku | ✅ |
| error listener na CDN failure | ✅ |
| setTimeout fallback pro cached script | ✅ |
| apiKey check na začátku | ✅ |
| TypeScript kompilace | ✅ PASS |

**Implementace kompletní a správná. Race condition opravena, UX error stavy pokryty. Připraveno k deployi.**
