# PLAN: TASK-112 — Zásilkovna (Packeta) widget nefunguje

## Kontext

Uzivatel: "widget se neotevira pri vyberu Zasilkovny v checkoutu"

Checkout flow:
1. Uzivatel vybere "Zásilkovna" jako shipping method
2. Zobrazi se PacketaWidget s tlacitkem "Vybrat pobocku"
3. Klik na tlacitko → mel by otevrit Packeta widget popup/modal
4. **Widget se neotvira**

---

## Analyza kodu

### Architektura

```
public/layout.tsx (radek 31-34)
  → <Script src="https://widget.packeta.com/www/js/library.js" strategy="afterInteractive" />

CheckoutClient.tsx (radek 610-621)
  → {form.shippingMethod === "PACKETA" && <PacketaWidget ... />}

PacketaWidget.tsx (radek 46-107)
  → apiKey = process.env.NEXT_PUBLIC_PACKETA_API_KEY  // "2bed6e6598041af2"
  → openWidget():
     1. Zkontroluje window.Packeta
     2. Pokud neexistuje → dynamicky nacte script + console.error
     3. Zkontroluje apiKey
     4. Zavola window.Packeta.Widget.pick(apiKey, callback, options)
```

### NALEZENE PROBLEMY

#### PROBLEM 1: Race condition — script neni nacten kdyz uzivatel klikne (CRITICAL)

**Soubor:** `src/components/public/PacketaWidget.tsx:50-69`

```typescript
const openWidget = useCallback((e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  if (!window.Packeta) {                          // ← widget script jeste neni nacten
    const script = document.querySelector('script[src*="packeta"]');
    if (!script) {
      const s = document.createElement("script");
      s.src = "https://widget.packeta.com/www/js/library.js";
      s.onload = () => {                           // ← callback po nacteni
        if (window.Packeta && apiKey) {
          window.Packeta.Widget.pick(apiKey, (point) => { if (point) onSelect(point); }, { country: "cz", language });
        }
      };
      document.head.appendChild(s);
    }
    console.error("Packeta Widget library not loaded yet");    // ← vzdy se logne error
    return;                                        // ← RETURN — widget se NEOTVIRA
  }
  // ... normalni flow
}, [...]);
```

**Scenar:**
1. Layout nacte `<Script strategy="afterInteractive" />` — to znamena ze script se nacita AZ PO hydrataci, coz muze byt az nekdy.
2. Uzivatel prijde na checkout → rychle vybere Zasilkovnu → klikne "Vybrat pobocku"
3. `window.Packeta` JESTE neexistuje
4. Kod zjisti ze `script` element existuje (protoze Next.js Script ho uz pridal do DOM) → skip dynamickeho nacteni
5. Logne error → **return bez otevreni widgetu**
6. Uzivatel klikne znovu — pokud script uz mezitim dobehl → funguje. Pokud ne → opet nic.

**HLAVNI BUG:** Kdyz `<script>` element existuje ale jeste nedokoncil nacteni, kod NEceka na jeho `onload` a rovnou vraci error.

**FIX:**

```typescript
const openWidget = useCallback((e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  if (!apiKey) {
    console.error("NEXT_PUBLIC_PACKETA_API_KEY not configured");
    return;
  }

  const tryOpen = () => {
    if (window.Packeta) {
      window.Packeta.Widget.pick(
        apiKey,
        (point) => { if (point) onSelect(point); },
        { country: "cz", language }
      );
    }
  };

  if (window.Packeta) {
    tryOpen();
    return;
  }

  // Widget not loaded yet — ensure script is loading and wait for it
  let script = document.querySelector('script[src*="packeta"]') as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.src = "https://widget.packeta.com/www/js/library.js";
    document.head.appendChild(script);
  }
  // Wait for script to load, then open widget
  script.addEventListener("load", tryOpen, { once: true });
  // If script already loaded but Packeta not defined (edge case)
  if (script.dataset.loaded) tryOpen();
}, [apiKey, onSelect, language]);
```

**Obtiznost:** Stredni — ~20 radku refaktor

---

#### PROBLEM 2: Chybejici UI feedback pri cekani na widget (MEDIUM)

**Soubor:** `src/components/public/PacketaWidget.tsx:86-106`

Kdyz uzivatel klikne a widget se nacita, neni zadna vizualni indikace ze se neco deje. Tlacitko nevykazuje stav "loading".

**FIX:** Pridat loading stav:

```typescript
const [loading, setLoading] = useState(false);

// V openWidget:
setLoading(true);
script.addEventListener("load", () => {
  tryOpen();
  setLoading(false);
}, { once: true });

// V JSX:
<button ... disabled={loading}>
  {loading ? "Načítání..." : selectedPoint ? ... : ...}
</button>
```

**Obtiznost:** Jednoducha — 5 radku

---

#### PROBLEM 3: console.error misto user-visible chyby (LOW)

**Soubor:** `src/components/public/PacketaWidget.tsx:67-68, 71-72`

Oba error stavy (`"not loaded yet"` a `"not configured"`) pouzivaji `console.error` — uzivatel nevi co se stalo.

**FIX:** Zobrazit inline chybu pod tlacitkem:

```typescript
const [error, setError] = useState("");

// Pri chybe:
setError("Widget se nepodařilo načíst. Zkuste to znovu.");

// V JSX:
{error && <p className="text-xs text-red-500 mt-1">{error}</p>}
```

**Obtiznost:** Jednoducha — 5 radku

---

#### PROBLEM 4: Script `strategy="afterInteractive"` muze byt prilis pozdni (INFO)

**Soubor:** `src/app/[locale]/(public)/layout.tsx:31-34`

```typescript
<Script
  src="https://widget.packeta.com/www/js/library.js"
  strategy="afterInteractive"
/>
```

`afterInteractive` = Next.js nacte script AZ PO hydrataci stranky. Na pomalych siti/zarizeni to muze trvat sekundy.

**ALTERNATIVY:**
- `strategy="lazyOnload"` — jeste horsi, nacte se az po loadu
- `strategy="afterInteractive"` — aktualni, prijatelne
- `strategy="beforeInteractive"` — blokujici, nechceme pro kazdy page load

**DOPORUCENI:** `afterInteractive` je spravna strategie. Problem neni v tom KDY se script nacita, ale v tom ze `openWidget` NEMCEKA na dokonceni nacteni (viz Problem 1).

---

## SHRNUTY — PRIORITIZOVANE OPRAVY

| # | Problem | Dopad | Obtiznost | Priorita |
|---|---------|-------|-----------|----------|
| 1 | Race condition — openWidget neceká na script load | Widget se neotvira | Stredni | P0 |
| 2 | Chybi loading stav na tlacitku | UX | Jednoducha | P1 |
| 3 | Chyby v console misto UI | UX | Jednoducha | P1 |

---

## SOUBORY K UPRAVE

| # | Soubor | Zmena |
|---|--------|-------|
| 1 | `src/components/public/PacketaWidget.tsx:50-84` | Refaktorovat openWidget — cekat na script load |
| 2 | `src/components/public/PacketaWidget.tsx:86-106` | Pridat loading/error stavy do UI |

**Celkem: 1 soubor, ~30 radku zmeny**

---

## KOMPLETNI NAVRZENY KOD

```typescript
"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";

// ... declare global, interfaces zustava ...

export function PacketaWidget({ onSelect, selectedPoint, language = "cs" }: Props) {
  const t = useTranslations("public.inquiry");
  const apiKey = process.env.NEXT_PUBLIC_PACKETA_API_KEY;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openWidget = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");

    if (!apiKey) {
      setError("Widget není nakonfigurován");
      return;
    }

    const pickPoint = () => {
      setLoading(false);
      if (window.Packeta) {
        window.Packeta.Widget.pick(
          apiKey,
          (point) => { if (point) onSelect(point); },
          { country: "cz", language }
        );
      } else {
        setError("Widget se nepodařilo načíst. Zkuste to znovu.");
      }
    };

    if (window.Packeta) {
      pickPoint();
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
    const onError = () => {
      setLoading(false);
      setError("Nepodařilo se načíst Zásilkovna widget");
    };
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });

    // If script already loaded (e.g. cached), check after microtask
    setTimeout(() => {
      if (window.Packeta) {
        script?.removeEventListener("load", onLoad);
        pickPoint();
      }
    }, 100);
  }, [apiKey, onSelect, language]);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={openWidget}
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-dashed border-line rounded-lg
                   text-sm text-ink hover:border-rose hover:bg-rose/5
                   transition-colors flex items-center justify-center gap-2
                   disabled:opacity-50 disabled:cursor-wait"
      >
        {loading ? (
          <span className="text-muted">Načítání...</span>
        ) : selectedPoint ? (
          <span>
            <span className="font-medium">{selectedPoint.name}</span>
            <span className="text-muted ml-1">({selectedPoint.city})</span>
            <span className="text-xs text-rose ml-2">{t("packetaChange")}</span>
          </span>
        ) : (
          <span>{t("packetaSelect")}</span>
        )}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
```

---

## PORADI IMPLEMENTACE

1. Prepsat `PacketaWidget.tsx` podle navrhu — vyresit race condition, pridat loading/error stavy

---

## VERIFIKACE

1. Otevrit checkout → vybrat Zasilkovnu → ihned kliknout "Vybrat pobocku" → widget se musi otevrit (nebo ukazat loading a pak otevrit)
2. Block network request na `widget.packeta.com` (DevTools) → overit ze se zobrazi chybova zprava
3. Kliknout dvakrat rychle za sebou → nesmí se otevrit 2 widgety
4. Na pomale siti (throttle 3G) → overit ze loading stav se zobrazi a widget se otevre po nacteni

---

## RIZIKA

- **Nizke** — zmena je v 1 client komponentu, nemeni server logiku
- Script z `widget.packeta.com` je CDN — nemeni se casto
- setTimeout(100) fallback je bezpecny — pokud Packeta neni dostupna do 100ms, pouzije se `load` event listener
