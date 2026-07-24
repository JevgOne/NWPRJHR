# TASK-103: Smazání testovacích zákazníků z DB

**Priorita:** P1
**Stav:** čeká

## Popis
Testovací zákazníci musí pryč z produkční DB.

## Zákazníci ke smazání
- "Test ApiTest" — určitě smazat
- "Jitka Zkouška" — ověřit zda je test (příjmení naznačuje ano)

## Plán
1. Najít zákazníky v DB
2. Ověřit že nemají reálné objednávky/prodeje
3. Cascade delete nebo soft delete
