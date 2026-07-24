# TASK-102: Kalendář mobilní optimalizace + WOW design — Plán

## Analýza současného stavu

**Hlavní soubor:** `src/app/(app)/reservations/ReservationsCalendar.tsx` (980 řádků)
**Stránka:** `src/app/(app)/calendar/page.tsx` (wrapper, jen auth + `<ActivityCalendar />`)

### Co už existuje:
- **Měsíční view** (grid 7 sloupců) — desktop only, na mobilu se buňky mačkají
- **Týdenní view** (grid 7 sloupců) — stejný problém na mobilu
- **Mobilní list view** (řádky 778-815) — `sm:hidden`, kompaktní seznam dnů s chipmi
- **Filter chipy** — přepínání rezervace/prodeje/objednávky/naskladnění
- **Legenda** — collapsible, grid 2-4 sloupce
- **Detail dne** — kliknutím na den se zobrazí detail pod kalendářem
- **View mode toggle** — měsíc/týden

### Problémy:
1. **Měsíční grid na mobilu** — 7 sloupců se nevejdou, buňky jsou příliš malé, text nečitelný
2. **Týdenní grid na mobilu** — stejný problém jako měsíční
3. **Chybí swipe gesta** — navigace měsíc/týden jen tlačítky `<` a `>`
4. **Chybí denní view** — pro mobil ideální (1 den, vertikální seznam)
5. **Design je funkční ale ne WOW** — chybí animace, přechody, vizuální efekty
6. **Detail dne se zobrazuje pod kalendářem** — na mobilu je to daleko, uživatel nevidí souvislost
7. **Mobilní list view** je flat — jen chipy, žádný detail bez kliknutí

## Řešení

### Fáze 1: Mobilní view modes (P0)

**Soubor:** `src/app/(app)/reservations/ReservationsCalendar.tsx`

#### 1A: Denní view pro mobil
Přidat `viewMode: "month" | "week" | "day"` (aktuálně jen month/week).

Na mobilu (`sm:` breakpoint) defaultovat na **day view**:
- Hlavička s datem + šipky vlevo/vpravo
- Vertikální timeline seznam všech entries pro daný den
- Swipe vlevo/vpravo pro přechod mezi dny
- Prázdný den → "Žádné záznamy" s jemným obrázkem

```tsx
// Nový state
const [currentDay, setCurrentDay] = useState(() => new Date());

// View mode selection — mobil defaultuje na day
useEffect(() => {
  const isMobile = window.innerWidth < 640;
  if (isMobile && viewMode === "month") setViewMode("day");
}, []);
```

#### 1B: Swipe gesta
Implementovat touch swipe pro navigaci:
- Swipe left → další den/týden/měsíc
- Swipe right → předchozí den/týden/měsíc
- Threshold: 50px horizontální pohyb
- Jen na kalendářní oblasti, ne na detail entries

```tsx
// Touch handling
const touchStartX = useRef(0);
const touchEndX = useRef(0);

function handleTouchStart(e: React.TouchEvent) {
  touchStartX.current = e.touches[0].clientX;
}

function handleTouchEnd(e: React.TouchEvent) {
  touchEndX.current = e.changedTouches[0].clientX;
  const diff = touchStartX.current - touchEndX.current;
  if (Math.abs(diff) > 50) {
    if (diff > 0) goNext(); // swipe left = next
    else goPrev(); // swipe right = prev
  }
}
```

#### 1C: Responzivní view toggle
Na mobilu zobrazit 3 módy (den/týden/měsíc), na desktopu 2 (týden/měsíc):
```tsx
<div className="flex gap-1 bg-nude-50 rounded-lg p-0.5">
  <button className="sm:hidden ..." onClick={() => setViewMode("day")}>Den</button>
  <button onClick={() => setViewMode("week")}>Týden</button>
  <button onClick={() => setViewMode("month")}>Měsíc</button>
</div>
```

### Fáze 2: WOW vizuální vylepšení (P1)

#### 2A: Animované přechody mezi měsíci/týdny
CSS transition na kalendářním gridu:
```tsx
// Slide animation direction
const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);

// Na wrapper div:
className={`transition-transform duration-200 ${
  slideDir === "left" ? "-translate-x-2 opacity-80" :
  slideDir === "right" ? "translate-x-2 opacity-80" : ""
}`}
```

Po navigaci: nastavit slideDir → po 200ms resetovat na null.

#### 2B: Vylepšený denní detail (mobilní sheet)
Místo detail pod kalendářem → na mobilu použít **bottom sheet** styl:
- Fixed na spodku obrazovky
- Slide-up animace
- Rounded top corners
- Zavřít swipe-down nebo X
- Max-height 60vh, scrollable

```tsx
{selectedDay && (
  <div className="fixed sm:relative bottom-0 left-0 right-0 sm:static
    bg-white border-t sm:border border-line rounded-t-2xl sm:rounded-xl
    shadow-xl sm:shadow-none p-4 space-y-2
    max-h-[60vh] sm:max-h-none overflow-y-auto
    animate-slide-up sm:animate-none z-30">
    ...
  </div>
)}
```

#### 2C: Gradient heatmap intenzita
Aktuálně `getDayBgIntensity` vrací `bg-rose/[0.03]` až `bg-rose/[0.15]`.
Vylepšit na gradient background:
```ts
function getDayBgIntensity(count: number): string {
  if (count === 0) return "";
  if (count <= 2) return "bg-gradient-to-br from-rose/[0.03] to-transparent";
  if (count <= 5) return "bg-gradient-to-br from-rose/[0.06] to-rose/[0.02]";
  if (count <= 10) return "bg-gradient-to-br from-rose/[0.12] to-rose/[0.04]";
  return "bg-gradient-to-br from-rose/[0.18] to-rose/[0.06]";
}
```

#### 2D: Statistický header
Přidat souhrnný řádek nad kalendář:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
  <div className="bg-white rounded-xl border border-line p-3 text-center">
    <div className="text-2xl font-bold text-ink">{totalReservations}</div>
    <div className="text-xs text-muted">Rezervace</div>
  </div>
  <div className="...">
    <div className="text-2xl font-bold text-ink">{totalSales}</div>
    <div className="text-xs text-muted">Prodeje</div>
  </div>
  <div className="...">
    <div className="text-2xl font-bold text-ink">{formatCZK(totalRevenue)}</div>
    <div className="text-xs text-muted">Obrat</div>
  </div>
  <div className="...">
    <div className="text-2xl font-bold text-ink">{totalOrders}</div>
    <div className="text-xs text-muted">Objednávky</div>
  </div>
</div>
```

### Fáze 3: I18n doplnění (P2)

**Soubory:** `messages/cs.json`, `messages/uk.json`, `messages/ru.json`

Nové klíče v `calendar` namespace:
```json
{
  "day": "Den",
  "today": "Dnes",
  "noEntriesDay": "Žádné záznamy",
  "totalRevenue": "Obrat",
  "swipeHint": "Přejeďte pro další"
}
```

## Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `src/app/(app)/reservations/ReservationsCalendar.tsx` | Denní view, swipe gesta, bottom sheet, animace, statistiky, heatmap gradient |
| 2 | `messages/cs.json` | Nové calendar klíče (day, today, totalRevenue, swipeHint) |
| 3 | `messages/uk.json` | Totéž — ukrajinské překlady |
| 4 | `messages/ru.json` | Totéž — ruské překlady |

## Rozsah
- 4 soubory
- ~150 řádků nového kódu v ReservationsCalendar.tsx
- ~10 řádků nových i18n klíčů per locale
- Žádné nové závislosti (čistý React + CSS)
- Žádná DB migrace

## Implementační pořadí
1. Denní view mode + responzivní toggle (základ)
2. Swipe gesta na touch (touch events)
3. Bottom sheet pro detail dne na mobilu
4. Statistický header
5. Gradient heatmap + slide animace
6. I18n klíče

## Testování
1. Desktop: měsíční a týdenní view fungují beze změny
2. Mobil (< 640px): defaultuje na denní view
3. Swipe left/right naviguje mezi dny/týdny/měsíci
4. Klik na den na mobilu → bottom sheet s detailem
5. Statistický header ukazuje správné součty za aktuální období
6. Přechody mezi měsíci mají jemnou animaci
7. Vše funguje s filtry (vypnutí kategorií)
