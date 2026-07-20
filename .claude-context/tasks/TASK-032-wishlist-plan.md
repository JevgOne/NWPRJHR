# TASK-032: "Přidat do oblíbených" — placeholder nebo funkční?

**Status:** Analýza hotová
**Autor:** Plánovač
**Datum:** 2026-07-15

---

## Verdikt: PLNĚ FUNKČNÍ — není placeholder

Wishlist je **kompletně implementovaný** s localStorage persistencí. Funguje bez serveru, bez přihlášení.

---

## Kde wishlist existuje (6 touchpointů)

| # | Místo | Soubor | Jak |
|---|-------|--------|-----|
| 1 | Product card (grid) | `src/components/public/ProductGridCard.tsx:159-169` | Heart ikona vpravo nahoře, `toggleWishlist(slug)` |
| 2 | Product detail | `src/components/public/WishlistToggle.tsx` | Heart button + text "Přidat/Odebrat z oblíbených" |
| 3 | Navbar (desktop) | `src/components/public/PublicNavbar.tsx:252-261` | Heart ikona s count badge, link na `/wishlist` |
| 4 | Navbar (mobile) | `src/components/public/PublicNavbar.tsx:341-347` | Heart ikona v mobile menu |
| 5 | Wishlist stránka | `src/app/[locale]/(public)/wishlist/WishlistClient.tsx` | Full page: grid produktů, empty state, "vymazat vše" |
| 6 | Layout wrapper | `src/app/[locale]/(public)/layout.tsx:17-28` | `WishlistProvider` wraps all public pages |

---

## Jak to funguje

### Technická implementace (`src/lib/wishlist.tsx`)

- **Storage:** `localStorage` klíč `hairland_wishlist`
- **Data:** Array slugů (string[]), max 50 položek
- **Context API:** `WishlistProvider` → `useWishlist()` hook
- **Metody:** `toggle(slug)`, `remove(slug)`, `clear()`, `isInWishlist(slug)`, `count`
- **Persistence:** Přežije refresh stránky (localStorage), ale NE:
  - Jiný prohlížeč
  - Incognito/private mode (po zavření)
  - Vymazání dat prohlížeče
  - Jiné zařízení

### Wishlist stránka (`/wishlist`)

- Fetchuje produkty přes `/api/public/products?slugs=slug1,slug2,...`
- Zobrazuje `ProductGridCard` pro každý produkt
- Empty state: heart ikona + "Prozkoumejte naše produkty" odkaz
- "Vymazat vše" tlačítko
- `noindex` meta tag (správně — interní stránka)

---

## Proč by uživatel mohl myslet že nefunguje

1. **Žádná zpětná vazba po kliknutí** — heart se vyplní, ale není toast/notifikace "Přidáno do oblíbených"
2. **Nevšiml si navbar ikony** — heart v navbar je malá, count badge může být přehlédnutelný
3. **Očekával server-side** — po přihlášení do admin panelu wishlist zmizí (localStorage je per-domain ale admin může být jiný kontext)
4. **Smazal cookies/data** — wishlist zmizí

---

## Doporučení

### Varianta A: Nechat jak je (DOPORUČENO)

Wishlist funguje správně pro public e-shop. localStorage je standardní přístup pro e-shopy bez povinného přihlášení. Žádný fix není potřeba — feature je kompletní.

### Varianta B: Přidat toast notifikaci (NICE-TO-HAVE)

Po kliknutí na heart zobrazit krátký toast "Přidáno do oblíbených" / "Odebráno z oblíbených". Zlepší UX feedback.

Soubory k úpravě:
- `src/lib/wishlist.tsx` — přidat toast callback
- Nebo `src/components/public/ProductGridCard.tsx:159-169` — přidat toast po toggle

### Varianta C: Odstranit (pokud user nechce wishlist)

Pokud user explicitně řekne že wishlist nechce, odstranit:
- `src/lib/wishlist.tsx`
- `src/components/public/WishlistToggle.tsx`
- `src/app/[locale]/(public)/wishlist/` (celý adresář)
- Heart ikony z `ProductGridCard.tsx` a `PublicNavbar.tsx`
- `WishlistProvider` z `layout.tsx`

---

## Shrnutí

**"Přidat do oblíbených" NENÍ placeholder.** Je to plně funkční localStorage wishlist s 6 touchpointy v UI. Funguje správně. Pokud user tvrdí že nefunguje, pravděpodobně neví kde najít uložené položky (navbar heart ikona → `/wishlist` stránka) nebo očekával server-side persistenci.
