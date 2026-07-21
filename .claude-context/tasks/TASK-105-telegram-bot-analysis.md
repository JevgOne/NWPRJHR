# TASK-105: Telegram Bot pro Hairland — Analýza a Návrh

## Analýza @kvetiny_my_angel_bot

Květinářský bot v Praze nabízí:
- Objednávka kytic přes chat
- Doručení po Praze
- Bonusový/věrnostní program
- Automatická blahopřání k svátkům

**Co můžeme převzít pro Hairland:**
Princip "objednávka přes chat" je ideální pro B2B kadeřnice — rychlé objednávky bez nutnosti se přihlašovat do admin panelu.

---

## Návrh Hairland Telegram Bota

### Architektura
- Využít existující bot token `8920165194:AAGOP6hdSKiFUbCodjp8eAkaAd4phMpDwKk`
- Webhook endpoint: `/api/telegram/webhook`
- Skupina "HairSystem" zůstane pro notifikace (poptávky, objednávky, reklamace)
- Bot bude fungovat i v privátních zprávách pro zákazníky

### TOP Funkce

#### 1. 📦 Katalog a objednávky (B2B)
- `/catalog` — zobrazí dostupné produkty s cenami (B2B ceny pro registrované)
- Inline tlačítka: vybrat produkt → délka → barva → množství → potvrdit
- Automatické vytvoření objednávky v systému
- Notifikace adminovi v skupině

#### 2. 💬 Online chat / Zákaznická podpora
- Bot jako live chat — zákazník napíše botu, zpráva se přepošle do admin skupiny
- Admin odpoví v skupině, bot přepošle odpověď zákazníkovi
- Historie konverzací uložena v DB
- Nahrazuje Crisp/Tawk/Intercom — ZDARMA

#### 3. 📊 Stav objednávky
- `/order` nebo `/objednavka` — zákazník zadá číslo objednávky
- Bot vrátí aktuální stav (nová/potvrzená/odesláno/doručeno)
- Automatický tracking od Zásilkovny/Packety

#### 4. 🔔 Notifikace pro adminy (už funguje)
- Nové poptávky s tlačítkem "BERU"
- Nové objednávky
- Reklamace
- Naskladnění
- Nízký stav skladu

#### 5. 💳 Platba přes QR / link
- Po vytvoření objednávky bot pošle platební link (Comgate)
- QR kód pro bankovní převod
- Apple Pay / Google Pay přes Comgate widget

#### 6. 📋 Rezervace přes bot
- Kadeřnice napíše "chci rezervovat 50g barva 6 délka 55cm"
- Bot zkontroluje sklad, vytvoří rezervaci
- Pošle zálohovou fakturu (50%)
- Po zaplacení potvrdí rezervaci

#### 7. 🎁 Věrnostní program
- Bot sleduje objednávky zákazníka
- Po X objednávkách automatická sleva / dárek
- "Doporučte nás" — referral kód přes bot

#### 8. 📸 Konzultace s fotkou
- Zákaznice pošle fotku svých vlasů
- Bot přepošle adminovi
- Admin doporučí produkty a délku
- Personalizovaný přístup

#### 9. 🏪 Lokátor / Mapa
- `/salons` — zobrazí mapu spolupracujících salonů
- Filtr podle města
- Odkaz na salon detail

#### 10. 📈 Admin příkazy
- `/stats` — denní přehled (prodeje, objednávky, sklad)
- `/stock` — aktuální stav skladu
- `/reservations` — aktivní rezervace

---

## Implementace — Fáze

### Fáze 1 (MVP — 1-2 dny)
- Webhook endpoint
- Online chat (zákazník ↔ admin skupina) — přeposílání zpráv
- Admin příkazy (/stats, /stock)
- Rozšíření existujících notifikací

### Fáze 2 (1-2 dny)
- Katalog s inline tlačítky
- Stav objednávky
- Platební linky

### Fáze 3 (2-3 dny)
- B2B objednávky přes bot
- Rezervace přes bot
- Věrnostní program

### Fáze 4 (budoucnost)
- AI chatbot (odpovídá na běžné dotazy automaticky)
- Konzultace s fotkou
- Multilingual (CZ/UK/RU)

---

## Technický stack
- Telegram Bot API (webhooks, ne polling)
- Existující Next.js API routes
- Prisma DB pro chat historii
- Inline keyboards pro interaktivní menu
- Comgate pro platby

## Použití jako online chat?
**ANO** — to je jeden z nejlepších use-cases. Výhody:
- Zákazník nemusí instalovat nic nového (Telegram má spousta lidí)
- Admin odpovídá přímo v skupině kde už dostává notifikace
- Historie konverzací
- Zdarma (žádné Crisp/Tawk poplatky)
- Push notifikace na mobilu pro admina
- Fotky, videa, dokumenty — vše nativně

**Nevýhoda:** Zákazník musí mít Telegram. Řešení: na webu tlačítko "Napsat na Telegram" + fallback na kontaktní formulář.
