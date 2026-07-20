# TASK-053: Formulář pro trust sekci CTA — analýza a plán

## Analýza existujícího systému

### Co už existuje

**1. Inquiry Cart (poptávka)** — plně funkční systém:
- **UI:** `src/app/[locale]/(public)/inquiry-cart/InquiryCartClient.tsx`
- **Cart state:** `src/lib/inquiry-cart.tsx` (localStorage, context provider)
- **API:** `POST /api/public/inquiry` — uloží do DB, pošle email + Telegram + in-app notifikaci
- **Photo upload:** `POST /api/public/inquiry/upload` — max 3 fotek, JPG/PNG/WebP, max 10MB
- **Formulářová pole:** jméno, email, telefon, salon, poznámka, promo kód, fotky
- **Flow:** zákaznice přidá produkty z product detail → přejde na `/inquiry-cart` → vyplní kontakt + fotky → odešle
- **Problém pro CTA:** Vyžaduje alespoň 1 položku v košíku (`items.min(1)` v zod validaci). Nelze odeslat jen zprávu + fotky bez produktu.

**2. Contact Form (kontakt)** — jednoduchý formulář:
- **UI:** `src/app/[locale]/(public)/contact/ContactForm.tsx`
- **API:** `POST /api/public/contact` — uloží do DB `contactMessage`, email + Telegram
- **Formulářová pole:** jméno, email, telefon, salon, zpráva
- **Problém pro CTA:** Nemá upload fotek. Jen textová zpráva.

### Mezera

Žádný z existujících formulářů přesně neodpovídá potřebě trust sekce CTA:
- **Inquiry cart** má photo upload, ale vyžaduje produkt v košíku
- **Contact form** je bez fotek, jen text

---

## Doporučené řešení

### Varianta A: Rozšířit Contact Form o photo upload (DOPORUČENO)

Nejmenší zásah. Přidáme photo upload do existujícího ContactForm a CTA z trust sekce
povedou na `/contact` s query parametrem pro pre-fill.

**Proč:**
- Contact form je generický "napište nám" — přidání fotek je přirozené rozšíření
- Nepotřebuje produkt v košíku
- Stačí rozšířit 2 soubory (ContactForm.tsx + contact API)
- CTA z trust sekce mohou linkovat na `/contact?reason=photo-match` nebo `/contact?reason=real-photo`
  a formulář pre-fillne placeholder text do zprávy

**Co změnit:**

#### 1. `src/app/[locale]/(public)/contact/ContactForm.tsx`

Přidat:
- State `photos: File[]` + `photoPreviews: string[]` (copy pattern z InquiryCartClient)
- Photo upload UI (copy z InquiryCartClient řádky 246-279 — bg-rose/5 box s camera ikonou)
- Před odesláním: upload fotek přes `/api/public/inquiry/upload` (reuse existující endpoint)
- Poslat `customerPhotos` URL array v POST body
- Přečíst `searchParams` a pre-fillnout message placeholder:
  - `?reason=real-photo` → "Ráda bych viděla reálnou fotku konkrétního kusu, který máte skladem."
  - `?reason=photo-match` → "Posílám fotku svých vlasů — prosím o doporučení správného odstínu a délky."
  - `?reason=show-in-person` → "Mám zájem o osobní ukázku vlasů v Praze."

#### 2. `src/app/api/public/contact/route.ts`

Přidat:
- `customerPhotos` pole do `contactFormSchema` (optional array of strings, max 3)
- Uložit do `contactMessage` (přidat sloupec `customerPhotos String?` do schema)
- Přidat fotky do email notifikace

#### 3. `prisma/schema.prisma` — model `ContactMessage`

Přidat:
```prisma
customerPhotos  String?   // JSON array of photo URLs
```

Pak `npx prisma db push`.

#### 4. `src/lib/validations/export.ts` — `contactFormSchema`

Přidat:
```typescript
customerPhotos: z.array(z.string()).max(3).optional().default([]),
```

#### 5. Trust sekce CTA linky (aktualizace TASK-052-trust-section-impl.md)

Změnit CTA link targets:
- CTA 1 "Vyfotíme váš konkrétní kus" → `<Link href="/contact?reason=real-photo">`
- CTA 2 "Přijedeme ukázat zdarma" → `<Link href="/contact?reason=show-in-person">` (místo WhatsApp)
- CTA 3 "Pošlete fotku svých vlasů" → `<Link href="/contact?reason=photo-match">`

**Alternativa pro CTA 2:** Ponechat WhatsApp link `https://wa.me/420608553103?text=...`
s pre-filled textem. Záleží na preferenci uživatele — WhatsApp je přímější, kontaktní formulář
je konzistentnější.

#### 6. i18n klíče — `messages/{cs,uk,ru}.json`

Přidat pod `public.contact.form`:
```json
"photoCtaTitle": "Přiložte fotku",
"photoCtaHint": "Pošlete fotku svých vlasů nebo požádejte o reálnou fotku konkrétního kusu (max 3 fotky).",
"photoButton": "Nahrát fotku",
"reasonRealPhoto": "Ráda bych viděla reálnou fotku konkrétního kusu, který máte skladem.",
"reasonPhotoMatch": "Posílám fotku svých vlasů — prosím o doporučení správného odstínu a délky.",
"reasonShowInPerson": "Mám zájem o osobní ukázku vlasů v Praze."
```

---

### Varianta B: Inquiry cart bez povinného produktu (NEDOPORUČENO)

Upravit inquiry API aby akceptoval prázdný `items` array. To by narušilo logiku celého
inquiry systému — poptávka bez produktu není poptávka, je to kontaktní zpráva.
Míchalo by to dva koncepty.

### Varianta C: Nový standalone formulář (OVERKILL)

Vytvořit novou stránku `/hair-matching` s vlastním formulářem. Zbytečná duplikace —
contact form s photo uploadem pokryje všechny 3 CTA use-cases.

---

## File Change Summary (Varianta A)

| # | File | Action | Lines |
|---|---|---|---|
| 1 | `prisma/schema.prisma` | MODIFY — přidat `customerPhotos` do ContactMessage | +1 |
| 2 | `src/lib/validations/export.ts` | MODIFY — přidat `customerPhotos` do contactFormSchema | +1 |
| 3 | `src/app/api/public/contact/route.ts` | MODIFY — uložit customerPhotos, přidat do emailu | +10 |
| 4 | `src/app/[locale]/(public)/contact/ContactForm.tsx` | MODIFY — přidat photo upload + reason pre-fill | +60 |
| 5 | `messages/cs.json` | MODIFY — přidat contact.form photo/reason klíče | +6 |
| 6 | `messages/uk.json` | MODIFY — přidat contact.form photo/reason klíče | +6 |
| 7 | `messages/ru.json` | MODIFY — přidat contact.form photo/reason klíče | +6 |
| 8 | `src/app/[locale]/(public)/offer/[...slug]/page.tsx` | MODIFY — aktualizovat CTA linky (pokud ještě nejsou implementované) | ~3 |

**Total: 7-8 upravených souborů, ~93 řádků, 1 schema change**

---

## Závislosti

- Trust sekce (TASK-052) musí být implementovaná nebo se implementuje současně
- Photo upload API (`/api/public/inquiry/upload`) je sdílený — inquiry cart i contact form ho použijí
- Schema change vyžaduje `npx prisma db push`

---

## Testing Checklist

- [ ] Otevřít `/contact` → photo upload sekce viditelná
- [ ] Nahrát 1-3 fotky → previews zobrazené, limit 3 dodržen
- [ ] Odeslat formulář s fotkami → fotky uložené v `/uploads/inquiries/`, URLs v DB
- [ ] Otevřít `/contact?reason=real-photo` → message placeholder pre-filled
- [ ] Otevřít `/contact?reason=photo-match` → message placeholder pre-filled
- [ ] Otevřít `/contact?reason=show-in-person` → message placeholder pre-filled
- [ ] Email notifikace obsahuje info o přiložených fotkách
- [ ] Telegram notifikace funguje
- [ ] Trust sekce CTA 1 "Vyfotíme" → vede na `/contact?reason=real-photo`
- [ ] Trust sekce CTA 3 "Pošlete fotku" → vede na `/contact?reason=photo-match`
- [ ] Funguje v CS/UK/RU locale
