# TASK-070: Slevový kód při objednávce/poptávce

## Cíl
Umožnit zadání slevového kódu ve dvou flow:
1. **B2B objednávka** (salon/kadeřnice) — v katalogu salonu (`CatalogClient.tsx`)
2. **Poptávka** (koncový zákazník) — v inquiry košíku (`InquiryCartClient.tsx`)

## Předpoklad
TASK-072 (CREATE TABLE `promo_codes`) musí být dokončen před nasazením.

---

## Současný stav

### Existující infrastruktura (funguje po TASK-072)
- **Admin UI**: `/promo-codes` — `PromoCodesClient.tsx` — CRUD pro správu kódů
- **API CRUD**: `/api/promo-codes` (GET, POST) + `/api/promo-codes/[id]` (PUT, DELETE)
- **API validace**: `/api/promo-codes/validate` (POST) — přijímá `{ code, orderTotal }`, vrací `{ valid, promoId, discountType, discountValue, discountAmount }`
- **Prisma model**: `PromoCode` se všemi poli (code, discountType, discountValue, minOrderValue, maxUses, usedCount, validFrom, validTo, active)
- **Discount model**: má pole `discountCodeId String?` — připraveno pro propojení slevového kódu s prodejní slevou

### Formuláře k úpravě
1. **`src/app/(salon)/salon/catalog/CatalogClient.tsx`** — floating cart bar dole na stránce, submituje na `/api/orders`
2. **`src/app/(public)/inquiry-cart/InquiryCartClient.tsx`** — cart s kontaktním formulářem, submituje na `/api/public/inquiry`

---

## Implementační plán

### Krok 1: Komponenta PromoCodeInput (nová)

**Soubor**: `src/components/PromoCodeInput.tsx`

Reusable komponenta pro oba flow:

```tsx
interface PromoCodeInputProps {
  orderTotal?: number;           // v halere, pro výpočet slevy
  onApply: (promo: PromoResult | null) => void;
  apiEndpoint?: string;          // default "/api/promo-codes/validate"
  requireAuth?: boolean;         // true pro B2B, false pro public inquiry
}

interface PromoResult {
  promoId: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  discountAmount: number;
}
```

Funkcionalita:
- Input field + tlačítko "Použít"
- Volá `/api/promo-codes/validate` s `{ code, orderTotal }`
- Zobrazuje úspěch (zelený badge se slevou) nebo chybu (neplatný, vypršel, vyčerpán, nízká objednávka)
- Tlačítko "Odebrat" pro odebrání aplikovaného kódu
- i18n: namespace `promoCode` (nový, sdílený)

### Krok 2: Integrace do B2B objednávky (CatalogClient)

**Soubor**: `src/app/(salon)/salon/catalog/CatalogClient.tsx`

Úpravy:
1. Přidat state: `promoDiscount` (PromoResult | null)
2. Přidat `<PromoCodeInput>` do floating cart baru (mezi note input a submit button)
3. Přepočítat `cartTotal` se slevou a zobrazit:
   - Původní cena (přeškrtnutá pokud je sleva)
   - Sleva (zelený text)
   - Cena po slevě
4. Při `submitOrder` přidat `promoCode` do POST body

**Lokace v UI** (floating bar, řádek ~370-395):
```
[Cart summary]  [Note input]  [Promo code input]  [Clear]  [Submit]
```
Na mobilech: promo code v novém řádku nad submit buttonem.

### Krok 3: API objednávky — přijem promo kódu

**Soubory**:
- `src/lib/validations/salon.ts` — přidat `promoCode: z.string().optional()` do `createOrderSchema`
- `src/app/api/orders/route.ts` — přidat promo code validaci a předat do `createOrder`
- `src/lib/order-workflow.ts` — přidat parametr `promoCode`, po potvrzení objednávky inkrementovat `usedCount`

Logika:
1. Pokud `promoCode` přítomen, validovat (existuje, aktivní, platný, nepřekročen limit, min. objednávka)
2. Uložit `promoCode` do order note nebo do budoucího pole (viz níže)
3. Při přechodu objednávky do CONFIRMED (v order workflow), inkrementovat `usedCount`:
   ```ts
   await prisma.promoCode.update({
     where: { code: promoCode },
     data: { usedCount: { increment: 1 } }
   });
   ```

**DŮLEŽITÉ**: Promo sleva se při B2B objednávce NEPOČÍTÁ automaticky — B2B ceny jsou už zvýhodněné (loyalty tier + B2B discount). Promo kód se uloží jako metadata k objednávce a admin ho vidí. Skutečný přepočet ceny proběhne až při konverzi objednávky na prodej (Sale), kde se vytvoří Discount s `discountCodeId`.

### Krok 4: Integrace do poptávky (InquiryCartClient)

**Soubor**: `src/app/(public)/inquiry-cart/InquiryCartClient.tsx`

Úpravy:
1. Přidat state: `promoCode` (string | null)
2. Přidat `<PromoCodeInput>` nad kontaktní formulář (pod cart items)
3. Poptávka NEMÁ orderTotal v halere (nemá přesné ceny), takže:
   - Validace proběhne bez `orderTotal` (minOrderValue check se přeskočí)
   - Zobrazí se jen badge "Kód XY bude aplikován"
4. Při submit přidat `promoCode` do POST body

**Důležité**: Validate endpoint pro inquiry NESMÍ vyžadovat auth — inquiry je veřejný. Buď:
- a) Vytvořit `/api/public/promo-codes/validate` (kopie bez auth) — DOPORUČENO
- b) Nebo upravit stávající validate, aby fungoval i bez session

### Krok 5: API poptávky — přijem promo kódu

**Soubor**: `src/app/api/public/inquiry/route.ts`

Úpravy:
1. Přidat `promoCode: z.string().max(50).optional()` do `inquirySchema`
2. Pokud promoCode přítomen, validovat a inkrementovat `usedCount`
3. Uložit promo kód do `message` pole inquiry (jako suffix) nebo do nového pole (vyžaduje DB migraci)

**Doporučení**: Uložit promo kód do pole `internalNote` na Inquiry modelu — to je STRING a neblokuje nic:
```ts
internalNote: promoCode ? `Promo: ${promoCode}` : null,
```

### Krok 6: Nový public validate endpoint

**Nový soubor**: `src/app/api/public/promo-codes/validate/route.ts`

Kopie stávajícího `/api/promo-codes/validate/route.ts` BEZ auth kontroly + s rate limiting (stejný jako inquiry endpoint).

### Krok 7: i18n překlady

**Soubory**: `messages/cs.json`, `messages/uk.json`, `messages/ru.json`

Nový namespace `promoCode` (sdílený pro oba flow):
```json
{
  "promoCode": {
    "label": "Slevový kód",
    "placeholder": "Zadejte kód",
    "apply": "Použít",
    "remove": "Odebrat",
    "applied": "Sleva aplikována",
    "willBeApplied": "Kód bude aplikován",
    "invalid": "Neplatný kód",
    "expired": "Kód vypršel",
    "maxUses": "Kód byl vyčerpán",
    "notYetValid": "Kód ještě není platný",
    "minOrder": "Minimální objednávka nesplněna",
    "discount": "Sleva",
    "originalPrice": "Původní cena",
    "priceAfterDiscount": "Cena po slevě"
  }
}
```

---

## Seznam souborů k úpravě/vytvořit

### Nové soubory
| Soubor | Účel |
|--------|------|
| `src/components/PromoCodeInput.tsx` | Reusable input pro slevový kód |
| `src/app/api/public/promo-codes/validate/route.ts` | Veřejný validate bez auth |

### Existující soubory k editaci
| Soubor | Co změnit |
|--------|-----------|
| `src/app/(salon)/salon/catalog/CatalogClient.tsx` | Přidat PromoCodeInput do cart baru, přepočet ceny |
| `src/app/(public)/inquiry-cart/InquiryCartClient.tsx` | Přidat PromoCodeInput nad formulář |
| `src/lib/validations/salon.ts` | Přidat `promoCode` do `createOrderSchema` |
| `src/app/api/orders/route.ts` | Předat promoCode do workflow, uložit k objednávce |
| `src/lib/order-workflow.ts` | Přijmout promoCode, inkrementovat usedCount |
| `src/app/api/public/inquiry/route.ts` | Přidat promoCode do schématu a uložení |
| `messages/cs.json` | Přidat namespace `promoCode` |
| `messages/uk.json` | Přidat namespace `promoCode` |
| `messages/ru.json` | Přidat namespace `promoCode` |

---

## Schema změny (ŽÁDNÉ DB migrace potřeba)

Promo kód se ukládá:
- **K objednávce**: do pole `Order.note` jako prefix `[PROMO:KODXY] ...` (žádná DB migrace)
- **K poptávce**: do pole `Inquiry.internalNote` (existující TEXT pole)
- **K prodeji**: do `Discount.discountCodeId` (existující pole v schema) — to už řeší existující sale workflow

## Pořadí implementace

1. **PromoCodeInput** komponenta
2. **Public validate endpoint** (bez auth)
3. **CatalogClient** integrace (B2B)
4. **Validace schema + API orders** úprava
5. **InquiryCartClient** integrace (public)
6. **API inquiry** úprava
7. **i18n překlady** (cs, uk, ru)
8. **Testování** obou flow

## Rizika a poznámky

- Validate endpoint pro inquiry NESMÍ vyžadovat session — inquiry je veřejný formulář bez přihlášení
- Rate limiting na public validate endpointu je důležitý — jinak lze brute-forcovat kódy
- `usedCount` increment by měl být při CONFIRMED (B2B) nebo při CREATE (inquiry), ne při validaci
- Promo kód se v B2B objednávce neuplatní na cenu přímo — admin ho vidí a uplatní ručně při konverzi na prodej
- V poptávce je promo kód informativní — zákazník nemá přesnou cenu, jen si "zaregistruje" slevu
