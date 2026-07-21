# MASTER TODO — Kompletní seznam oprav a změn

**Datum:** 2026-07-21
**Stav:** Aktivní

---

## P0 — KRITICKÉ (opravit ihned, blokuje provoz)

### ~~1. Bankovní účet~~ — ✅ JE SPRÁVNĚ
**Účet `6424423004/5500`, IBAN `CZ5555000000006424423004` je SPRÁVNÝ.**
**Firma: Altro servis group s.r.o., IČO 23673389**
**NEMĚNIT! Údaje v kódu i DB odpovídají realitě. Potvrzeno uživatelem.**

### ~~2. Název firmy~~ — ✅ JE SPRÁVNĚ
**Altro servis group s.r.o. je SPRÁVNÝ název. NEMĚNIT!**
Stará paměť uváděla "Alvento Solutions" / IČO 24111953 — to je NEPLATNÉ.

---

### 3. Comgate nemá nastavené přihlašovací údaje
**Problém:** V `.env.local` jsou prázdné proměnné:
```
COMGATE_MERCHANT=
COMGATE_SECRET=
COMGATE_TEST=true
```
**Důsledek:** Karetní platby (CARD) na e-shopu NEFUNGUJÍ — `createPayment()` pošle prázdný merchant/secret → Comgate vrátí error → API vrátí 502.

**Fix:** Uživatel musí nastavit `COMGATE_MERCHANT` a `COMGATE_SECRET` ve Vercel env vars. Bez nich nelze karetní platby použít.

---

## P1 — DŮLEŽITÉ (opravit tento týden)

### 4. Embedded replica — příčina prázdných stránek na Vercelu
**Problém:** `TURSO_EMBEDDED_REPLICA=true` způsobuje, že na cold startu se čte z prázdné `/tmp/turso-replica.db`.
**Soubor:** `src/lib/db.ts`
**Stav:** Podle team-leada už odstraněn z Vercel env vars — ověřit že funguje.

**Pokud problém přetrvává, fix v kódu:**
- Přidat sync wait před prvním čtením, nebo
- Přidat fallback na remote DB pokud replica vrátí 0 řádků

---

### 5. Přechod z poptávek na objednávky — terminologie
**Problém:** Web se mění z poptávkového systému na e-shop, ale stará terminologie "poptávka" zůstává na mnoha místech.

#### a) Metadata tab title — inquiry-cart page
- `messages/cs.json:67` — `"inquiryCartTitle": "Poptávkový košík"` → přejmenovat na `"Košík"` nebo `"Nákupní košík"`
- `messages/cs.json:68` — `"inquiryCartDescription": "Váš poptávkový košík — nezávazná poptávka..."` → přepsat
- Stejné v `uk.json:67-68` a `ru.json:67-68`

#### b) Inquiry-cart stránka — success texty
- `messages/cs.json:1020` — `"successTitle": "Poptávka odeslána!"` → `"Odesláno!"`
- `messages/cs.json:1021` — `"successText": "Děkujeme za vaši poptávku..."` → přepsat
- `messages/cs.json:1032` — `"submitButton": "Odeslat nezávaznou poptávku ({count} položek)"` → `"Odeslat ({count} položek)"`
- `messages/cs.json:1075` — `"orSendInquiry": "nebo odešlete nezávaznou poptávku..."` → `"nebo nám napište (bez online platby)"`

#### c) Interní notifikace/emaily (nízká priorita — vidí jen admin):
- `src/lib/notifications.ts:191-192` — `"Nová poptávka"` 
- `src/lib/email-templates.ts:143,146` — `"Vaše poptávka byla přijata"`
- `src/lib/telegram.ts:147-148` — `"NOVÁ POPTÁVKA"`
- `src/app/api/public/inquiry/route.ts:184-186` — email subjects

#### d) AddToInquiryForm — tlačítko
- `messages/cs.json:1007` — `"addToInquiry": "Přidat do košíku"` — **UŽ OK**, tlačítko říká "Přidat do košíku"
- `messages/cs.json:1011` — `"addButton": "Přidat do košíku"` — **UŽ OK**
- Header `src/app/[locale]/(public)/offer/[...slug]/AddToInquiryForm.tsx:140` — volá `t("inquiry.addToInquiry")` — **UŽ OK**

#### e) Interní kód — názvy (nízká priorita, funguje):
- `useInquiryCart` hook, `inquiry-cart.tsx`, `InquiryCartClient.tsx` — funkční, pouze interní pojmenování
- Stránka `/inquiry-cart` stále existuje a funguje jako konzultační formulář (consult mode) — to je OK, slouží pro "napsat nám" bez platby

#### f) Odkazy na /inquiry-cart v kódu:
- `src/app/[locale]/(public)/offer/[...slug]/page.tsx:1180,1194` — konzultační linky `href="/inquiry-cart?mode=consult&reason=..."` — **OK, toto je záměr** (konzultace nejsou objednávky)

**SHRNUTÍ: Checkout flow (/checkout) je správně pojmenovaný jako "Objednávka". Inquiry-cart zůstává pro konzultace. Opravit jen metadata title a pár starých textů v cs/uk/ru překladech.**

---

### 6. Admin prodeje (QR wizard) — CARD tlačítko nefunkční bez Comgate
**Soubor:** `src/app/(app)/sales/new/NewSaleWizard.tsx:551-563`
**Problém:** TRANSFER prodej vytvoří Comgate platbu a zobrazí "Zaplatit kartou" link. Ale bez Comgate credentials (viz P0 #3) se Comgate nepodaří → `comgateUrl` bude null → tlačítko se nezobrazí.
**Fix:** Závisí na nastavení Comgate credentials. Po nastavení bude fungovat automaticky.

---

## P2 — STŘEDNÍ PRIORITA (opravit brzy)

### 7. Dashboard cache — "neexistující pohyby"
**Problém:** Dashboard ukazuje stock movements které user nevidí v inventáři.
**Soubor:** `src/app/(app)/dashboard/page.tsx:111-119` — `recentMovements` query
**Analýza:** V DB existuje 44 pohybů (43 RECEIPT + 1 ISSUE). Dashboard je cached s `revalidate: 60, tags: ["dashboard"]`. Pokud user vidí pohyby které zdánlivě neexistují, může to být:
- Stale cache (60s TTL)
- Embedded replica vs remote nesynchronizace (pokud ještě běží)
**Fix:** Po vypnutí embedded replica by se mělo vyřešit. Pokud ne, přidat `revalidateTag("dashboard")` do stock-in API.

---

### 8. Follow-up emails — potenciální problém s noSurvey
**Soubor:** `src/app/api/cron/follow-up-emails/route.ts:28`
**Stav:** Kód má `noSurvey: false` v where clause na řádku 28 — **UŽ OPRAVENO**, filtruje správně.
**Inquiry follow-ups (řádek 62):** Nemají `noSurvey` filtr — ale `Inquiry` model nemá `noSurvey` field, takže OK.

---

### 9. Obchodní podmínky + Reklamační řád — firmy data
**Soubor:** `messages/cs.json` (a uk/ru verze)
**Problém:** Texty obsahují:
- "Altro servis group s.r.o." → opravit na "Alvento Solutions" (viz P0 #2)
- IČO, sídlo, kontaktní údaje — ověřit s uživatelem
- Účinnost od "1. 7. 2026" — je to OK?

---

### 10. Privacy stránka — obsah
**Soubor:** `messages/cs.json:1889-1916`
**Stav:** Privacy page existuje, má 6 sekcí (dataCollected, purpose, storage, rights, cookies, contact).
**Problém:** 
- Neuvádí název provozující firmy (Alvento Solutions)
- Neuvádí IČO
- Kontakt je jen email `info@hairland.cz`
- Nemá datum účinnosti (jen "Poslední aktualizace: červen 2026")
**Fix:** Doplnit identifikaci správce údajů (Alvento Solutions, IČO 24111953, sídlo).

---

## P3 — NÍZKÁ PRIORITA (nice to have)

### 11. BY_PIECE naskladnění — ověřeno, FUNGUJE
**Task #25** — VIRGIN culík cmrugysu3 úspěšně naskladněn (55g, 1 kus, exclusive=1).
Delivery i StockMovement RECEIPT existují v DB.
**Stav:** VYŘEŠENO — pokud uživatel zažil timeout, DB zápis přesto proběhl.

---

### 12. Orders stránka prázdná — SPRÁVNĚ
Tabulka `orders` v DB je prázdná (0 záznamů). E-shop objednávky ještě neproběhly.
**Stav:** NENÍ BUG — je to očekávaný stav.

---

### 13. SEO meta descriptions (Task #9/12)
**Plán:** `.claude-context/tasks/TASK-9-seo-plan.md`
**Stav:** Plán hotový, čeká na implementaci.

---

### 14. Sjednocení plateb QR prodej (Task #17)
**Plán:** `.claude-context/tasks/TASK-UNIFIED-PAYMENT-plan.md`
**Stav:** Admin QR wizard UŽ implementován s unified flow (TRANSFER vytvoří i Comgate link). Zbývá ověřit po nastavení Comgate credentials.

---

### 15. Delete product button (Task #8)
**Plán:** `.claude-context/tasks/TASK-8-delete-product-plan.md`
**Stav:** Plán hotový, čeká na implementaci.

---

## CHECKOUT FLOW — Kompletní audit

### Flow: Produkt → Košík → Checkout → Platba

| Krok | Stav | Poznámka |
|------|------|----------|
| Produkt → "Přidat do košíku" | OK | Tlačítko říká "Přidat do košíku" (přeloženo správně) |
| Navbar → košík ikona | OK | Odkazuje na `/checkout` |
| Checkout stránka | OK | 4-step wizard (contact, shipping, payment, summary) |
| TRANSFER platba | ✅ OK | Účet 6424423004/5500 je SPRÁVNÝ |
| CARD platba (Comgate) | BROKEN (credentials) | `COMGATE_MERCHANT` a `COMGATE_SECRET` prázdné → vrátí 502 |
| Potvrzovací email | ✅ OK | Účet v emailu je správný |
| GDPR text v checkoutu | OK | Řádek 783: "Odesláním objednávky souhlasíte..." s linkem na /privacy |
| Obchodní podmínky link | OK | Řádek 776: Link na /obchodni-podminky |
| noNewsletter opt-out | OK | Checkbox přítomný |
| noSurvey opt-out | OK | Checkbox přítomný |
| B2B flow | OK | Detekuje salon session, pre-fills kontakt, aplikuje slevu |
| Promo kód | OK | Validace přes API, vizuální potvrzení |
| Zásilkovna widget | OK | PacketaWidget komponent |

---

## SHRNUTÍ PRIORIT

| # | Priorita | Popis | Typ |
|---|----------|-------|-----|
| ~~1~~ | ~~P0~~ | ~~Bankovní účet~~ — ✅ JE SPRÁVNĚ (6424423004/5500) | ~~NEMĚNIT~~ |
| ~~2~~ | ~~P0~~ | ~~Název firmy~~ — ✅ JE SPRÁVNĚ (Altro servis group s.r.o.) | ~~NEMĚNIT~~ |
| 3 | P0 | Comgate credentials | KONFIGURACE |
| 4 | P1 | Embedded replica | INFRASTRUKTURA |
| 5 | P1 | Terminologie poptávka→objednávka | TEXT |
| 6 | P1 | Admin CARD platba (závisí na #3) | ZÁVISÍ |
| 7 | P2 | Dashboard cache | CACHE |
| 8 | P2 | Follow-up emails | UŽ OK |
| 9 | P2 | Obchodní podmínky firma | TEXT |
| 10 | P2 | Privacy stránka | TEXT |
| 11 | P3 | BY_PIECE stock-in | VYŘEŠENO |
| 12 | P3 | Prázdné objednávky | SPRÁVNĚ |
| 13-15 | P3 | Plánované features | ČEKÁ |
