# Placeholder a karta opravy — implementace

**Datum:** 2026-07-08

## Provedene zmeny

### 1. Produktova karta (ProductGridCard.tsx)
- **Barvy:** Karta nyni zobrazuje jen prvni (hlavni) barvu misto vsech barev
- **Delky:** Misto vypisu "40 cm, 50 cm, 60 cm, 70 cm" zobrazuje rozsah "40–70 cm"
- **Placeholder fotka:** Misto genericke SVG ikony fotoaparatu zobrazuje "✨ Foto pripravujeme"

### 2. Stat "0 Kc" → "Zdarma" (about page)
- cs.json: `statDeliveryValue: "Zdarma"`
- uk.json: `statDeliveryValue: "Безкоштовно"`
- ru.json: `statDeliveryValue: "Бесплатно"`

### 3. i18n klice
- Pridan `inquiry.photoSoon` do vsech 3 jazyku (cs/uk/ru)

## Co NEBYLO opraveno (datovy problem)
- **Produktove fotky chybi** — pole `photos` je prazdne v DB. To je datovy problem, ne kodovy. Fotky je nutne nahrat pres admin.
- **Blog cover images chybi** — sloupec `coverImage` je null v nekterych blog postech. Nutne nahrat pres admin nebo seed script.

## Soubory
| Soubor | Zmena |
|--------|-------|
| `src/components/public/ProductGridCard.tsx` | 1 barva, rozsah delek, lepsi placeholder |
| `messages/cs.json` | statDeliveryValue, photoSoon |
| `messages/uk.json` | statDeliveryValue, photoSoon |
| `messages/ru.json` | statDeliveryValue, photoSoon |
