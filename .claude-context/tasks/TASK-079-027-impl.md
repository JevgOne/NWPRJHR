# IMPL: TASK-079 + TASK-027

## Status: DONE

---

## TASK-079 — Prodejní karta chybí info o produktu

### Změněné soubory (2)

#### 1. src/components/sales/SaleItemRow.tsx
- Přidán `processingType?: string` do `SaleItemData` interface
- Přidáno zobrazení `{item.processingType && <span>{item.processingType}</span>}` do info řádku (mezi texture a SKU)

#### 2. src/app/(app)/sales/new/NewSaleWizard.tsx
- Přidán `processingType?: string` do `SaleItem` interface
- Přidána extrakce `processingType` z `ProductOption` v `addItemFromVariantId`
- Přidán `processingType` do obou větví vytváření položek (BY_PIECE i BY_GRAM)

---

## TASK-027 — Dashboard cache phantom data

### Změněné soubory (5)

#### 1. src/lib/db.ts
- `syncInterval: 60` → `syncInterval: 10` (Turso embedded replica sync 6x častěji)

#### 2. src/app/api/returns/[id]/approve/route.ts
- Přidán import `revalidateTag` z `next/cache`
- Přidán `revalidateTag("dashboard", "max")` po schválení vrátky

#### 3. src/app/api/returns/[id]/reject/route.ts
- Přidán import `revalidateTag` z `next/cache`
- Přidán `revalidateTag("dashboard", "max")` po zamítnutí vrátky

#### 4. src/app/api/reservations/[id]/route.ts
- Přidán import `revalidateTag` z `next/cache`
- Přidán `revalidateTag("dashboard", "max")` do case "complete" a case "cancel"

#### 5. src/app/api/cron/expire-reservations/route.ts
- Přidán import `revalidateTag` z `next/cache`
- Přidán `revalidateTag("dashboard", "max")` po expiraci (pouze když se něco expirovalo)

## Validace
- TypeScript: `npx tsc --noEmit` — PASS
