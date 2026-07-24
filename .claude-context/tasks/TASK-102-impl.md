# TASK-102: Kalendář mobilní optimalizace + WOW design — Implementace

**Stav:** HOTOVO
**Datum:** 2026-07-22
**TypeScript:** 0 chyb

---

## Změněné soubory

### 1. `src/app/(app)/reservations/ReservationsCalendar.tsx`

**Fáze 1: Mobilní view modes**

- **Denní view mode:** Přidán `viewMode: "month" | "week" | "day"` (bylo jen `month | week`). Nový `currentDay` state. Na mobilu (`< 640px`) se automaticky přepne na denní view přes useEffect.
- **Denní view rendering:** Kompletní vertikální seznam entries pro daný den s kartovým layoutem (rounded-xl, border, padding). Každý typ (reservation/sale/delivery/order) má vlastní card s barvou, statusem, detailem a cenou. Prázdný den zobrazí ikonu 📅 + "Žádné záznamy".
- **Responzivní view toggle:** 3 tlačítka na mobilu (Den/Měsíc/Týden), tlačítko "Den" je `sm:hidden` (skryté na desktopu).
- **Swipe gesta:** Touch event handlers (`handleTouchStart`, `handleTouchEnd`) s prahem 50px. Swipe left = další den/týden/měsíc, swipe right = předchozí. Wrapper div s `onTouchStart`/`onTouchEnd`.

**Fáze 2: WOW vizuální vylepšení**

- **Slide animace:** `slideDir` state (`"left" | "right" | null`). Při navigaci se nastaví směr → po 200ms reset. CSS `transition-all duration-200` s translate-x-2 a opacity-80.
- **Bottom sheet:** Selected day detail na mobilu je `fixed bottom-0 left-0 right-0` s `rounded-t-2xl`, `shadow-xl`, `max-h-[60vh]`, `overflow-y-auto`, `animate-slide-up`. Na desktopu zůstává `relative/static`. Přidáno tlačítko ✕ pro zavření na mobilu.
- **Gradient heatmap:** `getDayBgIntensity` nyní vrací `bg-gradient-to-br` místo plochého bg-rose. 4 úrovně gradientu od transparentní po rose/[0.18].
- **Statistický header:** Grid 2 sloupce (mobil) / 4 sloupce (desktop) nad kalendářem: Rezervace, Prodeje, Obrat, Objednávky. Počítá se z aktuálního období respektujíc filtry.

**Fáze 3: I18n**

- Nové klíče v `calendar` namespace (viz níže)

**Technické detaily:**
- Import rozšířen o `useRef, useCallback`
- `goNext`/`goPrev` unified navigation functions (useCallback)
- Navigation buttons (`<` / `>`) nyní volají unified `goPrev`/`goNext`
- Header label zobrazuje správný text dle view mode (dayLabel/monthLabel/weekLabel)
- `byDay` fetch pro day view stahuje celý měsíc (aby data fungovala)
- Mobilní list view skryt v day view mode (`viewMode !== "day"`)
- Bottom sheet se nezobrazuje v day view (day view už ukazuje detail)

### 2. `messages/cs.json` — Nové klíče v `calendar`:
```json
"day": "Den",
"today": "Dnes",
"totalRevenue": "Obrat",
"swipeHint": "Přejeďte pro další"
```

### 3. `messages/uk.json` — Nové klíče v `calendar`:
```json
"day": "День",
"today": "Сьогодні",
"totalRevenue": "Оборот",
"swipeHint": "Проведіть для наступного"
```

### 4. `messages/ru.json` — Nové klíče v `calendar`:
```json
"day": "День",
"today": "Сегодня",
"totalRevenue": "Оборот",
"swipeHint": "Проведите для следующего"
```

## Co NEBYLO změněno
- Žádné nové závislosti
- Žádná DB migrace
- Desktop month/week view funguje beze změny
- Existující i18n klíče neupraveny
- `animate-slide-up` keyframe už existoval v `globals.css`
