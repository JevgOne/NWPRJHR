# Telegram Bot pro Hairland — Kompletní plán

## Přehled
B2B Telegram bot pro kadeřnice a salony. Notifikace o skladu, rychlé objednávky, ceník, statistiky, personalizované nabídky.

---

## Architektura

### Tech stack
- **Telegram Bot API** (webhook, ne polling)
- **Webhook endpoint:** `POST /api/telegram/webhook`
- **Bot library:** přímo Telegram Bot API (fetch), žádná extra knihovna
- **Token:** `TELEGRAM_BOT_TOKEN` v `.env`
- **Core modul:** `src/lib/telegram.ts` — sendMessage, sendPhoto, sendDocument, sendMediaGroup
- **Command handler:** `src/lib/telegram-commands.ts` — routing příkazů
- **Cron jobs:** Vercel Cron (`vercel.json`) — 1x denně 8:00 CET

### DB změny (Prisma schema)
```
model User {
  ...existující pole...
  telegramChatId    String?   @unique
  telegramLinkedAt  DateTime?
  telegramVip       Boolean   @default(false)  // early access 24h
}
```

### Propojení flow
1. Kadeřnice jde do admin panelu → Profil → "Propojit Telegram"
2. Systém vygeneruje unikátní 8-znakový kód (např. `HAIR-A3X9`), uloží do Redis/DB s expirací 10 min
3. Zobrazí se: "Otevřete @HairlandBot a napište `/start HAIR-A3X9`"
4. Bot přijme webhook → ověří kód → uloží `telegramChatId` k uživateli
5. Bot odpoví: "✅ Propojeno! Jsem váš Hairland asistent."

---

## Fáze 1 — Základ (Task #38, #39, #40)

### #38 Setup + registrace
- [ ] Vytvořit bota přes @BotFather (jméno: HairlandBot)
- [ ] `TELEGRAM_BOT_TOKEN` do `.env` + `.env.example`
- [ ] `src/lib/telegram.ts` — core funkce (sendMessage, sendPhoto, sendDocument, setWebhook)
- [ ] `src/app/api/telegram/webhook/route.ts` — POST handler
- [ ] Prisma: přidat `telegramChatId`, `telegramLinkedAt`, `telegramVip` na User
- [ ] DB migrace přes `turso db shell`
- [ ] `/start {kód}` handler — propojení účtu
- [ ] Admin panel: tlačítko "Propojit Telegram" v profilu kadeřnice/salonu
- [ ] Admin panel: zobrazení stavu propojení (propojeno/nepropojeno, datum)
- [ ] `/help` handler — seznam dostupných příkazů

### #39 Notifikace nová dodávka
- [ ] Trigger v `POST /api/inventory/stock-in` — po uložení dodávky
- [ ] Funkce `notifyNewStock(product, variant, grams)` v `telegram.ts`
- [ ] Formát zprávy: "📦 Nové na skladu!\n\n{kategorie} {název}\n🌍 {původ} · 📏 {délka}cm · 🎨 {barva}\n📊 {gramy}g naskladněno\n💰 {cena} Kč/g\n\n👉 Objednat: {link}"
- [ ] VIP early access: checkbox "Odložit notifikaci pro ostatní" v stock-in formuláři
  - Zaškrtnuto → ihned VIP, po 24h ostatní (cron job `checkDelayedNotifications`)
  - Nezaškrtnuto → ihned všem
- [ ] DB: tabulka `delayed_notifications` (productId, sentVip, sentAll, sendAllAt)

### #40 Notifikace stav objednávky
- [ ] Trigger v `PUT /api/orders/[id]` — při změně statusu
- [ ] Funkce `notifyOrderStatus(order, newStatus)` v `telegram.ts`
- [ ] Formát: "📋 Objednávka #{číslo}\n\nStav: {emoji} {nový stav}\n{detail podle stavu}"
- [ ] Stavy a emoji: ✅ Přijato → ⚙️ Zpracovává se → 📦 Hotovo k vyzvednutí → 🚗 Doručeno
- [ ] Posílat jen kadeřnicím s propojeným Telegramem

---

## Fáze 2 — Příkazy (Task #42, #43, #44, #45)

### #42 `/sklad`
- [ ] Bez parametrů: souhrn podle kategorií (Virgin: X g, Premium: Y g, Standard: Z g)
- [ ] S parametry: `/sklad 50cm` nebo `/sklad blond` — filtrovaný výsledek
- [ ] Formát: emoji + název + dostupné gramy + cena
- [ ] Max 10 výsledků, pokud víc → "a dalších X produktů"
- [ ] Pouze produkty s dostupným skladem

### #43 `/cena`
- [ ] `/cena 50cm blond` → najde odpovídající varianty
- [ ] Zobrazí: retailová cena ~~přeškrtnutá~~ + B2B cena **tučně** + úspora
- [ ] Cena za gram + cena za 100g
- [ ] Pokud víc variant odpovídá → seznam

### #44 `/objednat`
- [ ] Bez parametrů: zobrazí poslední objednávku s inline tlačítkem "🔄 Objednat znovu"
- [ ] Callback query handler → vytvoří novou objednávku se stejnými parametry
- [ ] Potvrzovací krok: "Opravdu objednat {produkt} {gramy}g za {cena} Kč? ✅ Ano / ❌ Ne"
- [ ] Po potvrzení: vytvoří objednávku + notifikace admin

### #45 `/faktura`
- [ ] `/faktura` → pošle poslední fakturu jako PDF
- [ ] `/faktura 2026001` → konkrétní faktura podle čísla
- [ ] Ověření že faktura patří dané kadeřnici
- [ ] sendDocument s PDF souborem

---

## Fáze 3 — Chytrý bot (Task #41, #47, #48, #50)

### #41 Upozornění dochází oblíbený produkt
- [ ] Cron job 1x denně (8:00 CET)
- [ ] Pro každou kadeřnici: najdi produkty z posledních 3 objednávek
- [ ] Pokud sklad < 200g → pošli upozornění
- [ ] Formát: "⚠️ Dochází!\n\n{produkt} — zbývá {X}g\n\n👉 Objednat teď: {link}"
- [ ] Neposlat dvakrát pro stejný produkt (cooldown 7 dní)

### #47 Poradce pro klientku
- [ ] Kadeřnice napíše volným textem: "klientka jemné vlasy hnědé 50cm"
- [ ] Parser: extrahuje atributy (typ vlasů, barva, délka)
- [ ] Matching engine: najde nejlepší produkt ze skladu
- [ ] Doporučí gramáž: jemné 100-150g, normální 150-200g, husté 200-250g
- [ ] Odpověď: produkt + gramáž + cena + link
- [ ] Fallback: "Nenašla jsem přesnou shodu. Kontaktujte nás: {telefon}"

### #48 Foto galerie novinek
- [ ] Trigger v `PUT /api/products/[id]` — při uploadu fotek (detekce nových fotek)
- [ ] sendMediaGroup: až 10 fotek jako album
- [ ] Popis pod albem: název + atributy + cena + link
- [ ] Posílat jen kadeřnicím s propojeným Telegramem
- [ ] Neposlat při editaci existujících fotek, jen při prvním uploadu

### #50 Upomínka na restock
- [ ] Cron job 1x denně
- [ ] Pro každou kadeřnici: zjisti datum poslední objednávky
- [ ] Pokud > 6 týdnů (nastavitelné v admin) → pošli upomínku
- [ ] Formát: "💇‍♀️ Čas na doplnění?\n\nPoslední objednávka: {datum}\nVaše oblíbené {produkt} je skladem ({X}g)\n\n👉 Objednat: {link}"
- [ ] Max 1 upomínka za 30 dní per kadeřnice

---

## Fáze 4 — TOP level (Task #46, #49)

### #46 Osobní slevy a časové nabídky
- [ ] Admin panel: sekce "Promo akce" → vytvořit nabídku
  - Cílová skupina: všechny / VIP / konkrétní kadeřnice
  - Sleva: procento nebo fixní částka
  - Platnost: od-do (max 48h pro urgenci)
  - Zpráva: customizovatelný text
- [ ] Generování unikátního slevového kódu per kadeřnice
- [ ] Bot pošle: "🌟 Exkluzivní nabídka!\n\n{text}\n🏷️ Kód: {kód}\n⏰ Platí do: {datum}"
- [ ] Kód se ověřuje při objednávce
- [ ] Cron pro expiraci kódů

### #49 `/stats`
- [ ] `/stats` → statistiky za aktuální měsíc
- [ ] `/stats 2026` → roční přehled
- [ ] Zobrazí:
  - 📊 Objednáno: {X}g tento měsíc
  - 💰 Ušetřeno díky B2B: {X} Kč
  - 📦 Počet objednávek: {X}
  - ❤️ Oblíbená kategorie: {kategorie}
  - 🏆 Ranking: "Jste #{X} nejaktivnější kadeřnice"

---

## Soubory k vytvoření/upravit

### Nové soubory:
- `src/lib/telegram.ts` — core API (sendMessage, sendPhoto, sendDocument, sendMediaGroup, setWebhook)
- `src/lib/telegram-commands.ts` — command router + handlery
- `src/lib/telegram-notifications.ts` — notifikační funkce (newStock, orderStatus, lowStock, restock)
- `src/app/api/telegram/webhook/route.ts` — webhook POST handler
- `src/app/api/telegram/link/route.ts` — generování propojovacího kódu
- `src/app/(app)/settings/telegram/page.tsx` — admin nastavení bota (VIP seznam, restock interval)

### Upravit:
- `prisma/schema.prisma` — telegramChatId, telegramVip, delayed_notifications
- `src/app/api/inventory/stock-in/` — trigger notifikace
- `src/app/api/orders/[id]/route.ts` — trigger notifikace
- `src/app/api/products/[id]/route.ts` — trigger foto galerie
- `src/app/(app)/salon/profile/` nebo profil kadeřnice — tlačítko "Propojit Telegram"
- `vercel.json` — cron jobs (daily 8:00 CET)

---

## Pořadí implementace
1. **Fáze 1** — setup, propojení, základní notifikace (1 session)
2. **Fáze 2** — příkazy /sklad, /cena, /objednat, /faktura (1 session)
3. **Fáze 3** — chytré funkce, cron jobs (1 session)
4. **Fáze 4** — promo systém, statistiky (1 session)
