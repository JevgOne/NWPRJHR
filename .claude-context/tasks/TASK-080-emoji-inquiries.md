# TASK-080: Emoji nefunguje v poptávkách (assignedTo)

**Priorita:** P2
**Stav:** čeká

## Popis
Emoji funguje v sidebaru ale ne v seznamu poptávek.

## Analýza
- `UserBadge.tsx`
- `InquiriesClient.tsx`

## Plán
1. Ověřit jak se emoji renderuje v UserBadge vs InquiriesClient
2. Pravděpodobně chybí emoji font/rendering v tabulce
