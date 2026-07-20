# TASK-030 Evžen Audit — QR kod v inventari

**Datum:** 2026-07-15
**Auditor:** Evžen the King
**Commit:** 296329a

---

## Doslovne zadani od uzivatele

1. "nemůžu už najít nikde ten QR kód"
2. "ja ho potřebuju stahnout kámo a ne dat tisknout"

---

## Overeni implementace

### Bod 1: "nemůžu najít QR kód"
- ✅ QR tlacitko pridano do KAZDEHO radku inventory tabulky (InventoryClient.tsx, radky 332-343)
- ✅ Tlacitko ma QR ikonu (SVG), je videt na kazdem radku
- ✅ Kliknuti otevre modal s vygenerovanym QR kodem (radky 362-378)
- ✅ QR generovan on-demand z variantId pres `qrcode` knihovnu (radky 53-60)
- ✅ URL v QR: `${origin}/sales/new?variantId=${variantId}` -- odpovida QR POS konceptu
- ODPOVIDA ZADANI -- uzivatel ted najde QR v inventari na kazdem radku

### Bod 2: "potřebuju stáhnout a ne dát tisknout"
- ✅ Download tlacitko v modalu (radky 370-375)
- ✅ Blob URL implementace pro iOS Safari kompatibilitu (radky 63-74)
- ✅ Stahovany soubor: `qr-${variantId}.png`
- ✅ URL.revokeObjectURL() po stazeni (cleanup)
- ODPOVIDA ZADANI -- uzivatel muze stahnout PNG, ne jen tisknout

### i18n
- ✅ "downloadQr" v cs.json: "Stáhnout QR kód"
- ✅ "downloadQr" v uk.json: "Завантажити QR код"
- ✅ "downloadQr" v ru.json: "Скачать QR код"
- ⚠️ Minor: modal titulek "QR kód" (radek 366) je hardcoded cesky, ne pres i18n. Ale je to technicky termin, prakticky stejny ve vsech jazycich -- neni kriticke.

### Error handling
- ✅ try/catch kolem QR generovani (radek 58-60)
- ✅ e.stopPropagation() na tlacitku i modalu (zabranuje nechtene navigaci)

### Tabulka
- ✅ colSpan aktualizovan z 7 na 8 pro prazdny stav (radek 271)
- ✅ Nova th hlavicka s sr-only label (radek 267)

---

## Verdikt

**SCHVALENO** ✅

Implementace presne odpovida obema bodum zadani:
1. QR kod je snadno najitelny -- na kazdem radku v inventari
2. Download tlacitko umoznuje stazeni PNG (ne jen tisk)

Jedina drobnost: hardcoded "QR kód" v titulku modalu misto i18n -- nekriticky, technciky termin.
