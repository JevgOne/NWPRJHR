# QA: TASK-109 — Terminologie "poptávka" → "objednávka"

**Datum:** 2026-07-22
**Kontrolor:** kontrolor
**Status: TÉMĚŘ HOTOVO — 2 nalezené chyby vyžadují opravu**

---

## 1. SIMPLIFY KONTROLA

**Výsledek: PASS** — Implementace je čistá, bez zbytečných změn.

- Změny jsou přesně cílené pouze na uživatelsky viditelné texty
- JSON klíče zůstaly beze změny (inquiryCartTitle, submitButton atd.)
- Konzultační texty beze změny (consultSubject, consultBody1)
- Žádné nadbytečné ani duplicitní změny

---

## 2. DEBUG KONTROLA

### TypeScript kompilace
```
npx tsc --noEmit → PASS (žádné chyby)
```

### JSON validita
```
cs.json → VALID ✓
uk.json → VALID ✓
ru.json → VALID ✓
```

---

## 3. REVERZNÍ KONTROLA

### cs.json — PUBLIC texty (KROK 1)
- ✅ r67 `inquiryCartTitle`: "Košík objednávky"
- ✅ r68 `inquiryCartDescription`: "Váš košík — objednávka prémiových vlasů..."
- ✅ r1022 `successTitle`: "Objednávka odeslána!"
- ✅ r1023 `successText`: "Děkujeme za vaši objednávku."
- ✅ r1034 `submitButton`: "Odeslat objednávku ({count} položek)"
- ✅ r1077 `orSendInquiry`: "nebo odešlete objednávku níže (bez online platby)"

### cs.json — ADMIN texty (KROK 2)
- ✅ r103 `nav.inquiries`: "Objednávky z webu"
- ✅ r1600 `customer.inquiries`: "Objednávky z webu"
- ✅ r1601 `customer.noInquiries`: "Žádné objednávky z webu"
- ✅ r1602 `customer.inquiryCount`: "obj."
- ✅ r2767 `inquiry.title`: "Objednávky z webu"
- ✅ r2777 `inquiry.noInquiries`: "Žádné objednávky z webu"
- ✅ r2784 `inquiry.inquiryDate`: "Datum objednávky"
- ✅ r2788 `inquiry.inquiredHair`: "Objednané vlasy"
- ✅ r2790 `inquiry.inquiryStatus`: "Stav objednávky"

### cs.json — VOP (KROK 11)
- ✅ r801: "objednávkového formuláře na webu"

### cs.json — VYJIMKA
- ✅ r1972: "poptávky" (tržní poptávka) — NETKNUTÉ

### uk.json (KROKY 3+4)
- ✅ r67 `inquiryCartTitle`: "Кошик замовлення"
- ✅ r68 `inquiryCartDescription`: "Ваш кошик — замовлення..."
- ✅ r103 `nav.inquiries`: "Замовлення з сайту"
- ✅ r1022 `successTitle`: "Замовлення надіслано!"
- ✅ r1023 `successText`: "Дякуємо за ваше замовлення."
- ✅ r1034 `submitButton`: "Надіслати замовлення ({count} позицій)"
- ✅ r1077 `orSendInquiry`: "або надішліть замовлення нижче (без онлайн оплати)"

### ru.json (KROKY 5+6)
- ✅ r67 `inquiryCartTitle`: "Корзина заказа"
- ✅ r68 `inquiryCartDescription`: "Ваша корзина — заказ..."
- ✅ r103 `nav.inquiries`: "Заказы с сайта"
- ✅ r1022 `successTitle`: "Заказ отправлен!"
- ✅ r1034 `submitButton`: "Отправить заказ ({count} позиций)"
- ✅ r1077 `orSendInquiry`: "или отправьте заказ ниже (без онлайн оплаты)"

### email-templates.ts (KROK 8)
- ✅ r150 CS subject: "Vaše objednávka byla přijata — Hairland"
- ✅ r153 CS body1: "Děkujeme za vaši objednávku na Hairland.cz."
- ✅ r156 CS itemsHeader: "Objednané položky:"
- ✅ r163 UK subject: "Ваше замовлення прийнято — Hairland"
- ✅ r166 UK body1: "Дякуємо за ваше замовлення na Hairland.cz."
- ✅ r169 UK itemsHeader: "Замовлені товари:"
- ✅ r176 RU subject: "Ваш заказ принят — Hairland"
- ✅ r179 RU body1: "Благодарим за ваш заказ на Hairland.cz."
- ✅ r182 RU itemsHeader: "Заказанные товары:"

### notifications.ts (KROK 7)
- ✅ r191 title: "Nová objednávka z webu"
- ✅ r192 message: "Přišla nová objednávka z webu od..."

### telegram.ts (KROK 9)
- ✅ r147: "NOVÁ OBJEDNÁVKA Z WEBU / НОВЫЙ ЗАКАЗ С САЙТА"
- ✅ r148: "Nový zákazník odeslal objednávku přes web"
- ✅ r149: "Новый клиент отправил заказ через сайт"

### api/public/inquiry/route.ts (KROK 10)
- ✅ r184 email subject: "Nová objednávka z webu"
- ✅ r186 body: "Nová objednávka z webu"
- ✅ r215 notification title: "Nová objednávka z webu"

---

## NALEZENÉ CHYBY

### ⚠️ CHYBA 1 — email-templates.ts:204 (MIMO PLÁN)
**Soubor:** `src/lib/email-templates.ts`
**Řádek:** 204
**Aktuální text:** `"Použijte kód při objednávce nebo poptávce na"`
**Správný text:** `"Použijte kód při objednávce na"`
**Kontext:** Text promo kódu pro "Kolečko štěstí" — uživatelsky viditelný, starý výraz "poptávce" zůstal. Nebyl v plánu, ale měl být změněn.
**Závažnost:** Nízká (promo funkce, ne hlavní tok)

### ⚠️ CHYBA 2 — route.ts:217 (MIMO PLÁN)
**Soubor:** `src/app/api/public/inquiry/route.ts`
**Řádek:** 217
**Aktuální text:** `` `${name} poptává ${items.length} položek.` ``
**Správný text:** `` `${name} objednává ${items.length} položek.` ``
**Kontext:** Zpráva v notifikaci (in-app notification) pro vlastníky — "poptává" zůstalo. Plán opravil title notifikace (r215), ale ne message text.
**Závažnost:** Střední — admini tuto notifikaci vidí v aplikaci

---

## SOUHRN

| Oblast | Status |
|--------|--------|
| cs.json (15 změn) | ✅ PASS |
| uk.json (14 změn) | ✅ PASS |
| ru.json (14 změn) | ✅ PASS |
| email-templates.ts (9 změn) | ⚠️ CHYBA 1 na r204 |
| notifications.ts (2 změny) | ✅ PASS |
| telegram.ts (3 změny) | ✅ PASS |
| route.ts (3 změny) | ⚠️ CHYBA 2 na r217 |
| TypeScript kompilace | ✅ PASS |
| JSON validita | ✅ PASS |
| JSON klíče netknuty | ✅ PASS |
| cs.json:1972 netknuty | ✅ PASS |

**Doporučení:** Opravit 2 nalezené chyby, pak implementace je kompletní.
