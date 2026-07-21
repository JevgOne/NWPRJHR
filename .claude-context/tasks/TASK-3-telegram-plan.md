# TASK-3: Telegram — posílat jen objednávky, ne naskladnění

## Požadavek
Telegram notifikace NEMAJÍ posílat zprávy o naskladnění (stock-in). Mají posílat POUZE objednávky a důležité notifikace.

## Analýza

### Aktuální Telegram notifikace (src/lib/telegram.ts)

| Funkce | Volána z | Typ zprávy | Ponechat? |
|--------|----------|------------|-----------|
| `notifyInquiry` | `api/public/inquiry/route.ts` | Nová poptávka z webu | ANO |
| `notifyContact` | `api/public/contact/route.ts` | Kontaktní formulář | ANO |
| `notifySalonRegistration` | `api/public/register-salon/route.ts` | Registrace salonu | ANO |
| **`notifyRestock`** | **`src/lib/stock-in.ts:93`** | **Naskladnění zboží** | **ODEBRAT** |
| **`notifyLowStock`** | **`src/lib/stock-in.ts:4` (import), `src/lib/sales.ts:267`** | **Nízký stav skladu** | **ZVÁŽIT** |
| `notifyNegativeReview` | `api/reviews/`, `api/public/reviews/` | Negativní recenze | ANO |
| `notifyComplaintTicket` | `api/public/complaint-tickets/route.ts` | Nová reklamace | ANO |
| `notifyOrderCancelled` | `api/orders/[id]/route.ts:596` | Zrušení objednávky | ANO |
| `sendTelegramMessage` | `api/cron/daily-summary/`, `api/cron/unassigned-reminder/` | Denní souhrn, reminders | ANO |

### Co odebrat

#### 1. `notifyRestock` — volání v stock-in.ts (řádky 81-101)
```typescript
// src/lib/stock-in.ts řádky 81-101 — CELÝ BLOK SMAZAT:
// Telegram: notify about restock
try {
  const variant = await prisma.variant.findUnique({...});
  if (variant) {
    notifyRestock(...).catch(() => {});
  }
} catch {}
```

Toto je jediné místo kde se `notifyRestock` volá. Po odstranění volání:
- Smazat import `notifyRestock` ze `stock-in.ts:4`
- Pokud `notifyRestock` nemá jiné volání → smazat i funkci z `telegram.ts:266-277`

#### 2. `notifyLowStock` z stock-in.ts — TAKY ODEBRAT
Import `notifyLowStock` v `stock-in.ts:4` existuje ale **NIKDY se nevolá** v tom souboru — import je nepoužitý. Odstranit.

`notifyLowStock` se skutečně volá jen z `sales.ts:267` (po prodeji). To je legitimní use case — upozornění že po prodeji dochází zboží. **PONECHAT volání v sales.ts.**

## Plán implementace

### Krok 1: src/lib/stock-in.ts — odebrat Telegram restock notifikaci
1. Smazat import `notifyRestock` a `notifyLowStock` z řádku 4 (ponechat jen ostatní importy)
2. Smazat celý blok řádky 81-101 (Telegram notify about restock)
3. Import `generateSku` z řádku 6 — ověřit zda je použit jinde, pokud ne → smazat

### Krok 2: src/lib/telegram.ts — smazat funkci notifyRestock
Smazat funkci `notifyRestock` (řádky 266-277) — nemá už žádné volání.

### Krok 3: Ověření
Grep `notifyRestock` v celém projektu — musí být 0 výskytů.

## Soubory k editaci
1. `src/lib/stock-in.ts` — odebrat import + volání (řádky 4, 81-101)
2. `src/lib/telegram.ts` — smazat `notifyRestock` funkci (řádky 263-277)

## Priorita
Střední — funkční ale nežádoucí chování.

## Poznámka
`notifyLowStock` z `sales.ts` se NEODEBÍRÁ — to je užitečná notifikace po prodeji, ne po naskladnění.
