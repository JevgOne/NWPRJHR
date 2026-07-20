# QA Report — Task #30: QR kód v inventory tabulce
Date: 2026-07-14
Tester: TEST-CHROME
Status: CODE REVIEW PASS — manualni vizualni test blokovan (admin credentials)

---

## Dev server
- Spusten na http://localhost:3001 (port 3000 obsazen jinym projektem)
- HTTP 200 na / — OK
- /inventory → 307 redirect na login (spravne chovani pro neprihlasenho)

## Chrome
- Otevren: http://localhost:3001/inventory, http://localhost:3001/login
- Bez admin credentials nelze projit login a zobrazit inventory tabulku

---

## Code Review — PASS

### QR ikona v tabulce (InventoryClient.tsx:336-345)
- SVG QR ikona v kazdem radku tabulky (w-4 h-4, barva muted → espresso po hoveru)
- Button: `onClick={() => openQr(item.variantId)}`, `title="QR"` pro accessibility
- Klik je izolovany od row-click (e.stopPropagation())
- PASS

### openQr funkce (InventoryClient.tsx:55-64)
- Dynamicky importuje "qrcode" (lazy load)
- Generuje URL: `${window.location.origin}/sales/new?variantId=${variantId}`
- QR parametry: width 300, errorCorrectionLevel M, margin 2 — rozumne
- setQrModal({ variantId, dataUrl }) — spravne
- Error handling: console.error pri selhani
- PASS

### Modal (InventoryClient.tsx:362-378)
- fixed inset-0 z-50, bg-black/40 backdrop
- Klik na backdrop zavira modal (onClick={() => setQrModal(null)})
- X button zavira modal
- <img src={qrModal.dataUrl} alt="QR" className="w-full max-w-[250px] mx-auto" />
- Download button s textem z i18n klice "downloadQr"
- PASS

### downloadQr funkce (InventoryClient.tsx:66-80)
- Spravne parsuje dataUrl (header + base64)
- Vytvori Blob → createObjectURL → link.click() → revokeObjectURL
- Nazev souboru: qr-{variantId}.png
- PASS

---

## Zaver

| Test | Vysledek |
|------|----------|
| Dev server HTTP 200 | PASS |
| /inventory redirect pro neprihlasene | PASS (307 → login) |
| QR ikona v tabulce — kod | PASS |
| openQr — generovani QR z variantId | PASS |
| Modal — zobrazeni QR obrazku | PASS |
| Zavrit modal (× + backdrop) | PASS |
| Download QR PNG | PASS |
| Vizualni test v Chrome | BLOKOVAN — chybi admin credentials |

**Code review: vse spravne implementovano.**
Vizualni/interaktivni overeni vyzaduje prihlaseni do admin.
Uzivatel muze overit vizualne v Chrome na http://localhost:3001/inventory po prihlaseni.
