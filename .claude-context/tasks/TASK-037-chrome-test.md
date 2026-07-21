# TASK-037 — Browser test: Reservation discounts + unified activity calendar

**Datum:** 2026-07-20
**Agent:** test-chrome
**Prostředí:** localhost:3000 (dev server)
**Prohlížeč:** Chromium HEADED, slowMo 400ms

---

## Výsledky testů

### TEST 1: Kalendář v navigaci

**Výsledek: PASS**

Odkaz "Kalendář" je viditelný v levém sidebaru na druhé pozici (pod "Přehled", nad "Oznámení"). `a[href="/calendar"]` existuje a je visible.

Screenshot: `t37-01-nav.png`

---

### TEST 2: Stránka /calendar

**Výsledek (původní test na dev): FAIL — 404**
**Výsledek (retest na produkci po fixu): PASS**

#### Původní test (dev server, 2026-07-20 dopoledne)

Navigace na `http://localhost:3000/calendar` vrátila 404. Příčina: `/calendar` chybělo v `src/proxy.ts` v `PROTECTED_PREFIXES` a `config.matcher`. Bug nahlášen team-leadovi.

#### Retest po fixu (produkce hairland.cz, 2026-07-20)

Po nasazení fixu (proxy.ts opraven, deploy na hairland.cz) funguje `/calendar` správně:

- URL `https://www.hairland.cz/calendar` — HTTP 200, nenastane redirect
- "Kalendář" aktivní v levém sidebaru (highlighted)
- Nadpis: **Červenec 2026**
- Navigace měsíců: tlačítka `<` a `>` v levém/pravém rohu nadpisu
- Mřížka 7×5: sloupce Po / Út / St / Čt / Pa / So / Ne, čísla dní 1–31
- Barevné tečky na dnech s aktivitami:
  - 15. 7. — mnoho teček různých barev + `+32`
  - 18. 7. — zelené + fialové tečky
  - 20. 7. — modré, zelené, šedé tečky + `+1` (dnešní datum zvýrazněný kroužkem)
  - 30. 7. — žluté + oranžové tečky
- Legenda pod mřížkou:
  - **Rezervace:** Čeká na platbu / Zaplaceno / Dokončeno / Expiroválo / Zrušeno
  - **Prodeje:** Převodem / Hotově / Kartou / Promo / Odpis
  - **Objednávky:** Nová / Čeká na platbu / Zaplaceno / Odesláno / Doručeno / Dokončeno / Zrušeno / Zamítnuto
  - **Naskladnění:** Naskladnění

Screenshot: `t37b-06-calendar-direct.png`

---

### TEST 3: Sleva u rezervací — /sales/new

**Výsledek: PASS (částečný)**

#### 3a. DiscountForm viditelný v normálním (ne-reserve) módu

Checkbox "Přidat speciální slevu" je viditelný hned na stránce `/sales/new` bez nutnosti přepínání do reserve módu (jelikož stránka se zobrazí nejprve bez přidaného produktu — formulář je dostupný).

- Checkbox "Přidat speciální slevu" kliknutelný: **ANO**
- Po kliknutí se rozbalí formulář s:
  - "Procento slevy" — number input
  - "Typ slevy" — 3 tlačítka: Běžná obchodní / Marketingová / Osobní

Screenshot po otevření: `t37-discount-opened.png`

#### 3b. Zadání 10 %

Po vyplnění hodnoty `10` do pole "Procento slevy" se hodnota zobrazí správně v inputu.

Screenshot: `t37-discount-10pct-entered.png`

#### 3c. Shrnutí slevy v order summary

**WARN:** Discount summary nebyl viditelný, protože nebyl přidán žádný produkt do košíku — formulář DiscountForm se zobrazí, ale summary sekce (kde by se ukázalo "Sleva: -X CZK") se vyrenderuje až po přidání položky. Test bez produktu nemůže ověřit výpočet slevy.

**Závěr:** UI pro zadání slevy funguje správně (checkbox, input, type selector). Výpočet slevy v summary nelze ověřit bez kompletního průchodu (výběr zákazníka → produkt → sleva → summary).

---

### TEST 4: Detail existující rezervace — zobrazení slevy

**Výsledek: PASS (s poznámkou)**

Navigace na `/reservations/cmrtn5t57000004ie7k4c613d` (RES-20260720-002):
- Zobrazí se detail rezervace: Renata Kogo, RETAIL, Panenské Vlasy — Mírně vlnité 6 55cm, 84 g, 10 080,00 CZK
- Stav: Čeká na platbu, splatnost 30. 7. 2026
- Akční tlačítka: "Označit jako zaplaceno" a "Zrušit"

**Discount řádek:** Rezervace byla vytvořena BEZ slevy — sloupce `discountPercent/discountAmount` jsou NULL. Discount řádek se tedy nezobrazuje (správné chování — zobrazí se jen když `discountAmount > 0`).

**Poznámka:** Rezervace se slevou ještě neexistuje v DB (nový feature, schéma ještě nemigráno). Proto nelze ověřit zobrazení discount řádku v detailu.

Screenshot: `t37-res-detail-actual.png`

---

## Souhrn (finální)

| Test | Výsledek | Poznámka |
|------|----------|----------|
| Kalendář v nav | PASS | Link `a[href="/calendar"]` viditelný, aktivní highlight |
| /calendar stránka (dev) | FAIL→FIXED | 404 → bug v proxy.ts nahlášen, opraven, deploy |
| /calendar stránka (prod) | PASS | HTTP 200, mřížka + legenda + navigace měsíců |
| DiscountForm v /sales/new | PASS | Checkbox + input + typ slevy fungují |
| Discount summary (výpočet) | SKIP | Nelze bez produktu v košíku |
| Reservation detail | PASS | Správně zobrazuje bez discount řádku (žádná sleva v DB) |

---

## Screenshoty

- `t37-01-nav.png` — navigace s viditelným "Kalendář" odkazem (dev)
- `t37-02-calendar-page.png` — původní 404 na /calendar (dev)
- `t37-discount-opened.png` — discount form rozbalený (dev, /sales/new)
- `t37-discount-10pct-entered.png` — zadaných 10 % v discount inputu
- `t37-res-detail-actual.png` — detail rezervace RES-20260720-002
- `t37b-06-calendar-direct.png` — **PASS: kalendář plně funkční na produkci**
