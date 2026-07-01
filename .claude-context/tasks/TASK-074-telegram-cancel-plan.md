# TASK-074: Telegram notifikace při zrušení objednávky

## Cíl
Při zrušení objednávky poslat Telegram notifikaci. Obousměrně:
1. **Salon zruší objednávku** → Telegram notifikace adminovi (do group chatu)
2. **Admin zruší objednávku** → Telegram notifikace (do group chatu, se jménem salonu)

## Současný stav

### Cancel logika
**Soubor**: `src/app/api/orders/[id]/route.ts:239-293`

Akce `cancel` už má:
- In-app notifikaci adminovi (pokud salon ruší): `createNotificationForRole` (řádky 277-283)
- In-app notifikaci salonu (pokud admin ruší): `createSalonNotification` (řádky 285-290)
- Audit log s `cancelledBy: "salon" | "admin"`

**Chybí**: Telegram bot zprávy.

### Existující Telegram infrastruktura
**Soubor**: `src/lib/telegram.ts`

Dostupné funkce:
- `sendTelegramMessage(text)` — jednoduchá zpráva bez tlačítek (řádek 106)
- `sendWithClaimButton(text, type, recordId)` — zpráva s "BERU" tlačítkem (řádek 10)
- `notifyInquiry(...)` — vzor pro formátování zpráv
- `esc(s)` — HTML escape pro Telegram
- Env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- Formát: HTML parse_mode, bilinguální CZ/RU

### Vzor existujících notifikací
Všechny Telegram zprávy mají pattern:
```
EMOJI <b>NADPIS CZ / NADPIS RU</b>
Popis CZ
Popis RU

Detail řádky...
```

---

## Implementační plán

### Krok 1: Nová funkce v telegram.ts

**Soubor**: `src/lib/telegram.ts`

Přidat novou exportovanou funkci:

```ts
/**
 * Notify about order cancellation.
 */
export async function notifyOrderCancelled(data: {
  orderNumber: string | null;
  orderId: string;
  salonName: string;
  cancelledBy: "salon" | "admin";
  itemCount: number;
}): Promise<void> {
  const orderLabel = data.orderNumber ?? data.orderId.slice(0, 8);
  
  const lines = data.cancelledBy === "salon"
    ? [
        `❌ <b>OBJEDNÁVKA ZRUŠENA SALONEM / ЗАКАЗ ОТМЕНЁН САЛОНОМ</b>`,
        ``,
        `Objednávka/Заказ: ${esc(orderLabel)}`,
        `Salon/Салон: ${esc(data.salonName)}`,
        `Položek/Позиций: ${data.itemCount}`,
        ``,
        `Salon zrušil svou objednávku.`,
        `Салон отменил свой заказ.`,
      ]
    : [
        `❌ <b>OBJEDNÁVKA ZRUŠENA ADMINEM / ЗАКАЗ ОТМЕНЁН АДМИНОМ</b>`,
        ``,
        `Objednávka/Заказ: ${esc(orderLabel)}`,
        `Salon/Салон: ${esc(data.salonName)}`,
        `Položek/Позиций: ${data.itemCount}`,
        ``,
        `Admin zrušil objednávku salonu.`,
        `Админ отменил заказ салона.`,
      ];

  await sendTelegramMessage(lines.join("\n"));
}
```

**Poznámka**: Používám `sendTelegramMessage` (bez tlačítek) — cancel nemá akci k provedení, je to jen informativní zpráva.

### Krok 2: Volání v cancel akci

**Soubor**: `src/app/api/orders/[id]/route.ts`

Na řádku ~262 (po existující logice cancel) přidat import a volání:

1. Přidat import:
```ts
import { notifyOrderCancelled } from "@/lib/telegram";
```

2. Po existujících in-app notifikacích (řádek ~291, před `return NextResponse.json(order)`) přidat:
```ts
// Telegram notification
notifyOrderCancelled({
  orderNumber: order.orderNumber,
  orderId: order.id,
  salonName: orderCheck.salon.name,
  cancelledBy: isSalonCancel ? "salon" : "admin",
  itemCount: orderCheck.items?.length ?? 0,
}).catch(() => {});
```

**DŮLEŽITÉ**: Potřeba rozšířit `orderCheck` query o items count. Aktuální query (řádek 240-243):
```ts
const orderCheck = await prisma.order.findUniqueOrThrow({
  where: { id },
  include: { salon: { select: { name: true } } },
});
```
Změnit na:
```ts
const orderCheck = await prisma.order.findUniqueOrThrow({
  where: { id },
  include: {
    salon: { select: { name: true } },
    _count: { select: { items: true } },
  },
});
```
A pak použít `orderCheck._count.items` místo `orderCheck.items?.length`.

---

## Seznam souborů k úpravě

| Soubor | Změna |
|--------|-------|
| `src/lib/telegram.ts` | Přidat funkci `notifyOrderCancelled()` |
| `src/app/api/orders/[id]/route.ts` | Import + volání `notifyOrderCancelled()`, rozšířit orderCheck query o `_count` |

**Žádné nové soubory. Žádné DB migrace. 2 editace.**

---

## Poznámky

- Telegram zpráva jde do sdíleného group chatu (TELEGRAM_CHAT_ID) — vidí ji admin i kadeřnice
- Pokud salon nemá Telegram (většina), vidí in-app notifikaci — ta už existuje
- `.catch(() => {})` — Telegram selhání nesmí blokovat cancel flow (konzistentní s ostatními notifikacemi)
- Bilinguální formát (CZ/RU) — konzistentní se všemi existujícími Telegram zprávami v projektu
