# TASK-112: Zásilkovna widget — nefunguje výběr pobočky

**Priorita:** P2
**Stav:** čeká

## Popis
Widget se neotevírá při výběru Zásilkovny v checkoutu.

## Analýza
- `src/app/[locale]/(public)/checkout/CheckoutClient.tsx`
- Packeta widget: `public/` script v layout
- `PacketaWidget.tsx`

## Plán
1. Ověřit zda se Packeta script načítá
2. Debug widget inicializaci
3. Zkontrolovat API klíč (2bed6e6598041af2)
4. Ověřit callback handling
