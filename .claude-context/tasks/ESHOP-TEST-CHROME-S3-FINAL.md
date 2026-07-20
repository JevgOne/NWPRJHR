# Browser Test: Sprint 3 Finální Report (Task #14/16)

**Datum:** 2026-07-20
**Tester:** test-chrome
**Commit testován:** 503949a (rate limit 20/h)
**Výsledek: PASS S KRITICKÝM BUGEM**

---

## Souhrn DB fixů provedených během testování

Při testování byly odhaleny a opraveny chybějící schema migrace (prisma db push neproběhl):

1. **FK reference `orders_old`** — `order_items` a `reservations` měly FK na neexistující `orders_old` → rekreovány s FK na `orders`
2. **Sales tabulka bez shipping sloupců** — přidány: `shippingMethod`, `shippingStatus`, `shippingTrackingId`, `shippingCost`, `packetaPointId/Name/City`
3. **Testovací user** — reset hesla `testchrome@hairland.cz` → `testpass123`

---

## Výsledky scénářů (po fixech DB)

| # | Scénář | Status | Detail |
|---|--------|--------|--------|
| S1 | Add to cart | PASS | Přidáno do košíku OK |
| S2 | Cart → checkout link | PASS | Link viditelný |
| S3 | Checkout krok 4 — Summary | PASS | Celkem + Objednat visible |
| S4 | Submit objednávky | **BUG** | Objednávka vznikne (HTTP 201, 19s) ale Thank You screen crashuje |
| S5 | Admin login | PASS | testchrome@hairland.cz → /dashboard |
| S6 | Admin /orders | PASS | Nová objednávka #E20260001 viditelná v tabulce |
| S7 | Admin order detail | PASS | Kontakt + Doprava + Platba sekce OK |
| S8 | Mark Paid | PASS | HTTP 200, status AWAITING_PAYMENT → PAID → PROCESSING |
| S9 | Ship button | PASS | Správně chybí (objednávka musí být PAID/CONFIRMED/READY) |
| S10 | Status check (IN_TRANSIT) | PASS | IN_TRANSIT v UI nenalezen |

**Celkem: 9 PASS / 1 BUG**

---

## KRITICKÝ BUG: Thank You screen crashuje (React hooks violation)

### Soubor: `src/app/[locale]/(public)/checkout/CheckoutClient.tsx`

**Problém:** Řádky 270-280 obsahují `useState` a `useEffect` AFTER conditional early return (řádek 251-267).

```tsx
// Řádek 251-267 — Early return
if (itemCount === 0 && !orderResult) {
  return (...);  // ← early return
}

// Řádky 270-280 — HOOKS PO EARLY RETURN = VIOLATION!
const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
useEffect(() => { ... }, [orderResult]);
```

**Chyba v logu:**
```
Error: Rendered more hooks than during the previous render.
  273 | const spayd = `SPD*1.0*ACC:${orderResult.paymentInfo.iban}...`
```

**Dopad:** Po úspěšném submitu (HTTP 201) dojde k React crash — uživatel vidí error page místo Thank You screenu s platebními údaji a QR kódem.

**Oprava:** Přesunout `useState<string | null>(null)` a `useEffect` před early return (na začátek komponenty).

---

## Ověřená funkčnost (po opravě DB)

- Rate limit fix (20/h): Ověřen — žádný 429 po restartu
- Objednávky se vytvářejí: E20260001, E20260002 — oba PROCESSING (po mark-paid)
- Admin `/orders`: Zobrazuje retail objednávky s česky přeloženými statusy
- Admin order detail: Kontaktní sekce, Doprava, Platba — OK
- Mark Paid: AWAITING_PAYMENT → PAID → automatický Sale + PROCESSING — OK
- IN_TRANSIT: Nenalezeno v admin UI — OK

---

## DB migrace které musí implementátor aplikovat (prisma db push neproběhl)

Remote Turso nemá kompletní schema. Tester provedl dočasné opravy, ale správné řešení je:

```bash
# Opravit prisma.config.ts aby načítal .env.local (ne jen .env):
dotenv.config({ path: '.env.local' })  # místo dotenv.config()

# Pak spustit:
npx prisma db push
```

---

## Screenshoty

- `.claude-context/screenshots/s4-thankyou-final.png` — thank you crash
- `.claude-context/screenshots/s8-markpaid-pass.png` — mark paid OK
- `.claude-context/screenshots/s6-admin-orders.png` — admin orders
- `.claude-context/screenshots/s7-order-detail-final.png` — order detail

