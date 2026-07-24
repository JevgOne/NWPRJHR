# EVŽEN VERDIKT: TASK-109 + TASK-099

**Datum:** 2026-07-22
**Kontrolor:** Evžen
**Status: SCHVÁLENO — oba tasky odpovídají původnímu zadání**

---

## TASK-109 — Terminologie "poptávka" → "objednávka"

### Původní zadání (shrnutí):
- Změnit "poptávka" na "objednávka" ve všech uživatelsky viditelných textech
- Soubory: messages/cs.json, uk.json, ru.json + notifications.ts, email-templates.ts, telegram.ts, api/public/inquiry/route.ts
- /inquiry-cart zůstává pro konzultace (mode=consult)
- JSON klíče, názvy komponent, API routes se NEMĚNÍ
- cs.json:1972 "tržní poptávka" — NEMĚNÍ SE

### Nezávislá verifikace:

| Kontrolní bod | Výsledek |
|---------------|----------|
| `grep "poptáv" src/` → 0 výskytů | PASS |
| `grep "poptáv" messages/` → jen cs.json:1972 (tržní poptávka) | PASS |
| cs.json r67 inquiryCartTitle = "Košík objednávky" | PASS |
| cs.json r103 nav.inquiries = "Objednávky z webu" | PASS |
| cs.json r1022 successTitle = "Objednávka odeslána!" | PASS |
| cs.json r1972 = "poptávky" (NETKNUTÉ) | PASS |
| notifications.ts r191 = "Nová objednávka z webu" | PASS |
| email-templates.ts r150 = "Vaše objednávka byla přijata" | PASS |
| email-templates.ts r204 = "Použijte kód při objednávce na" (fix QA chyby 1) | PASS |
| telegram.ts r147 = "NOVÁ OBJEDNÁVKA Z WEBU" | PASS |
| route.ts r184/186/215 = "Nová objednávka z webu" | PASS |
| route.ts r217 = "objednává" (fix QA chyby 2) | PASS |
| JSON klíče netknuté (inquiry*, submit*, nav.*) | PASS |
| TypeScript kompilace (dle QA) | PASS |

### Verdikt TASK-109: **SCHVÁLENO**

Všechny uživatelsky viditelné texty změněny ze "poptávka" na "objednávka" ve všech 3 jazycích + backend soubory. JSON klíče, komponenty, API routes netknuté. Výjimka cs.json:1972 respektována. Obě chyby nalezené v prvním QA kole opraveny a verifikovány.

---

## TASK-099 — Notifikační zvoneček dokončení

### Původní zadání (shrnutí):
- Při stornu objednávky/rezervace smazat související notifikace
- Ověřit navigaci na všech typech notifikací

### Nezávislá verifikace:

| Kontrolní bod | Výsledek |
|---------------|----------|
| notifications.ts r401: "inquiryId" přidán do entityKey union | PASS |
| orders/[id]/route.ts r210: reject → deleteNotificationsForEntity("orderId", id) | PASS |
| inquiries/[id]/route.ts r6: import deleteNotificationsForEntity | PASS |
| inquiries/[id]/route.ts r53-54: CANCELLED → deleteNotificationsForEntity("inquiryId", id) | PASS |
| expire-reservations/route.ts r4: import deleteNotificationsForEntity | PASS |
| expire-reservations/route.ts r60-62: loop orderIds → cleanup notifikací | PASS |
| NotificationBell.tsx r43: NEW_CONTACT → "/notifications" (shoduje se s NotificationsClient) | PASS |
| NotificationBell.tsx r47: REGISTRATION → d.salonId ? /salons/{id} : /registrations (shoduje se) | PASS |
| Všechny .catch(() => {}) — neblokující vzor, konzistentní | PASS |
| TypeScript kompilace (dle QA) | PASS |

### Verdikt TASK-099: **SCHVÁLENO**

Všechny 4 problémy z plánu opraveny:
1. Reject objednávky maže notifikace
2. Expirace objednávek maže notifikace (loop přes orderIds)
3. Inquiry CANCELLED maže notifikace (s rozšířením entityKey union o "inquiryId")
4. NotificationBell URL sjednoceny s NotificationsClient (NEW_CONTACT, REGISTRATION)

---

## CELKOVÝ VERDIKT

**SCHVÁLENO** — Oba tasky plně odpovídají původnímu zadání. Implementace je čistá, cílená, bez nadbytečných změn. QA proces zachytil 2 opomenuté výskyty v TASK-109, které byly následně opraveny. Připraveno k deployi.
