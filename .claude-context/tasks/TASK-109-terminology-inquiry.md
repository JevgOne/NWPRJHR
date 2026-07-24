# TASK-109: Terminologie "poptávka" → "objednávka"

**Priorita:** P1
**Stav:** čeká

## Popis
Změnit terminologii z "poptávka" na "objednávka" v celé aplikaci.

## Soubory k úpravě
- `messages/cs.json:67-68` — inquiryCartTitle/Description
- `messages/cs.json:1020-1021` — successTitle/Text
- `messages/cs.json:1032` — submitButton
- `messages/cs.json:1075` — orSendInquiry
- Stejné v `uk.json` a `ru.json`
- `notifications.ts` — "Nová poptávka"
- `email-templates.ts` — "Nová poptávka"
- `telegram.ts` — "Nová poptávka"

## Poznámka
/inquiry-cart route zůstává pro konzultace (mode=consult) — to je záměr.
