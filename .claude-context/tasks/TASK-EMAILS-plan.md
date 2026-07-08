# TASK: Automatické emaily — potvrzení, follow-up, welcome

**Status:** Plan ready
**Datum:** 2026-07-06

## Stávající stav

### Existující email infrastruktura
- **`src/lib/email.ts`** — `sendNotificationEmail()` přes Resend API, from: `info@hairland.cz`
- **`src/lib/email-templates.ts`** — `hairlandEmailTemplate()` wrapper, šablony:
  - `getRegistrationConfirmationEmail()` — potvrzení B2B registrace (cs/uk/ru)
  - `getApprovalConfirmationEmail()` — schválení B2B účtu (cs/uk/ru)
  - `getInquiryConfirmationEmail()` — potvrzení poptávky (cs/uk/ru)
  - `getSpinWinEmail()` — výhra ze spin wheelu (cs/uk/ru)
- **Resend:** `resend@^6.14.0` v package.json
- **Multilingual:** Všechny šablony podporují cs/uk/ru

### Co CHYBÍ
1. **Potvrzení objednávky** — B2B salon dostane objednávku potvrzenou, ale žádný email
2. **Follow-up email** — po doručení/dokončení objednávky žádný follow-up
3. **Welcome email** — po schválení B2B účtu je email, ale chybí welcome pro retail zákazníky (po první poptávce)

---

## 1. Nové email šablony

### A) Order Confirmation Email (po potvrzení objednávky)

**Trigger:** `src/app/api/orders/[id]/route.ts` — akce `confirm` (řádek ~80)
**Příjemce:** Salon email (z `salon.email` nebo `user.email`)

```typescript
export function getOrderConfirmationEmail(
  lang: string,
  data: {
    salonName: string;
    orderNumber: string;
    items: Array<{ productName: string; lengthCm: number; color: string; grams: number; pieces: number }>;
    estimatedTotal: number;
    promoCode?: string;
    promoDiscount?: number;
  }
): { subject: string; text: string; html: string }
```

Obsah:
- "Vaše objednávka #{orderNumber} byla potvrzena"
- Tabulka položek (produkt, délka, barva, gramáž)
- Celková cena (po slevě pokud promo)
- "Objednávku připravíme a informujeme vás o odeslání."
- CTA: "Sledovat objednávku" → link na salón portál

### B) Order Shipped Email (objednávka odeslána)

**Trigger:** `src/app/api/orders/[id]/route.ts` — akce status change to `IN_TRANSIT`
**Příjemce:** Salon email

```typescript
export function getOrderShippedEmail(
  lang: string,
  data: {
    salonName: string;
    orderNumber: string;
    estimatedTotal: number;
  }
): { subject: string; text: string; html: string }
```

Obsah:
- "Vaše objednávka #{orderNumber} je na cestě"
- "Osobní odběr Praha — doručíme do 24h"
- CTA: "Přihlásit se do portálu"

### C) Follow-up Email (3 dny po dokončení)

**Trigger:** CRON job (denně) — hledá objednávky s `completedAt` před 3 dny
**Příjemce:** Salon email

```typescript
export function getOrderFollowUpEmail(
  lang: string,
  data: {
    salonName: string;
    orderNumber: string;
    reviewUrl: string;
  }
): { subject: string; text: string; html: string }
```

Obsah:
- "Jak jste spokojeni s objednávkou #{orderNumber}?"
- "Budeme rádi za vaši recenzi"
- CTA: "Napsat recenzi" → link na recenzi
- "Máte dotaz? Odpovězte na tento email."

### D) Inquiry Follow-up Email (pro retail zákazníky, 3 dny po poptávce)

**Trigger:** CRON job (denně) — hledá inquiry s `contactedAt` nebo `createdAt` + 3 dny
**Příjemce:** Inquiry email

```typescript
export function getInquiryFollowUpEmail(
  lang: string,
  data: {
    name: string;
    inquiryItems: string; // summary
  }
): { subject: string; text: string; html: string }
```

Obsah:
- "Děkujeme za váš zájem o naše vlasy"
- "Chcete se na něco zeptat? Jsme tu pro vás."
- CTA: "Kontaktovat nás" → link na kontakt

---

## 2. Implementace triggerů

### A) Synchronní triggery (ihned po akci)

**Order Confirmed:**
```
src/app/api/orders/[id]/route.ts
case "confirm":
  // ... existující kód
  // PŘIDAT: 
  const salonEmail = order.salon.email || salonUser?.email;
  if (salonEmail) {
    const lang = order.salon.language || "cs";
    const emailData = getOrderConfirmationEmail(lang, { ... });
    sendNotificationEmail({ to: salonEmail, ...emailData }).catch(() => {});
  }
```

**Order Shipped (IN_TRANSIT):**
```
src/app/api/orders/[id]/route.ts
case "ship": / status transition to IN_TRANSIT
  // PŘIDAT:
  sendOrderShippedEmail(order).catch(() => {});
```

### B) Asynchronní triggery (CRON)

**Nový CRON endpoint:** `src/app/api/cron/follow-up-emails/route.ts`

```typescript
export async function GET(request: NextRequest) {
  // Verify cron secret
  
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
  
  // 1. B2B order follow-ups
  const completedOrders = await prisma.order.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: fourDaysAgo, lte: threeDaysAgo },
      followUpSent: false, // nový field
    },
    include: { salon: true },
  });
  
  for (const order of completedOrders) {
    // Send follow-up email
    // Mark followUpSent = true
  }
  
  // 2. Retail inquiry follow-ups
  const inquiries = await prisma.inquiry.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: fourDaysAgo, lte: threeDaysAgo },
      followUpSent: false, // nový field
    },
  });
  
  // ...
}
```

**Vercel CRON config** (vercel.json):
```json
{
  "crons": [{
    "path": "/api/cron/follow-up-emails",
    "schedule": "0 9 * * *"
  }]
}
```

---

## 3. DB Schema změny

```prisma
// Order — přidat tracking
model Order {
  // ... existující pole
  followUpSent    Boolean   @default(false)
  followUpSentAt  DateTime?
}

// Inquiry — přidat tracking
model Inquiry {
  // ... existující pole
  followUpSent    Boolean   @default(false)
  followUpSentAt  DateTime?
}
```

---

## 4. Soubory k editaci/vytvořit

| Soubor | Akce | Popis |
|--------|------|-------|
| `prisma/schema.prisma` | Edit | Přidat followUpSent na Order a Inquiry |
| `src/lib/email-templates.ts` | Edit | 4 nové šablony (cs/uk/ru) |
| `src/app/api/orders/[id]/route.ts` | Edit | Přidat email triggery na confirm a ship |
| `src/app/api/cron/follow-up-emails/route.ts` | New | CRON pro follow-up emaily |
| `vercel.json` | Edit | Přidat CRON schedule |

---

## 5. Multilingual podpora

Všechny nové šablony musí podporovat cs/uk/ru (stávající pattern z `email-templates.ts`):
- `const orderConfirmT: Record<Lang, { ... }> = { cs: {...}, uk: {...}, ru: {...} };`
- Jazyk se bere z `salon.language` (B2B) nebo `inquiry.locale` (retail)

---

## 6. Existující CRON endpointy (reference)

Projekt už má CRON endpointy:
- `src/app/api/cron/daily-summary/route.ts` — denní shrnutí
- `src/app/api/cron/overdue-check/route.ts` — kontrola splatnosti
- `src/app/api/cron/unassigned-reminder/route.ts` — nepřiřazené poptávky

Pattern: `vercel.json` cron + API route s secret ověřením.

---

## 7. Implementační priorita

| # | Email | Trigger | Priorita |
|---|-------|---------|----------|
| 1 | Order Confirmation | Sync (confirm akce) | **P1** |
| 2 | Order Shipped | Sync (ship akce) | **P1** |
| 3 | B2B Follow-up (3d) | CRON | P2 |
| 4 | Retail Follow-up (3d) | CRON | P2 |

**Estimated effort:** 2-3 hodiny celkem.
