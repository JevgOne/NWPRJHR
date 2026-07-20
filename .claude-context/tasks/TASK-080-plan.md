# TASK-080: Emoji nefunguje v poptavkach (assignedTo)

## Analyza problemu

### Kde funguje (sidebar/AppShell)
- `session.user.name` z User tabulky (napr. "Inna Korotka")
- `getUserColor("Inna Korotka")` → key = "inna korotka" → `key.startsWith("inna ")` → MATCH → emoji "🐀"

### Kde nefunguje (InquiriesClient)
- `inq.assignedTo` je free-text String z DB
- Dva zdroje dat:
  1. **Telegram bot** (src/lib/telegram.ts:57): `name = firstName + " " + lastName` z Telegram profilu — muze byt v kyrilici (napr. "Інна Коротка") → `getUserColor("інна коротка")` → NEODPOVIDA klicum `inna`/`inga` → FALLBACK (no emoji)
  2. **Manual edit** (InquiriesClient.tsx:401): volny textovy `<input>` — uzivatel musi napsat presne "Inna" aby to matchlo

### Korenova pricina
`getUserColor()` porovnava lowercase Latin klice (`inna`, `inga`, `jevgenij`, `martin`), ale:
- Telegram muze poslat jmena v kyrilici
- Manualni input nema zadne omezeni — uzivatel muze napsat cokoliv

## Plan opravy

### Varianta A: Nahradit free-text input dropdownem (DOPORUCENO)

Nahradit `<input>` pro assignedTo za `<select>` s pevnymi hodnotami z `USER_COLORS` mapy. To zaridi ze:
- Hodnota v DB bude vzdy odpovedat klicum v `getUserColor()`
- Emoji se zobrazi vzdy

### Krok 1: Pridat export klicu z user-colors.ts

Pridat export seznamu jmen pro pouziti v dropdownu:

```typescript
// V user-colors.ts pridat:
export const TEAM_MEMBERS = Object.keys(USER_COLORS).map(
  (key) => key.charAt(0).toUpperCase() + key.slice(1)
);
// Vysledek: ["Inna", "Inga", "Jevgenij", "Martin"]
```

POZOR: Klice v USER_COLORS jsou lowercase first-name-only ("inna"), ale getUserColor matchuje case-insensitive a s startsWith. Takze do dropdownu staci dat kapitalizovane formy prvnich jmen.

### Krok 2: Upravit InquiriesClient.tsx — nahradit input za select

Zmenit radky 398-406:

```tsx
// PRED (free text input):
<input
  value={editAssigned}
  onChange={(e) => setEditAssigned(e.target.value)}
  className="border border-line rounded-lg px-3 py-2 text-sm w-full max-w-xs"
  placeholder={t("assignedPlaceholder")}
/>

// PO (dropdown select):
<select
  value={editAssigned}
  onChange={(e) => setEditAssigned(e.target.value)}
  className="border border-line rounded-lg px-3 py-2 text-sm w-full max-w-xs"
>
  <option value="">{t("unassigned")}</option>
  {TEAM_MEMBERS.map((name) => (
    <option key={name} value={name}>{name}</option>
  ))}
</select>
```

Pridat import: `import { TEAM_MEMBERS } from "@/lib/user-colors";`

### Krok 3: Opravit Telegram bot assignment

V src/lib/telegram.ts:55-57 — Telegram posilaja jmena z profilu (mohou byt kyrilice). Pridat mapovani z Telegram jmen na systemove klice:

```typescript
// V telegram.ts pridat mapovani Telegram jmen na user-colors klice
import { getUserColor } from "@/lib/user-colors";

// Po radku 57 (kde se sestavi name):
const firstName = callbackQuery.from?.first_name ?? "Někdo";
const lastName = callbackQuery.from?.last_name ?? "";
const rawName = lastName ? `${firstName} ${lastName}` : firstName;

// Zkusit matchnout — pokud getUserColor vrati emoji, pouzij rawName
// Pokud ne, zkusit transliteraci nebo ponechat jak je
const color = getUserColor(rawName);
const name = color.emoji ? rawName : rawName; // Funguje protoze getUserColor uz dela lowercase + startsWith
```

VLASTNE — problem je v tom, ze `getUserColor` hleda lowercase Latin klice ale Telegram muze poslat kyrilici. Reseni: pridat do `getUserColor` alternativni klice (aliasy) pro kyrilicke varianty.

### Krok 3 (upraveny): Pridat aliasy do USER_COLORS

```typescript
// V user-colors.ts — rozsirit lookup o kyrilicke varianty
export const USER_ALIASES: Record<string, string> = {
  "інна": "inna",
  "інга": "inga",
  "євгеній": "jevgenij",
  "евгений": "jevgenij",
  "мартін": "martin",
  "мартин": "martin",
};

export function getUserColor(name: string | null | undefined) {
  if (!name) return FALLBACK;
  const key = name.trim().toLowerCase();
  
  // Direct match
  for (const [userName, colors] of Object.entries(USER_COLORS)) {
    if (key === userName || key.startsWith(userName + " ")) {
      return colors;
    }
  }
  
  // Alias match (Cyrillic names from Telegram)
  for (const [alias, target] of Object.entries(USER_ALIASES)) {
    if (key === alias || key.startsWith(alias + " ")) {
      return USER_COLORS[target] ?? FALLBACK;
    }
  }
  
  return FALLBACK;
}
```

### Krok 4: Pridat i18n klic "unassigned"

Zkontrolovat ze existuje prekladovy klic `inquiry.unassigned` pro dropdown prazdnou volbu. Pokud ne, pridat.

## Soubory k uprave

1. **`src/lib/user-colors.ts`**
   - Pridat `TEAM_MEMBERS` export
   - Pridat `USER_ALIASES` pro kyrilicke varianty
   - Rozsirit `getUserColor()` o alias lookup

2. **`src/app/(app)/inquiries/InquiriesClient.tsx`**
   - Import `TEAM_MEMBERS`
   - Nahradit `<input>` za `<select>` pro assignedTo

3. **`messages/cs.json`** (a dalsi locales)
   - Pridat `inquiry.unassigned` klic (pokud neexistuje)

4. **Volitelne: `src/lib/telegram.ts`**
   - Pokud se ukaze ze Telegram posilaja kyrilicke jmena, aliasy v user-colors.ts to vyresi automaticky (getUserColor bude matchovat i kyrilicke vstupy)
   - Alternativne: normalizovat name v telegram.ts pred ulozenim do DB

## Poznamky

- Existujici zaznamy v DB s "spatnymi" jmeny se automaticky neopravi. To je OK — nove prirazeni uz bude spravne.
- Stejny problem existuje i v ComplaintsClient.tsx (radek 154) — tam ale neni edit UI, assignment jde jen pres Telegram. Alias reseni v getUserColor to vyresi pro oba pripady.
- Pokud by v budoucnu pribyly dalsi clenove tymu, staci pridat radek do USER_COLORS a vse funguje automaticky.
