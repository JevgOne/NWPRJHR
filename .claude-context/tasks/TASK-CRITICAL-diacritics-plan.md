# TASK: Fix diakritika v notifikacích

**Date:** 2026-07-01
**Status:** Plan ready for implementation

---

## Problem

Many notification texts in API routes use Czech text without diacritics (háčky/čárky). Example: "Registrace schvalena" instead of "Registrace schválena". This looks unprofessional to users.

---

## Full Audit Results

All locations with Czech text missing diacritics, organized by file:

### 1. `src/app/api/salons/[id]/route.ts` (line 133-134)

```
CURRENT:  title: "Registrace schvalena"
FIX:      title: "Registrace schválena"

CURRENT:  message: "Vas B2B ucet byl schvalen. Nyni muzete objednavat."
FIX:      message: "Váš B2B účet byl schválen. Nyní můžete objednávat."
```

### 2. `src/app/api/returns/route.ts` (line 92-93)

```
CURRENT:  title: `Vratka ke schvaleni`
FIX:      title: `Vratka ke schválení`

CURRENT:  message: `Nova vratka ke schvaleni od salonu ${sale?.salon?.name ?? ""}.`
FIX:      message: `Nová vratka ke schválení od salonu ${sale?.salon?.name ?? ""}.`
```

### 3. `src/app/api/samples/[id]/route.ts` (line 62-63)

```
CURRENT:  title: "Vzorek odeslan"
FIX:      title: "Vzorek odeslán"

CURRENT:  message: "Vas vzorek byl odeslan."
FIX:      message: "Váš vzorek byl odeslán."
```

### 4. `src/app/api/samples/route.ts` (line 79-80)

```
CURRENT:  title: `Zadost o vzorek: ${parsed.data.salonName ?? ""}`
FIX:      title: `Žádost o vzorek: ${parsed.data.salonName ?? ""}`

CURRENT:  message: `Salon "${parsed.data.salonName ?? ""}" zada o vzorek.`
FIX:      message: `Salon "${parsed.data.salonName ?? ""}" žádá o vzorek.`
```

### 5. `src/app/api/orders/route.ts` (line 109-110)

```
CURRENT:  title: `Nova objednavka: ${salon?.name ?? ""}`
FIX:      title: `Nová objednávka: ${salon?.name ?? ""}`

CURRENT:  message: `Salon "${salon?.name ?? ""}" vytvoril novou objednavku (${parsed.data.items.length} polozek).`
FIX:      message: `Salon "${salon?.name ?? ""}" vytvořil novou objednávku (${parsed.data.items.length} položek).`
```

### 6. `src/app/api/public/reviews/route.ts` (line 57-58)

```
CURRENT:  title: `Nova recenze: ${data.authorName} (${data.rating}★)`
FIX:      title: `Nová recenze: ${data.authorName} (${data.rating}★)`

CURRENT:  message: `${data.authorName} pridal/a recenzi ...`
FIX:      message: `${data.authorName} přidal/a recenzi ...`
```

### 7. `src/app/api/public/contact/route.ts` (line 95-96)

```
CURRENT:  title: `Kontaktni formular: ${name}`
FIX:      title: `Kontaktní formulář: ${name}`

CURRENT:  message: `${name}${...} odeslal/a zpravu pres kontaktni formular.`
FIX:      message: `${name}${...} odeslal/a zprávu přes kontaktní formulář.`
```

### 8. `src/app/api/complaints/route.ts` (line 77-78)

```
CURRENT:  title: "Nova reklamace"
FIX:      title: "Nová reklamace"

CURRENT:  message: `Nova reklamace: ${parsed.data.description?.slice(0, 100) ?? ""}`
FIX:      message: `Nová reklamace: ${parsed.data.description?.slice(0, 100) ?? ""}`
```

### 9. `src/app/api/payments/route.ts` (line 92-93)

```
CURRENT:  title: "Platba prijata"
FIX:      title: "Platba přijata"

CURRENT:  message: `Prijata platba k fakture ${invoice.number}`
FIX:      message: `Přijata platba k faktuře ${invoice.number}`
```

### 10. `src/lib/reminders.ts` (line 42-43) — Czech template

```
CURRENT:  subject: `Upominka: faktura ${invoice.number} po splatnosti`
FIX:      subject: `Upomínka: faktura ${invoice.number} po splatnosti`

CURRENT:  body: `Dobry den,...splatnosti...Prosime o uhradu na ucet...Dekujeme`
FIX:      body: `Dobrý den,...splatnosti...Prosíme o úhradu na účet...Děkujeme`
```

Full corrected Czech body for reminders.ts:
```
`Dobrý den,\n\nfaktura č. ${invoice.number} ze dne ${formatDate(invoice.issueDate, "cs")} se splatností ${formatDate(invoice.dueDate, "cs")} je ${daysOverdue} dní po splatnosti.\n\nZbývá uhradit: ${remainingCZK} Kč.\n\nProsíme o úhradu na účet uvedený na faktuře.\n\nDěkujeme,\nHairland.cz`
```

---

## Files NOT affected (already correct)

These files already use proper diacritics:
- `src/app/api/public/register-salon/route.ts` — "Nová registrace", "žádá o schválení" (correct)
- `src/app/api/public/inquiry/route.ts` — "Nová poptávka", "poptává" (correct)
- `src/app/api/orders/[id]/route.ts` line 284 — "Objednávka zrušena salonem" (correct)
- `src/app/api/public/complaint-tickets/route.ts` — "podal/a reklamaci" (correct)
- `src/lib/notifications.ts` — translateNotification templates all use proper diacritics (correct)

---

## Files Summary

| File | Lines | Fix |
|------|-------|-----|
| `src/app/api/salons/[id]/route.ts` | 133-134 | title + message diacritics |
| `src/app/api/returns/route.ts` | 92-93 | title + message diacritics |
| `src/app/api/samples/[id]/route.ts` | 62-63 | title + message diacritics |
| `src/app/api/samples/route.ts` | 79-80 | title + message diacritics |
| `src/app/api/orders/route.ts` | 109-110 | title + message diacritics |
| `src/app/api/public/reviews/route.ts` | 57-58 | title + message diacritics |
| `src/app/api/public/contact/route.ts` | 95-96 | title + message diacritics |
| `src/app/api/complaints/route.ts` | 77-78 | title + message diacritics |
| `src/app/api/payments/route.ts` | 92-93 | title + message diacritics |
| `src/lib/reminders.ts` | 42-43 | subject + body diacritics |

**Total: 10 files, 20 string fixes**

---

## Risk

VERY LOW — Pure text corrections, no logic changes. Each fix is a simple string replacement.

## Note

These hardcoded Czech strings are only used for in-app notifications and admin-facing content. The `translateNotification()` function in `notifications.ts` handles proper localized notifications and already has correct diacritics. The hardcoded strings bypass the translation system — ideally they should use `translateNotification()` too, but that's a larger refactor for another task.
