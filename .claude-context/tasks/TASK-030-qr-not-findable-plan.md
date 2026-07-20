# TASK-030: QR kód — uživatel ho nemůže najít

**Status:** Analýza hotová
**Autor:** Plánovač
**Datum:** 2026-07-15

---

## Kontext

User: "nemůžu už najít nikde ten QR kód"

---

## Audit: Kde QR kódy existují v systému

### 1. Po naskladnění — success screen (`StockInForm.tsx` řádky 524-532)

QR kód se zobrazuje **pouze na success screenu po naskladnění**. Jakmile uživatel klikne "Naskladnit další" nebo odejde na jinou stránku → QR **ZMIZÍ navždy**. Není uložený nikde v DB.

**Problém:** QR je EPHEMERAL — generuje se client-side z `variantId`, zobrazí se jednou, a pak je pryč.

```
naskladnění → success screen → QR viditelný → user odejde → QR ZTRACEN
```

### 2. Inventory stránka — QR label tisk (`InventoryClient.tsx` řádky 197-207)

Na inventory stránce existuje funkce **"Tisk štítků"**:
1. User zaškrtne varianty v tabulce (checkboxy)
2. Objeví se tlačítko "Tisk štítků (N)" v summary baru
3. Kliknutí otevře `QrLabelSheet` — full-screen overlay s tisknutelnými štítky
4. Každý štítek: QR kód (20x20mm) + produkt/délka/barva/barcode

**Problém:** Tlačítko je viditelné POUZE když user zaškrtne alespoň 1 variantu. Pokud user neví že má zaškrtávat → nevidí tlačítko → "nemůžu najít QR".

### 3. Stock-in stránka — přístup POUZE pro OWNER

`src/app/(app)/inventory/stock-in/page.tsx` řádek 12:
```typescript
if (session.user.role !== "OWNER") redirect("/dashboard");
```

Stock-in (a tedy QR na success screenu) je přístupný **POUZE pro OWNER** roli.

### 4. Inventory stránka — přístup

`src/app/(app)/inventory/page.tsx` — nezkontroloval jsem role check ale inventory page zobrazuje QrLabelSheet pro vybrané varianty.

---

## Identifikované problémy

### Problem 1: HLAVNÍ — QR kód není dostupný po opuštění success screenu

QR kód se generuje client-side a **nikam se neukládá**. Po naskladnění:
- User vidí QR na success screenu
- Pokud stáhne (download button) → má ho lokálně
- Pokud klikne "Naskladnit další" nebo odejde → QR zmizí
- Pokud se vrátí na inventory → musí najít variantu, zaškrtnout ji, kliknout "Tisk štítků"

**Ale:** QR kód je deterministický — vždy `{origin}/sales/new?variantId={id}`. Může se kdykoli regenerovat ze znalosti `variantId`. Nemusí se ukládat do DB.

### Problem 2: Tlačítko "Tisk štítků" je skryté

Na inventory stránce je tlačítko pro tisk QR štítků viditelné **POUZE po zaškrtnutí variant**. User ho nevidí protože:
1. Neví že má zaškrtnout varianty
2. Tlačítko se zobrazí v summary baru — může být přehlédnutelné
3. Na mobilu (iPhone) je tabulka s checkboxy méně přehledná

### Problem 3: Žádný přímý přístup k QR pro konkrétní variantu

Nikde v UI neexistuje "Zobrazit QR" tlačítko na úrovni jedné varianty. User nemůže kliknout na variantu a vidět její QR kód.

---

## Doporučený fix plan

### Krok 1: Přidat QR ikonu/tlačítko do inventory tabulky (HLAVNÍ FIX)

Do `InventoryClient.tsx` — přidat QR ikonu ke každému řádku varianty v tabulce. Kliknutí buď:
- **Varianta A:** Otevře mini modal s QR kódem + download button pro tu jednu variantu
- **Varianta B:** Přidá sloupec s malou QR ikonou, kliknutí generuje a stáhne QR

**Doporučuji variantu A** — modal s QR pro jednu variantu:
```tsx
// V tabulce inventory, nový sloupec nebo ikona v řádku
<button onClick={() => showSingleQr(item)}>
    <QrIcon className="w-4 h-4" />
</button>

// Modal: zobrazí QR + download + print
```

### Krok 2: Zviditelnit "Tisk štítků" i bez selekce

Přidat permanentní tlačítko/odkaz "QR štítky" do horní lišty inventory stránky (vedle filtrů). Aktuální behavior (select → print) zachovat jako hromadnou variantu, ale přidat i přímý přístup.

Alternativa: přidat text hint pod summary bar: "Zaškrtněte varianty pro tisk QR štítků"

### Krok 3: Zvážit QR na product detail stránce (admin)

V `ProductDetailClient.tsx` — ve `VariantTable` je každá varianta zobrazená jako card. Přidat QR ikonu/tlačítko do karty varianty, aby OWNER mohl:
1. Kliknout na QR ikonu
2. Vidět QR kód pro tu variantu
3. Stáhnout nebo vytisknout

Toto by bylo nejpřirozenější místo kde user hledá QR — na stránce produktu, u konkrétní varianty.

---

## Soubory k úpravě

| # | Soubor | Změna | Priorita |
|---|--------|-------|----------|
| 1 | `src/app/(app)/inventory/InventoryClient.tsx` | Přidat QR tlačítko/ikonu per-row nebo zviditelnit "Tisk štítků" | HLAVNÍ |
| 2 | `src/components/products/VariantTable.tsx` | Přidat QR ikonu do variant karty (OWNER only) | NICE-TO-HAVE |

**Poznámka:** QR kód se nemusí ukládat do DB — URL je deterministická (`/sales/new?variantId={id}`), QR se generuje dynamicky přes `qrcode` package.

---

## Shrnutí

User nemůže najít QR protože:
1. Po naskladnění QR zmizí z success screenu (ephemeral)
2. Na inventory stránce musí zaškrtnout varianty aby viděl "Tisk štítků" → neintuitivní
3. Nikde není přímý "Zobrazit QR" pro jednu variantu

Hlavní fix: přidat QR ikonu/tlačítko přímo do inventory tabulky (per-row), kliknutí → mini modal s QR + download.
