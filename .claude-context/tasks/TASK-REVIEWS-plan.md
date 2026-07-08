# TASK: Reviews/Ratings — zákaznické recenze na produkty

**Status:** Plan ready
**Datum:** 2026-07-06

## Stávající stav

### Co UŽ funguje
1. **Review model v Prisma** — kompletní schema s rating, ratingQuality/Communication/Speed, source (MANUAL/GOOGLE/INSTAGRAM), productId vazba, featured/active flags
2. **Admin správa** — `src/app/(app)/reviews/ReviewsClient.tsx` — plnohodnotný CRUD (přidej, edituj, smaž, toggle featured/active)
3. **Admin API** — `src/app/api/reviews/route.ts` (GET/POST) + `[id]/route.ts` (PUT/DELETE) — auth OWNER/EMPLOYEE
4. **Public API** — `src/app/api/public/reviews/route.ts` — POST (submit, active=false by default) + GET (active reviews)
5. **Product detail** — `src/app/(public)/offer/[slug]/ProductReviews.tsx` — server component, zobrazuje recenze s aggregate rating bars
6. **Formulář pro zákazníka** — `WriteReviewForm.tsx` — client component, odesílá na `/api/public/reviews`, confetti efekt po odeslání
7. **AggregateRating JSON-LD** — `page.tsx:312-317` — `prisma.review.aggregate` pro SEO schema
8. **Telegram notifikace** — negativní recenze (rating <= 3) se posílají do Telegramu
9. **In-app notifikace** — `createNotificationForRole("OWNER", "NEW_REVIEW", ...)` po public submitu

### Co CHYBÍ / je potřeba vylepšit
1. **Moderace workflow** — recenze od zákazníků jsou `active: false`, ale admin nemá jasný přehled "čekajících na schválení"
2. **Product binding** — admin formulář nemá dropdown na přiřazení recenze k produktu
3. **Verified purchase badge** — žádná vazba na skutečný nákup (sale/order)
4. **Email odpověď** — zákazník nedostane email s poděkováním nebo když je recenze schválena
5. **Stránka všech recenzí** — public `/recenze` stránka chybí (SEO value)
6. **Homepage reviews** — `ReviewsSection` komponent existuje ale nemusí využívat featured reviews správně

---

## 1. Moderace workflow — pending reviews queue

### Admin vylepšení

**Prioritní filtr v `ReviewsClient.tsx`:**
```typescript
// Přidat tabs: "Ke schválení" | "Aktivní" | "Všechny"
const [filter, setFilter] = useState<"pending" | "active" | "all">("pending");

// pending = active: false (čekající na schválení)
// active = active: true
// all = bez filtru
```

**Vizuální úpravy:**
- Pending recenze: žlutý banner "Čeká na schválení" + tlačítka "Schválit" / "Zamítnout"
- Schválit = `active: true`
- Zamítnout = smazat (nebo soft-delete přes nový status field)
- Badge v sidebar menu s počtem pending recenzí

**API úprava** — `GET /api/reviews`:
```typescript
// Přidat query param
const pending = sp.get("pending") === "true";
if (pending) {
  reviews = await prisma.review.findMany({
    where: { active: false },
    orderBy: { createdAt: "desc" },
  });
}
```

---

## 2. Product binding v admin formuláři

**Admin formulář** — přidat select pro produkt:
```typescript
// Načíst produkty pro dropdown
const [products, setProducts] = useState<{id: string; name: string}[]>([]);
useEffect(() => {
  fetch("/api/products?archived=false").then(r => r.json()).then(setProducts);
}, []);

// V formuláři:
<select value={form.productId} onChange={...}>
  <option value="">Obecná recenze (bez produktu)</option>
  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
</select>
```

**Schema změna**: Žádná — `productId` je optional už teď.

**API změna**: Přidat `productId` do review schema v `src/app/api/reviews/route.ts`:
```typescript
const reviewSchema = z.object({
  // ... existující
  productId: z.string().optional(), // PŘIDAT
});
```

---

## 3. AggregateRating pro SEO — vylepšení

### Stávající stav
`page.tsx:312-317` — aggregateRating je jen pro product-specific reviews.

### Vylepšení
Použít globální fallback — pokud produkt nemá vlastní recenze, použít celkové hodnocení:
```typescript
let reviewStats = await prisma.review.aggregate({
  where: { productId: product.id, active: true },
  _avg: { rating: true },
  _count: true,
});

// Fallback na globální rating pokud produkt nemá recenze
if (reviewStats._count === 0) {
  reviewStats = await prisma.review.aggregate({
    where: { active: true },
    _avg: { rating: true },
    _count: true,
  });
}
```

### Review structured data (JSON-LD)
Přidat individuální Review objekty do JSON-LD (Google zobrazuje snippety):
```json
{
  "@type": "Product",
  "review": [
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Jana K." },
      "reviewRating": { "@type": "Rating", "ratingValue": "5" },
      "reviewBody": "Krásné vlasy, perfektní kvalita..."
    }
  ],
  "aggregateRating": { ... }
}
```

---

## 4. Public stránka `/recenze`

**Nová stránka:** `src/app/(public)/recenze/page.tsx`

Obsah:
- Celkový aggregate rating (velký)
- Rating bars (kvalita, komunikace, rychlost)
- Grid recenzí (všechny active, featured first)
- Filtr: "Všechny" | "5 hvězd" | "4 hvězdy" | ...
- Google/Instagram badge u externích recenzí
- SEO metadata + JSON-LD AggregateRating
- CTA: "Napsat recenzi" → odkaz na produkt nebo generický formulář

---

## 5. Email notifikace

### Po odeslání recenze zákazníkem
Stávající: In-app notification + Telegram (negativní)
Přidat: Email zákazníkovi? NE — WriteReviewForm nemá email pole.

### Po schválení recenze adminem
Přidat: Pokud recenze má navázaný produkt → revalidateTag("reviews") pro cache.

---

## 6. Soubory k editaci/vytvořit

| Soubor | Akce | Popis |
|--------|------|-------|
| `src/app/(app)/reviews/ReviewsClient.tsx` | Edit | Tabs pending/active/all, product select, approve button |
| `src/app/api/reviews/route.ts` | Edit | Přidat productId do schema, pending filter |
| `src/app/api/reviews/[id]/route.ts` | Edit | Revalidate cache po approve |
| `src/app/(public)/offer/[slug]/page.tsx` | Edit | AggregateRating fallback, Review JSON-LD |
| `src/app/(public)/recenze/page.tsx` | New | Public stránka všech recenzí |

---

## 7. Implementační kroky

### Krok 1: Admin moderace (45 min)
- Tabs v ReviewsClient.tsx (pending/active/all)
- Badge count v sidebar
- Approve/reject buttons
- Product select v create/edit form

### Krok 2: SEO vylepšení (30 min)
- AggregateRating fallback v product detail
- Individual Review JSON-LD objekty
- Review snippety pro Google

### Krok 3: Public `/recenze` stránka (45 min)
- Server component s aggregate rating
- Review grid s filtry
- SEO metadata

### Krok 4: Cache invalidace (15 min)
- Po approve/update review → `revalidateTag("reviews")`
- Po vytvoření review → revalidate product page

---

## 8. Technické poznámky

- **Žádné schema změny** — Review model je kompletní, productId je optional
- **Public submit** — už funguje (`/api/public/reviews`), active=false je správné chování (moderace)
- **Rating agregace** — dělat na serveru (ne na klientu), využít Prisma aggregate
- **WriteReviewForm** — není potřeba měnit, funguje správně
- **Google Rich Snippets** — pro zobrazení hvězdiček v SERPu potřeba min 1 review + aggregateRating v JSON-LD
