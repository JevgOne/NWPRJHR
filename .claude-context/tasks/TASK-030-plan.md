# TASK-030: QR kód — uživatel ho nemůže najít po naskladnění

**Status:** Analýza hotová — připraveno pro implementátora
**Autor:** Plánovač
**Datum:** 2026-07-15

---

## 1. Kde se QR generuje a zobrazuje

### A) Stock-in success screen — DOČASNÝ (zmizí)

`src/components/inventory/StockInForm.tsx` řádky 326-333:
```typescript
const saleUrl = `${window.location.origin}/sales/new?variantId=${result.variantId}`;
const QRCode = await import("qrcode");
const dataUrl = await QRCode.toDataURL(saleUrl, {
    errorCorrectionLevel: "M",
    width: 200,
    margin: 2,
});
setQrDataUrl(dataUrl);
```

- Generuje se **client-side** v `handleSubmit` po úspěšném naskladnění
- Uloží se do React state `qrDataUrl`
- Zobrazí se na success screenu (řádky 524-532) jako `<img>`
- Download button (řádky 591-612) — stáhne jako PNG
- **Po kliknutí "Naskladnit další" nebo navigaci pryč → state se resetuje → QR ZMIZÍ NAVŽDY**

### B) Inventory stránka — hromadný tisk štítků (SKRYTÝ)

`src/app/(app)/inventory/InventoryClient.tsx` řádky 197-207:
- Tlačítko "Tisk štítků" se zobrazí **POUZE po zaškrtnutí variant** v tabulce (checkboxy)
- Otevře `QrLabelSheet` komponentu — full-screen overlay s tisknutelnými štítky
- Generuje QR dynamicky z `variantId` (nepotřebuje DB)

**Problém:** User neví že má zaškrtávat varianty → nevidí tlačítko → "nemůžu najít QR"

---

## 2. QR NENÍ uložen v DB

QR kód se nikam nepersistuje. Je čistě ephemeral — existuje jen v React state během jednoho session.

**Ale nemusí být v DB** — QR URL je deterministická:
```
${window.location.origin}/sales/new?variantId=${variantId}
```

Může se kdykoli regenerovat ze znalosti `variantId` přes `qrcode` package.

---

## 3. Proč user nemůže QR najít

1. **Po naskladnění odešel** ze success screenu → QR zmizelo
2. **Na inventory stránce** neví o checkboxech → nevidí "Tisk štítků"
3. **Nikde v UI** není tlačítko "Zobrazit QR" pro jednu konkrétní variantu

---

## 4. Navržené řešení

### Přidat QR ikonu do inventory tabulky (per-row)

V `InventoryClient.tsx` — ke každému řádku varianty přidat QR ikonu. Kliknutí otevře mini modal:

```
┌─────────────────────────────────┐
│  QR kód — Panenské Vlasy 55cm  │
│                                 │
│         [QR IMAGE 200x200]     │
│                                 │
│  URL: hairland.cz/sales/new... │
│                                 │
│  [Stáhnout PNG]  [Zavřít]      │
└─────────────────────────────────┘
```

**Implementace:**
1. Přidat nový sloupec nebo ikonu do tabulky řádku (před/za délku)
2. `onClick` → dynamicky importovat `qrcode`, vygenerovat `toDataURL` z `variantId`
3. Zobrazit v modalu s download buttonem (Blob URL pro iOS kompatibilitu)

QR se generuje on-demand, nemusí se ukládat do DB.

### Volitelně: QR i na product detail (VariantTable)

V `VariantTable.tsx` — přidat QR ikonu do variant karty (OWNER only). Stejný princip — kliknutí → modal s QR.

---

## Fix plan pro implementátora

| # | Soubor | Změna | Priorita |
|---|--------|-------|----------|
| 1 | `src/app/(app)/inventory/InventoryClient.tsx` | Přidat QR ikonu per-row + mini modal s QR generovaným z variantId | HLAVNÍ |
| 2 | `src/components/products/VariantTable.tsx` | Přidat QR ikonu do variant karty (OWNER only) | NICE-TO-HAVE |

**Technické detaily:**
- QR package: `qrcode` v1.5.4 (už v dependencies)
- Generování: `const QRCode = await import("qrcode"); await QRCode.toDataURL(url, { width: 200, margin: 2 })`
- Download: převést data URL na Blob URL pro iOS Safari kompatibilitu (viz task #25)
- Modal: jednoduchý inline modal nebo reuse existujícího modal patternu z projektu

**Žádný user input potřeba** — toto je čistě UX improvement.
