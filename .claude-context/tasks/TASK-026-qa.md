# QA Report: Task #26 — Full E2E Audit

**Datum:** 2026-06-27
**Kontrolor:** KONTROLOR agent
**Build:** ✓ Compiled (120/120 stránek), 0 TS errors

---

## BLOCKER / KRITICKÉ CHYBY

### ❌ B1 — Salon catalog: CHYBÍ tlačítko "Přidat do objednávky"
**Soubor:** `src/app/(salon)/salon/catalog/CatalogClient.tsx`

Katalog ukazuje produkty a ceny, ale salon NEMŮŽE vytvořit objednávku z katalogu. Neexistuje žádné UI pro přidání položky do košíku/objednávky. `/salon/orders` stránka pouze zobrazuje existující objednávky. Salon portál nemá formulář pro **vytvoření nové objednávky**.

API `POST /api/orders` existuje a funguje, ale žádná stránka v `(salon)` ho nevolá. Salon neví, jak objednat.

**Dopad:** Klíčový B2B workflow "salon si objedná vlasy" je nefunkční.

---

### ❌ B2 — Inquiry form: "Internal error" — chybí tabulka v Turso DB
**Soubory:** `src/app/api/public/inquiry/route.ts`, `prisma/schema.prisma`

Task #1 — popsáno v předchozích reportech. Schema má `Inquiry` model (`@@map("inquiries")`), ale tabulka neexistuje v Turso runtime DB. Každý submit inquiry formy vrací 500 Internal Error.

---

### ❌ B3 — `/vykup` stránka: "Kc" místo "Kč"
**Soubor:** `src/app/(public)/vykup/page.tsx:136-138`

```tsx
<td>{row.blonde} Kc</td>  // ❌ mělo by být "Kč"
<td>{row.brown} Kc</td>
<td>{row.dark} Kc</td>
```

Cenová tabulka výkupu zobrazuje "Kc" (chybí háček). Viditelný typografický bug na veřejné stránce.

---

### ❌ B4 — Contact page: chybí telefonní číslo
**Soubor:** `src/app/(public)/contact/page.tsx`

Task #4 (Store phone +420 728 729 666) stále není implementován. Kontaktní stránka zobrazuje pouze email `info@hairland.cz`. Telefon není nikde na webu.

---

## STŘEDNÍ PROBLÉMY

### ⚠️ M1 — CatalogClient: Sloupec "-" jako header
**Soubor:** `src/app/(salon)/salon/catalog/CatalogClient.tsx:85`

```tsx
<th className="py-1 pr-2">-</th>  // ❌ placeholder text
```
Hlavička tabulky variant zobrazuje "-" místo smysluplného labelu (např. "Varianta" nebo "Délka / Barva").

**Totéž v OrderDetailClient:**
```tsx
<th className="py-1 pr-2">-</th>  // src/app/(app)/orders/[id]/OrderDetailClient.tsx:108
```

### ⚠️ M2 — SalonInvoicesClient: empty state je "-"
**Soubor:** `src/app/(salon)/salon/invoices/SalonInvoicesClient.tsx:49`

```tsx
<p className="text-gray-500 text-center py-8">-</p>  // ❌ placeholder
```
Prázdný stav faktur zobrazuje jen pomlčku místo smysluplné zprávy.

### ⚠️ M3 — Salon nemá přístup k objednávkám přes správný portál
**Soubory:** `src/app/(salon)/salon/orders/page.tsx`

Salon orders stránka reuse `OrdersClient` z admin panelu. Funguje pro zobrazení, ale:
- Header sloupce se podmíněně schovává (`role !== "SALON"`) ale salon vidí sloupec `{o.salon.name}` přesto — pro svou vlastní objednávku to je redundantní
- Salon nemůže objednávku zrušit (cancel button `doAction("cancel")` existuje, ale salon nemá přístup k PATCH `/api/orders/[id]` — chybí auth check pro SALON roli v cancel akci)

### ⚠️ M4 — Dashboard: odkaz "Čekající registrace" vede na /salons, ne /registrations
**Soubor:** `src/app/(app)/dashboard/page.tsx:291`

```tsx
<a href="/salons"><QuickBadge label={t("pendingRegistrations")} .../></a>
```
Badge "Čekající registrace" vede na `/salons`, ale existuje nová stránka `/registrations`. Uživatel musí ručně vybrat tab "Čekající".

### ⚠️ M5 — Notification bell: neaktualizuje se po přečtení notifikace
**Soubor:** `src/components/NotificationBell.tsx` + `src/components/AppShell.tsx`

AppShell poll notifikace každých 30s. NotificationBell je samostatný komponent. Po kliknutí "Označit jako přečtené" v `/notifications` se číslo v AppShell neaktualizuje okamžitě — jen při příštím poll (max 30s zpoždění).

### ⚠️ M6 — CatalogClient vrací produkty bez fotek
**Soubor:** `src/app/api/salon-portal/catalog/route.ts:78-88`

API response NEOBSAHUJE pole `photos`. CatalogClient interface nemá `photos`. Katalog zobrazuje jen textovou tabulku bez vizuálního náhledu produktů.

---

## NÍZKÁ PRIORITA / KOSMETIKA

### ⚠️ L1 — OrdersClient: "Vše" label je tCommon("search")
**Soubor:** `src/app/(app)/orders/OrdersClient.tsx:91`

```tsx
{s === "" ? tCommon("search") : ...}
```
Tab pro "Všechny objednávky" zobrazuje překlad "Hledat" (search) místo "Vše" (all). Použít `tCommon("all")`.

### ⚠️ L2 — OrdersClient: redundantní salon sloupec při empty hide
```tsx
<th>{role !== "SALON" ... ? t("salon") : ""}</th>  // header je prázdný
<td>{o.salon.name}</td>  // ale data se zobrazí vždy
```
Header sloupce se schovává pro SALON roli ale `<td>` se salon názvem zobrazuje vždy.

### ⚠️ L3 — Poradna stránka bez obsahu
**Soubor:** `src/app/(public)/poradna/page.tsx`
Poradna zobrazuje seznam článků z DB. Pokud jsou 0 článků, zobrazí se prázdná stránka bez informačního obsahu — žádný fallback text.

### ⚠️ L4 — SalonShell: aktivní link — highlight nevýrazný
**Soubor:** `src/components/SalonShell.tsx:41`

Aktivní nav item má `bg-rose/10 text-espresso` — velmi světlý, téměř neviditelný. Použít `bg-rose text-white` jako v AppShell pro konzistenci.

### ⚠️ L5 — Export filenames: "hairora" místo "hairland"
**Soubory:** `src/app/api/export/excel/route.ts:43,52`, `src/app/api/export/pohoda/route.ts:40`

Download filenames stále říkají `hairora-export-...` a `hairora-pohoda-...`. Brand je Hairland.

### ⚠️ L6 — CookieBanner: klíč "hairora_cookie_consent"
**Soubor:** `src/components/CookieBanner.tsx:6`

`const CONSENT_KEY = "hairora_cookie_consent"` — interní klíč, neviditelný pro uživatele, ale konzistentní brand by měl být "hairland".

---

## AUDIT KAŽDÉ SEKCE

### Admin panel

| Sekce | Stav |
|-------|------|
| Dashboard | ✅ Reálná data, badges funkční |
| Produkty | ✅ List, create, edit fungují |
| Sklad (Inventory) | ✅ Stock overview, fyzické/dostupné gramy |
| Dodavatelé | ✅ CRUD |
| Prodeje | ✅ Wizard funguje, 4 kroky |
| Objednávky | ✅ List + detail + akce (confirm/reject/complete) |
| Faktury | ✅ List + detail + PDF |
| Platby | ✅ Pohledávky, přidat platbu |
| Salony | ✅ List, tabs (pending/active/archived), type filter |
| Registrace | ✅ Separátní stránka `/registrations` s approve flow |
| Kadeřnice (Stylists) | ✅ CRUD form kompletní |
| Zákazníci | ✅ List + detail |
| Recenze | ✅ CRUD + emoji rating |
| Reklamace | ✅ List + approve/reject |
| Vratky | ✅ List + approve/reject + credit note |
| Vzorky | ✅ List + status management |
| Finance | ✅ Monthly overview, operating costs, partners |
| Slevy | ✅ List + summary |
| Export | ✅ Excel/CSV/Pohoda export |
| Oznámení | ✅ List + mark read + mark all read |
| Nastavení | ✅ Loyalty, B2B, Pricing, Companies |
| Audit log | ✅ Read-only log |

### Salon portál

| Sekce | Stav |
|-------|------|
| Katalog | ❌ Zobrazuje produkty ale NELZE objednat (viz B1) |
| Moje objednávky | ✅ List + detail (ale nemůže vytvořit novou) |
| Faktury | ⚠️ Empty state je "-" (viz M2) |
| Vzorky | ✅ Zobrazení vzorků |
| Profil | ✅ Loyalty tier, discount, info |

### Veřejný web

| Sekce | Stav |
|-------|------|
| Homepage | ✅ Hero, kategorie, barvy, recenze, stylists |
| Nabídka (/offer) | ✅ Filtry, kategorie, color swatches |
| Produkt detail (/offer/[id]) | ✅ Gallery, add to inquiry, reviews |
| Inquiry cart | ❌ Form submit → 500 (viz B2) |
| Kontakt | ⚠️ Chybí telefon (viz B4) |
| Registrace | ✅ Salon/kadeřnice typ, validace |
| /pro | ✅ B2B landing, 2 karty salon/kadeřnice |
| /kadernice | ✅ Grid stylistů |
| /kadernice/[slug] | ✅ Detail stylisty |
| /vykup | ⚠️ "Kc" místo "Kč" (viz B3) |
| /poradna | ⚠️ Prázdné bez článků |
| Ochrana osobních údajů | ✅ |
| Obchodní podmínky | ✅ |
| O nás | ✅ |

---

## SHRNUTÍ PRIORIT

### BLOCKER (opravit před deployem):
1. **B1** — Salon nemůže vytvořit objednávku z katalogu → přidat "Objednat" flow
2. **B2** — Inquiry form → 500 (Turso DB tabulka chybí)
3. **B3** — `/vykup`: "Kc" → "Kč" (1 řádek fix)
4. **B4** — Contact: přidat telefon +420 728 729 666

### STŘEDNÍ (opravit brzy):
- M1: "-" header v tabulkách → smysluplné labely
- M2: Empty state v salon fakturách → přidat text
- M4: Dashboard badge → link na `/registrations`
- M5: Notification bell zpoždění 30s
- M6: Katalog bez fotek produktů

### NÍZKÁ (kosmetika):
- L1: Tab "Vše" zobrazuje "Hledat"
- L2: Redundantní salon sloupec
- L4: SalonShell aktivní link highlight
- L5: Export filenames "hairora" → "hairland"
- L6: Cookie key "hairora" → "hairland"
