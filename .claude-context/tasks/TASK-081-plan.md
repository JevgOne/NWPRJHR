# TASK-081: Nasadit nove Hairland logo + favicon

## Zdroj brand package
`/Users/zen/Desktop/vlasy k prodloužení/Hairland-BrandPackage/04_WEB_SVG/`

### Dostupne varianty:
- **horizontal/** — fullcolor (light/dark bg, transparent light/dark use) + mono (black/chocolate/white)
- **symbol/** — same set
- **vertical/** — same set
- **wordmark/** — same set (jen text bez symbolu)

### Barvy loga:
- Tmave hneda (text/artwork): `#382C2A`
- Ruzova (kruznice): `#C88A87`
- Bila: `#FFFFFF`

## Aktualni stav — kde se pouziva stare logo

### 1. Public navbar (PublicNavbar.tsx:181-193)
- **Inline SVG** — hand-coded kruh s "H" + text "HAIRLAND" + tagline
- Na light bg (bila navigace)
- Nahradit za: **horizontal-fullcolor-transparent-light-use.svg** (jako `<img>`)

### 2. Public footer (PublicFooter.tsx:22-29)
- `<Image src="/logo-dark.svg">` — na dark bg (espresso)
- Stary handmade SVG s kruhem+H+HAIRLAND+PREMIOVE VLASY
- Nahradit za: **horizontal-fullcolor-transparent-dark-use.svg**

### 3. Login page (login/page.tsx:14)
- `<img src="/seal-dark.svg">` — symbol na light bg
- Stary handmade SVG s kruhem+H+HAIRLAND
- Nahradit za: **symbol-fullcolor-transparent-light-use.svg**

### 4. Admin sidebar (AppShell.tsx:144)
- `<img src="/icons/icon-192x192.png">` + text "Hairland"
- Na dark bg (espresso sidebar)
- Nahradit za: **symbol-fullcolor-transparent-dark-use.svg** (misto PNG) nebo pouzit horizontal dark-use

### 5. Salon shell (SalonShell.tsx:36-37)
- Text-only `Hairland` — zadny obrazek
- Pridat: **horizontal-fullcolor-transparent-light-use.svg** (light bg)

### 6. Favicon + icons
Aktualni soubory:
- `public/favicon.ico` — 32x32 .ico
- `public/icon.svg` — SVG s "H" na tmavem rounded rect
- `public/icons/icon-192x192.png` — 192px PNG
- `public/icons/icon-512x512.png` — 512px PNG
- `public/apple-touch-icon.png` — Apple touch icon

Vsechny pouzivaji stary design (H na tmavem pozadi). Nahradit novym symbol logem.

### 7. Manifest (public/manifest.json)
Odkazuje na `/icons/icon-192x192.png` a `/icons/icon-512x512.png` — soubory se prepisou, cesty zustanou.

### 8. Structured data (JSON-LD)
- `page.tsx:92` — `logo: "https://www.hairland.cz/icons/icon-512x512.png"` — OK po prepisu PNG
- `page.tsx:137` — same
- `blog/[slug]/page.tsx:199` — `logo: { url: "https://www.hairland.cz/og-image.jpg" }` — og-image se NEMENI
- `poradna/[slug]/page.tsx:126` — same

### 9. Email template (email-templates.ts:25)
- `<img src="https://hairland.cz/og-image.jpg">` — pouziva og-image, NE logo. NEMENIT.

## Plan implementace

### Krok 1: Zkopirovat SVG do public/

Zkopirovat tyto soubory z brand package do `/public/`:

| Zdrojovy soubor | Cilova cesta | Pouziti |
|---|---|---|
| `horizontal/hairland-horizontal-fullcolor-transparent-light-use.svg` | `/public/logo-light.svg` | Navbar (light bg), Salon shell |
| `horizontal/hairland-horizontal-fullcolor-transparent-dark-use.svg` | `/public/logo-dark.svg` | Footer (dark bg) |
| `symbol/hairland-symbol-fullcolor-transparent-light-use.svg` | `/public/seal-light.svg` | Login (light bg) |
| `symbol/hairland-symbol-fullcolor-transparent-dark-use.svg` | `/public/seal-dark.svg` | Admin sidebar (dark bg) |
| `symbol/hairland-symbol-fullcolor-transparent-light-use.svg` | `/public/icon.svg` | Favicon SVG |

Toto **prepise** stare soubory (logo-light.svg, logo-dark.svg, seal-light.svg, seal-dark.svg, icon.svg) — nazvy zustanou, obsah se zmeni.

### Krok 2: Vygenerovat favicon a PNG icony

Z `symbol/hairland-symbol-fullcolor-light-background.svg` vygenerovat:

1. **`public/favicon.ico`** — 32x32 ICO (symbol na bilem pozadi)
2. **`public/icons/icon-192x192.png`** — 192x192 PNG
3. **`public/icons/icon-512x512.png`** — 512x512 PNG
4. **`public/apple-touch-icon.png`** — 180x180 PNG

Pouzit `sharp` (uz v dependencies) nebo externi nastroj (napr. `npx svgexport` nebo `npx svg2png`). Alternativne: rucne prekonvertovat.

**POZOR**: Favicon ICO format — moze byt potreba specialni nastroj (sharp nepodporuje ICO). Moznosti:
- Pouzit `png-to-ico` npm package
- Nebo ponechat favicon.ico a nahradit jen SVG icon v layout.tsx (moderni browsery preferuji SVG)
- Nebo pouzit online konvertor

### Krok 3: Upravit PublicNavbar.tsx

Nahradit inline SVG logo (radky 181-193) za `<img>` tag:

```tsx
<Link href="/" className="flex-shrink-0 flex items-center gap-2">
  <img
    src="/logo-light.svg"
    alt="Hairland"
    className="h-9 w-auto"
  />
</Link>
```

**Poznamka**: Tagline "PREMIOVE VLASY" je soucasti noveho loga (wordmark v SVG obsahuje stylizovany text), ALE nova horizontal varianta ma jen "HAIRLAND" text. Tagline bude mozna treba pridat rucne vedle — OVERIT co je v SVG.

Vlastne: nova horizontal SVG obsahuje: symbol (slozity artwork s "H") + circle (#C88A87) + wordmark "HAIRLAND". BEZ tagline. Pokud uzivatel chce tagline zachovat, bude treba pridat `<span>` pod logo.

### Krok 4: Upravit PublicFooter.tsx

Zmenit `src="/logo-dark.svg"` — soubor se uz prepise v kroku 1, takze staci overit ze rozmery seddi. Mozna bude treba upravit `width`/`height` atributy a `className`.

Soucasne: `width={160} height={52} className="h-9 w-auto"` — nove logo ma jiny aspect ratio (viewBox 2267.72 x 623.62 = cca 3.64:1). Stare logo melo viewBox 360 x 120 = 3:1. Takze `h-9` by melo fungovat, ale `width={160}` je treba prepocitat: pri h-9 (36px) × 3.64 = ~131px. Nastavit `width={131}`.

### Krok 5: Upravit login/page.tsx

`src="/seal-dark.svg"` — soubor se prepise v kroku 1. Soucasne: `className="w-24 h-24"` — overit ze symbol SVG se spravne renderuje v 96x96px ctverci. Symbol SVG ma viewBox `130 41.66 527.52 527.52` (ctverec), takze `w-24 h-24` bude fungovat.

**Ale pozor**: aktualni seal-dark.svg mel kruh na tmavem pozadi. Novy seal-light.svg (transparent-light-use) ma artwork v #382C2A na transparentnim pozadi — to je spravne pro light bg login stranky. ALE soubor se jmenuje `seal-dark.svg`! Prejmenovani neni nutne — staci prepsat obsah. Nebo lepe:

- `/public/seal-dark.svg` ← `symbol-fullcolor-transparent-dark-use.svg` (bile artwork, pro dark bg)
- `/public/seal-light.svg` ← `symbol-fullcolor-transparent-light-use.svg` (tmave artwork, pro light bg)

A na login page zmenit `src="/seal-dark.svg"` na `src="/seal-light.svg"` protoze login ma light bg (bg-nude-50).

### Krok 6: Upravit AppShell.tsx

Radek 144: `<img src="/icons/icon-192x192.png">` — po prepisu PNG v kroku 2 to bude automaticky nove logo. Ale lep by bylo pouzit SVG:

```tsx
<img src="/seal-dark.svg" alt="Hairland" className="w-8 h-8 rounded-lg" />
```

Sidebar ma tmave pozadi → pouzit seal-dark.svg (bile/svetle artwork). `rounded-lg` muze zustat pokud symbol vypada dobre s zakulacenymi rohy.

### Krok 7: Upravit SalonShell.tsx

Radek 36-37: Text-only "Hairland" nahradit za logo obrazek:

```tsx
<Link href="/salon" className="flex items-center gap-2">
  <img src="/logo-light.svg" alt="Hairland" className="h-7 w-auto" />
</Link>
```

### Krok 8: Aktualizovat layout.tsx icons (volitelne)

Radek 28: `{ url: "/icon.svg", type: "image/svg+xml" }` — soubor se prepise, cesta zustava. OK.
Radek 31: `{ url: "/icons/icon-192x192.png", sizes: "192x192" }` — soubor se prepise. OK.

Zadna zmena kodu nutna, jen prepis souboru.

## Soubory k uprave (presny poradi)

### A) Kopie souboru (Bash)
1. Zkopirovat 5 SVG z brand package do `/public/` (prepsat stare)
2. Vygenerovat PNG ikony (192, 512, apple-touch-icon) z symbol SVG
3. Vygenerovat favicon.ico z symbol SVG

### B) Editace kodu
1. **`src/components/public/PublicNavbar.tsx`** — nahradit inline SVG (radky 180-194) za `<img src="/logo-light.svg">`
2. **`src/components/public/PublicFooter.tsx`** — overit/upravit width/height atributy Image
3. **`src/app/login/page.tsx`** — zmenit `src="/seal-dark.svg"` na `src="/seal-light.svg"`
4. **`src/components/AppShell.tsx`** — zmenit PNG src na SVG `/seal-dark.svg`
5. **`src/components/SalonShell.tsx`** — pridat logo obrazek misto text-only

### C) Soubory co se NEMENIJI
- `public/manifest.json` — cesty zustavaji, soubory se prepisou
- `src/app/layout.tsx` — cesty zustavaji
- `src/lib/email-templates.ts` — pouziva og-image, ne logo
- OG image — dle zadani: uzivatel udela zvlast

## Dulezite poznamky

1. **Aspect ratio zmenil** — stare logo 3:1, nove ~3.64:1. Footer a navbar budou potrebovat maly adjustment width atributu.

2. **Tagline "PREMIOVE VLASY"** — stary navbar mel tagline pod logem jako `<span>`. Nove SVG logo neobsahuje tagline (jen "HAIRLAND"). Pokud uzivatel chce tagline zachovat, pridat `<span>` vedle loga. Doporucuji konzultovat s uzivatelem.

3. **Symbol logo je slozity artwork** — neni to jednoduchy "H" v kruhu. Je to stylizovany vlasovy motiv s pismenem H. Velikostne bude fungovat v 32px+ ale favicon.ico na 16px muze byt neostry — overit vizualne.

4. **SVG soubory maji `<?xml>` header** — pro pouziti v `<img>` to nevadi. Pro inline SVG by bylo treba odstranit.

5. **`preserveAspectRatio="xMidYMid meet"`** je v novych SVG — to je dobre, zajisti spravne skalovani.
