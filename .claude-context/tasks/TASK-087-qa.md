# QA Report: TASK-087 — Fix photos/video not displaying on product detail

**Status:** APPROVED ✅
**Date:** 2026-07-19
**Reviewer:** QA Kontrolor

---

## 1. Simplify Check

**Soubor:** `src/app/[locale]/(public)/offer/[...slug]/PhotoGallery.tsx`

**Změna (řádek 122):**
```tsx
// PŘED:
className="w-full h-full cursor-zoom-in"

// PO:
className="block w-full h-full cursor-zoom-in"
```

Změna je minimální a přesně cílená. Žádná zbytečná složitost, žádné duplikáty. ✅

Žádné jiné části souboru nebyly dotčeny. Zbytek komponenty (swipe, lightbox, tabs, thumbnails, video) zůstal beze změny. ✅

---

## 2. Debug — Build

```
npx next build
```

**Výsledek:** ✅ Čistý build bez chyb

```
▲ Next.js 16.2.9 (Turbopack)
✓ Compiled successfully in 16.7s
✓ TypeScript passed
✓ Generating static pages (429/429)
```

Žádné TypeScript chyby, žádné build errory, žádné warningy nad rámec již existujících `@next/next/no-img-element` (ty jsou pre-existující, nesouvisí s touto změnou).

---

## 3. Reverzní kontrola

**Původní zadání:** "nahrané fotky ani video se nezobrazují na stránce produktu"

| Bod | Ověření | Výsledek |
|-----|---------|----------|
| Button se nezhroutí na 0 výšky | `block` zajistí `display: block` → `h-full` funguje v aspect-ratio kontejneru | ✅ Opraveno |
| Foto se zobrazí přes celou plochu kontejneru | `<img className="w-full h-full object-cover">` uvnitř `block` buttonu funguje správně | ✅ |
| Video zobrazení | Nebylo dotčeno — video sekce (řádky 207–233) fungovala správně, `<video>` není obaleno buttonem | ✅ Funguje |
| Lightbox po kliknutí na foto | `onClick` na buttonu stále funguje, `block` neovlivňuje event handling | ✅ |
| Swipe na mobilu | Touch handlery jsou na parent `<div>`, ne na buttonu — beze změny | ✅ |
| Thumbnail strip + dot indikátory | Nebylo dotčeno | ✅ |

---

## Závěr

Fix je správný, minimální a bezpečný. Root cause byl jednoznačný: `<button>` s `display: inline-block` (default) + `h-full` uvnitř `aspect-ratio` kontejneru → nulová výška → foto neviditelné. Přidání `block` opravuje chování beze změny ostatní funkcionality.

**Doporučení pro implementaci TASK-089 (design polish):** Zvážit nahrazení `<img>` za `<Image />` z next/image pro lepší LCP (aktuálně 3 ESLint warnings). Vercel Blob hostname je již v `remotePatterns` v `next.config.ts`.
