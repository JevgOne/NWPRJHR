# TASK: Potvrzovací emaily + HTML šablony

**Date:** 2026-07-01
**Status:** Plan ready for implementation

---

## Overview

Add 3 confirmation emails sent to **customers/registrants** (not admin). Currently all emails go only to admin (info@hairland.cz). These new emails confirm to the user that their action was received/processed.

### Emails to implement:

1. **Registration confirmation** — sent to registrant after B2B registration
2. **Approval confirmation** — sent to salon/hairdresser after admin approves their B2B account
3. **Inquiry confirmation** — sent to customer after submitting a product inquiry

All emails must be branded HTML using Hairland design system colors.

---

## Current State Analysis

### Email infrastructure:
- **`src/lib/email.ts`** — `sendNotificationEmail({ to, toName?, subject, body, html? })` using Resend API
- Already supports `html` parameter (optional) — if provided, Resend sends HTML version
- `from`: `process.env.EMAIL_FROM ?? "info@hairland.cz"`
- Reference HTML email exists in `src/app/api/public/spin/route.ts` (inline HTML strings)

### Current notification flow (admin-only):
- **Registration** (`register-salon/route.ts`): Sends plain-text email to `contactTo` (admin) + Telegram + in-app notification to OWNERs. **No email to the registrant.**
- **Approval** (`salons/[id]/route.ts`): Creates in-app notification via `createSalonNotification()`. **No email to salon users.** The notification text is "Vas B2B ucet byl schvalen" (missing diacritics — separate fix task).
- **Inquiry** (`inquiry/route.ts`): Sends plain-text email to `contactTo` (admin) + Telegram + in-app notification to OWNERs. **No email to the customer.**

### Localization:
- Registration form sends `language` field (cs/uk/ru) — stored on `Salon.language`
- Inquiry form does NOT send locale — `Inquiry.locale` defaults to "cs" in schema
- All 3 emails need translations for cs, uk, ru

---

## Brand Colors (from globals.css)

```
--nude-50:    #fdfaf7   (background)
--nude-100:   #f7efe8   (light bg)
--nude-200:   #efe0d6   (border)
--blush-100:  #f6e3e0   (light accent)
--blush-200:  #ecc9c6   (medium accent)
--blush-300:  #dba8a6   (accent)
--rose:       #c98b88   (primary)
--rose-deep:  #a96d6c   (primary dark)
--espresso:   #3a2c2a   (text)
--gold:       #c2a36b   (gold accent)
--line:       #ead9cf   (divider)
--muted:      #9c8682   (muted text)
```

---

## Implementation Plan

### Step 1: Create shared HTML email template builder

**New file:** `src/lib/email-templates.ts`

Create a reusable function that wraps email content in branded HTML layout. This avoids duplicating the HTML boilerplate across 3 email types (and the existing spin email can be refactored later).

```typescript
// src/lib/email-templates.ts

/**
 * Wrap email body content in branded Hairland HTML template.
 * All styles inline (email client compatibility).
 */
export function hairlandEmailTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fdfaf7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(58,44,42,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#c98b88,#a96d6c);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:300;letter-spacing:2px;">HAIRLAND</h1>
      <div style="width:40px;height:2px;background:#c2a36b;margin:12px auto 0;"></div>
    </div>
    <!-- Content -->
    <div style="padding:32px 24px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="background:#f7efe8;padding:20px 24px;text-align:center;border-top:1px solid #ead9cf;">
      <p style="margin:0;color:#9c8682;font-size:12px;">
        &copy; ${new Date().getFullYear()} Hairland.cz &mdash; Pr&eacute;miov&eacute; vlasy
      </p>
      <p style="margin:4px 0 0;color:#9c8682;font-size:11px;">
        <a href="https://hairland.cz" style="color:#a96d6c;text-decoration:none;">hairland.cz</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
```

Then create 3 generator functions in the same file for each email type.

---

### Step 2: Registration confirmation email (to registrant)

**Trigger:** After successful salon/hairdresser registration
**File to modify:** `src/app/api/public/register-salon/route.ts`
**Recipient:** The email address provided in the registration form
**Language:** `language` field from the form (cs/uk/ru)

#### Email content (cs version):

- **Subject:** "Vaše registrace byla přijata — Hairland"
- **Body:**
  - Greeting: "Dobrý den, {contactPerson},"
  - Message: "Děkujeme za vaši registraci na Hairland.cz. Vaše žádost o B2B přístup byla přijata a čeká na schválení."
  - Info box with submitted details (salon name, contact, city)
  - "Jakmile bude váš účet schválen, budeme vás informovat emailem."
  - CTA: none (just informational)

#### Code change in `register-salon/route.ts`:

After the existing admin email (line ~124-149), add:

```typescript
// Confirmation email to the registrant
const confirmationTranslations = getRegistrationConfirmationEmail(language, {
  contactPerson,
  salonName,
  email,
  type: typeLabel,
});

sendNotificationEmail({
  to: email,
  toName: contactPerson,
  subject: confirmationTranslations.subject,
  body: confirmationTranslations.text,
  html: confirmationTranslations.html,
}).catch(() => {});
```

#### HTML template function in `email-templates.ts`:

```typescript
export function getRegistrationConfirmationEmail(
  lang: string,
  data: { contactPerson: string; salonName: string; email: string; type: string }
): { subject: string; text: string; html: string } {
  // Translations object with cs/uk/ru
  // Returns { subject, text (plain), html (branded) }
}
```

**Translations needed:**

| Key | CS | UK | RU |
|-----|----|----|-----|
| subject | "Vaše registrace byla přijata — Hairland" | "Вашу реєстрацію прийнято — Hairland" | "Ваша регистрация принята — Hairland" |
| greeting | "Dobrý den, {name}," | "Вітаємо, {name}," | "Здравствуйте, {name}," |
| body1 | "Děkujeme za vaši registraci na Hairland.cz." | "Дякуємо за реєстрацію на Hairland.cz." | "Благодарим за регистрацию на Hairland.cz." |
| body2 | "Vaše žádost o B2B přístup byla přijata a čeká na schválení." | "Ваш запит на B2B доступ прийнято та очікує схвалення." | "Ваш запрос на B2B доступ принят и ожидает одобрения." |
| body3 | "Jakmile bude váš účet schválen, budeme vás informovat emailem." | "Щойно ваш обліковий запис буде схвалено, ми повідомимо вас електронною поштою." | "Как только ваш аккаунт будет одобрен, мы уведомим вас по электронной почте." |
| detailsLabel | "Údaje registrace:" | "Дані реєстрації:" | "Данные регистрации:" |

---

### Step 3: Approval confirmation email (to salon/hairdresser)

**Trigger:** When admin approves a salon (PUT with `approved: true`)
**File to modify:** `src/app/api/salons/[id]/route.ts`
**Recipient:** Email of users linked to the salon (`User.email WHERE salonId = id`)
**Language:** `Salon.language` field

#### Current state:

The approval handler (lines 129-137) already:
1. Detects approval via `isApproval` flag
2. Creates in-app notification via `createSalonNotification()`
3. But does NOT send an email (the `sendEmail` flag is not passed)

#### Email content (cs version):

- **Subject:** "Váš B2B účet byl schválen — Hairland"
- **Body:**
  - Greeting: "Dobrý den,"
  - Message: "S radostí vám oznamujeme, že váš B2B účet na Hairland.cz byl schválen."
  - "Nyní se můžete přihlásit a začít objednávat prémiové vlasy za velkoobchodní ceny."
  - CTA button: "Přihlásit se" → https://hairland.cz/prihlaseni
  - Note: "Pokud máte jakékoliv dotazy, kontaktujte nás na info@hairland.cz."

#### Code change in `salons/[id]/route.ts`:

Replace the current approval notification block (lines 129-137) with:

```typescript
if (isApproval) {
  // In-app notification (keep existing)
  createSalonNotification({
    salonId: id,
    type: "REGISTRATION",
    title: "Registrace schválena",
    message: "Váš B2B účet byl schválen. Nyní můžete objednávat.",
    data: { approved: true },
  }).catch(() => {});

  // Email confirmation to salon users
  const salonData = await prisma.salon.findUnique({
    where: { id },
    select: { language: true, name: true },
  });
  const salonUsers = await prisma.user.findMany({
    where: { salonId: id, role: { in: ["SALON", "HAIRDRESSER"] } },
    select: { email: true, name: true },
  });

  const lang = salonData?.language ?? "cs";
  for (const user of salonUsers) {
    if (!user.email) continue;
    const emailData = getApprovalConfirmationEmail(lang, {
      name: user.name ?? undefined,
      salonName: salonData?.name ?? "",
    });
    sendNotificationEmail({
      to: user.email,
      toName: user.name ?? undefined,
      subject: emailData.subject,
      body: emailData.text,
      html: emailData.html,
    }).catch(() => {});
  }
}
```

**New import needed:** `import { sendNotificationEmail } from "@/lib/email";` and `import { getApprovalConfirmationEmail } from "@/lib/email-templates";`

**Translations needed:**

| Key | CS | UK | RU |
|-----|----|----|-----|
| subject | "Váš B2B účet byl schválen — Hairland" | "Ваш B2B обліковий запис схвалено — Hairland" | "Ваш B2B аккаунт одобрен — Hairland" |
| greeting | "Dobrý den," | "Вітаємо," | "Здравствуйте," |
| body1 | "S radostí vám oznamujeme, že váš B2B účet na Hairland.cz byl schválen." | "З радістю повідомляємо, що ваш B2B обліковий запис на Hairland.cz схвалено." | "С радостью сообщаем, что ваш B2B аккаунт на Hairland.cz одобрен." |
| body2 | "Nyní se můžete přihlásit a začít objednávat prémiové vlasy za velkoobchodní ceny." | "Тепер ви можете увійти та почати замовляти преміальне волосся за оптовими цінами." | "Теперь вы можете войти и начать заказывать премиальные волосы по оптовым ценам." |
| cta | "Přihlásit se" | "Увійти" | "Войти" |
| footer | "Pokud máte jakékoliv dotazy, kontaktujte nás na info@hairland.cz." | "Якщо маєте запитання, зверніться до нас на info@hairland.cz." | "Если у вас есть вопросы, свяжитесь с нами по адресу info@hairland.cz." |

#### Also fix diacritics in existing notification:

Current (line 133): `title: "Registrace schvalena"` → `title: "Registrace schválena"`
Current (line 134): `message: "Vas B2B ucet byl schvalen. Nyni muzete objednavat."` → `message: "Váš B2B účet byl schválen. Nyní můžete objednávat."`

---

### Step 4: Inquiry confirmation email (to customer)

**Trigger:** After successful inquiry submission
**File to modify:** `src/app/api/public/inquiry/route.ts`
**Recipient:** The email address provided in the inquiry form
**Language:** `Inquiry.locale` field (defaults to "cs"). NOTE: The form currently does NOT send locale. Two options:
  - **Option A (recommended):** Pass the current page locale from the client. Modify `InquiryCartClient.tsx` to include `locale` in the POST body.
  - **Option B (simpler):** Use the default "cs" since the public site serves Czech market primarily.

**Recommendation:** Option A — detect locale from `useLocale()` hook (already imported in the component's scope via next-intl) and include it in the request body.

#### Client-side change (`InquiryCartClient.tsx`):

```typescript
// Add to imports (if not already):
import { useLocale } from "next-intl";

// In the component:
const locale = useLocale();

// In handleSubmit, modify the fetch body:
body: JSON.stringify({
  ...form,
  locale,  // ADD THIS
  promoCode: promoResult?.valid ? promoResult.code : form.promoCode || undefined,
  items,
}),
```

#### Server-side change (`inquiry/route.ts`):

Add `locale` to the Zod schema:

```typescript
const inquirySchema = z.object({
  // ... existing fields ...
  locale: z.enum(["cs", "uk", "ru"]).optional().default("cs"),  // ADD THIS
});
```

Then after the admin email block (line ~134), add the customer confirmation email.

#### Email content (cs version):

- **Subject:** "Vaše poptávka byla přijata — Hairland"
- **Body:**
  - Greeting: "Dobrý den, {name},"
  - Message: "Děkujeme za vaši poptávku na Hairland.cz. Přijali jsme ji a brzy se vám ozveme."
  - Summary table of items (product name, length, color, quantity)
  - If promoCode applied: "Slevový kód: {code}"
  - "Obvykle odpovídáme do 24 hodin."
  - Contact info: "info@hairland.cz"

#### Code in `inquiry/route.ts`:

```typescript
// Confirmation email to customer
const locale = parsed.data.locale ?? "cs";
const inquiryEmailData = getInquiryConfirmationEmail(locale, {
  name,
  items,
  promoCode: appliedPromoCode ?? undefined,
  inquiryId: inquiry.id,
});

sendNotificationEmail({
  to: email,
  toName: name,
  subject: inquiryEmailData.subject,
  body: inquiryEmailData.text,
  html: inquiryEmailData.html,
}).catch(() => {});
```

**Translations needed:**

| Key | CS | UK | RU |
|-----|----|----|-----|
| subject | "Vaše poptávka byla přijata — Hairland" | "Ваш запит прийнято — Hairland" | "Ваш запрос принят — Hairland" |
| greeting | "Dobrý den, {name}," | "Вітаємо, {name}," | "Здравствуйте, {name}," |
| body1 | "Děkujeme za vaši poptávku na Hairland.cz." | "Дякуємо за ваш запит на Hairland.cz." | "Благодарим за ваш запрос на Hairland.cz." |
| body2 | "Přijali jsme ji a brzy se vám ozveme." | "Ми його прийняли і незабаром зв'яжемося з вами." | "Мы его приняли и скоро свяжемся с вами." |
| itemsHeader | "Poptávané položky:" | "Запитувані товари:" | "Запрашиваемые товары:" |
| promoLabel | "Slevový kód:" | "Промокод:" | "Промокод:" |
| responseTime | "Obvykle odpovídáme do 24 hodin." | "Зазвичай відповідаємо протягом 24 годин." | "Обычно отвечаем в течение 24 часов." |

---

## HTML Design Specification

All 3 emails share the same outer template (from `hairlandEmailTemplate()`). The inner content varies:

### Shared HTML elements:

**Info box** (for details like registration data or item lists):
```html
<div style="background:#f7efe8;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:3px solid #c2a36b;">
  <!-- content -->
</div>
```

**CTA button** (for approval email):
```html
<div style="text-align:center;margin:28px 0;">
  <a href="https://hairland.cz/prihlaseni"
     style="display:inline-block;background:linear-gradient(135deg,#c98b88,#a96d6c);color:#ffffff;
            text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:500;
            letter-spacing:0.5px;">
    Přihlásit se
  </a>
</div>
```

**Item table** (for inquiry email):
```html
<table style="width:100%;border-collapse:collapse;margin:12px 0;">
  <tr style="border-bottom:1px solid #ead9cf;">
    <td style="padding:8px 0;color:#3a2c2a;font-size:14px;">{productName}</td>
    <td style="padding:8px 0;color:#9c8682;font-size:14px;text-align:right;">{lengthCm} cm, {color}, {quantity}{unit}</td>
  </tr>
</table>
```

**Paragraph text:**
```html
<p style="color:#3a2c2a;font-size:15px;line-height:1.6;margin:0 0 16px;">...</p>
```

**Muted text:**
```html
<p style="color:#9c8682;font-size:13px;line-height:1.5;margin:16px 0 0;">...</p>
```

---

## Files Summary

### New files:
| File | Purpose |
|------|---------|
| `src/lib/email-templates.ts` | Shared HTML template wrapper + 3 email generator functions with translations |

### Files to modify:
| File | Changes |
|------|---------|
| `src/app/api/public/register-salon/route.ts` | Add confirmation email to registrant after registration |
| `src/app/api/salons/[id]/route.ts` | Add confirmation email to salon users after approval, fix diacritics in notification title/message, add imports |
| `src/app/api/public/inquiry/route.ts` | Add `locale` to Zod schema, add confirmation email to customer after inquiry |
| `src/app/(public)/inquiry-cart/InquiryCartClient.tsx` | Pass `locale` in the POST body |

### Files NOT modified:
| File | Reason |
|------|--------|
| `src/lib/email.ts` | Already supports `html` parameter — no changes needed |
| `src/lib/notifications.ts` | In-app notification system unchanged |
| `prisma/schema.prisma` | `Inquiry.locale` already exists with default "cs" |

---

## Edge Cases & Notes

1. **Email failures should never block the API response** — all `sendNotificationEmail()` calls wrapped in `.catch(() => {})` (consistent with existing pattern)
2. **HTML entity encoding** — Czech/Ukrainian/Russian characters in HTML must use UTF-8 charset (set in meta tag), not HTML entities. The existing spin email uses entities for Czech but that's unnecessary with proper charset.
3. **Resend rate limits** — Registration + approval emails are low-volume operations; no rate concern. Inquiry could be higher volume but is already rate-limited (5/hour/IP).
4. **No reply-to needed** — `from` stays as `info@hairland.cz`, customers can reply directly.
5. **Login URL** in approval email: `https://hairland.cz/prihlaseni` — this is the public login page route.

---

## Testing Checklist

- [ ] Register a new salon → check registrant receives branded HTML email
- [ ] Approve a salon in admin → check salon user receives branded HTML email with login button
- [ ] Submit an inquiry → check customer receives branded HTML email with item summary
- [ ] Test each email in cs, uk, ru languages
- [ ] Verify emails render correctly in Gmail, Outlook (inline styles only)
- [ ] Verify plain-text fallback (`body`) is also correct
- [ ] Verify existing admin notification emails still work unchanged
