# IMPL: TASK-101 — Blog SEO meta popisky

## Status: DONE

## Změněný soubor (1)

### src/app/[locale]/(public)/blog/[slug]/page.tsx
- Přidán `stripMarkdown()` helper — odstraní markdown syntaxi (headers, bold, italic, links, lists, newlines)
- Přidán `generateSeoDescription()` helper — cascade: metaDescription → excerpt (155 znaků) → content stripped (155 znaků) → title
- Ořezání na 155 znaků na celé slovo + "..."
- `seoTitle` opraveno na `localized(post, "title", locale)` — pro UK/RU se použije titleUk/titleRu
- `seoDesc` nyní používá `generateSeoDescription(post, locale)` — auto-generuje z obsahu

## Chování
- Post S metaDescription → beze změny (metaDescription se použije)
- Post S excerpt → excerpt oříznutý na 155 znaků
- Post BEZ excerpt i metaDescription → auto-generováno z content (strip markdown, 155 znaků)
- UK/RU locale → lokalizovaný title i description

## Validace
- TypeScript: `npx tsc --noEmit` — PASS
