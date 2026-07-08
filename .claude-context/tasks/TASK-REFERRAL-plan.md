# TASK: Referral Program — sleva za doporučení

**Status:** Plan ready
**Datum:** 2026-07-06

## Koncept

Zákazník (B2B salon/kadeřnice i retail) sdílí unikátní referral link. Nový zákazník přes link dostane slevu na první nákup, referrer dostane kredit/slevu na další nákup. Obě strany motivovány.

---

## 1. DB Schema — rozšíření

### Nový model `Referral`

```prisma
model Referral {
  id              String    @id @default(cuid())
  
  // Kdo doporučuje
  referrerType    String    // "SALON" | "CUSTOMER"
  referrerSalonId String?
  referrerSalon   Salon?    @relation("ReferrerSalon", fields: [referrerSalonId], references: [id])
  referrerCustomerId String?
  referrerCustomer   Customer? @relation("ReferrerCustomer", fields: [referrerCustomerId], references: [id])
  
  // Unikátní kód pro sdílení
  code            String    @unique
  
  // Odměna pro referrera
  referrerRewardType  PromoDiscountType @default(PERCENT)
  referrerRewardValue Int     @default(1000) // 10% v basis points
  
  // Sleva pro nového zákazníka
  refereeDiscountType  PromoDiscountType @default(PERCENT)
  refereeDiscountValue Int     @default(500) // 5% v basis points
  
  // Tracking
  usedCount       Int       @default(0)
  maxUses         Int?      // null = unlimited
  active          Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  conversions     ReferralConversion[]
  
  @@index([code])
  @@index([referrerSalonId])
  @@index([referrerCustomerId])
  @@map("referrals")
}

model ReferralConversion {
  id              String    @id @default(cuid())
  
  referralId      String
  referral        Referral  @relation(fields: [referralId], references: [id])
  
  // Kdo přišel přes referral
  refereeType     String    // "SALON" | "CUSTOMER" | "INQUIRY"
  refereeSalonId  String?
  refereeCustomerId String?
  refereeInquiryId  String?
  
  // Odměna
  referrerPromoCodeId String? // PromoCode vygenerovaný pro referrera
  refereePromoCodeId  String? // PromoCode použitý refereeem
  
  status          String    @default("PENDING") // PENDING, COMPLETED, EXPIRED
  
  createdAt       DateTime  @default(now())
  
  @@index([referralId])
  @@index([status])
  @@map("referral_conversions")
}
```

### Rozšíření stávajících modelů

```prisma
// Salon — přidat relace
model Salon {
  // ... existující pole
  referrals       Referral[] @relation("ReferrerSalon")
}

// Customer — přidat relace
model Customer {
  // ... existující pole
  referrals       Referral[] @relation("ReferrerCustomer")
}

// Inquiry — přidat referral tracking
model Inquiry {
  // ... existující pole
  referralCode    String?    // kód doporučení
}
```

---

## 2. Využití existujícího PromoCode systému

**Klíčové rozhodnutí:** Referral slevy se realizují přes existující `PromoCode` tabulku.

Když nový zákazník přijde přes referral link:
1. Automaticky se vytvoří jednorázový `PromoCode` pro referee (nový zákazník) — předvyplněn v poptávce
2. Po dokončení konverze (objednávka nebo poptávka) se vytvoří jednorázový `PromoCode` pro referrera

Výhody:
- Žádné změny v `order-workflow.ts` — PromoCode validace už funguje
- Žádné změny v `Discount` tabulce — slevový systém zůstává
- Admin vidí referral promo kódy v existujícím promo code managementu

Konvence kódů: `REF-{REFERRER_CODE}-{RANDOM}` — snadno odlišitelné v adminu.

---

## 3. API Endpointy

### `POST /api/referrals` (authenticated, SALON/HAIRDRESSER/OWNER)
Vytvoří referral kód pro přihlášeného uživatele.
```typescript
// Request: {} (prázdné, kód se generuje automaticky)
// Response: { code: "HAIR-ABC123", shareUrl: "https://hairland.cz?ref=HAIR-ABC123" }
```

### `GET /api/referrals/my` (authenticated)
Vrací referral kód a statistiky pro aktuálního uživatele.
```typescript
// Response: { 
//   code: "HAIR-ABC123",
//   shareUrl: "https://hairland.cz?ref=HAIR-ABC123",
//   totalConversions: 5,
//   pendingRewards: 2,
//   conversions: [...] 
// }
```

### `GET /api/public/referral/validate?code=HAIR-ABC123` (public)
Validuje referral kód.
```typescript
// Response: { 
//   valid: true, 
//   referrerName: "Salon XY",
//   discountType: "PERCENT",
//   discountValue: 500 // 5%
// }
```

### `POST /api/referrals/admin` (OWNER only)
Admin vytvoří referral pro jakýkoliv salon/zákazníka s custom hodnotami.

---

## 4. UI Flow

### A) Sdílení (referrer)

**Salon Portal / kadeřnice dashboard:**
1. Nová sekce "Doporučte nás" v salón portálu
2. Zobrazí unikátní referral link + kód
3. Tlačítka: "Kopírovat link", "Sdílet na WhatsApp", "Sdílet na Instagram"
4. Statistiky: kolik lidí přišlo, kolik slev získáno

**Odkud:** `src/app/(salon)/` — stávající salón portál

### B) Příchod přes referral (referee)

1. Nový zákazník klikne na `hairland.cz?ref=HAIR-ABC123`
2. Kód se uloží do `localStorage` (30 dní expiry)
3. Na stránce se zobrazí banner: "Dostanete 5% slevu díky doporučení od Salon XY"
4. Při odesílání poptávky/objednávky:
   - Referral kód se automaticky předvyplní jako promo kód
   - Nebo se přidá jako `referralCode` na `Inquiry`/`Order`

### C) Admin

1. Nová stránka `/admin/referrals` — přehled všech referralů
2. Sloupce: kód, referrer, konverze, status, vytvořeno
3. Detail: seznam konverzí, vygenerované promo kódy

---

## 5. Implementační kroky

### Krok 1: Schema + migrace (30 min)
- Přidat `Referral`, `ReferralConversion` modely
- Přidat `referralCode` na `Inquiry`
- `npx prisma migrate dev`

### Krok 2: API routes (1h)
- `src/app/api/referrals/route.ts` — CRUD
- `src/app/api/referrals/my/route.ts` — pro salón portál
- `src/app/api/public/referral/validate/route.ts` — veřejná validace
- Logika generování PromoCode při konverzi

### Krok 3: Referral tracking na frontendu (1h)
- Middleware nebo `useEffect` v public layoutu — detekce `?ref=` parametru
- Uložení do `localStorage`
- Banner komponenta zobrazující referral slevu
- Auto-předvyplnění v inquiry cart

### Krok 4: Salon Portal UI (1h)
- Nová sekce v `/salon/dashboard` nebo vlastní stránka `/salon/referral`
- Share buttons, statistiky
- Využít existující salon portal layout

### Krok 5: Admin UI (45 min)
- `/admin/referrals` stránka s tabulkou
- Filtry: aktivní/neaktivní, s konverzemi
- Detail modal: konverze, promo kódy

### Krok 6: Email notifikace (30 min)
- Email referrerovi když někdo použije jeho kód (nový template v `email-templates.ts`)
- Email s promo kódem odměny po dokončení konverze
- Využít stávající `sendNotificationEmail` + `hairlandEmailTemplate`

---

## 6. Soubory k editaci/vytvořit

| Soubor | Akce | Popis |
|--------|------|-------|
| `prisma/schema.prisma` | Edit | Přidat Referral, ReferralConversion modely |
| `src/app/api/referrals/route.ts` | New | CRUD pro referraly |
| `src/app/api/referrals/my/route.ts` | New | Statistiky pro salón |
| `src/app/api/public/referral/validate/route.ts` | New | Veřejná validace |
| `src/lib/email-templates.ts` | Edit | Přidat referral email šablony |
| `src/lib/notifications.ts` | Edit | Přidat NotificationType.REFERRAL_USED |
| `src/app/(public)/layout.tsx` | Edit | Detekce ?ref= parametru |
| `src/app/(salon)/*/` | Edit | Referral sekce v salón portálu |
| `src/app/(app)/referrals/` | New | Admin stránka |

---

## 7. Technické poznámky

- **Generování kódů:** `HAIR-` prefix + 6 random alfanumerických znaků (např. `HAIR-K7M2X9`)
- **Expiry:** Referral kódy bez expiry (stále platné), ale konverze musí proběhnout do 30 dní od kliknutí
- **Deduplikace:** Jeden zákazník/salon může mít max 1 referral kód
- **Ochrana:** Rate limiting na validaci (existující pattern z spin wheel)
- **Promo kód odměny:** Automaticky generovaný, jednorázový, platný 90 dní
