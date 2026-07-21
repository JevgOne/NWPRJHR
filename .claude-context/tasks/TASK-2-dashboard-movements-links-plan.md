# TASK-2: Dashboard pohyby klikací — plán

## Požadavek
"Kliknu na pohyb a otevře mi to tu položku tam kde je" — každý řádek v sekci "Poslední pohyby" na dashboardu má být klikací.

## Analýza

### Aktuální stav
- **Dashboard page:** `src/app/(app)/dashboard/page.tsx` (server component)
- **Movements query** (řádky 111-118): selektuje `id, type, grams, pieces, createdAt, note, variant.{lengthCm, color, product.{name}}`
- **CHYBÍ v query:** `variant.product.id` (potřeba pro link na produkt) a `deliveryId` (pro link na delivery)
- **Řádky** (382-405): prosté `<tr>` bez odkazu

### Cílová stránka pro link
**`/products/[productId]`** — existuje na `src/app/(app)/products/[id]/page.tsx`

"Kde ta položka je" = detail produktu, kde uživatel vidí varianty, stock, fotky.

Alternativně pro RECEIPT pohyby by dával smysl `/inventory/deliveries/[deliveryId]`, ale pro jednoduchost a konzistenci: všechny řádky → product detail.

## Plán implementace

### Krok 1: Rozšířit query o product.id
V `dashboard/page.tsx` řádek 116:
```typescript
// Před:
variant: { select: { lengthCm: true, color: true, product: { select: { name: true } } } },

// Po:
variant: { select: { lengthCm: true, color: true, product: { select: { id: true, name: true } } } },
```

### Krok 2: Obalit řádky do `<a>` tagu
Dashboard page je server component, takže nemůžeme použít `onClick`/`router.push`. Použijeme `<a>` tag.

Nejčistší řešení: obalit celý `<tr>` do klikatelného linku stylováním na `<tr>`:
```tsx
<tr 
  key={m.id}
  className="cursor-pointer hover:bg-nude-50 transition-colors"
  // Can't use onClick in server component
>
```

Protože je to server component, nejlepší přístup je:
- Obalit jednu z buněk (název produktu) do `<a>` tagu
- NEBO přidat CSS trik s absolutním linkem přes celý řádek

**Doporučený přístup — link na produktovém názvu + celý řádek klikací:**
```tsx
<tr key={m.id} className="relative hover:bg-nude-50 transition-colors">
  ...
  <td className="py-2.5 pr-4 text-ink">
    <a href={`/products/${m.variant.product.id}`} className="after:absolute after:inset-0">
      {m.variant.product.name} · {m.variant.color} #{m.variant.lengthCm}cm
    </a>
  </td>
  ...
</tr>
```

CSS trik `after:absolute after:inset-0` na `<a>` rozšíří klikací oblast na celý řádek, přitom zachová sémantiku. `<tr>` musí mít `relative` positioning.

### Krok 3: Přidat "Zobrazit vše" link pod tabulku
```tsx
<div className="mt-3 text-right">
  <a href="/inventory/movements" className="text-sm text-rose font-medium hover:underline">
    {t("viewAllMovements")} →
  </a>
</div>
```

### Krok 4: Translation keys
Přidat do `messages/cs.json`, `messages/uk.json`, `messages/ru.json`:
```json
// V dashboard namespace:
"viewAllMovements": "Zobrazit vše"  // cs
"viewAllMovements": "Показати все"  // uk
"viewAllMovements": "Показать все"  // ru
```

## Soubory k editaci
1. `src/app/(app)/dashboard/page.tsx` — query + template
2. `messages/cs.json` — translation key
3. `messages/uk.json` — translation key
4. `messages/ru.json` — translation key

## Priorita
Nízká — UX vylepšení.
