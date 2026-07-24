# PLAN: TASK-109 — Terminologie "poptavka" -> "objednavka"

## Kontext
Uzivatel chce zmenit uzivatelsky viditelne texty z "poptavka" na "objednavka" vsude, kde se jedna o proces nakupu vlasu. Route `/inquiry-cart` zustava pro konzultace (mode=consult) — to je zamerny design.

**DULEZITE:** Nazvy promennych, JSON klicu, komponent a API routes se NEMENI. Meni se POUZE uzivatelsky viditelne texty (stringy v uvozovkach).

**VYJIMKA:** `cs.json:1972` "poptavky" = trhova poptavka/nabidka — NEMENIT (jiny vyznam).

---

## KROK 1: messages/cs.json — PUBLIC texty (inquiry-cart)

| Radek | Klic | Puvodni text | Novy text |
|-------|------|-------------|-----------|
| 67 | `metadata.inquiryCartTitle` | `"Poptavkovy kosik"` | `"Kosik objednavky"` |
| 68 | `metadata.inquiryCartDescription` | `"Vas poptavkovy kosik — nezavazna poptavka premiovych vlasu k prodlouzeni. Odpovime do 24 hodin."` | `"Vas kosik — objednavka premiovych vlasu k prodlouzeni. Odpovime do 24 hodin."` |
| 1022 | `public.inquiry.successTitle` | `"Poptavka odeslana!"` | `"Objednavka odeslana!"` |
| 1023 | `public.inquiry.successText` | `"Dekujeme za vasi poptavku. Ozveme se vam co nejdrive."` | `"Dekujeme za vasi objednavku. Ozveme se vam co nejdrive."` |
| 1034 | `public.inquiry.submitButton` | `"Odeslat nezavaznou poptavku ({count} polozek)"` | `"Odeslat objednavku ({count} polozek)"` |
| 1077 | `public.inquiry.orSendInquiry` | `"nebo odeslete nezavaznou poptavku nize (bez online platby)"` | `"nebo odeslete objednavku nize (bez online platby)"` |

## KROK 2: messages/cs.json — ADMIN texty (navigace, inquiry sekce)

| Radek | Klic | Puvodni text | Novy text |
|-------|------|-------------|-----------|
| 103 | `nav.inquiries` | `"Poptavky"` | `"Objednavky z webu"` |
| 1600 | `customer.inquiries` | `"Poptavky"` | `"Objednavky z webu"` |
| 1601 | `customer.noInquiries` | `"Zadne poptavky"` | `"Zadne objednavky z webu"` |
| 1602 | `customer.inquiryCount` | `"popt."` | `"obj."` |
| 2767 | `inquiry.title` | `"Poptavky"` | `"Objednavky z webu"` |
| 2777 | `inquiry.noInquiries` | `"Zadne poptavky"` | `"Zadne objednavky z webu"` |
| 2784 | `inquiry.inquiryDate` | `"Datum poptavky"` | `"Datum objednavky"` |
| 2788 | `inquiry.inquiredHair` | `"Poptavane vlasy"` | `"Objednane vlasy"` |
| 2790 | `inquiry.inquiryStatus` | `"Stav poptavky"` | `"Stav objednavky"` |

## KROK 3: messages/uk.json — PUBLIC texty

| Radek | Klic | Puvodni text | Novy text |
|-------|------|-------------|-----------|
| 67 | `metadata.inquiryCartTitle` | `"Кошик запитів"` | `"Кошик замовлення"` |
| 68 | `metadata.inquiryCartDescription` | `"Ваш кошик запитів — незобов'язуючий запит на преміальне волосся для нарощування. Відповімо протягом 24 годин."` | `"Ваш кошик — замовлення преміального волосся для нарощування. Відповімо протягом 24 годин."` |
| 1022 | `public.inquiry.successTitle` | `"Запит надіслано!"` | `"Замовлення надіслано!"` |
| 1023 | `public.inquiry.successText` | `"Дякуємо за ваш запит. Ми зв'яжемося з вами якнайшвидше."` | `"Дякуємо за ваше замовлення. Ми зв'яжемося з вами якнайшвидше."` |
| 1034 | `public.inquiry.submitButton` | `"Надіслати незобов'язуючий запит ({count} позицій)"` | `"Надіслати замовлення ({count} позицій)"` |
| 1077 | `public.inquiry.orSendInquiry` | `"або надішліть незобов'язуючий запит нижче (без онлайн оплати)"` | `"або надішліть замовлення нижче (без онлайн оплати)"` |

## KROK 4: messages/uk.json — ADMIN texty

| Radek | Klic | Puvodni text | Novy text |
|-------|------|-------------|-----------|
| 103 | `nav.inquiries` | `"Запити"` | `"Замовлення з сайту"` |
| 1600 | `customer.inquiries` | `"Запити"` | `"Замовлення з сайту"` |
| 1601 | `customer.noInquiries` | `"Немає запитів"` | `"Немає замовлень з сайту"` |
| 1602 | `customer.inquiryCount` | `"запит."` | `"зам."` |
| 2777 | `inquiry.noInquiries` | `"Немає запитів"` | `"Немає замовлень з сайту"` |
| 2784 | `inquiry.inquiryDate` | `"Дата запиту"` | `"Дата замовлення"` |
| 2788 | `inquiry.inquiredHair` | `"Запитуване волосся"` | `"Замовлене волосся"` |
| 2790 | `inquiry.inquiryStatus` | `"Статус запиту"` | `"Статус замовлення"` |

## KROK 5: messages/ru.json — PUBLIC texty

| Radek | Klic | Puvodni text | Novy text |
|-------|------|-------------|-----------|
| 67 | `metadata.inquiryCartTitle` | `"Корзина запросов"` | `"Корзина заказа"` |
| 68 | `metadata.inquiryCartDescription` | `"Ваша корзина запросов — необязывающий запрос на премиальные волосы для наращивания. Ответим в течение 24 часов."` | `"Ваша корзина — заказ премиальных волос для наращивания. Ответим в течение 24 часов."` |
| 1022 | `public.inquiry.successTitle` | `"Запрос отправлен!"` | `"Заказ отправлен!"` |
| 1023 | `public.inquiry.successText` | `"Благодарим за ваш запрос. Мы свяжемся с вами в ближайшее время."` | `"Благодарим за ваш заказ. Мы свяжемся с вами в ближайшее время."` |
| 1034 | `public.inquiry.submitButton` | `"Отправить необязывающий запрос ({count} позиций)"` | `"Отправить заказ ({count} позиций)"` |
| 1077 | `public.inquiry.orSendInquiry` | `"или отправьте необязывающий запрос ниже (без онлайн оплаты)"` | `"или отправьте заказ ниже (без онлайн оплаты)"` |

## KROK 6: messages/ru.json — ADMIN texty

| Radek | Klic | Puvodni text | Novy text |
|-------|------|-------------|-----------|
| 103 | `nav.inquiries` | `"Запросы"` | `"Заказы с сайта"` |
| 1600 | `customer.inquiries` | `"Запросы"` | `"Заказы с сайта"` |
| 1601 | `customer.noInquiries` | `"Нет запросов"` | `"Нет заказов с сайта"` |
| 1602 | `customer.inquiryCount` | `"запр."` | `"зак."` |
| 2777 | `inquiry.noInquiries` | `"Нет запросов"` | `"Нет заказов с сайта"` |
| 2784 | `inquiry.inquiryDate` | `"Дата запроса"` | `"Дата заказа"` |
| 2788 | `inquiry.inquiredHair` | `"Запрашиваемые волосы"` | `"Заказанные волосы"` |
| 2790 | `inquiry.inquiryStatus` | `"Статус запроса"` | `"Статус заказа"` |

## KROK 7: src/lib/notifications.ts

| Radek | Puvodni text | Novy text |
|-------|-------------|-----------|
| 191 | `title: "Nová poptávka"` | `title: "Nová objednávka z webu"` |
| 192 | `message: \`Přišla nová poptávka od ...\`` | `message: \`Přišla nová objednávka z webu od ...\`` |

## KROK 8: src/lib/email-templates.ts

| Radek | Puvodni text | Novy text |
|-------|-------------|-----------|
| 150 | `subject: "Vaše poptávka byla přijata — Hairland"` | `subject: "Vaše objednávka byla přijata — Hairland"` |
| 153 | `body1: "Děkujeme za vaši poptávku na Hairland.cz."` | `body1: "Děkujeme za vaši objednávku na Hairland.cz."` |
| 156 | `itemsHeader: "Poptávané položky:"` | `itemsHeader: "Objednané položky:"` |
| 163 | `subject: "Ваш запит прийнято — Hairland"` | `subject: "Ваше замовлення прийнято — Hairland"` |
| 166 | `body1: "Дякуємо за ваш запит на Hairland.cz."` | `body1: "Дякуємо за ваше замовлення на Hairland.cz."` |
| 169 | `itemsHeader: "Запитувані товари:"` | `itemsHeader: "Замовлені товари:"` |
| 176 | `subject: "Ваш запрос принят — Hairland"` | `subject: "Ваш заказ принят — Hairland"` |
| 179 | `body1: "Благодарим за ваш запрос на Hairland.cz."` | `body1: "Благодарим за ваш заказ на Hairland.cz."` |
| 182 | `itemsHeader: "Запрашиваемые товары:"` | `itemsHeader: "Заказанные товары:"` |

## KROK 9: src/lib/telegram.ts

| Radek | Puvodni text | Novy text |
|-------|-------------|-----------|
| 147 | `📦 <b>NOVÁ POPTÁVKA / НОВЫЙ ЗАПРОС</b>` | `📦 <b>NOVÁ OBJEDNÁVKA Z WEBU / НОВЫЙ ЗАКАЗ С САЙТА</b>` |
| 148 | `Nový zákazník odeslal poptávku přes web` | `Nový zákazník odeslal objednávku přes web` |
| 149 | `Новый клиент отправил запрос через сайт` | `Новый клиент отправил заказ через сайт` |

## KROK 10: src/app/api/public/inquiry/route.ts

| Radek | Puvodni text | Novy text |
|-------|-------------|-----------|
| 184 | `"Nová poptávka"` | `"Nová objednávka z webu"` |
| 186 | `"Nová poptávka"` | `"Nová objednávka z webu"` |
| 215 | `"Nová poptávka"` (v title notifikace) | `"Nová objednávka z webu"` |

**POZN:** "Žádost o poradenství" zustava beze zmeny — to je konzultacni mod.

## KROK 11: VOP text v cs.json (radek 801)

| Radek | Puvodni fragment | Novy fragment |
|-------|-----------------|---------------|
| 801 | `"prostřednictvím poptávkového formuláře na webu"` | `"prostřednictvím objednávkového formuláře na webu"` |

---

## CO SE NEMENI (dulezite!)

1. **Nazvy JSON klicu:** `inquiryCartTitle`, `submitButton`, `orSendInquiry`, `inquiries`, `noInquiries`, `inquiryDate`, `inquiredHair`, `inquiryStatus` — klice zustavaji stejne
2. **Nazvy komponent:** `InquiryCartClient`, `InquiriesClient`, `useInquiryCart` — zustavaji
3. **API routes:** `/api/public/inquiry`, `/api/inquiries` — zustavaji
4. **Route paths:** `/inquiry-cart` — zustava (pouziva se i pro konzultace)
5. **DB model:** `inquiry` tabulka — zustava
6. **cs.json:1972** `"poptávky"` — trhova poptavka/nabidka, jiny vyznam, NEMENIT
7. **Konzultacni texty:** `consultTitle`, `consultSubject`, `consultBody1` — zustavaji

---

## PORADI IMPLEMENTACE

1. `messages/cs.json` (kroky 1+2) — 15 zmen
2. `messages/uk.json` (kroky 3+4) — 14 zmen
3. `messages/ru.json` (kroky 5+6) — 14 zmen
4. `src/lib/email-templates.ts` (krok 8) — 9 zmen
5. `src/lib/notifications.ts` (krok 7) — 2 zmeny
6. `src/lib/telegram.ts` (krok 9) — 3 zmeny
7. `src/app/api/public/inquiry/route.ts` (krok 10) — 3 zmeny

**Celkem: 7 souboru, ~60 textovych zmen**

## RIZIKA

- **Zadne** — jde pouze o textove zmeny v uzivatelsky viditelnch stringach
- Zadna zmena kodu, logiky, API, DB
- Vsechny JSON klice zustavaji — zadne broken references

## TEST

Po implementaci:
1. Nacist `/inquiry-cart` v CS/UK/RU — overit nove texty
2. Odeslat testovaci objednavku — overit email subject, success stranku
3. Zkontrolovat Telegram notifikaci
4. Overit admin panel: navigace, seznam poptavek (nyni "objednavky z webu"), detail
5. Overit `/inquiry-cart?mode=consult` — texty pro konzultaci zustavaji
