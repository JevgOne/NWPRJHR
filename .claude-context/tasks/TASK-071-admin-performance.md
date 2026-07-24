# TASK-071: Performance — pomalé načítání admin panelu

**Priorita:** P2
**Stav:** čeká

## Popis
Admin panel se načítá pomalu.

## Plán
1. Profiling — identifikovat bottlenecky (DB queries, bundle size, SSR)
2. Optimalizovat nejpomalejší queries
3. Lazy loading komponent
4. Zvážit ISR/SWR pro statická data
