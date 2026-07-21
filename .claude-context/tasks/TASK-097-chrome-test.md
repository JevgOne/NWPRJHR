# TASK-097 — Browser test: Kalendář overhaul + rezervace se slevou

**Datum:** 2026-07-20
**Agent:** test-chrome
**Prostředí:** https://www.hairland.cz (produkce)
**Prohlížeč:** Chromium HEADED, slowMo 500ms

---

## Výsledky testů

### TEST 1: Vizuál — chipy s emoji místo teček

**Výsledek: PASS**

Kalendář zobrazuje barevné chipy s emoji a počtem místo malých teček:
- **📋 Rezervace 5** — béžový chip s počtem
- **💰 Prodeje 1** — žlutý chip
- **📦 Objednávky 5** — hnědý chip
- **📥 Naskladnění 42** — modrý chip

V buňkách dní jsou čipy s emoji + počtem (např. `📥38` na 15., `💰1 📥4` na 18., `📦5` na 20.).

Screenshot: `t097-01-calendar-initial.png`

---

### TEST 2: Hover — tooltip

**Výsledek: PARTIAL**

Při hover na den se nezobrazil klasický HTML tooltip element (`[role="tooltip"]`). Ale funguje **klik na den** který rozbalí detail panel (viz TEST 3). Tooltip jako overlay nebyl detekován — pravděpodobně implementace používá click místo hover pro detail.

---

### TEST 3: Klik na den — detail panel

**Výsledek: PASS**

Klik na den 20. 7. (dnešek) rozbalí pod kalendářem seznam událostí pro daný den:
```
20. červenec 2026
● 📦Objednávka  E20260005  ⏳Čeká na platbu
  Test Testovací — 11 100 CZK

● 📦Objednávka  E20260004  ✗Zrušeno
  Thank You — 11 100 CZK

● 📦Objednávka  E20260003  ✗Zrušeno
  ...
```

Detail obsahuje: typ události s emoji, číslo záznamu, status chip s emoji, jméno zákazníka, částku.

Screenshot: `t097-04-filter-rezervace-off.png` (detail panel viditelný pod mřížkou)

---

### TEST 4: Filtry — klikací chipy

**Výsledek: PASS**

Nad kalendářem jsou 4 filtrační chipy:
- `📋 Rezervace 5`
- `💰 Prodeje 1`
- `📦 Objednávky 5`
- `📥 Naskladnění 42`

Po kliknutí na "Rezervace" se chip zobrazí jako deaktivovaný (šedý) a rezervace zmizí z mřížky. Po opětovném kliknutí se vrátí. Filtrování funguje správně.

Screenshot: `t097-04-filter-rezervace-off.png` (Rezervace chip deaktivován, rezervace v mřížce skryty)

---

### TEST 5: Legenda

**Výsledek: PASS**

Tlačítko "Zobrazit legendu statusů" (vpravo nahoře) rozbalí nad mřížkou podrobnou legendu ve 4 sloupcích:

| Rezervace | Prodeje | Objednávky | Naskladnění |
|-----------|---------|------------|-------------|
| ⏳Čeká na platbu | 💳Převodem | 🆕Nová | 💊Naskladnění |
| ✅Zaplaceno | 💵Hotové | ⏳Čeká na platbu | |
| ✅Dokončeno | 💳Kartou | ✅Zaplaceno | |
| 😮Expiroválo | 🎁Promo | 🚚Odesláno | |
| ✗Zrušeno | ✏️Odpis | 📦Doručeno | |
| | | ✅Dokončeno | |
| | | ✗Zrušeno | |
| | | 🚫Zamítnuto | |

Tlačítko se změní na "Skrýt legendu". Detailní legenda zobrazena správně.

Screenshot: `t097-05-legend-expanded.png`

---

### TEST 6: Navigace měsíců

**Výsledek: PASS**

Tlačítka `<` a `>` fungují:
- Klik na `>` → zobrazí **Srpen 2026** s prázdnou mřížkou (žádné záznamy) + den detail panel zůstane z předchozího výběru
- Klik na `<` → návrat na Červenec 2026

Screenshot: `t097-07-next-month.png` (Srpen 2026 zobrazen)

---

### TEST 7: Dnešek — zvýraznění

**Výsledek: PASS (vizuálně)**

Den 20 (dnešní datum) má:
- Číslo "20" zobrazeno **tučněji** (font-weight: 700) a v tmavší barvě
- Červený kroužek kolem čísla "21" (zítřek — zvýraznění dne s budoucí splatností?)
- Den 20 má světle růžové pozadí buňky (zvýraznění dnešního dne)

Screenshot: `t097-01-calendar-initial.png` (den 20 s tučným číslem a světlým pozadím)

**Poznámka:** CSS border/borderRadius na samotném číslu "20" není — dnešek je zvýrazněn pozadím buňky, ne kroužkem kolem čísla.

---

### TEST 8: Mobilní pohled

**Výsledek: PASS**

Na šířce 390px (iPhone 14 Pro):
- Mřížka 7×5 je **skryta**
- Místo ní se zobrazí **list dní s aktivitami**:
  ```
  15   📥38
  18   💰1 📥4    2 634 CZK
  19   📦1        16 565 CZK
  20   📦5        55 500 CZK
  30   📦4        34 754 CZK
  ```
- Filtry (chipy) zobrazeny nad listem ve 2×2 mřížce
- Navigace měsíců funkční

Screenshot: `t097-09-mobile-view.png`

---

### TEST 9: Rezervace se slevou

**Výsledek: PASS**

Průchod `/sales/new`:

1. Typ zákazníka: Koncový zákazník
2. Produkt: Ruční výběr → Panenské Vlasy — Mírně vlnité 55cm 6, 50g
3. Cena/g: 120 CZK → Mezisoučet: **6 000,00 CZK**
4. "Rezervovat místo prodeje" checkbox zaškrtnut → Datum splatnosti: 23.07.2026
5. "Přidat speciální slevu" checkbox zaškrtnut → 10%, Běžná obchodní
6. Summary preview:
   - Sleva: **-600,00 CZK** (10% z 6 000 = 600 ✓)
   - Celkem s DPH: **5 400,00 CZK** ✓
7. Klik "Vytvořit rezervaci" → HTTP 200 → přesměrování na `/reservations/cmrtscsqj000204ky52ccd0du`

**Detail rezervace RES-20260720-004 zobrazuje:**
- Panenské Vlasy — Mírně vlnité 6 55cm, 50 g → 5 400,00 CZK
- **Sleva (10%) → -600,00 CZK** (červeně)
- **Celkem → 5 400,00 CZK** (tučně)
- Splatnost: 23. 7. 2026
- Stav: Čeká na platbu

Sleva se uložila do DB a zobrazuje se v detailu rezervace správně.

Screenshot: `t097-SUB-04-summary.png`, `t097-SUB-05-result.png`

---

## Souhrn

| Test | Výsledek | Poznámka |
|------|----------|----------|
| 1. Vizuál — chipy s emoji | PASS | 4 typy, emoji + počet, barevné pozadí |
| 2. Hover tooltip | PARTIAL | Tooltip element nedetekován; detail se otevírá klikem |
| 3. Klik na den — detail | PASS | Rozbalí seznam událostí pod mřížkou |
| 4. Filtry | PASS | Všechny 4 chipy klikatelné, filtrování funguje |
| 5. Legenda | PASS | "Zobrazit legendu statusů" rozbalí úplnou legendu s emoji |
| 6. Navigace měsíců | PASS | < > fungují, Srpen 2026 načten |
| 7. Dnešek | PASS | Zvýraznění pozadím buňky + tučné číslo |
| 8. Mobilní pohled | PASS | List místo mřížky, filtry, navigace |
| 9. Rezervace se slevou | PASS | RES-20260720-004, 10% = -600 CZK, uloženo v DB |

---

## Screenshoty

- `t097-01-calendar-initial.png` — kalendář s chipy (Červenec 2026)
- `t097-04-filter-rezervace-off.png` — filtr Rezervace vypnut + detail panelu dne
- `t097-05-legend-expanded.png` — rozbalená legenda statusů
- `t097-07-next-month.png` — Srpen 2026 (navigace měsíců)
- `t097-09-mobile-view.png` — mobilní pohled (list)
- `t097-SUB-04-summary.png` — formulář rezervace s 10% slevou
- `t097-SUB-05-result.png` — detail RES-20260720-004 se slevou -600 CZK
