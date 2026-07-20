# TASK-029 Evžen Audit — Krok 4: Nový formát názvu produktu

**Datum:** 2026-07-15
**Auditor:** Evžen the King
**Commit:** 027ff1b

---

## Doslovne zadani od uzivatele

1. "nemůžeme dávat do textu produktu jakože Panenské vlasy Ukrajina Mírně vlnité 55cm"
2. "Já nevim jaky formát vlasu tam dat ale musí tam být asi B protože je to i jako H1 na produktech atd"

Uzivatel schvalil variantu B: category + texture, BEZ origin.

---

## Overeni implementace

### Zmena formatu nazvu (deliveries/route.ts:105-107)
- Stary format: `${catNames.cs} ${data.origin} ${data.texture}` = "Panenské Vlasy Ukrajina Mírně vlnité"
- Novy format: `${catNames.cs} — ${data.texture}` = "Panenské Vlasy — Mírně vlnité"
- ✅ Origin ODSTRANEN z nazvu -- presne to co uzivatel zadal
- ✅ Category PONECHANA -- uzivatel rekl "musí tam být" (je to H1)
- ✅ Texture PONECHANA -- uzivatel nerekl ze je duplicitni
- ✅ Em dash separator "—" pro lepsi citelnost
- ✅ Zmena ve vsech 3 jazycich (cs, uk, ru)

### Co NENI ovlivneno
- ✅ Origin se stale uklada do `origin` pole (radek 110) -- zobrazuje se pres badge
- ✅ Slug stale obsahuje origin pro unikatnost URL (radek 113)
- ✅ Zmena se tyka POUZE novych produktu -- existujici nezmeneny (spravne)

---

## Verdikt

**SCHVALENO** ✅

Novy format nazvu presne odpovida variante B schvalene uzivatelem. Origin odstranen z nazvu (zobrazuje se pres badge), category a texture ponechany. Zmena je minimalni a bezpecna -- meni jen 3 radky, pouze pro nove produkty.

Kombinace s predchozim commitem 7ed9276 (100% prave vlasy presun) = TASK-029 je nyni KOMPLETNE SPLNEN.
