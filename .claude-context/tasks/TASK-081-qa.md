# QA Report: TASK-081 — Logo + favicon nasazení

**Datum:** 2026-07-16
**Kontrolor:** Kontrolor agent
**Build status:** PASS (no errors, no warnings)

---

## 1. SVG soubory v /public/

| Soubor | Přítomen | Obsah | Správný fill |
|--------|----------|-------|--------------|
| `logo-light.svg` | PASS | viewBox 2267.72×623.62, aria-label "HAIRLAND horizontal logo" | fill="#382C2A" (tmavá na light bg) |
| `logo-dark.svg` | PASS | viewBox 2267.72×623.62, horizontal | fill="#FFFFFF" (bílá na dark bg) |
| `seal-light.svg` | PASS | viewBox 130 41.66 527.52 527.52, symbol | fill="#382C2A" (tmavá na light bg) |
| `seal-dark.svg` | PASS | viewBox symbol | fill="#FFFFFF" (bílá na dark bg) |
| `icon.svg` | PASS | symbol SVG | fill="#382C2A" |

Všechna SVG obsahují nový brand artwork (stylizované "H" s vlasovým motivem, nikoli starý hand-coded kruh).

## 2. PNG ikony a favicon

| Soubor | Rozměry | Formát |
|--------|---------|--------|
| `icons/icon-192x192.png` | 192×192 px | PNG RGBA 8-bit |
| `icons/icon-512x512.png` | 512×512 px | PNG RGBA 8-bit |
| `apple-touch-icon.png` | 180×180 px | PNG RGBA 8-bit |
| `favicon.ico` | 32×32 px | MS Windows ICO s PNG daty |

Všechny soubory jsou validní, správné rozměry dle plánu.

## 3. PublicNavbar.tsx

- Řádky 181-186: `<img src="/logo-light.svg" alt="Hairland" className="h-9 w-auto" />`
- Inline SVG nahrazen `<img>` odkazem na nový soubor. PASS.
- `eslint-disable-next-line` comment přítomen (správné pro `<img>` v Next.js). OK.

## 4. PublicFooter.tsx

- `<Image src="/logo-dark.svg" alt="Hairland" width={131} height={36} className="h-9 w-auto" />`
- Width upraven na 131 (správný přepočet pro nový aspect ratio ~3.64:1 při h=36px). PASS.
- logo-dark.svg má bílý fill — správné pro espresso dark bg footeru. PASS.

## 5. login/page.tsx

- `<img src="/seal-light.svg" ... className="w-24 h-24 mx-auto mb-2" />`
- Používá `seal-light.svg` (tmavý artwork na light bg) — správné pro světlé login pozadí. PASS.
- Plán požadoval změnu z `seal-dark.svg` na `seal-light.svg` — provedeno. PASS.

## 6. AppShell.tsx

- `<img src="/seal-dark.svg" alt="Hairland" className="w-8 h-8 rounded-lg" />`
- Nahrazen PNG `icon-192x192.png` za SVG `seal-dark.svg` — lepší kvalita, bílý artwork na tmavém sidebaru. PASS.

## 7. SalonShell.tsx

- `<img src="/logo-light.svg" alt="Hairland" className="h-7 w-auto" />`
- Logo přidáno místo text-only "Hairland". PASS.

## 8. Build

- `npx next build` — PASS, 0 errors, 0 warnings (mimo standardní Next.js ESLint noticky)
- TypeScript: PASS

---

## Reverzní kontrola — odpovídá zadání?

| Požadavek | Status | Poznámka |
|-----------|--------|----------|
| logo-light.svg v /public/ | PASS | Nový brand horizontal |
| logo-dark.svg v /public/ | PASS | Nový brand horizontal, bílé barvy |
| seal-light.svg v /public/ | PASS | Nový brand symbol |
| seal-dark.svg v /public/ | PASS | Nový brand symbol, bílé barvy |
| icon.svg v /public/ | PASS | Nový brand symbol |
| icon-192x192.png | PASS | 192×192 PNG |
| icon-512x512.png | PASS | 512×512 PNG |
| apple-touch-icon.png | PASS | 180×180 PNG |
| PublicNavbar — img místo inline SVG | PASS | logo-light.svg, h-9 |
| PublicFooter — správné rozměry | PASS | width=131 (přepočteno pro nový AR) |
| login/page.tsx — seal-light.svg | PASS | (bylo seal-dark.svg, opraveno) |
| AppShell.tsx — seal-dark.svg | PASS | (bylo PNG, nyní SVG) |
| SalonShell.tsx — logo obrázek | PASS | logo-light.svg přidáno |
| Build PASS | PASS | |

## Simplify — zbytečná složitost?

- Navbar: `<img>` s `h-9 w-auto` — minimální, přehledné. OK.
- Footer: Next.js `<Image>` s `width/height` — správné pro optimalizaci. OK.
- login/AppShell/SalonShell: `<img>` pro SVG (Next.js Image není nutný pro SVG bez optimalizace velikosti). OK.
- Žádná zbytečná složitost.

---

## Celkový verdikt

**TASK-081: APPROVED**

Všechny soubory nasazeny, všechny komponenty aktualizovány, build čistý. Žádné blocker issues.
