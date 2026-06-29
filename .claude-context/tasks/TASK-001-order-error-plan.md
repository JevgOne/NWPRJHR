# TASK-001: Fix salon catalog order error "The string did not match the expected pattern"

## Root Cause

The error "The string did not match the expected pattern" is a **LibSQL/Turso driver error** that occurs when `null`/`undefined` is passed as an ID value to a database query.

### Error flow:
1. Salon user clicks "Odeslat objednavku" in `/salon/catalog`
2. Client sends `POST /api/orders` with `{ items: [...], note: "..." }` — **no `salonId` in body** (correct — salon users shouldn't send salonId, the server determines it from the session)
3. In `src/app/api/orders/route.ts:76-77`:
   ```typescript
   if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
     salonId = session.user.salonId!;  // <-- BUG: non-null assertion on nullable value
   }
   ```
   If `session.user.salonId` is `null`, the `!` assertion does nothing at runtime — `salonId` becomes `null`.
4. `createOrder(salonId, ...)` is called with `null` (`src/app/api/orders/route.ts:88`)
5. In `src/lib/order-workflow.ts:31`:
   ```typescript
   const salon = await tx.salon.findUniqueOrThrow({ where: { id: salonId } });
   ```
   Prisma passes `null` to LibSQL which throws "The string did not match the expected pattern"

### Why `salonId` can be null:
- User with role SALON/HAIRDRESSER has `salonId = null` in database
- Salon was deleted but user account remains
- Registration created user before salon linking was completed

## Fix Plan

### File 1: `src/app/api/orders/route.ts`
**Line 76-77** — Add explicit null check for `session.user.salonId`

**Before:**
```typescript
if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
    salonId = session.user.salonId!;
}
```

**After:**
```typescript
if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
    if (!session.user.salonId) {
      return NextResponse.json(
        { error: "Salon account not linked. Contact support." },
        { status: 403 }
      );
    }
    salonId = session.user.salonId;
}
```

**Why:** This is the primary fix. Instead of silently passing `null` and letting the DB driver throw a cryptic error, we return a clear 403 error before reaching the database. The non-null assertion `!` is also removed since the guard clause makes it unnecessary.

### File 2: `src/app/api/orders/route.ts` (GET handler)
**Line 24-25** — Same pattern exists in GET handler

**Before:**
```typescript
if (session.user.role === "SALON" || session.user.role === "HAIRDRESSER") {
    where.salonId = session.user.salonId;
}
```

**After:** No change needed for GET — a `null` salonId in a `where` clause will simply return no results (no crash). But for consistency and correctness, consider adding a guard there too. **Optional fix — low priority.**

### File 3: `src/app/(salon)/salon/catalog/CatalogClient.tsx`
**Line 128-129** — Improve client-side error display

The client already handles errors correctly:
```typescript
setOrderError(e instanceof Error ? e.message : t("orderError"));
```

The fix in the API route will now return `"Salon account not linked. Contact support."` instead of "The string did not match the expected pattern", which is a much clearer message for the user.

**No change needed in CatalogClient.tsx.**

### File 4: `src/lib/validations/salon.ts` (optional)
**No change needed.** The `createOrderSchema` correctly has `salonId: z.string().optional()` — the salonId for salon users comes from the session, not the request body.

## Summary of Changes

| File | Line | Change | Priority |
|------|------|--------|----------|
| `src/app/api/orders/route.ts` | 76-77 | Add null guard for `session.user.salonId`, return 403 | **CRITICAL** |

**Total files to edit:** 1
**Total lines changed:** ~5 (add 4 lines, modify 1 line)
**Risk:** Very low — guard clause before existing logic, no behavior change for valid sessions

## Testing

1. Test with a SALON user who has a valid `salonId` — should work as before
2. Test with a SALON user whose `salonId` is `null` — should get clear 403 error instead of cryptic pattern error
3. Test with OWNER/EMPLOYEE role + explicit salonId in body — should work as before
4. Verify that the existing Zod validation still runs before the salonId check
