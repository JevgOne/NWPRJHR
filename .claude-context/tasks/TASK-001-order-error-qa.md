# QA Report: Fix salon catalog order error "The string did not match the expected pattern"

**Datum:** 2026-06-28
**Kontrolor:** KONTROLOR agent
**Status:** PASS

---

## 1. Root cause ověření

Plán identifikoval správnou příčinu: `session.user.salonId!` (non-null assertion) na řádku 77 způsobovalo, že `null` byl předán do `createOrder()` → Prisma → LibSQL → "The string did not match the expected pattern".

## 2. Fix ověření

**Soubor:** `src/app/api/orders/route.ts:76-86`

Fix je v kódu a správně implementuje plán:

```typescript
if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
    if (!session.user.salonId) {
      return NextResponse.json({ error: "Salon account not linked. Contact support." }, { status: 403 });
    }
    salonId = session.user.salonId;   // <-- bez non-null assertion
}
```

- Non-null assertion (`!`) odstraněn ✅
- Explicitní guard clause vrací 403 pro null salonId ✅
- Jasná chybová zpráva pro uživatele (ne kryptický DB error) ✅

## 3. TypeScript

```
npx tsc --noEmit → žádné errory
```

✅ Prochází

## 4. Hardcoded stringy

**Nalezeny** v `src/app/api/orders/route.ts:98-99`:
```typescript
title: `Nova objednavka: ${salon?.name ?? ""}`,
message: `Salon "${salon?.name ?? ""}" vytvoril novou objednavku (${parsed.data.items.length} polozek).`,
```

Tyto stringy jsou v server-side notifikaci (admin notifikace), nikoli v user-facing UI. Nejde o překlady přes next-intl — jde o interní notifikace pro OWNER role. **Nízká priorita**, ale technicky se jedná o hardcoded češtinu.

## 5. Security

- Null salonId je správně ošetřen před dosažením DB
- OWNER/EMPLOYEE musí explicitně poslat salonId v body ✅
- Salon users nemohou objednat pro jiný salon (salonId z session, ne z body) ✅
- Zod validace probíhá před kontrolou salonId ✅

## 6. Konzistence UI

CatalogClient (`src/app/(salon)/salon/catalog/CatalogClient.tsx`) správně zobrazuje error z API:
```typescript
setOrderError(e instanceof Error ? e.message : t("orderError"));
```
Nyní zobrazí "Salon account not linked. Contact support." místo "The string did not match the expected pattern" ✅

## 7. Porovnání s plánem

| Plán | Status |
|------|--------|
| Přidat null guard pro `session.user.salonId` | ✅ |
| Odstranit non-null assertion | ✅ |
| Vrátit 403 s jasnou chybou | ✅ |
| Zod validace nezměněna | ✅ |
| CatalogClient nemusí být změněn | ✅ |

## Verdikt

**PASS.** Fix je správně implementován. TypeScript prochází. Chyba "The string did not match the expected pattern" je opravena — nyní se vrátí čitelná 403 chyba pro salon účty bez propojeného salonId. Jeden low-priority nález: hardcoded česky notifikační text (není user-facing, pouze admin notifikace).
