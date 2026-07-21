# TASK-12: Dashboard pohyby klikací — plán

## Problém
Na dashboardu sekce "Poslední pohyby" (src/app/(app)/dashboard/page.tsx řádky 382-405) — řádky tabulky nejsou klikací, nelze z nich navigovat nikam.

## Analýza

### Aktuální stav
- Dashboard query (page.tsx:111-118) selektuje: `id, type, grams, pieces, createdAt, note, variant.lengthCm, variant.color, variant.product.name`
- **Neselektuje:** `deliveryId`, `variantId`, ani žádné ID pro navigaci
- Řádky jsou prosté `<tr>` bez odkazu

### Kam by měl odkaz vést?
**Doporučení: na `/inventory/movements`** (přehled skladových pohybů)

Důvody:
- Pohyby nemají vlastní detail stránku
- `/inventory` je přehled skladu (varianty + zásoby), ne pohyby
- Link na product detail nedává smysl z kontextu pohybů
- Nejjednodušší a nejužitečnější: celý řádek → `/inventory/movements`

**Alternativa (lepší UX):** každý řádek → `/inventory/movements` s filtrem na typ pohybu nebo produkt. Ale to by vyžadovalo implementaci filtrů na movements stránce (neexistují dosud).

## Plán implementace

### Varianta A — Jednoduchá (doporučená)
Obalit celou tabulku nebo přidat link na řádek:

```tsx
// Wrap each <tr> in clickable behavior, or add a link at the end
<tr key={m.id} className="cursor-pointer hover:bg-nude-50" onClick={() => router.push('/inventory/movements')}>
```

ALE: Dashboard page je server component. Nelze přidat onClick.

**Řešení:** Přidat `<a>` wrapper nebo `<Link>` kolem textového obsahu, NEBO:

Nejčistší varianta — použít `<a>` tag na celém řádku:
```tsx
<tr key={m.id}>
  <td colSpan={5}>
    <a href="/inventory/movements" className="...">
      {/* obsah řádku */}
    </a>
  </td>
</tr>
```

Nebo jednodušeji — přidat "Zobrazit vše" link pod tabulku (jak to dělají QuickBadge):
```tsx
<a href="/inventory/movements" className="text-sm text-rose hover:underline">
  {t("viewAll")} →
</a>
```

### Varianta B — "Zobrazit vše" link (nejjednodušší)
Přidat odkaz pod tabulku pohybů, podobně jako jsou QuickBadge linky.

```tsx
{/* Po </table> */}
<div className="mt-3 text-right">
  <a href="/inventory/movements" className="text-sm text-rose font-medium hover:underline">
    {t("viewAllMovements")} →
  </a>
</div>
```

### Doporučení
**Varianta B** je nejjednodušší a konzistentní s designem. Stačí přidat translation key `viewAllMovements` a link.

Pokud je požadavek, aby byl KAŽDÝ ŘÁDEK klikací, pak:
1. Přidat do dashboard query `variantId` select
2. Každý řádek obalit do `<a href="/inventory?highlight={variantId}">` 
3. Na inventory stránce implementovat highlight/scroll-to behavior

## Soubory k editaci
- `src/app/(app)/dashboard/page.tsx` — přidat link
- `messages/cs.json`, `messages/uk.json`, `messages/ru.json` — přidat translation key

## Priorita
Nízká — vizuální UX vylepšení, ne crash.
