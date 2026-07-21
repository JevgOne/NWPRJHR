# Bug: Mobilní vyhledávání způsobuje horizontální scroll

**Task:** #99
**Datum:** 2026-07-21
**Priorita:** BUG

---

## Problém

Na mobilu (hairland.cz) — po otevření vyhledávání (klik na lupu) se stránka "hýbe doprava a doleva" = horizontální scroll celé stránky.

---

## Analýza

### Kde je search na mobilu

1. **Mobilní navbar** (`src/components/public/PublicNavbar.tsx`, ř. 352-358): Lupa ikona → otevře `SearchOverlay`
2. **SearchOverlay** (`src/components/public/SearchOverlay.tsx`): Fixed fullscreen overlay s search inputem
3. **ProductsShowcase** (`src/app/[locale]/(public)/offer/ProductsShowcase.tsx`, ř. 230-262): Search bar přímo na stránce `/offer`

### Root cause: iOS auto-zoom na inputech s font-size < 16px

**Hlavní příčina:** Na iOS Safari se automaticky zoomuje na input fokus pokud `font-size < 16px`. Po zoomu zůstane stránka odscrollovaná horizontálně.

**Kde jsou problematické inputy:**

| Soubor | Řádek | CSS třída | Font size | Problém? |
|--------|-------|-----------|-----------|----------|
| `SearchOverlay.tsx` | 141 | `text-sm` | 14px | **ANO** — focus triggers iOS zoom |
| `ProductsShowcase.tsx` | 241 | `text-sm` | 14px | **ANO** — focus triggers iOS zoom |

**Viewport meta** (`src/app/layout.tsx`, ř. 70-74):
```ts
export const viewport: Viewport = {
  themeColor: "#3a2c2a",
  width: "device-width",
  initialScale: 1,
  // CHYBÍ: maximumScale: 1 — iOS může zoomovat
};
```

**Body overflow** (`src/app/layout.tsx`, ř. 87):
```html
<body className="... overflow-x-hidden">
```
Body MÁ `overflow-x-hidden`, ale na iOS Safari to nefunguje spolehlivě. Browser stále dovolí horizontální scroll při auto-zoom.

### Sekundární příčina: SearchOverlay nezamyká body scroll

`SearchOverlay` je fixed overlay (`fixed inset-0 z-[60]`) ale **NEblokuje** scroll těla stránky pod ním. Na mobilu to znamená:
- Overlay je otevřený
- Uživatel může scrollovat stránku pod overlayem
- Po iOS auto-zoom na input → horizontální scroll pod overlayem

---

## Fix plán

### Fix 1: Zvětšit font-size inputů na 16px (HLAVNÍ — eliminuje iOS auto-zoom)

**Soubor:** `src/components/public/SearchOverlay.tsx` (ř. 141)

```tsx
// BYLO:
className="flex-1 text-sm text-ink bg-transparent outline-none placeholder:text-muted/50"

// NOVÉ:
className="flex-1 text-base text-ink bg-transparent outline-none placeholder:text-muted/50"
```

**Soubor:** `src/app/[locale]/(public)/offer/ProductsShowcase.tsx` (ř. 241)

```tsx
// BYLO:
className="w-full pl-10 pr-20 py-2.5 border border-line rounded-xl text-sm focus:ring-2 focus:ring-rose focus:border-rose"

// NOVÉ:
className="w-full pl-10 pr-20 py-2.5 border border-line rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-rose focus:border-rose"
```

**Vysvětlení:** `text-base` = 16px na mobilu (zabraňuje iOS auto-zoom), `sm:text-sm` = 14px na tabletu/desktopu (zachová design).

### Fix 2: Scroll lock při otevření SearchOverlay

**Soubor:** `src/components/public/SearchOverlay.tsx` (ř. 50-70, useEffect)

Přidat body scroll lock:

```tsx
// Přidat do existujícího useEffect nebo nový:
useEffect(() => {
  if (open) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
  return () => { document.body.style.overflow = ""; };
}, [open]);
```

**Alternativa (Tailwind-only):** Na containeru `fixed inset-0` přidat `overscroll-contain` pro prevenci scroll chaining.

### Fix 3: Viewport maximumScale (POJISTKA — kontroverzní)

**Soubor:** `src/app/layout.tsx` (ř. 70-74)

```ts
// BYLO:
export const viewport: Viewport = {
  themeColor: "#3a2c2a",
  width: "device-width",
  initialScale: 1,
};

// NOVÉ:
export const viewport: Viewport = {
  themeColor: "#3a2c2a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};
```

**POZNÁMKA:** `maximumScale: 1` zabrání uživateli pinch-to-zoom, což zhoršuje přístupnost. **NEDOPORUČUJI** pokud Fix 1 stačí. Použít jen jako krajní řešení.

---

## Doporučené pořadí

1. **Fix 1** — `text-base` na mobilních inputech (2 soubory, 2 řádky) — eliminuje root cause
2. **Fix 2** — body scroll lock v SearchOverlay (1 soubor, 5 řádků) — prevence scroll pod overlayem
3. **Fix 3** — VYNECHAT pokud Fix 1+2 stačí

## Soubory ke změně

| Soubor | Změna |
|--------|-------|
| `src/components/public/SearchOverlay.tsx` | `text-sm` → `text-base` (ř. 141) + body scroll lock |
| `src/app/[locale]/(public)/offer/ProductsShowcase.tsx` | `text-sm` → `text-base sm:text-sm` (ř. 241) |
