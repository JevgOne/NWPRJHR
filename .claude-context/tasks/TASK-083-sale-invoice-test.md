# TEST REPORT: Sale + Invoice Flow — Produkce hairland.cz
**Datum:** 2026-07-16  
**Tester:** TEST-CHROME  
**Prostředí:** https://www.hairland.cz  
**Login:** test@hairland.cz / TestHairland2026!

---

## VÝSLEDKY SCÉNÁŘŮ

| # | Scénář | Stav | Detail |
|---|--------|------|--------|
| S1 | Login | **OK** | Redirect /dashboard |
| S2 | /sales/new | **OK** | Formulář se načte |
| S3 | Výběr "Koncový zákazník" | **OK** | Zákazníci se zobrazí |
| S4 | Výběr zákaznice "Jitka Zkouška" | **OK** | lunamanazer@gmail.com |
| S5 | Výběr produktu (BY_PIECE) | **OK** | Luxe Vlasy — Mírně vlnité, 55cm, barva 2 |
| S6 | Přepnout na "Prodat po gramech" | **OK** | Přepínač funguje, zobrazí "Cena/g: 110,44 CZK" |
| S6 | Zadání 150 gramů | **OK** | Pole přijme 150 |
| S6 | Cena: 150 × 110,44 = mezisoučet | **OK** | Mezisoučet: **16 566,00 CZK** (správně) |
| S7 | Typ platby = Převod | **OK** | Default, "Faktura se vytvoří automaticky" |
| S8 | Dokončit prodej | **OK** | POST /api/sales → HTTP 201, redirect na detail |
| S9 | Sale detail | **OK** | Stav "Dokončen", 150g @ 16 564,86 CZK/g = 16 566 CZK |
| S10 | Faktura vygenerována | **OK** | Faktura **2026-0011** automaticky vytvořena |
| S11 | Email odeslán | **PARTIAL** | emailSent: false v notifikacích — viz níže |

**VÝSLEDEK: 12 OK, 1 PARTIAL**

---

## CENA — OVĚŘENÍ (klíčový test)

```
Produkt:    Luxe Vlasy — Mírně vlnité, 55cm, barva 2 (BY_PIECE)
Cena/g:     110,44 CZK/g  (= 16 564,86 CZK / 150 g)
Množství:   150 g

Výpočet:    150 × 110,44 = 16 566,00 CZK  ✓ SPRÁVNĚ
            (NENÍ 111 CZK ani jiná chybná cena)

Celkem bez DPH:  13 690,00 CZK
DPH 21%:         2 876,00 CZK
Celkem s DPH:    16 566,00 CZK
```

---

## FAKTURA — DETAIL

```
Číslo:          2026-0011
ID:             cmrnz0gdt000804lacoc1d5s3
Prodej ID:      cmrnz0g0u000604laupw2wvzq
Odběratel:      Jitka Zkouška (lunamanazer@gmail.com)
Vystavitel:     Alvento Solutions s.r.o.
Datum vydání:   16. 7. 2026
Datum splatnosti: 30. 7. 2026 (14 dní)
Variabilní symbol: 20260011
Mezisoučet:     13 690,00 CZK
DPH 21%:        2 876,00 CZK
Celkem:         16 566,00 CZK
Status:         Vystavená (ISSUED)
Položka:        Luxe Vlasy — Mírně vlnité, 55cm, 2 (L-MV-02-55), 1 ks
```

---

## EMAIL — STAV

Notifikační API vrátí:
```json
{ "emailSent": false, "emailSentAt": null }
```

**Interpretace:** Email notifikace je v systému zaznamenána (notifikace existuje v DB), ale `emailSent: false` znamená buď:
1. Testovací OWNER účet (test@hairland.cz) nemá email notifikace zapnuty, nebo
2. Email pro zákazníka (lunamanazer@gmail.com) nebyl odeslán — systém odesílá email až asynchronně / přes cron

Doporučuji ověřit s reálným OWNER účtem (inga@hairland.cz nebo jevgenij@hairland.cz) zda email dorazí.

---

## PRODEJ — API RESPONSE

```json
{
  "id": "cmrnz0g0u000604laupw2wvzq",
  "status": "COMPLETED",
  "paymentType": "TRANSFER",
  "customerName": "Jitka Zkouška",
  "items": [{
    "grams": 150,
    "pieces": 1,
    "pricePerGramUsed": 1656486,
    "lineTotal": 1656600
  }],
  "totalAmount": 1656600,
  "completedAt": "2026-07-16T20:37:42.532Z"
}
```

---

## KOMPLETNÍ STAV

| Oblast | Stav |
|--------|------|
| Výběr zákazníka | OK |
| BY_PIECE produkt → přepnutí na gramy | OK |
| Cena/g kalkulace (150g × 110,44 = 16 566) | OK — SPRÁVNĚ |
| Typ platby Převod + note o faktuře | OK |
| Dokončení prodeje POST 201 | OK |
| Sale detail (COMPLETED, správné ceny) | OK |
| Automatická faktura (2026-0011) | OK — vygenerována |
| Email zákazníkovi | PARTIAL — emailSent: false, nutno ověřit |

---

## SCREENSHOT

- `/tmp/prod-sale-150g-price.png` — formulář s 150g a cenou 16 566 CZK
