# TASK-033 Evžen Audit — Fix photo upload failure (500)

**Datum:** 2026-07-15
**Auditor:** Evžen the King
**Commit:** 18576ee

---

## Doslovne zadani od uzivatele

- "Upload selhal (500)"

---

## Overeni implementace

### Pricina: sekvencni zpracovani fotek
- Stary kod: for-loop pres soubory, sekvencni sharp zpracovani + upload = casovy limit pri vice fotkach
- Novy kod:
  1. Validace VSECH souboru PRED zpracovanim (radky 74-101)
  2. Paralelni zpracovani pres Promise.all (radky 104-131)
  3. DB update az PO vsech uploadech (jednou)

### Co je overeno:
- ✅ Validace souboru (MIME/extension check) pred zpracovanim -- nezmenena logika, jen presunut pred processing
- ✅ Max 6 fotek kontrola pred zpracovanim (ne uvnitr smycky) -- efektivnejsi
- ✅ Promise.all pro paralelni zpracovani -- reseni timeoutu
- ✅ try/catch kolem Promise.all s error response (radky 133-138)
- ✅ Video i foto zpracovani zachovano (isVideo branch)
- ✅ Soubory po zpracovani rozdeleny na photos/video (radky 140-148)

### Potencialni riziko:
- ⚠️ Paralelni upload vice fotek = vetsi pametova spotreba (vsechny buffery naraz). Pro 6 fotek po ~5MB = ~30MB RAM. Na Vercelu by to melo byt OK (funkce maji 1024MB+ RAM).

---

## Verdikt

**SCHVALENO** ✅

Fix resí presne hlaseny problem (500 pri uploadu). Zmena ze sekvencniho na paralelni zpracovani je spravny pristup k reseni timeoutu. Validace presunutu pred zpracovani je bonus (fail-fast).
