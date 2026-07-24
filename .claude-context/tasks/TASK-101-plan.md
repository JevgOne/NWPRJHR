# TASK-101: Blog SEO meta popisky — Plán

## Problém

Blog detail page (`src/app/[locale]/(public)/blog/[slug]/page.tsx:38-67`) má **slabé fallbacky** pro SEO meta popisky:

### Problém 1: `metaDescription` fallback je příliš krátký/generický
```ts
const seoDesc = post.metaDescription || post.excerpt || post.title;
```
- Pokud admin nevyplní `metaDescription` a `excerpt` je prázdný → description = title (1-5 slov)
- Google doporučuje 120-160 znaků pro description
- Většina blog postů nebude mít ručně vyplněné `metaDescription` — admin to typicky přeskočí

### Problém 2: Chybí lokalizace metaTitle/metaDescription
- Schema má pouze `metaTitle` a `metaDescription` (bez Uk/Ru variant)
- `seoTitle` se bere jen z `post.metaTitle || post.title` — při UK/RU locale se použije CZ title jako SEO title
- Tohle je schema-level omezení, ale dá se obejít bez migrace

### Problém 3: Chybí auto-generace z obsahu
- Když chybí excerpt i metaDescription, není žádná logika která by vytáhla prvních 150 znaků z `content`
- Content je markdown string — potřeba strip markdown značky

## Řešení

### Fix 1: Auto-generace SEO description z obsahu (P0)
**Soubor:** `src/app/[locale]/(public)/blog/[slug]/page.tsx`
**Řádky:** 38-67 (generateMetadata)

Přidat helper funkci `generateSeoDescription` která:
1. Pokud existuje `metaDescription` → použij ho
2. Pokud existuje `excerpt` → použij ho (ořízni na 155 znaků)
3. Fallback: vezmi `content`, strip markdown, ořízni na 155 znaků na celé slovo + "..."

```ts
function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")        // headers
    .replace(/\*\*(.+?)\*\*/g, "$1")     // bold
    .replace(/\*(.+?)\*/g, "$1")         // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/^- /gm, "")               // list items
    .replace(/\n+/g, " ")               // newlines → spaces
    .replace(/\s+/g, " ")               // multiple spaces
    .trim();
}

function generateSeoDescription(post: BlogPost, locale: string): string {
  // 1. Manual meta description (always CZ — no localized field exists)
  if (post.metaDescription) return post.metaDescription;

  // 2. Localized excerpt
  const excerpt = localized(post, "excerpt", locale);
  if (excerpt) {
    if (excerpt.length <= 155) return excerpt;
    return excerpt.slice(0, 152).replace(/\s+\S*$/, "") + "...";
  }

  // 3. Auto-generate from localized content
  const content = localized(post, "content", locale);
  if (content) {
    const plain = stripMarkdown(content);
    if (plain.length <= 155) return plain;
    return plain.slice(0, 152).replace(/\s+\S*$/, "") + "...";
  }

  // 4. Ultimate fallback
  return localized(post, "title", locale);
}
```

Pak v `generateMetadata`:
```ts
const seoTitle = post.metaTitle || localized(post, "title", locale);
const seoDesc = generateSeoDescription(post, locale);
```

### Fix 2: Lokalizovaný title fallback (P0)
**Soubor:** `src/app/[locale]/(public)/blog/[slug]/page.tsx`
**Řádky:** 42-43

Aktuálně:
```ts
const seoTitle = post.metaTitle || post.title;
```

Opravit na:
```ts
const seoTitle = post.metaTitle || localized(post, "title", locale);
```

Tím se pro UK/RU locale použije `titleUk`/`titleRu` místo CZ title.

### Fix 3: Blog listing page description per-post (P1 — nice to have)
**Soubor:** `src/app/[locale]/(public)/blog/page.tsx`

Blog listing page (`/blog`) má statické meta tagy z i18n — to je OK. Ale jednotlivé karty v listing nemají meta relevance. Listing page meta je v pořádku — neměnit.

## Soubory k úpravě

| # | Soubor | Změna | Řádky |
|---|--------|-------|-------|
| 1 | `src/app/[locale]/(public)/blog/[slug]/page.tsx` | Přidat `stripMarkdown` + `generateSeoDescription` helper, opravit `generateMetadata` | ~20 řádků nového kódu |

## Rozsah
- 1 soubor
- ~25 řádků změn
- Žádné nové závislosti
- Žádná DB migrace
- Zpětně kompatibilní (pokud admin vyplnil metaDescription, chování se nemění)

## Testování
1. Blog post BEZ metaDescription a BEZ excerpt → description by měl být auto-generovaný z content (prvních 155 znaků, strip markdown)
2. Blog post S excerpt → excerpt jako description
3. Blog post S metaDescription → metaDescription jako description (beze změny)
4. UK/RU locale → title by měl být lokalizovaný (titleUk/titleRu)
5. Ověřit že `| Blog` suffix je na titlu
