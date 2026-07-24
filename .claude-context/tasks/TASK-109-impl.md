# IMPL: TASK-109 — Terminologie "poptávka" → "objednávka"

## Status: DONE

## Změněné soubory (7)

### 1. messages/cs.json (15 změn)
- `metadata.inquiryCartTitle`: "Poptávkový košík" → "Košík objednávky"
- `metadata.inquiryCartDescription`: poptávkový košík → košík objednávky
- `nav.inquiries`: "Poptávky" → "Objednávky z webu"
- `public.inquiry.successTitle`: "Poptávka odeslána!" → "Objednávka odeslána!"
- `public.inquiry.successText`: poptávku → objednávku
- `public.inquiry.submitButton`: "Odeslat nezávaznou poptávku" → "Odeslat objednávku"
- `public.inquiry.orSendInquiry`: nezávaznou poptávku → objednávku
- `customer.inquiries`: "Poptávky" → "Objednávky z webu"
- `customer.noInquiries`: "Žádné poptávky" → "Žádné objednávky z webu"
- `customer.inquiryCount`: "popt." → "obj."
- `inquiry.title`: "Poptávky" → "Objednávky z webu"
- `inquiry.noInquiries`: "Žádné poptávky" → "Žádné objednávky z webu"
- `inquiry.inquiryDate`: "Datum poptávky" → "Datum objednávky"
- `inquiry.inquiredHair`: "Poptávané vlasy" → "Objednané vlasy"
- `inquiry.inquiryStatus`: "Stav poptávky" → "Stav objednávky"
- VOP section2Text: poptávkového formuláře → objednávkového formuláře

### 2. messages/uk.json (14 změn)
- `metadata.inquiryCartTitle`: "Кошик запитів" → "Кошик замовлення"
- `metadata.inquiryCartDescription`: кошик запитів → кошик замовлення
- `nav.inquiries`: "Запити" → "Замовлення з сайту"
- `public.inquiry.successTitle`: "Запит надіслано!" → "Замовлення надіслано!"
- `public.inquiry.successText`: запит → замовлення
- `public.inquiry.submitButton`: незобов'язуючий запит → замовлення
- `public.inquiry.orSendInquiry`: незобов'язуючий запит → замовлення
- `customer.inquiries`: "Запити" → "Замовлення з сайту"
- `customer.noInquiries`: "Немає запитів" → "Немає замовлень з сайту"
- `customer.inquiryCount`: "запит." → "зам."
- `inquiry.title`: "Запити" → "Замовлення з сайту"
- `inquiry.noInquiries`: "Немає запитів" → "Немає замовлень з сайту"
- `inquiry.inquiryDate/inquiredHair/inquiryStatus`: запит → замовлення

### 3. messages/ru.json (14 změn)
- Analogické změny: запрос → заказ, "Запросы" → "Заказы с сайта"

### 4. src/lib/email-templates.ts (9 změn)
- CS: poptávka → objednávka (subject, body1, itemsHeader)
- UK: запит → замовлення (subject, body1, itemsHeader)
- RU: запрос → заказ (subject, body1, itemsHeader)

### 5. src/lib/notifications.ts (2 změny)
- title: "Nová poptávka" → "Nová objednávka z webu"
- message: "Přišla nová poptávka" → "Přišla nová objednávka z webu"

### 6. src/lib/telegram.ts (3 změny)
- Header: "NOVÁ POPTÁVKA / НОВЫЙ ЗАПРОС" → "NOVÁ OBJEDNÁVKA Z WEBU / НОВЫЙ ЗАКАЗ С САЙТА"
- CZ line: poptávku → objednávku
- RU line: запрос → заказ

### 7. src/app/api/public/inquiry/route.ts (3 změny)
- 3× "Nová poptávka" → "Nová objednávka z webu" (email subject, body, notification title)

## NEZMĚNĚNO (dle plánu)
- cs.json:1972 "poptávky" (tržní poptávka) — NETKNUTÉ ✓
- JSON klíče (inquiryCartTitle, submitButton...) — NETKNUTÉ ✓
- Názvy komponent — NETKNUTÉ ✓
- API routes — NETKNUTÉ ✓
- DB model — NETKNUTÉ ✓
- Konzultační texty — NETKNUTÉ ✓

## Validace
- TypeScript: `npx tsc --noEmit` — PASS ✓
- JSON parsing: cs/uk/ru — VALID ✓
