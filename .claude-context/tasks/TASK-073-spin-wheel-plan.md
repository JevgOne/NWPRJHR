# TASK-073: Kolečko štěstí — spin-to-win na veřejném webu

## Cíl
Marketingový popup na veřejném webu — zákazník zadá e-mail, zatočí kolečkem, vyhraje slevový kód. Kód se automaticky vytvoří v PromoCode systému a pošle na e-mail.

---

## Segmenty kolečka

| Segment | Výhra | Pravděpodobnost | Barva (návrh) |
|---------|-------|-----------------|---------------|
| 1 | Sleva 5% | 18% | `nude-100` |
| 2 | Zkus to příště | 15% | `nude-200` |
| 3 | Sleva 10% | 12% | `rose` (light) |
| 4 | Zkus to příště | 15% | `nude-200` |
| 5 | Zkus to příště | 13% | `espresso/10` |
| 6 | Sleva 15% | 5% | `rose` |
| 7 | Zkus to příště | 12% | `nude-200` |
| 8 | Sleva 20% | 3% | `gold` (light) |
| 9 | Zkus to příště | 6% | `espresso/10` |
| 10 | Sleva 25% | 1% | `gold` |

Celkem: 100%. "Zkus to příště" = 61%, výhra = 39%. (5 výherních, 5 nevýherních segmentů)

---

## Architektura

### Nová DB tabulka: `spin_entries`

Potřebujeme trackovat kdo už točil (1x per e-mail). Nová tabulka v Turso:

```sql
CREATE TABLE IF NOT EXISTS "spin_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "segment" INTEGER NOT NULL,
    "won" INTEGER NOT NULL DEFAULT 0,
    "discountPercent" INTEGER,
    "promoCodeId" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "spin_entries_email_key" ON "spin_entries"("email");
CREATE INDEX "spin_entries_createdAt_idx" ON "spin_entries"("createdAt");
```

**Prisma model** (přidat do `schema.prisma`):

```prisma
model SpinEntry {
  id              String    @id @default(cuid())
  email           String    @unique
  segment         Int
  won             Boolean   @default(false)
  discountPercent Int?
  promoCodeId     String?
  ipAddress       String?
  createdAt       DateTime  @default(now())

  @@index([createdAt])
  @@map("spin_entries")
}
```

### Flow

```
1. Zákazník navštíví web → po 10s / scroll 50% se zobrazí popup
2. Zákazník zadá e-mail → klikne "Zatočit"
3. Frontend POST /api/public/spin → server:
   a. Zkontroluje rate limit (IP) a jestli e-mail už točil
   b. Určí výherní segment (server-side RNG, weighted random)
   c. Vytvoří SpinEntry záznam
   d. Pokud výhra: vytvoří PromoCode (unikátní kód, PERCENT, jednorázový, validTo +30 dnů)
   e. Pokud výhra: pošle e-mail s kódem
   f. Vrátí { segment, won, discountPercent, code? }
4. Frontend animuje kolečko na správný segment
5. Zobrazí výsledek (výhra + kód / nevýhra)
```

**DŮLEŽITÉ**: Segment se určuje SERVER-SIDE, ne na klientovi. Frontend jen animuje na segment, který server vrátil.

---

## Implementační plán

### Krok 1: Prisma model + SQL migrace

**Soubory**:
- `prisma/schema.prisma` — přidat model `SpinEntry`
- SQL migrace pro Turso (viz výše)

### Krok 2: API endpoint — `/api/public/spin`

**Nový soubor**: `src/app/api/public/spin/route.ts`

```ts
POST /api/public/spin
Body: { email: string }
Response: { segment: number, won: boolean, discountPercent?: number, code?: string }
```

Logika:
1. Validace e-mailu (zod)
2. Rate limit: max 5 per IP per hodina (stejný pattern jako inquiry)
3. Kontrola duplikátu: `prisma.spinEntry.findUnique({ where: { email } })`
   - Pokud existuje → `{ error: "already_played" }`
4. Weighted random výběr segmentu:
   ```ts
   const SEGMENTS = [
     { id: 0, discount: 5,  weight: 18, label: "5%" },
     { id: 1, discount: 0,  weight: 15, label: "miss" },
     { id: 2, discount: 10, weight: 12, label: "10%" },
     { id: 3, discount: 0,  weight: 15, label: "miss" },
     { id: 4, discount: 0,  weight: 13, label: "miss" },
     { id: 5, discount: 15, weight: 5,  label: "15%" },
     { id: 6, discount: 0,  weight: 12, label: "miss" },
     { id: 7, discount: 20, weight: 3,  label: "20%" },
     { id: 8, discount: 0,  weight: 6,  label: "miss" },
     { id: 9, discount: 25, weight: 1,  label: "25%" },
   ];
   
   function pickSegment(): typeof SEGMENTS[number] {
     const total = SEGMENTS.reduce((s, seg) => s + seg.weight, 0);
     let rand = Math.random() * total;
     for (const seg of SEGMENTS) {
       rand -= seg.weight;
       if (rand <= 0) return seg;
     }
     return SEGMENTS[0];
   }
   ```
5. Vytvoření SpinEntry
6. Pokud výhra (discount > 0):
   - Vygenerovat unikátní kód: `SPIN-${randomPart}` (6 znaků, uppercase alfanumerické)
   - Vytvořit PromoCode:
     ```ts
     await prisma.promoCode.create({
       data: {
         code: generatedCode,
         description: `Kolečko štěstí — ${discount}% sleva`,
         discountType: "PERCENT",
         discountValue: discount * 100, // basis points
         maxUses: 1,
         validFrom: new Date(),
         validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dní
         active: true,
       },
     });
     ```
   - Odeslat e-mail s kódem (Resend, viz `src/lib/email.ts`)
7. Vrátit response

### Krok 3: SpinWheel komponenta (animované kolečko)

**Nový soubor**: `src/components/public/SpinWheel.tsx`

Implementace pomocí **CSS transform + transition** (ne Canvas — jednodušší, lepší výkon):

- Kolečko = kruhový SVG nebo CSS conic-gradient s 10 segmenty
- Animace: `transform: rotate(Xdeg)` s `transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)`
- Výpočet cílového úhlu na základě segmentu ze serveru:
  ```ts
  // Vizuálně rovnoměrné segmenty (360/10 = 36° each)
  const segmentAngle = 360 / 10;
  const targetAngle = 360 * 5 + (segmentAngle * segment + segmentAngle / 2);
  // 5 plných otáček + pozice segmentu
  ```

**Design** (brand barvy):
- Segmenty střídají `nude-100`, `nude-200`, `rose/10`, `rose/20` atd.
- Výherní segmenty mají výraznější barvy
- Středový kruh s logem/textem "SPIN"
- Ukazatel (šipka) nahoře

**Stavy**:
1. `idle` — e-mail input + "Zatočit" button
2. `spinning` — animace (4s)
3. `result-win` — zelený výsledek s kódem + "Kód odeslán na e-mail"
4. `result-lose` — "Příště to vyjde!" s CTA na nabídku
5. `already-played` — "Už jste točili" zpráva

### Krok 4: SpinWheelPopup — wrapper modal

**Nový soubor**: `src/components/public/SpinWheelPopup.tsx`

Podobný pattern jako `BatchPopup.tsx`:
- Zobrazí se po 10s na stránce NEBO po scroll na 50%
- Kontrola `localStorage` — pokud `spin-popup-dismissed`, nezobrazovat 7 dní
- Kontrola `localStorage` — pokud `spin-played`, nezobrazovat vůbec
- Overlay modal (ne corner popup) — kolečko potřebuje prostor
- Close button (X) v rohu
- Na mobilech: fullscreen modal

**Trigger logika**:
```ts
useEffect(() => {
  const played = localStorage.getItem("spin-played");
  const dismissed = localStorage.getItem("spin-dismissed");
  const dismissedAt = dismissed ? parseInt(dismissed) : 0;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  
  if (played) return; // Už hrál
  if (dismissedAt && Date.now() - dismissedAt < sevenDays) return; // Zavřel nedávno
  
  const timer = setTimeout(() => setVisible(true), 10000);
  return () => clearTimeout(timer);
}, []);
```

### Krok 5: Integrace do public layoutu

**Soubor**: `src/app/(public)/layout.tsx`

Přidat `<SpinWheelPopup />` vedle `<BatchPopup />`:

```tsx
<BatchPopup />
<SpinWheelPopup />
```

### Krok 6: Admin přehled (volitelné, nice-to-have)

Jednoduchý endpoint pro statistiky:
- `GET /api/spin-stats` — celkem točení, celkem výher, breakdown per segment
- Nebo přidat do existujícího dashboardu jako badge

### Krok 7: i18n překlady

**Soubory**: `messages/cs.json`, `messages/uk.json`, `messages/ru.json`

Nový namespace `spinWheel`:
```json
{
  "spinWheel": {
    "title": "Zatočte a vyhrajte slevu!",
    "subtitle": "Zadejte e-mail a zkuste štěstí",
    "emailPlaceholder": "vas@email.cz",
    "spinButton": "Zatočit!",
    "spinning": "Točí se...",
    "won": "Gratulujeme! Vyhráli jste {discount}% slevu!",
    "wonSub": "Kód byl odeslán na váš e-mail",
    "lost": "Tentokrát to nevyšlo",
    "lostSub": "Zkuste to příště!",
    "alreadyPlayed": "Už jste točili",
    "alreadyPlayedSub": "Každý e-mail může točit pouze jednou",
    "tooManyAttempts": "Příliš mnoho pokusů, zkuste později",
    "invalidEmail": "Zadejte platný e-mail",
    "viewOffer": "Prohlédnout nabídku",
    "yourCode": "Váš slevový kód",
    "seg5": "5% sleva",
    "seg10": "10% sleva",
    "seg15": "15% sleva",
    "seg20": "20% sleva",
    "seg25": "25% sleva",
    "segMiss": "Zkus příště",
    "close": "Zavřít"
  }
}
```

### Krok 8: E-mail šablona

Jednoduchý HTML e-mail poslaný přes Resend:
```
Předmět: Vaše výhra z Kolečka štěstí — {discount}% sleva! 🎉

Gratulujeme!
Vyhráli jste {discount}% slevu na nákup vlasů.

Váš slevový kód: {CODE}
Platný do: {validTo}

Použijte kód při objednávce nebo poptávce na hairland.cz.
```

---

## Seznam souborů

### Nové soubory
| Soubor | Účel |
|--------|------|
| `src/components/public/SpinWheel.tsx` | Animované kolečko (CSS/SVG) |
| `src/components/public/SpinWheelPopup.tsx` | Modal wrapper s trigger logikou |
| `src/app/api/public/spin/route.ts` | API — validace, RNG, PromoCode vytvoření, e-mail |

### Existující soubory k editaci
| Soubor | Změna |
|--------|-------|
| `prisma/schema.prisma` | Přidat model SpinEntry |
| `src/app/(public)/layout.tsx` | Přidat `<SpinWheelPopup />` |
| `messages/cs.json` | Namespace `spinWheel` |
| `messages/uk.json` | Namespace `spinWheel` |
| `messages/ru.json` | Namespace `spinWheel` |

### SQL migrace (Turso)
```sql
CREATE TABLE IF NOT EXISTS "spin_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "segment" INTEGER NOT NULL,
    "won" INTEGER NOT NULL DEFAULT 0,
    "discountPercent" INTEGER,
    "promoCodeId" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "spin_entries_email_key" ON "spin_entries"("email");
CREATE INDEX "spin_entries_createdAt_idx" ON "spin_entries"("createdAt");
```

---

## Bezpečnostní opatření

1. **Server-side RNG** — segment se nikdy neurčuje na klientovi
2. **Rate limiting** — max 5 pokusů per IP per hodina (stejný pattern jako inquiry)
3. **E-mail uniqueness** — UNIQUE index v DB, pokus o duplikát vrátí `already_played`
4. **Promo kód** — jednorázový (maxUses=1), platný 30 dní, automaticky expiruje
5. **Kód na klientovi se nezobrazuje celý** — plný kód přijde jen na e-mail
6. **localStorage** — dismissal + played flag zabrání spam zobrazování

## Pořadí implementace

1. Schema + SQL migrace (SpinEntry tabulka)
2. API endpoint `/api/public/spin`
3. SpinWheel komponenta (animace)
4. SpinWheelPopup (modal + trigger)
5. Layout integrace
6. i18n překlady
7. E-mail šablona
8. Testování (manual)

## Design poznámky

- Kolečko by mělo vizuálně odpovídat Hairland brandu (rose, gold, nude tóny)
- Animace: plynulé zpomalení (ease-out), ~4s, 5 plných otáček
- Na mobilech: modal zabere celou obrazovku, kolečko se zmenší
- Zvukový efekt: NE (rušivé, problematické na mobilech)
- Konfety po výhře: ANO (už existuje `canvas-confetti` v projektu — viz InquiryCartClient)
