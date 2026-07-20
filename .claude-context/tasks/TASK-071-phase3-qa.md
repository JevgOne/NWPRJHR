# TASK-071 QA Report — Fáze 3 (Suspense + composite index)

**Commit:** 7f8422f
**Datum QA:** 2026-07-14
**QA provedl:** Kontrolor

---

## ✅ Co je hotové a odpovídá zadání

### 3.1 Related products — Suspense server component

**`src/app/[locale]/(public)/offer/[...slug]/page.tsx`:**

- `RelatedProducts` vyextrahována jako `async function RelatedProducts({...})` — async server komponenta ✅
- Props: `productId`, `category`, `origin`, `texture`, `colorTone` — odpovídá plánu ✅
- Interně volá `getTranslations("public")` pro i18n ✅
- Používá `getCachedRelatedCandidates(productId)` z Fáze 1 ✅
- Scoring logika (category +3, origin +2, texture +1, colorTone +1) zachována ✅
- Zobrazuje max 4 produkty, renderuje přes `flattenProductVariants` + `ProductGridCard` ✅
- Early return `null` pokud žádné related produkty ✅

**Suspense wrapper v hlavním renderu:**
```tsx
<Suspense fallback={<div className="mt-12 pt-8 border-t border-line h-48 animate-pulse bg-nude-50 rounded-2xl" />}>
  <RelatedProducts productId={...} category={...} origin={...} texture={...} colorTone={...} />
</Suspense>
```
- Skeleton fallback přítomen ✅
- Odpovídá plánu sekce 3.2 ✅

### 3.2 Composite index na Sale modelu

**`prisma/schema.prisma`:**
- `@@index([status, completedAt])` přidán na Sale model ✅
- Existující samostatné indexy `@@index([status])` a `@@index([completedAt])` zachovány ✅
- Odpovídá plánu sekce 3.3 (v plánu pojmenován 3.3, task popisuje jako 3.2) ✅

**Poznámka k migraci:** Impl report uvádí, že index vyžaduje manuální SQL na Turso (`CREATE INDEX idx_sales_status_completedAt ON sales (status, completedAt)`). Toto je mimo scope kódu — nutno provést ručně nebo přes Vercel/Turso dashboard.

---

## ❌ Co chybí nebo neodpovídá

Nic chybějícího v rámci Fáze 3.

---

## ⚠️ Co potřebuje pozornost

### Composite index — migrace na produkci

Index je definován v `schema.prisma` ale Turso (libsql) nevyžaduje/neprovádí automatické migrace přes `prisma db push` stejně jako SQL DB. Impl report správně upozorňuje na nutnost manuálního SQL příkazu na Turso. Toto je akční bod pro nasazení — bez něj index v DB neexistuje.

### TypeScript: 0 chyb

`npx tsc --noEmit` → prázdný výstup = 0 chyb ✅

---

## Verdikt

**Fáze 3: SCHVÁLENA** ✅

`RelatedProducts` správně vyextrahována do Suspense-wrapped async server komponenty. Composite index přidán do schema. TypeScript 0 chyb.

**Akční bod pro nasazení:** Spustit `CREATE INDEX idx_sales_status_completedAt ON sales (status, completedAt)` na Turso DB.
