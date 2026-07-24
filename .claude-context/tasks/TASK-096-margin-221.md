# TASK-096: Marže 221% místo 100%

**Priorita:** P0
**Stav:** čeká na debug

## Popis problému
Po úpravě nákupní ceny na 3300 u S-RV-10-55 je marže stále 221% místo 100%.

## Analýza
- Variant PUT: `src/app/api/variants/[id]/route.ts`
- Pricing: `src/lib/pricing.ts`
- Price settings: `src/app/api/price-settings/route.ts`
- Možné příčiny: retailPrice se nepřepočítá po změně nákupní ceny, cache, špatný výpočet marže

## Plán opravy
1. Debug: co se děje po PUT na variant s novou cenou
2. Ověřit zda se retailPrice přepočítá automaticky dle marže 100%
3. Ověřit pricing.ts logiku
4. Zkontrolovat zda se mění purchasePrice na delivery úrovni nebo variant úrovni
