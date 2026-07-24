# QA: TASK-102 — Kalendář mobilní optimalizace + WOW

**Datum:** 2026-07-22
**Kontrolor:** kontrolor
**Status: PASS — vše správně implementováno**

---

## 1. Denní view mode

**Soubor:** `src/app/(app)/reservations/ReservationsCalendar.tsx`

State (r345-346):
```typescript
const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
const [currentDay, setCurrentDay] = useState(() => new Date());
```
✅ `viewMode` rozšířen o `"day"` variantu
✅ `currentDay` state pro sledování aktuálního dne

Automatický přepínač na mobilu (r377-381):
```typescript
useEffect(() => {
  const isMobile = window.innerWidth < 640;
  if (isMobile && viewMode === "month") setViewMode("day");
}, []);
```
✅ Default denní view na mobilu (< 640px)

View toggle tlačítko "Den" skryté na desktopu (r763-764):
```typescript
className={`sm:hidden px-3 py-1 rounded-md text-xs font-medium transition-colors ${
  viewMode === "day" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"
}`}
```
✅ `sm:hidden` — tlačítko "Den" viditelné pouze na mobilu

Day view rendering (r808): `{viewMode === "day" ? (...)` — kompletní větvení
✅ Denní view renderuje seznam entries pro daný den

---

## 2. Swipe gesta

**Soubor:** r540-550, r800-801

```typescript
const touchStartX = useRef(0);
const handleTouchStart = useCallback((e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX;
}, []);
const handleTouchEnd = useCallback((e: React.TouchEvent) => {
  const diff = touchStartX.current - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) {
    if (diff > 0) goNext();
    else goPrev();
  }
}, [goNext, goPrev]);
```

Wrapper div (r800-801):
```tsx
onTouchStart={handleTouchStart}
onTouchEnd={handleTouchEnd}
```

✅ `useRef` pro touchStartX
✅ Threshold 50px (`Math.abs(diff) > 50`)
✅ Swipe left (diff > 0) → `goNext()`
✅ Swipe right (diff < 0) → `goPrev()`
✅ Oba handlery přes `useCallback`

---

## 3. Bottom sheet pro detail dne

**Soubor:** r1048-1054, r1061

```tsx
{selectedDay && viewMode !== "day" && (
  <div className="... fixed bottom-0 left-0 right-0 sm:static ...
    rounded-t-2xl shadow-xl max-h-[60vh] overflow-y-auto
    animate-slide-up sm:animate-none z-30">
    <button className="sm:hidden w-7 h-7 ...">✕</button>
```

✅ `fixed bottom-0 left-0 right-0` — mobilní fixed pozice
✅ `sm:static` — desktop zůstává inline
✅ `rounded-t-2xl` — slide-up efekt
✅ `shadow-xl` — vizuální oddělení
✅ `max-h-[60vh] overflow-y-auto` — scrollovatelný, max 60vh
✅ `animate-slide-up sm:animate-none` — animace pouze na mobilu
✅ `z-30` — nad ostatním obsahem
✅ Tlačítko ✕ `sm:hidden` — zavření pouze na mobilu
✅ Nezobrazuje se v day view (`viewMode !== "day"`) — den view má vlastní detail

---

## 4. Statistický header

**Soubor:** r637-654

```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
  <div>... {stats.totalReservations} ... {tCal("reservation")}</div>
  <div>... {stats.totalSales} ... {tCal("sales")}</div>
  <div>... {formatCZK(stats.totalRevenue)} ... {tCal("totalRevenue")}</div>
  <div>... {stats.totalOrders} ... {tCal("orders")}</div>
</div>
```

Stats výpočet (r616-630): respektuje filtry, počítá z aktuálního období
✅ Grid 2 sloupce na mobilu, 4 na desktopu
✅ Rezervace, Prodeje, Obrat, Objednávky
✅ `totalRevenue` I18n klíč použit (`tCal("totalRevenue")`)
✅ Obrat se počítá z reservations.lineTotal + sales.totalAmount

---

## 5. Gradient heatmap + slide animace

Heatmap (r172-178):
```typescript
function getDayBgIntensity(count: number): string {
  if (count === 0) return "";
  if (count <= 2) return "bg-gradient-to-br from-rose/[0.03] to-transparent";
  if (count <= 5) return "bg-gradient-to-br from-rose/[0.06] to-rose/[0.02]";
  if (count <= 10) return "bg-gradient-to-br from-rose/[0.12] to-rose/[0.04]";
  return "bg-gradient-to-br from-rose/[0.18] to-rose/[0.06]";
}
```
✅ 4 úrovně gradientu (byl 1 plochý bg)
✅ `bg-gradient-to-br` místo plochého `bg-rose`

Slide animace (r347, r521-537, r803-804):
```typescript
const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
// goNext: setSlideDir("left") → po 200ms null
// goPrev: setSlideDir("right") → po 200ms null
// CSS:
slideDir === "left" ? "-translate-x-2 opacity-80" :
slideDir === "right" ? "translate-x-2 opacity-80" : ""
```
✅ `slideDir` state
✅ `setTimeout(..., 200)` pro reset
✅ `-translate-x-2 / translate-x-2` s `opacity-80` pro vizuální feedback

---

## 6. Desktop view neporušen

✅ Month/week view beze změny (podmíněné větvení, nové kódy přidány vedle)
✅ Mobilní list view skryt v day view (`viewMode !== "day"` na r1005)
✅ Bottom sheet nezobrazuje v day view (`viewMode !== "day"` na r1049)
✅ Desktop view toggle: "Měsíc" a "Týden" zachovány, "Den" je `sm:hidden`

---

## 7. I18n klíče ve všech 3 locale

Nové klíče v `calendar` namespace:

| Klíč | cs.json | uk.json | ru.json |
|------|---------|---------|---------|
| `day` | "Den" (r3055) | "День" (r3055) | "День" (r3055) |
| `today` | "Dnes" (r3056) | "Сьогодні" (r3056) | "Сегодня" (r3056) |
| `totalRevenue` | "Obrat" (r3057) | "Оборот" (r3057) | "Оборот" (r3057) |
| `swipeHint` | "Přejeďte pro další" (r3058) | "Проведіть для наступного" (r3058) | "Проведите для следующего" (r3058) |

✅ Všechny 4 nové klíče ve všech 3 locale

---

## 8. TypeScript kompilace

```
npx tsc --noEmit → PASS (žádné chyby)
```
✅

---

## SOUHRN

| Kontrola | Výsledek |
|----------|----------|
| viewMode: "day" state | ✅ |
| Automatický day view na mobilu (< 640px) | ✅ |
| "Den" tlačítko sm:hidden | ✅ |
| Swipe threshold 50px | ✅ |
| handleTouchStart/End správně | ✅ |
| goNext/goPrev unified | ✅ |
| Bottom sheet: fixed bottom-0 | ✅ |
| Bottom sheet: sm:static (desktop inline) | ✅ |
| Bottom sheet: max-h-60vh + overflow-y-auto | ✅ |
| Bottom sheet: animate-slide-up sm:animate-none | ✅ |
| Bottom sheet: z-30 + ✕ sm:hidden | ✅ |
| Stats header: grid 2/4 + 4 metriky | ✅ |
| Gradient heatmap: 4 úrovně | ✅ |
| slideDir animace 200ms | ✅ |
| Desktop month/week neporušen | ✅ |
| I18n: day/today/totalRevenue/swipeHint CS | ✅ |
| I18n: day/today/totalRevenue/swipeHint UK | ✅ |
| I18n: day/today/totalRevenue/swipeHint RU | ✅ |
| TypeScript kompilace | ✅ PASS |

**Implementace kompletní a správná. Připraveno k deployi.**
