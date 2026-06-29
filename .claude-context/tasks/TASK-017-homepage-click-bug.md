# TASK #17 — BUG: Homepage karty nejdou rozkliknout na detail produktu

**Datum:** 2026-06-28
**Agent:** planovac

---

## VERDIKT: KOD JE SPRAVNY — BUG NENI V KODU

---

## ANALYZA

### 1. ProductCard.tsx — Non-interactive mode (lines 250-261)

Kdyz `onCategoryClick` NENI predany (homepage), karta se renderuje jako:

```tsx
<Link href={href} className="block bg-white rounded-xl border ...">
  {imageBlock}
  {infoBlock}
</Link>
```

Cela karta je `<Link>` — kliknutelna od rohu k rohu. `href` = `/offer/${p.slug ?? p.id}?color=${v.color}&length=${v.lengthCm}`.

### 2. HeroProductSlider.tsx — Pouziti (lines 61-67)

```tsx
<ProductCard
  key={`${p.id}-${v.lengthCm}-${v.color}`}
  product={p}
  variant={v}
/>
```

**BEZ `onCategoryClick`** → `isInteractive = false` → staticka karta → cela je `<Link>`.

### 3. Vnorene linky — NENI problem

V non-interactive mode:
- Category badge je `<span>` (line 121), NE `<button>` — OK
- Origin/texture badges jsou `<span>` (lines 146, 165) — OK
- Product name je `<h3>` BEZ `<Link>` (line 200) — OK
- Zadna vnorena `<a>` uvnitr parent `<Link>` — OK

### 4. API endpoint `/api/public/products` — EXISTUJE a vraci data

- `src/app/api/public/products/route.ts` — vraceni `slug`, `id`, varianty se stock
- Detail stranka `src/app/(public)/offer/[slug]/page.tsx` — existuje, hleda slug NEBO id

### 5. Cilova stranka — EXISTUJE

`/offer/[slug]` page.tsx:
- Nejdriv hleda podle slug
- Fallback na id (pro stare URL)
- Pokud najde id a ma slug, presmerovava na slug URL

---

## MOZNE PRICINY (MIMO KOD)

### Hypoteza A: STARA VERZE NA PRODUKCI (NEJPRAVDEPODOBNEJSI)

Pred Task #9 pouzivala homepage `HeroProductSlider.tsx` vlastni inline `VariantCard` funkci, NE sdileny `<ProductCard>`. Je mozne, ze aktualni produkce MA STAROU VERZI bez `<Link>` wrapperu.

**Overeni:** Zkontrolovat zda posledni deploy zahrnuje zmeny z Task #9.

### Hypoteza B: CSS/Z-INDEX PREKRYVANI

Category badge `<span>` s `absolute top-2 left-2` by mohl teoreticky blokovat klik, ale:
- Badge je uvnitr `<Link>`, takze klik na badge = klik na Link
- Badge nema zadny onClick handler v non-interactive mode
- `pointer-events` neni nikde nastaven na `none`

**Verdict:** NEPRAVDEPODOBNE.

### Hypoteza C: JAVASCRIPT ERROR PRI HYDRATION

Pokud klient-side hydration selze (napr. kvuli chybe v `useEffect` fetch), React muze "odpojit" event listenery. Ale `<Link>` je server-side `<a>` tag — funguje i bez JS.

**Verdict:** NEPRAVDEPODOBNE pro `<Link>`.

---

## DOPORUCENI

1. **OVERIT DEPLOY** — Zkontrolovat zda je na produkci nasazena verze se sdilenym `ProductCard.tsx` (Task #9)
2. **TESTOVAT LOKALNE** — Spustit `npm run dev` a overit klikatelnost na homepage
3. **BROWSER DEVTOOLS** — Zkontrolovat v produkci zda je karta `<a>` tag a ne `<div>`

---

## ZAVER

Kod v `ProductCard.tsx` a `HeroProductSlider.tsx` je **SPRAVNY**. Non-interactive karta je korektne zabalena do `<Link>` (= `<a>` tag). Zadny vnoreny odkaz, zadny z-index problem, zadny chybejici handler.

Nejpravdepodobnejsi pricina: **produkce nema nasazenou nejnovejsi verzi kodu** (pred Task #9 karty pouzivaly inline `VariantCard` ktera MOHLA mit chybejici Link wrapper).
