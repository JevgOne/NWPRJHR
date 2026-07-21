# TASK-8: Sklad — tlačítko "Smazat produkt" (hard delete)

## Požadavek
V inventáři (/inventory) přidat tlačítko pro **trvalé smazání produktu** — odstraní produkt, varianty, dodávky, pohyby a vše související.

## Analýza

### Aktuální stav
- Existující DELETE `/api/products/[id]` (řádek 145-171) **pouze archivuje** (`archived: true`) — nesmaže nic
- InventoryClient.tsx zobrazuje tabulku variant se stock daty, kliknutí na řádek → `/products/{id}`
- Filtr `showSoldOut` umožňuje zobrazit i vyprodané varianty
- Role check: tabulka ukazuje reserved sloupec jen pro OWNER

### FK relace — kaskáda smazání

```
Product
  ├── Variant (onDelete: Cascade) ← automaticky
  │     ├── Delivery (NO cascade) ← musíme smazat
  │     │     └── StockMovement (NO cascade) ← musíme smazat
  │     ├── Reservation (NO cascade) ← musíme smazat
  │     ├── SaleItem (NO cascade) ← BLOKUJE mazání
  │     ├── OrderItem (NO cascade) ← BLOKUJE mazání
  │     ├── ProductReservation (NO cascade) ← musíme smazat/odpojit
  │     └── StockSubscription (onDelete: Cascade) ← automaticky
  ├── SampleRequest (NO cascade) ← musíme smazat
  └── Review (NO cascade, nullable productId) ← nullify
```

**DŮLEŽITÉ:** `SaleItem` a `OrderItem` referencují `variantId` BEZ cascade. Pokud produkt má historii prodejů/objednávek, nemůžeme variantu smazat bez porušení FK.

### Strategie mazání

**Dvě varianty:**

**A) Hard delete jen pro produkty BEZ prodejů/objednávek** (doporučeno)
- Kontrola: existují SaleItems nebo OrderItems s variantId tohoto produktu?
- ANO → vrátit chybu "Produkt má historii prodejů, nelze smazat — pouze archivovat"
- NE → kaskádově smazat vše

**B) Hard delete vždy — nullify FK v sale_items/order_items**
- Rizikovější — ztráta dat v historii prodejů
- Vyžaduje schema změnu (variantId nullable)

**Doporučení: Varianta A** — bezpečnější, zachovává integritu dat.

### Pořadí mazání (Varianta A — hard delete)

Musí být v transakci, v tomto pořadí (kvůli FK):

```
1. StockMovement    WHERE variantId IN (variant IDs)
2. Delivery         WHERE variantId IN (variant IDs)
3. Reservation      WHERE variantId IN (variant IDs)
4. StockSubscription WHERE variantId IN (variant IDs)  ← má onDelete:Cascade, ale explicitně pro jistotu
5. ProductReservation WHERE variantId IN (variant IDs)  ← odpojit nebo smazat
6. SampleRequest    WHERE productId = {id}
7. Review           WHERE productId = {id}  → SET productId = NULL (nullable)
8. InquiryItem      WHERE productId = {id}  → smazat (nemá FK na Product, jen string reference)
9. Variant          WHERE productId = {id}  ← automaticky přes cascade, ale explicitně
10. Product          WHERE id = {id}
```

**Pre-check (PŘED transakcí):**
```sql
SELECT COUNT(*) FROM sale_items si 
  JOIN variants v ON si.variantId = v.id 
  WHERE v.productId = {id};

SELECT COUNT(*) FROM order_items oi 
  JOIN variants v ON oi.variantId = v.id 
  WHERE v.productId = {id};
```
Pokud > 0 → ODMÍTNOUT smazání s chybou.

## Plán implementace

### Krok 1: API endpoint — hard delete

Soubor: `src/app/api/products/[id]/route.ts`

Přidat nový endpoint nebo rozšířit DELETE. Doporučení: **přidat query param** `?hard=true` k existujícímu DELETE:

```typescript
export async function DELETE(request, { params }) {
  // ... auth + OWNER check (existující)
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const hard = searchParams.get("hard") === "true";

  if (!hard) {
    // Existující soft delete (archive)
    // ... stávající kód
  }

  // Hard delete flow
  const variantIds = await prisma.variant.findMany({
    where: { productId: id },
    select: { id: true },
  }).then(vs => vs.map(v => v.id));

  if (variantIds.length === 0) {
    // Product without variants — just delete
    await prisma.product.delete({ where: { id } });
    revalidateTag("products", "max");
    revalidateTag("stock", "max");
    return NextResponse.json({ deleted: true });
  }

  // Pre-check: sales and orders
  const [saleItemCount, orderItemCount] = await Promise.all([
    prisma.saleItem.count({ where: { variantId: { in: variantIds } } }),
    prisma.orderItem.count({ where: { variantId: { in: variantIds } } }),
  ]);

  if (saleItemCount > 0 || orderItemCount > 0) {
    return NextResponse.json({
      error: "Produkt má historii prodejů nebo objednávek. Použijte archivaci.",
      salesCount: saleItemCount,
      ordersCount: orderItemCount,
    }, { status: 409 });
  }

  // Cascade delete in transaction
  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.deleteMany({ where: { variantId: { in: variantIds } } });
    await tx.delivery.deleteMany({ where: { variantId: { in: variantIds } } });
    await tx.reservation.deleteMany({ where: { variantId: { in: variantIds } } });
    await tx.stockSubscription.deleteMany({ where: { variantId: { in: variantIds } } });
    await tx.productReservation.deleteMany({ where: { variantId: { in: variantIds } } });
    await tx.sampleRequest.deleteMany({ where: { productId: id } });
    await tx.review.updateMany({ where: { productId: id }, data: { productId: null } });
    // InquiryItem has productId as plain String (no FK) — safe to leave or delete
    await tx.variant.deleteMany({ where: { productId: id } });
    await tx.product.delete({ where: { id } });
  }, { timeout: 30000 });

  revalidateTag("products", "max");
  revalidateTag("stock", "max");
  return NextResponse.json({ deleted: true });
}
```

### Krok 2: UI — tlačítko smazat v InventoryClient.tsx

**Umístění:** Po vybrání variant checkboxem — vedle tlačítka "Tisk štítků" v summary baru (řádek 269-279). Alternativně: na každém řádku vedle QR tlačítka.

**Doporučení:** Tlačítko v summary baru — funguje na vybrané produkty:

Za print labels button (řádek 278), přidat:

```tsx
{role === "OWNER" && selected.size > 0 && (
  <button
    onClick={() => setDeleteConfirm(true)}
    className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5"
  >
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
    {t("deleteProduct")}
  </button>
)}
```

### Krok 3: Confirmation dialog

Nový state:
```typescript
const [deleteConfirm, setDeleteConfirm] = useState(false);
const [deleting, setDeleting] = useState(false);
const [deleteError, setDeleteError] = useState("");
```

Dialog (modal):
```tsx
{deleteConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteConfirm(false)}>
    <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-lg font-bold text-red-600 mb-2">{t("deleteConfirmTitle")}</h3>
      <p className="text-sm text-muted mb-4">
        {t("deleteConfirmText", { count: selectedProductIds.length })}
      </p>
      <p className="text-xs text-red-500 mb-4">{t("deleteConfirmWarning")}</p>
      {deleteError && <p className="text-sm text-red-600 mb-3">{deleteError}</p>}
      <div className="flex gap-3">
        <button onClick={() => setDeleteConfirm(false)}
          className="flex-1 py-2 border border-line rounded-lg text-sm text-muted hover:bg-nude-50">
          {tCommon("cancel")}
        </button>
        <button onClick={handleDelete} disabled={deleting}
          className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">
          {deleting ? "..." : t("deleteConfirmButton")}
        </button>
      </div>
    </div>
  </div>
)}
```

### Krok 4: Delete handler

Smazání funguje na úrovni PRODUKTU (ne varianty). Potřeba extrahovat unikátní productId z vybraných variant:

```typescript
const selectedProductIds = useMemo(() => {
  const ids = new Set<string>();
  filtered.filter(i => selected.has(i.variantId)).forEach(i => ids.add(i.product.id));
  return [...ids];
}, [filtered, selected]);

const handleDelete = async () => {
  setDeleting(true);
  setDeleteError("");
  try {
    for (const productId of selectedProductIds) {
      const res = await fetch(`/api/products/${productId}?hard=true`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
    }
    setDeleteConfirm(false);
    setSelected(new Set());
    router.refresh();
  } catch (err) {
    setDeleteError(err instanceof Error ? err.message : "Chyba při mazání");
  } finally {
    setDeleting(false);
  }
};
```

### Krok 5: Překlady

**messages/cs.json** — do sekce `"stock"`:
```json
"deleteProduct": "Smazat produkt",
"deleteConfirmTitle": "Opravdu smazat?",
"deleteConfirmText": "Tím se trvale smaže {count} produkt(ů) včetně všech variant, dodávek a skladových pohybů.",
"deleteConfirmWarning": "Tato akce je nevratná!",
"deleteConfirmButton": "Smazat trvale",
"deleteBlocked": "Produkt má historii prodejů nebo objednávek. Použijte archivaci."
```

messages/uk.json a messages/ru.json — ekvivalenty.

### Krok 6: Audit log

V API DELETE handleru (po úspěšném smazání):
```typescript
logAudit({
  userId: session.user.id,
  userEmail: session.user.email ?? undefined,
  action: "HARD_DELETE",
  entity: "Product",
  entityId: id,
  detail: { variantCount: variantIds.length, productName: product.name },
  ipAddress: getClientIp(request),
});
```

## Soubory k editaci

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `src/app/api/products/[id]/route.ts` | Rozšířit DELETE — `?hard=true` pro kaskádové smazání |
| 2 | `src/app/(app)/inventory/InventoryClient.tsx` | Tlačítko smazat + confirm dialog + delete handler |
| 3 | `messages/cs.json` | Překlady (6 klíčů) |
| 4 | `messages/uk.json` | Překlady (UK) |
| 5 | `messages/ru.json` | Překlady (RU) |

## Bezpečnostní opatření

1. **Jen OWNER** — role check v API (existující) + UI schovává tlačítko pro non-OWNER
2. **Pre-check prodejů** — API odmítne smazání produktu s historií prodejů/objednávek (HTTP 409)
3. **Confirmation dialog** — uživatel musí potvrdit smazání
4. **Audit log** — HARD_DELETE akce je logována
5. **Transakce** — buď se smaže vše, nebo nic (atomicita)
6. **InquiryItem** — nemá FK na Product (plain String), zůstane v DB jako sirotčí záznam (přijatelné — historická data poptávek)

## Priorita
Střední — funkční požadavek, ne bug.
