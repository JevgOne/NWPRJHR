# QA: TASK-101 — Blog SEO meta popisky

**Datum:** 2026-07-22
**Kontrolor:** kontrolor
**Status: PASS — implementace správná**

---

## 1. stripMarkdown — odstraňování markdown značek

**Soubor:** `src/app/[locale]/(public)/blog/[slug]/page.tsx:30-40`

```typescript
function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")          // # headers
    .replace(/\*\*(.+?)\*\*/g, "$1")       // **bold**
    .replace(/\*(.+?)\*/g, "$1")           // *italic*
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) → text
    .replace(/^- /gm, "")                  // bullet points
    .replace(/\n+/g, " ")                  // newlines → space
    .replace(/\s+/g, " ")                  // multi-space → single
    .trim();
}
```

✅ Headers h1-h6 odstraněny
✅ Bold `**text**` → `text`
✅ Italic `*text*` → `text`
✅ Links `[text](url)` → `text` (URL zahozena)
✅ Bullet points `-` odstraněny
✅ Newlines sloučeny do mezer
✅ Whitespace normalizován + trim

---

## 2. generateSeoDescription — fallback chain + ořez 155 znaků

**Soubor:** `src/app/[locale]/(public)/blog/[slug]/page.tsx:42-59`

```typescript
function generateSeoDescription(post: Record<string, unknown>, locale: string): string {
  if (post.metaDescription) return post.metaDescription as string;   // 1. metaDescription

  const excerpt = localized(post, "excerpt", locale);
  if (excerpt) {
    if (excerpt.length <= 155) return excerpt;
    return excerpt.slice(0, 152).replace(/\s+\S*$/, "") + "...";    // 2. excerpt ořez
  }

  const content = localized(post, "content", locale);
  if (content) {
    const plain = stripMarkdown(content);
    if (plain.length <= 155) return plain;
    return plain.slice(0, 152).replace(/\s+\S*$/, "") + "...";      // 3. content stripped
  }

  return localized(post, "title", locale);                            // 4. title fallback
}
```

✅ Fallback chain: metaDescription → excerpt → content (stripped) → title
✅ Ořez na 155 znaků: `slice(0, 152)` + `.replace(/\s+\S*$/, "")` ořízne na celé slovo + `"..."`
✅ `152 + "..." = 155` — přesně správná délka
✅ Pokud text ≤ 155 znaků → vrátí bez ořezu (r47, r54)
✅ `localized()` volán pro excerpt i content — UK/RU lokalizace funguje

---

## 3. Lokalizovaný title v generateMetadata

**Soubor:** `src/app/[locale]/(public)/blog/[slug]/page.tsx:73`

```typescript
const seoTitle = post.metaTitle || localized(post, "title", locale);
```

✅ `localized(post, "title", locale)` — pro UK vrátí `titleUk`, pro RU `titleRu`, pro CS `title`
✅ `post.metaTitle` má prioritu (pokud nastaven ručně)

Použití seoTitle:
```typescript
title: `${seoTitle} | Blog`,   // r77 — page title
openGraph.title: seoTitle,      // r82
twitter.title: seoTitle,        // r93
```
✅ Lokalizovaný title ve všech 3 místech

`seoDesc` (r74):
```typescript
const seoDesc = generateSeoDescription(post, locale);
```
✅ Předán `locale` — lokalizace description funguje

---

## 4. TypeScript kompilace

```
npx tsc --noEmit → PASS (žádné chyby)
```
✅

---

## Simplify kontrola

- Kód je čistý, bez duplicit
- `stripMarkdown` a `generateSeoDescription` jsou pure functions — dobře testovatelné
- `localized()` helper již existoval v souboru — správně znovupoužit

---

## SOUHRN

| Kontrola | Výsledek |
|----------|----------|
| stripMarkdown: headers | ✅ |
| stripMarkdown: bold/italic | ✅ |
| stripMarkdown: links | ✅ |
| stripMarkdown: bullets + whitespace | ✅ |
| generateSeoDescription: metaDescription priorita | ✅ |
| generateSeoDescription: excerpt fallback | ✅ |
| generateSeoDescription: content stripped fallback | ✅ |
| generateSeoDescription: title fallback | ✅ |
| Ořez 155 znaků na celé slovo | ✅ |
| seoTitle: localized(post, "title", locale) | ✅ |
| seoDesc: generateSeoDescription(post, locale) | ✅ |
| Lokalizace ve všech 3 meta místech | ✅ |
| TypeScript kompilace | ✅ PASS |

**Implementace kompletní a správná. Připraveno k deployi.**
