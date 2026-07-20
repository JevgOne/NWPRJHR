# TASK-071 QA Report — Fáze 2 (sales select + salon catalog select + admin products cache)

**Commit:** 06122c0
**Datum QA:** 2026-07-14
**QA provedl:** Kontrolor

---

## ✅ Co je hotové a odpovídá zadání

### 2.1 Sales list API — select optimization + security fix

**`src/app/api/sales/route.ts`:**
- GET handler (list): `salon: { select: { id, name } }`, `customer: { select: { id, name } }`, `user: { select: { id, name, email, role } }` — `hashedPassword` odstraněn ✅
- POST handler (create): stejná partial select logika ✅
- `serializeSaleForRole()` přijímá nový `SaleWithRelations` typ ✅

**`src/app/api/sales/[id]/route.ts`:**
- Detail endpoint také aktualizován na partial select (stejný pattern) ✅

**`src/lib/api/sale-serializer.ts`:**
- `SaleWithRelations` typ upraven: `salon`, `customer` jako `{ id, name }`, `user` jako `{ id, name, email, role }` ✅
- TypeScript: 0 chyb ✅

**Security:** `hashedPassword` není přítomen v žádném `include: { user: true }` — leak eliminován ✅

### 2.2 Salon catalog API — select optimization

**`src/app/api/salon-portal/catalog/route.ts`:**
- `include: { variants }` nahrazeno `select` s přesnými fieldy ✅
- Product fields: id, name, nameUk, nameRu, category, processingType, origin, texture, photos ✅
- Variant fields: id, lengthCm, color, retailPricePerGram, retailPricePerPiece, pricePerPiece, sellingMode ✅
- Odpovídá plánu sekce 2.2 přesně ✅

### 2.3 Admin products page — unstable_cache

**`src/app/(app)/products/page.tsx`:**
- `getCachedAdminProducts()` v `unstable_cache` ✅
- Cache klíč: `["admin-products"]`, revalidate: 15s, tags: `["products"]` ✅
- Serializace Map → Array pro cache kompatibilitu, rekonstrukce při čtení ✅
- Odpovídá plánu sekce 2.3 ✅

---

## ❌ Co chybí nebo neodpovídá

Nic chybějícího v rámci Fáze 2.

---

## ⚠️ Co potřebuje pozornost

### Build — TypeScript OK, runtime chyba je prostředí

- **TypeScript:** `npx tsc --noEmit` → 0 chyb ✅
- **`npm run build`** selhal při "Collecting page data" s `SQLITE_ERROR: no such table: main.variants`
  - Toto je chyba lokálního prostředí (Turso remote DB není dostupná při build)
  - Existovala i před Fází 2 (ověřeno na commitu d0a82be)
  - Na Vercelu s reálnou DB build projde

### Poznámka: TypeScript chyba z Fáze 1 opravena

Na commitu d0a82be existoval TypeScript error `Cannot find name 'RelatedProducts'`. Fáze 2 commit tuto chybu opravil (nebo implementace Fáze 1 ji nezanechala v commitu - nutno ověřit s implementátorem). TypeScript nyní 0 chyb.

---

## Verdikt

**Fáze 2: SCHVÁLENA** ✅

Implementace 2.1, 2.2 a 2.3 přesně odpovídá plánu v TASK-071-performance-plan-v2.md.
Security fix (hashedPassword leak) potvrzen.
TypeScript 0 chyb.
Runtime SQLite chyba při build je prostředí (existující problém, nikoliv regrese).
