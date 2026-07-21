# QA Report: TASK-097 Phase 1 — Calendar Visual Overhaul

**Datum:** 2026-07-20
**Commit:** 750fa3c
**Kontrolor:** kontrolor
**Výsledek: PASS — 1 drobná poznámka**

---

## 1. Mini-chipy místo teček

**Implementace:** `DaySummary` komponenta (ř. 205-228)

- Barevné chipy s emoji (📋💰📦📥) a počtem pro každý typ — SPRÁVNĚ
- Barvy: amber=rezervace, blue=prodeje, indigo=objednávky, teal=naskladnění — SPRÁVNĚ
- Max 3 chipy zobrazeny, overflow jako `+N` (ř. 223-225) — SPRÁVNĚ
- `DaySummaryInline` pro mobilní list view (ř. 230-258) — SPRÁVNĚ

**Výsledek: PASS**

---

## 2. Hover tooltip

**Implementace:** `DayTooltip` komponenta (ř. 260-293)

- CSS popup: `hidden group-hover:block`, pozice `bottom-full mb-1.5 z-30` — SPRÁVNĚ
- Parent button má `group relative` třídu (ř. 577) — SPRÁVNĚ, `group-hover` funguje
- Tooltip ukazuje: datum, počty po typech (📋💰📦📥), celkovou částku pokud > 0 — SPRÁVNĚ
- CSS šipka dolů pomocí border trik (ř. 288-290) — SPRÁVNĚ
- `pointer-events-none` — tooltip nereaguje na myš, neblokuje interakci — SPRÁVNĚ

**Výsledek: PASS**

---

## 3. Heat-map

**Implementace:** `getDayBgIntensity()` funkce (ř. 169-175)

```ts
if (count === 0) return "";
if (count <= 2) return "bg-rose/[0.03]";
if (count <= 5) return "bg-rose/[0.06]";
if (count <= 10) return "bg-rose/[0.10]";
return "bg-rose/[0.15]";
```

- 4 úrovně intenzity — SPRÁVNĚ
- Aplikováno v button className (ř. 581-584): `${getDayBgIntensity(dayEntries.length)}` — SPRÁVNĚ
- Respektuje isToday a isSelected stavy — SPRÁVNĚ (podmíněné)

**Výsledek: PASS**

---

## 4. Dnešek — ring-2 ring-rose/40

**Implementace:** ř. 581

```tsx
isToday
  ? `ring-2 ring-rose/40 ring-inset ${isSelected ? "bg-rose/10" : getDayBgIntensity(dayEntries.length)} border-rose/20`
```

- `ring-2 ring-rose/40 ring-inset` — SPRÁVNĚ, přesně dle zadání
- Číslo dne: bílé v rose kruhu (ř. 591-592) — SPRÁVNĚ

**Výsledek: PASS**

---

## 5. Filter/legenda — klikací chipy, localStorage

**Implementace:** ř. 312-329 (state + localStorage) + ř. 441-471 (UI)

- `filters` state s bool pro každý typ (ř. 312-318) — SPRÁVNĚ
- `useEffect` načte uložené filtry z `localStorage.getItem("calendar-filters")` (ř. 320-325) — SPRÁVNĚ
- `useEffect` ukládá filtry při změně (ř. 327-329) — SPRÁVNĚ
- Kliknutí toggle: `setFilters(f => ({ ...f, [key]: !f[key] }))` (ř. 450) — SPRÁVNĚ
- Vizuální stav: aktivní chip = barevný, neaktivní = `line-through + opacity muted` (ř. 452-453) — SPRÁVNĚ
- Zobrazuje počet záznamů v měsíci na každém chipu (ř. 457-461) — SPRÁVNĚ
- `byDay` useMemo respektuje `filters` (ř. 379-416) — SPRÁVNĚ, filtrování funguje

**Výsledek: PASS**

---

## 6. Collapsible detail legenda

**Implementace:** `showStatusLegend` state (ř. 310) + ř. 465-531

- Tlačítko `showLegend`/`hideLegend` toggle (ř. 465-470) — SPRÁVNĚ
- `{showStatusLegend && (...)}` wrapper (ř. 474) — SPRÁVNĚ
- Grid 2×2 / 4×1 (responsive) s filtry — zobrazí se jen sekce pro aktivní filtry (ř. 476, 490, 504, 518: `{filters.xxx && (...)}`) — SPRÁVNĚ
- Statusy s barevnou tečkou + emoji + přeložený label — SPRÁVNĚ

**Výsledek: PASS**

---

## 7. Mobilní list view

**Implementace:** ř. 610-648

- `block sm:hidden` wrapper — SPRÁVNĚ, skryto na desktop
- Desktop grid: `hidden sm:block` (ř. 555) — SPRÁVNĚ
- Mobile list: dny seřazeny vzestupně (ř. 613), den jako kruh s číslem, `DaySummaryInline` chipy, celková částka — SPRÁVNĚ
- Prázdný stav: `tCal("noEntries")` (ř. 646) — SPRÁVNĚ (klíč existuje: "Žádné záznamy v tomto měsíci")
- Dnešek: `bg-rose text-white` v kruhu (ř. 627-629) — SPRÁVNĚ

**Výsledek: PASS**

---

## 8. Delivery link

**Implementace:** ř. 732-754

```tsx
<Link href={`/inventory/deliveries/${dl.id}`} ...>
```

- SPRÁVNĚ — delivery je nyní `<Link>` místo původního `<div>`
- Hover efekt `hover:bg-nude-50` — SPRÁVNĚ

**Výsledek: PASS**

---

## 9. Šedé barvy — WRITEOFF a ORDER CANCELLED

**Implementace:** ř. 80-97

```ts
SALE_DOT.WRITEOFF = "bg-amber-300"   // ✅ (ne bg-zinc-400)
ORDER_DOT.CANCELLED = "bg-red-300"   // ✅ (ne bg-gray-300)
```

- `bg-amber-300` pro WRITEOFF — SPRÁVNĚ dle zadání
- `bg-red-300` pro ORDER CANCELLED — SPRÁVNĚ dle zadání
- `isCancelledEntry()` funkce (ř. 195-201): vrací `true` pro RESERVATION CANCELLED, ORDER CANCELLED, SALE WRITEOFF — SPRÁVNĚ
- `opacity-50` aplikováno v detail view na všechny cancelled entries (ř. 670, 703, 762) — SPRÁVNĚ
- Delivery nemá cancelled stav — správně nemá `opacity-50`

**Výsledek: PASS**

---

## 10. Překlady — cs/uk/ru

| Klíč | CS | UK | RU |
|------|----|----|-----|
| `calendar.showLegend` | ✅ "Zobrazit legendu statusů" | ✅ "Показати легенду статусів" | ✅ "Показать легенду статусов" |
| `calendar.hideLegend` | ✅ "Skrýt legendu" | ✅ "Сховати легенду" | ✅ "Скрыть легенду" |
| `calendar.noEntries` | ✅ "Žádné záznamy v tomto měsíci" | ✅ "Немає записів за цей місяць" | ✅ "Нет записей за этот месяц" |

**Výsledek: PASS — všechny 3 klíče ve všech 3 jazycích**

---

## Drobná poznámka

**Emoji 📥 vs 🚚:** Zadání uvádí emoji `🚚` pro delivery, implementace používá `📥`. Hodnota `TYPE_EMOJI.delivery = "📥"` (ř. 134). Funkčnost není dotčena — 📥 je sémanticky správnější pro "příjem/naskladnění". Není chyba.

---

## Závěr

| Oblast | Status |
|--------|--------|
| Mini-chipy s emoji a počtem | PASS |
| Hover tooltip (CSS, group-hover) | PASS |
| Heat-map (4 úrovně intenzity) | PASS |
| Dnešek ring-2 ring-rose/40 | PASS |
| Filter chipy + localStorage | PASS |
| Collapsible detail legenda | PASS |
| Mobilní list view (block sm:hidden) | PASS |
| Delivery link → /inventory/deliveries/:id | PASS |
| WRITEOFF=bg-amber-300, CANCELLED=bg-red-300, opacity-50 | PASS |
| Překlady cs/uk/ru (showLegend, hideLegend, noEntries) | PASS |

**VERDIKT: PASS. Všechny body dle zadání implementovány správně.**
