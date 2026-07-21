# TASK-1: Skladové pohyby padají — analýza a plán opravy

## Problém
Stránka `/inventory/movements` zobrazuje "Něco se pokazilo" (globální error.tsx boundary).

## Analýza

### Soubory
- **Server component:** `src/app/(app)/inventory/movements/page.tsx`
- **Client component:** `src/app/(app)/inventory/movements/MovementsClient.tsx`
- **Stock-in flow:** `src/lib/stock-in.ts`
- **Error boundary:** `src/app/error.tsx` (globální, zobrazuje "Něco se pokazilo")

### Zjištěné příčiny

#### 1. HLAVNÍ PŘÍČINA (POTVRZENO z Vercel logů): Neplatný enum "SALE" ve StockMovementType

```
Error [PrismaClientKnownRequestError]: 
Invalid `prisma.stockMovement.findMany()` invocation:
Value 'SALE' not found in enum 'StockMovementType'
```

V databázi existuje stock movement s `type = "SALE"`, ale Prisma enum `StockMovementType` (schema:243-251) obsahuje pouze:
`RECEIPT, ISSUE, RETURN, COMPLAINT, SAMPLE_OUT, SAMPLE_RETURN, ADJUSTMENT`

**Kde se "SALE" vzalo:**
- Žádný aktuální kód NEVYTVÁŘÍ movement s typem "SALE"
- Sale flow (`src/lib/sales.ts`) volá `fifoDeduct()` → `src/lib/fifo.ts:119` → vytváří typ `"ISSUE"`
- "SALE" je **legacy/orphan data** z dřívější verze kódu

**Rozhodnutí: OPRAVIT DATA na "ISSUE", NE přidávat SALE do enum**
Důvody:
- Žádný kód SALE nevytváří — přidání do enum by vytvořilo mrtvý typ
- SALE je sémanticky totožné s ISSUE (výdej ze skladu při prodeji)
- UI (`MovementsClient.tsx`) nemá label/barvu pro SALE
- Dva typy pro totéž = zmatek

#### 2. SEKUNDÁRNÍ PŘÍČINA: `pieces Int` bez defaultu ve StockMovement (schema:367)

V Prisma schématu je `pieces Int` na StockMovement povinné, **bez defaultní hodnoty**.
Pokud byl tento sloupec přidán později (při implementaci BY_PIECE), starší záznamy v SQLite mají `NULL` pro `pieces`.

Prisma při čtení `Int` (non-optional) pole s hodnotou NULL v DB vyhodí runtime error:
```
Error: Invalid value for field 'pieces': expected Int, got null
```

Totéž platí pro Delivery model:
- `initialPieces Int` (schema:316) — bez default
- `remainingPieces Int` (schema:320) — bez default

**Query na movements page (page.tsx:16-31)** neprovádí žádné WHERE filtrování, takže `take: 100` stáhne i staré záznamy bez `pieces`.

#### 2. SEKUNDÁRNÍ: Žádný error handling v server componentu

`page.tsx` nemá try-catch ani error boundary na úrovni stránky. Jakákoliv chyba v Prisma query se propaguje do globálního error.tsx.

#### 3. revalidateTag — NENÍ problém

`revalidateTag("dashboard", "max")` je validní syntax. Next.js v tomto projektu přijímá 2 argumenty: `(tag: string, profile: string | CacheLifeConfig)`. Druhý argument `"max"` je cache life profile.

#### 4. m.delivery.barcode — NENÍ problém

- `deliveryId` je povinný `String` (ne optional) v schema
- `delivery.barcode` je `String?` (nullable), ale code správně řeší null: `m.deliveryBarcode ?? "-"` v MovementsClient:84
- Server serialization `m.delivery.barcode` (page.tsx:41) přiřadí null do `deliveryBarcode: string | null`

### Kontrola integrity dat — všechny FK relations:
- `StockMovement.deliveryId` → `Delivery` — povinné, no cascade delete ✓
- `StockMovement.variantId` → `Variant` — povinné, no cascade delete ✓  
- `StockMovement.userId` → `User` — povinné, no cascade delete ✓
- `Delivery.barcode` — nullable (String?) — OK, handled

## Plán opravy

### Krok 1: Opravit existující data v DB (KRITICKÉ — bez toho nic nefunguje)
Spustit SQL fix pro legacy data:
```sql
-- FIX #1: Přepsat neplatný typ SALE na ISSUE
UPDATE stock_movements SET type = 'ISSUE' WHERE type = 'SALE';

-- FIX #2: Opravit NULL pieces
UPDATE stock_movements SET pieces = 0 WHERE pieces IS NULL;

-- FIX #3: Opravit NULL pieces v deliveries
UPDATE deliveries SET initialPieces = 0 WHERE initialPieces IS NULL;
UPDATE deliveries SET remainingPieces = 0 WHERE remainingPieces IS NULL;
```

**POZOR:** Pokud běží na Turso (remote), SQL fix musí jít přes Turso CLI/dashboard, ne lokálně.
Pokud dev.db (lokálně): `sqlite3 prisma/dev.db < fix.sql`

### Krok 2: Přidat default value do Prisma schema (prevence do budoucna)
```prisma
model StockMovement {
  pieces      Int       @default(0)
  ...
}

model Delivery {
  initialPieces   Int   @default(0)
  remainingPieces Int   @default(0)
  ...
}
```

### Krok 3: Defenzivní serialization v page.tsx
Přidat null-safe přístup v serialization pro jistotu:
```typescript
const serialized = movements.map((m) => ({
  id: m.id,
  type: m.type,
  grams: m.grams,
  pieces: m.pieces ?? 0,        // defensive
  note: m.note,
  createdAt: m.createdAt.toISOString(),
  user: m.user,
  deliveryBarcode: m.delivery?.barcode ?? null,   // defensive
  deliveryId: m.delivery?.id ?? "",               // defensive
  variant: {
    lengthCm: m.variant?.lengthCm ?? 0,
    color: m.variant?.color ?? "",
    productName: m.variant?.product?.name ?? "?",
  },
}));
```

### Krok 4: Push schema changes
```bash
npx prisma db push
```

## Priorita
KRITICKÁ — stránka je kompletně nefunkční.

## Poznámky
- Dashboard query (page.tsx:111-118) pro `recentMovements` neincluduje `delivery`, takže tam pieces problém nevznikne, ale `pieces` se tam ani neselektuje.
- Pokud se jedná o Turso (remote), SQL fix musí běžet přes Turso CLI nebo dashboard.

---

# Problém 2: Culíky neviditelné ve skladu

## Analýza

### Co se děje na /inventory stránce
1. `page.tsx` fetchne ALL active variants přímo z Prisma (not cached) → OK
2. `getAllStockNumbers()` fetchne stock čísla přes `unstable_cache` (tag: "stock", revalidate: 60s)
3. Items se zmapují: variant + stock numbers → pokud stock není v mapě → `physicalGrams: 0, availableGrams: 0`
4. **InventoryClient filtr (řádek 140):** `if (!showSoldOut && item.availableGrams <= 0) return false;`
5. `showSoldOut` defaults to `false`

### Možné příčiny (seřazeno dle pravděpodobnosti)

#### 1. PRAVDĚPODOBNÁ: Stale stock cache + sold-out filter
Pokud `unstable_cache` nevrátil čerstvá data (i přes `invalidateStockCache()`):
- Nová varianta se zobrazí v seznamu (fresh from DB)
- Ale `allStock.get(v.id)` vrátí `undefined` → physicalGrams=0, availableGrams=0
- Filter `!showSoldOut && availableGrams <= 0` → skryje ji jako "vyprodanou"
- **FIX:** Zapnutí "Zobrazit vyprodané" by ji ukázalo

Invalidation chain je: `stockIn()` → `invalidateStockCache()` → `revalidateTag("stock", "max")` a pak route → `revalidatePath("/inventory")`. Mělo by to fungovat. ALE pokud `revalidateTag` selže (je wrapped v try-catch, line 169), cache zůstane stale.

#### 2. MÉNĚ PRAVDĚPODOBNÁ: Delivery má NULL remainingPieces
Stejný problém jako u movements — pokud `remainingPieces` je NULL v DB, raw SQL query (stock.ts:90-97) to řeší přes `COALESCE(SUM(remainingPieces), 0)` → 0. Ale `remainingGrams` by mělo být OK (nastaveno v stockIn).

Pro BY_PIECE stock-in: `effectiveTotalGrams = totalPieces × pieceWeightGrams` (deliveries/route.ts:196-198). Pokud pieceWeight=50 a pieces=2, totalGrams=100. Delivery bude mít remainingGrams=100. Takže by se mělo zobrazit.

#### 3. MÉNĚ PRAVDĚPODOBNÁ: ACCESSORY kategorie chybí ve filtrech
`InventoryClient.tsx:28` → `CATEGORIES = ["ALL", "VIRGIN", "LUXE", "STANDARD", "SALE"]`
Chybí "ACCESSORY". Pokud by culíky byly ACCESSORY, nešly by filtrovat. ALE "ALL" filter je default → zobrazí vše. Takže to není příčina neviditelnosti, jen chybějící filter tab.

### Plán opravy

#### Krok 1: Schema default fix (stejný jako problém 1)
Přidat `@default(0)` na `pieces` fieldy a opravit existující NULL data.

#### Krok 2: Defenzivní filter v InventoryClient
Změnit filter aby nebral items s `availablePieces > 0` jako sold-out:
```typescript
// Před:
if (!showSoldOut && item.availableGrams <= 0) return false;

// Po:
if (!showSoldOut && item.availableGrams <= 0 && item.availablePieces <= 0) return false;
```

#### Krok 3: Přidat ACCESSORY do CATEGORIES filtru
```typescript
const CATEGORIES = ["ALL", "VIRGIN", "LUXE", "STANDARD", "SALE", "ACCESSORY"] as const;
```

#### Krok 4: Ověřit invalidateStockCache funguje
Přidat logging nebo verifikovat, že `revalidateTag("stock", "max")` skutečně invaliduje cache. Případně po stock-in volat `invalidateStockCache()` i v route handleru přímo (ne jen uvnitř stockIn funkce).
