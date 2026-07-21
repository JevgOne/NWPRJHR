# TASK: Comgate + prevod v jednom emailu — zakaznik si vybere zpusob platby

## Kontext

**Pozadavek:** Po odeslani objednavky zakaznik dostane JEDEN email s OBEMA moznostmi platby:
1. Bankovni prevod (cislo uctu + VS + QR SPAYD kod)
2. Platba kartou (odkaz na Comgate platebni branu)

**Projekt:** `/Users/zen/NWPRJHR`

**Soucasny stav — dva oddelene flow:**
- **TRANSFER:** Zakaznik vybere prevod → API vrati `paymentInfo` (bankAccount, iban, VS, amount) → checkout stranka zobrazi platebni udaje + QR → potvrzovaci email obsahuje bankovni udaje
- **CARD:** Zakaznik vybere kartu → API vytvori Comgate payment → API vrati `redirect` URL → zakaznik je presmerovan na Comgate → po zaplaceni callback vytvori Sale

**Klicove soubory:**
- `src/app/api/public/orders/route.ts` — Order creation API (430 radku)
- `src/lib/email-templates.ts` — `getRetailOrderConfirmationEmail()` (radek 853)
- `src/lib/comgate.ts` — `createPayment()` (Comgate API wrapper)
- `src/app/[locale]/(public)/checkout/CheckoutClient.tsx` — Checkout UI (818 radku)
- `src/app/api/comgate/callback/route.ts` — Comgate webhook
- `src/lib/invoice-email.ts` — `sendPaymentDetailsEmail()` (pro interni prodeje)

**Bankovni ucet:** `7141812004/5500` (Raiffeisenbank), IBAN: `CZ6755000000007141812004`

**POZOR — oprava hardcoded hodnot:**
V kodu je na vice mistech spatny ucet `6424423004/5500`. Nutno opravit na `7141812004/5500` vsude:
- `src/app/api/public/orders/route.ts` radek 365, 422-423
- `src/app/api/sales/route.ts` radek 58-59
- `src/lib/invoice-pdf.ts` radek 256

---

## Plan implementace

### KROK 0: Opravit hardcoded bank account (PREDNOST)

**Soubory k oprave:**

1. **`src/app/api/public/orders/route.ts`** (radky 365, 422-423):
   ```diff
   - bankAccount: "6424423004/5500",
   + bankAccount: "7141812004/5500",
   
   - bankAccount: "6424423004/5500",
   - iban: "CZ5550000000006424423004",
   + bankAccount: "7141812004/5500",
   + iban: "CZ6755000000007141812004",
   ```

2. **`src/app/api/sales/route.ts`** (radky 58-59):
   ```diff
   - const bankAccount = company?.bankAccount || "6424423004/5500";
   - const iban = company?.bankIban || "CZ5550000000006424423004";
   + const bankAccount = company?.bankAccount || "7141812004/5500";
   + const iban = company?.bankIban || "CZ6755000000007141812004";
   ```

3. **`src/lib/invoice-pdf.ts`** (radek 256):
   ```diff
   - text(`${sanitizeText(t.bankAccount)}: ${data.company.bankAccount || "6424423004/5500"}`, ...);
   + text(`${sanitizeText(t.bankAccount)}: ${data.company.bankAccount || "7141812004/5500"}`, ...);
   ```

### KROK 1: Vzdy vytvorit Comgate payment (bez ohledu na zvolenou metodu)

**Soubor:** `src/app/api/public/orders/route.ts` (radky 347-430)

**Soucasny stav:**
```
Krok 8: Send confirmation email (without Comgate link)
Krok 9: IF paymentMethod === "CARD" → createPayment() + return redirect
        ELSE → return paymentInfo (bankAccount, VS, amount)
```

**Novy stav:**
```
Krok 8: VZDY createPayment() → ziskat Comgate redirect URL
Krok 9: Send confirmation email S comgateUrl + bankAccount udaji
Krok 10: IF paymentMethod === "CARD" → return redirect (presmerovat na Comgate)
         ELSE → return paymentInfo + comgateUrl (zobrazit obe moznosti)
```

**Konkretni zmeny:**

1. **Presunout Comgate createPayment PRED email** (radky ~380-412 → pred radek 348):
   ```typescript
   // 8. Create Comgate payment (always — for card payment link in email)
   let comgateUrl: string | undefined;
   let comgateTransId: string | undefined;
   try {
     const comgateResult = await createPayment({
       price: totalAmount,
       label: `Obj ${order.orderNumber}`,
       refId: order.orderNumber ?? order.id,
       email: data.email,
       fullName: `${data.firstName} ${data.lastName}`,
       lang: data.locale,
     });
     if (comgateResult.success) {
       comgateUrl = comgateResult.redirect;
       comgateTransId = comgateResult.transId;
       // Store transId on order
       await prisma.order.update({
         where: { id: order.id },
         data: { comgateTransId: comgateResult.transId },
       });
     }
   } catch (e) {
     console.error("[public/orders] Comgate create failed:", e);
     // Non-fatal — customer can still pay by transfer
   }
   ```

2. **Predat comgateUrl a bankAccount do emailu** (radek 348-377):
   ```typescript
   const emailData = getRetailOrderConfirmationEmail(data.locale ?? "cs", {
     customerName: `${data.firstName} ${data.lastName}`,
     orderNumber: order.orderNumber ?? "",
     items: orderItems.map(...),
     subtotal: estimatedTotal + promoDiscount,
     shippingCost,
     promoCode: appliedPromoCode,
     promoDiscount: promoDiscount || undefined,
     totalAmount,
     paymentMethod: data.paymentMethod,
     // VZDY predat bankovni udaje
     bankAccount: "7141812004/5500",
     iban: "CZ6755000000007141812004",
     variableSymbol: order.orderNumber ?? undefined,
     // NOVE: Comgate URL
     comgateUrl,
   });
   ```

3. **Upravit CARD response** (radky 380-413):
   ```typescript
   if (data.paymentMethod === "CARD") {
     if (!comgateUrl) {
       // Comgate failed — fallback to transfer only
       return NextResponse.json({
         success: true,
         orderId: order.id,
         orderNumber: order.orderNumber,
         paymentInfo: {
           bankAccount: "7141812004/5500",
           iban: "CZ6755000000007141812004",
           variableSymbol: order.orderNumber,
           amount: totalAmount / 100,
         },
       }, { status: 201 });
     }
     return NextResponse.json({
       success: true,
       orderId: order.id,
       orderNumber: order.orderNumber,
       redirect: comgateUrl,
     }, { status: 201 });
   }
   ```

4. **Pridat comgateUrl do TRANSFER response** (radky 415-429):
   ```typescript
   return NextResponse.json({
     success: true,
     orderId: order.id,
     orderNumber: order.orderNumber,
     paymentInfo: {
       bankAccount: "7141812004/5500",
       iban: "CZ6755000000007141812004",
       variableSymbol: order.orderNumber,
       amount: totalAmount / 100,
       comgateUrl, // NOVE — pro "Zaplatit kartou" button na success strance
     },
   }, { status: 201 });
   ```

### KROK 2: Upravit email sablonu — obe moznosti platby

**Soubor:** `src/lib/email-templates.ts`

**Zmeny v `retailOrderConfirmT` translations (radky 783-851):**

Pridat nove klice do vsech 3 jazyku:

```typescript
const retailOrderConfirmT: Record<Lang, {
  // ... existujici klice ...
  bodyUnified: string;        // NOVY: text pro unified email
  payByCardLabel: string;     // NOVY: "Zaplatit kartou"
  payByTransferLabel: string; // NOVY: "Zaplatit prevodem"
  orLabel: string;            // NOVY: "nebo"
}> = {
  cs: {
    // ... existujici ...
    bodyUnified: "Objednavku muzete uhradit kartou nebo prevodem na ucet.",
    payByCardLabel: "Zaplatit kartou",
    payByTransferLabel: "Platba prevodem",
    orLabel: "nebo",
  },
  uk: {
    bodyUnified: "Ви можете оплатити замовлення карткою або переказом на рахунок.",
    payByCardLabel: "Оплатити карткою",
    payByTransferLabel: "Оплата переказом",
    orLabel: "або",
  },
  ru: {
    bodyUnified: "Вы можете оплатить заказ картой или переводом на счёт.",
    payByCardLabel: "Оплатить картой",
    payByTransferLabel: "Оплата переводом",
    orLabel: "или",
  },
};
```

**Zmeny v `getRetailOrderConfirmationEmail` (radky 853-946):**

1. **Pridat `comgateUrl` a `iban` do interface:**
   ```typescript
   export function getRetailOrderConfirmationEmail(
     lang: string,
     data: {
       // ... existujici ...
       bankAccount?: string;
       iban?: string;           // NOVE
       variableSymbol?: string;
       comgateUrl?: string;     // NOVE
     }
   )
   ```

2. **Nahradit podminene body za unified text:**
   ```typescript
   const hasComgate = !!data.comgateUrl;
   const hasTransfer = !!data.bankAccount;
   const bodyText = (hasComgate && hasTransfer)
     ? t.bodyUnified
     : hasTransfer ? t.bodyTransfer : t.bodyCard;
   ```

3. **Pridat Comgate button do HTML (pred nebo po transfer detailech):**
   ```typescript
   const comgateHtml = data.comgateUrl
     ? `<div style="text-align:center;margin:24px 0;">
         <a href="${data.comgateUrl}"
            style="display:inline-block;background:linear-gradient(135deg,#c98b88,#a96d6c);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.5px;">
           ${esc(t.payByCardLabel)}
         </a>
       </div>`
     : "";
   
   const orDivider = (data.comgateUrl && data.bankAccount)
     ? `<div style="text-align:center;margin:16px 0;color:#9c8682;font-size:14px;">— ${esc(t.orLabel)} —</div>`
     : "";
   ```

4. **Transfer blok zobrazit VZDY (ne jen pro isTransfer):**
   ```typescript
   const transferHtml = data.bankAccount
     ? `<div style="background:#f7efe8;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:3px solid #c2a36b;">
         <p style="color:#3a2c2a;font-size:14px;font-weight:600;margin:0 0 12px;">${esc(t.payByTransferLabel)}</p>
         <table style="width:100%;border-collapse:collapse;">
           <tr>...</tr>  <!-- bankAccount -->
           <tr>...</tr>  <!-- VS -->
           <tr>...</tr>  <!-- amount -->
         </table>
       </div>`
     : "";
   ```

### KROK 3: Checkout success stranka — zobrazit obe moznosti

**Soubor:** `src/app/[locale]/(public)/checkout/CheckoutClient.tsx`

1. **Pridat `comgateUrl` do `paymentInfo` typu:**
   ```typescript
   paymentInfo?: {
     bankAccount: string;
     iban: string;
     variableSymbol: string;
     amount: number;
     comgateUrl?: string;  // NOVE
   };
   ```

2. **Na TRANSFER success strance pridat "Zaplatit kartou" button:**
   ```tsx
   {orderResult.paymentInfo?.comgateUrl && (
     <div className="mt-6 text-center">
       <p className="text-muted text-sm mb-3">{t("orPayByCard")}</p>
       <a
         href={orderResult.paymentInfo.comgateUrl}
         className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
       >
         {t("payByCard")}
       </a>
     </div>
   )}
   ```

### KROK 4: Admin panel — sloucit TRANSFER+CARD do "Faktura"

**Soubor:** `src/app/(app)/sales/new/NewSaleWizard.tsx` (radky 718-722)

**Soucasny stav — 5 tlacitek:**
```typescript
{ key: "TRANSFER", label: t("paymentTransfer") },
{ key: "CASH", label: t("paymentCash") },
{ key: "CARD", label: t("paymentCard") },
{ key: "PROMO", label: t("paymentPromo") },
{ key: "WRITEOFF", label: t("paymentWriteoff") },
```

**Novy stav — 4 tlacitka:**
```typescript
{ key: "TRANSFER", label: t("paymentInvoice") },  // "Faktura" — vygeneruje fakturu (prevod i karta)
{ key: "CASH", label: t("paymentCash") },
{ key: "PROMO", label: t("paymentPromo") },
{ key: "WRITEOFF", label: t("paymentWriteoff") },
```

**Zmeny:**
1. Odstranit `CARD` z tlacitkovych moznosti
2. Prejmenovrat `TRANSFER` na "Faktura" (label `t("paymentInvoice")`)
3. PaymentType v DB zustava `TRANSFER` (pro zpetnou kompatibilitu)
4. Logika pro TRANSFER se nemeni — generuje fakturu s bankovnimi udaji + QR SPAYD
5. Pokud zakaznik chce platit kartou, admin mu posle link (nebo zakaznik pouzije e-shop)

**I18n klice:**
```json
// cs.json
"paymentInvoice": "Faktura"

// uk.json  
"paymentInvoice": "Рахунок"

// ru.json
"paymentInvoice": "Счёт"
```

**POZOR:** `CARD` PaymentType v DB enum zustava (existujici data). Jen se odstranuje z admin UI jako moznost rucniho prodeje. E-shop (public orders) stale pouziva CARD payment method pres Comgate.

### KROK 5: I18n klice pro checkout + admin

**Pridat do checkout translations:**
```json
// cs.json
"orPayByCard": "Nebo zaplate kartou online:",
"payByCard": "Zaplatit kartou"

// uk.json
"orPayByCard": "Або оплатіть карткою онлайн:",
"payByCard": "Оплатити карткою"

// ru.json
"orPayByCard": "Или оплатите картой онлайн:",
"payByCard": "Оплатить картой"
```

### KROK 6: QR SPAYD v emailu (volitelne, nice-to-have)

**Doporuceni:** Varianta A — predat QR data URL jako parametr do emailove sablony:
```typescript
// V orders/route.ts:
const spayd = generateSpayd({ iban, amount, variableSymbol, message });
const qrDataUrl = await generateQRCodeDataUrl(spayd);

// Predat do emailu:
getRetailOrderConfirmationEmail(locale, { ...data, qrDataUrl });
```

Pouzit inline attachment s `cid:` referenci (jako v `sendPaymentDetailsEmail`).

---

## Soubory k uprave (kompletni seznam)

| # | Soubor | Typ zmeny | Popis |
|---|--------|-----------|-------|
| 1 | `src/app/api/public/orders/route.ts` | EDIT | Opravit bank account, vzdy vytvorit Comgate payment, predat comgateUrl + bankAccount do emailu |
| 2 | `src/app/api/sales/route.ts` | EDIT | Opravit hardcoded bank account fallback |
| 3 | `src/lib/invoice-pdf.ts` | EDIT | Opravit hardcoded bank account fallback |
| 4 | `src/lib/email-templates.ts` | EDIT | Pridat unified email s obema platebnimi metodami |
| 5 | `src/app/[locale]/(public)/checkout/CheckoutClient.tsx` | EDIT | Pridat "Zaplatit kartou" button na transfer success stranku |
| 6 | `src/app/(app)/sales/new/NewSaleWizard.tsx` | EDIT | Sloucit TRANSFER+CARD do "Faktura" (4 misto 5 tlacitek) |
| 7 | `messages/cs.json` | EDIT | Pridat checkout i18n klice + paymentInvoice |
| 8 | `messages/uk.json` | EDIT | Pridat checkout i18n klice + paymentInvoice |
| 9 | `messages/ru.json` | EDIT | Pridat checkout i18n klice + paymentInvoice |
| 10 | `src/lib/email.ts` (volitelne) | EDIT | Podpora attachmentu v sendNotificationEmail (pro QR v emailu) |

## Edge cases

1. **Comgate selhani:** Pokud `createPayment()` selze, email se posle BEZ tlacitka "Zaplatit kartou" — jen s bankovnimi udaji. Non-fatal error.
2. **Expiry Comgate linku:** Comgate payment ma omezenou platnost. Pokud zakaznik klikne pozde, Comgate zobrazi chybu. Reseni: zakaznik zaplati prevodem (udaje ma v emailu).
3. **Dvoji platba:** Zakaznik zaplati kartou I prevodem. Comgate callback vytvori Sale automaticky. Pokud prijde i prevod, admin ho musi rucne vyresit (vratit). Toto je existujici riziko i ted.
4. **Reservation expiry:** Ponechat stavajici logiku — CARD = 30min, TRANSFER = 48h. Zakaznik vybira metodu v checkoutu, tim se urci expiry.
5. **Comgate test mode:** `COMGATE_TEST=true` — v test mode se vzdy vytvori test payment. OK pro dev.

## Rizika

1. **Comgate API rate limit:** Dvojnasobny pocet `createPayment()` volani. Overit limit.
2. **Comgate poplatky:** Kazdy `createPayment()` muze generovat poplatek pri PAID statusu. Neuhrazene = zadny poplatek.
3. **Admin CARD odebrani:** Existujici Sale s paymentType=CARD v DB zustavaji. Jen se pridava nova moznost do admin UI neni.

## Poznamky pro implementatora

- Bank account: `7141812004/5500` (Raiffeisenbank) — NE `6424423004/5500`!
- IBAN: `CZ6755000000007141812004`
- Comgate env vars: `COMGATE_MERCHANT`, `COMGATE_SECRET`, `COMGATE_TEST`
- `createPayment()` vraci `{ success, transId, redirect, error }`
- `getRetailOrderConfirmationEmail` je synchronni — QR generaci udelat PRED volanim funkce
- Testovat: objednavka s TRANSFER → email obsahuje obe moznosti
- Testovat: objednavka s CARD → email obsahuje obe moznosti + redirect na Comgate funguje
- Testovat: Comgate failure → email obsahuje jen bankovni udaje (graceful degradation)
- Testovat: admin prodej — 4 tlacitka (Faktura, Hotovost, Promo, Odpis), CARD chybi
