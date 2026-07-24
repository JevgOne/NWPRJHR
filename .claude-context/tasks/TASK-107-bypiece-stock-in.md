# TASK-107: Naskladnění BY_PIECE visí na "Načítání..."

**Priorita:** P0
**Stav:** čeká

## Popis problému
LUXE exkluzivní culík se neuloží do DB — request timeoutuje, UI zůstane na "Načítání..."

## Analýza
- Deliveries POST: `src/app/api/deliveries/route.ts`
- BY_PIECE logika řádky 100-103
- `TURSO_EMBEDDED_REPLICA=true` na Vercelu — replica vrácena
- Vercel function limit může způsobit timeout

## Plán opravy
1. Prozkoumat proč POST /api/deliveries timeoutuje
2. Ověřit BY_PIECE logiku — správné vytváření stock movements
3. Zkontrolovat Vercel function timeout (default 10s)
4. Optimalizovat transakci pokud je pomalá
5. Přidat lepší error handling a loading states
