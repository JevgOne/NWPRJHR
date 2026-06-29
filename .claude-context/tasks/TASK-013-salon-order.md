# TASK #13 — BUG: Salon/kadernice nemuze odeslat objednavku

**Datum:** 2026-06-28
**Agent:** planovac

---

## SOUHRN

Objednavkovy flow pro salony a kadernice je implementovan kompletne. Kod je syntakticky a logicky korektni. Problem je pravdepodobne v DATECH, ne v kodu — konkretne:

1. **Salon nema naskladnene varianty** → katalog je prazdny (filtruji se jen `availableGrams > 0`)
2. **User nema nastaveny `salonId`** → API vraci 403 "Salon account not linked"
3. **Salon neni schvaleny** → login blokovan v auth.ts
4. **LoyaltySettings neexistuji** → `getLoyaltyDiscount` vrati 0 (padne potichu, neni fatalni)

---

## FLOW ANALYZA

### 1. Salon se prihlasi
- `src/lib/auth.ts` r.55-61: Kontrola `approved` — neprihlasi neschvaleny salon
- Session ma `salonId` (r.89, 96) — MUSI byt nastaveny na User zaznamu

### 2. Salon jde do katalogu
- URL: `/salon/catalog` → `src/app/(salon)/salon/catalog/CatalogClient.tsx`
- Vola: `GET /api/salon-portal/catalog` → `src/app/api/salon-portal/catalog/route.ts`

### 3. Katalog API (KRITICKE MISTO)
- r.13-16: Kontrola role + salonId — **vraci 403 pokud salonId chybi**
- r.18: `salon.findUniqueOrThrow` — **padne pokud salon neexistuje v DB**
- r.48-76: Pro KAZDOU variantu vola `getStockNumbers()` — **N+1 problem, POMALE**
- r.79: Filtruje `availableGrams > 0` — **pokud nic neni naskladnene, katalog je prazdny**
- r.80: Filtruje produkty s 0 variantami — **prazdny katalog = nic k objednani**

### 4. Salon prida do kosiku a odesle
- `CatalogClient.tsx` r.105-134: `submitOrder()` vola `POST /api/orders`
- `src/app/api/orders/route.ts` r.61-114: 
  - r.77: `session.user.salonId` MUSI existovat, jinak 403
  - r.91: `createOrder(salonId, items, note)`

### 5. Vytvoreni objednavky
- `src/lib/order-workflow.ts` r.26-106: `createOrder()`
  - r.32-33: `salon.findUniqueOrThrow` — **padne pokud salon neexistuje**
  - r.36-38: Kontrola `archived` — **zamitne archivovany salon**
  - r.40: `getLoyaltyDiscount` — potrebuje LoyaltySettings v DB
  - r.62-64: **Kontrola skladu** — `availableGrams < item.grams` → `InsufficientStockError`
  - r.92-101: Vytvori Order + OrderItem + Reservation v transakci

---

## MOZNE PRICINY "NEMUZE ODESLAT OBJEDNAVKU"

### Pricina A: Prazdny katalog (NEJPRAVDEPODOBNEJSI)
**Proc:** Zadne varianty nemaji `availableGrams > 0` (nic neni naskladnene)
**Efekt:** Katalog ukazuje "Zadne produkty" — neni co objednat
**Jak overit:** Zkontrolovat v DB `SELECT COUNT(*) FROM deliveries WHERE remainingGrams > 0`
**Reseni:** Naskladnit zbozi pres `/inventory/stock-in`

### Pricina B: User nema salonId
**Proc:** Uzivatel s role SALON/HAIRDRESSER nema v DB `users.salonId` nastaven
**Efekt:** `POST /api/orders` vraci 403 "Salon account not linked. Contact support."
**Jak overit:** `SELECT id, email, role, salonId FROM users WHERE role IN ('SALON', 'HAIRDRESSER')`
**Reseni:** V DB nastavit `salonId` na spravny salon

### Pricina C: Salon neni schvaleny
**Proc:** `salons.approved = false`
**Efekt:** Login se nepovedede (auth.ts r.60 vraci null) — uzivatel se neprihlasi
**Jak overit:** `SELECT id, name, approved FROM salons`
**Reseni:** Schvalit salon v admin panelu `/registrations`

### Pricina D: Nedostatecny sklad
**Proc:** Uzivatel chce objednat vice gramu nez je dostupnych
**Efekt:** `POST /api/orders` vraci 400 "Insufficient stock: grams requested=X available=Y"
**Jak overit:** Error message v CatalogClient.tsx se zobrazi v cervenem boxu nad kosikem
**Reseni:** Naskladnit vice

### Pricina E: LoyaltySettings chybi (MALA PRAVDEPODOBNOST)
**Proc:** `loyaltySettings` tabulka je prazdna
**Efekt:** `getLoyaltyDiscount` vraci 0 → ceny budou wholesalePricePerGram bez slevy → neni fatalni
**Jak overit:** `SELECT * FROM loyalty_settings`
**Reseni:** Spustit seed nebo pridat manualne

---

## KRITICKE ZJISTENI: N+1 PERFORMANCE BUG v katalogu

**Soubor:** `src/app/api/salon-portal/catalog/route.ts` r.48-76

```typescript
// Pro KAZDOU variantu se vola getStockNumbers() zvlast!
const allVariants = await Promise.all(
  product.variants.map(async (v) => {
    const stock = await getStockNumbers(v.id);  // ← QUERY na KAZDOU variantu
    ...
  })
);
```

Pri 50 produktech × 10 variantech = **500 SQL dotazu** na jedno nacteni katalogu!

**FIX:** Pouzit `getAllStockNumbers()` (uz existuje v `src/lib/stock.ts` r.74-129) misto `getStockNumbers()` pro kazdou variantu. Stejny pattern jako v public products API (`src/app/api/public/products/route.ts` r.75).

```typescript
// SPRAVNE:
const stockMap = await getAllStockNumbers();
// pak pro kazdou variantu:
const stock = stockMap.get(v.id);
```

---

## SOUBORY K UPRAVE

| Soubor | Akce | Priorita |
|--------|------|----------|
| `src/app/api/salon-portal/catalog/route.ts` | Nahradit N+1 `getStockNumbers()` za `getAllStockNumbers()` | VYSOKA |

---

## DOPORUCENY POSTUP

1. **PRVNI: Overit data** — zkontrolovat v produkci jestli existuji:
   - Naskladnene dodavky (`deliveries.remainingGrams > 0`)
   - Uzivatel s role SALON a nastavenym salonId
   - Schvaleny salon (`salons.approved = true`)
   - LoyaltySettings

2. **DRUHY: Opravit N+1 bug** v catalog route — neni pricina "nemuze odeslat", ale zpusobuje pomale nacteni katalogu

3. **TRETI: Pridat lepsi error handling** — CatalogClient.tsx ukazuje genericke "orderError" ale nerozlisuje 403 vs 400 vs 500

---
