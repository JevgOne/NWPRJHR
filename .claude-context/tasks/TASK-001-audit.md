# TASK-001 Audit: Fix salon catalog order error

**Zadani uzivatele (doslovna citace):** "objednavka nejde odeslat"
**Chybova hlaska:** "The string did not match the expected pattern"
**Status:** SCHVALENO

---

## Co bylo opraveno

### 1. Zod schema — `salonId` udelano optional (commit 8bd3e7e)
- **Pred:** `salonId: z.string()` — REQUIRED
- **Po:** `salonId: z.string().optional()`
- **Proc:** Salon/hairdresser klient NEPOSILA salonId v body (bere se ze session). Povinny `z.string()` validace padala na `undefined` s chybou "The string did not match the expected pattern".

### 2. API route — explicitni null check na session.user.salonId (commit 8bd3e7e + nasledujici)
- **Pred:** `salonId = session.user.salonId!` — non-null assertion, pokud salonId je null -> Prisma throws
- **Po:** Explicitni check `if (!session.user.salonId)` s chybovou hlaskou 403 "Salon account not linked. Contact support."
- **Navic:** OWNER/EMPLOYEE logika rozdelena s validaci `if (!parsed.data.salonId)` -> 400 error

### 3. Klient (CatalogClient.tsx) — BEZ ZMEN
- Klient spravne posila jen `items` a `note` (bez salonId) — to je korektni, protoze salon dostane salonId ze session.

## Overeni spravnosti

| Kontrolni bod | Vysledek |
|---|---|
| Root cause identifikovan? | ANO — Zod schema vyzadovala salonId, klient ho neposilal |
| Oprava odpovida root cause? | ANO — salonId je nyni optional v schema |
| Null safety na session.user.salonId? | ANO — explicitni check misto `!` assertion |
| Chybove hlasky pro uzivatele? | ANO — "Salon account not linked" (403) |
| Staff flow (OWNER/EMPLOYEE) funguje? | ANO — vyzaduje salonId v body, validovano |
| Klient posila spravny format? | ANO — items array s variantId/grams/pieces, note optional |
| Zadne vedlejsi efekty? | ANO — zmena je minimalni a cilena |

## Verdikt

**SCHVALENO** — Oprava presne resi pricinu problemu "objednavka nejde odeslat". Zod schema uz neodmitne request bez salonId, a API route spravne bere salonId ze session pro salon/hairdresser uzivatele.
