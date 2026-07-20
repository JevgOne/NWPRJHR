# TASK-031: Server error na localhost inventory stránce

**Status:** Analýza hotová
**Autor:** Plánovač
**Datum:** 2026-07-15

---

## Diagnostika

### 1. `lib/queries.ts` — NEEXISTUJE v repo

Gemini měl údajně pushout commit `33fb67d` s úpravou `lib/queries.ts`. Ale:
- `git fetch --all` — žádné nové remote commity
- `git log --all` — commit `33fb67d` neexistuje nikde
- `git branch -a` — pouze `main` a `remotes/origin/main`
- `origin/main` ukazuje na `379034f` (náš předposlední pushnutý commit)
- Soubor `src/lib/queries.ts` na disku neexistuje

**Závěr:** Gemini buď nepushoval, pushoval na jiný remote, nebo pushoval na jiný repo. Jeho změny NEJSOU v našem repo.

### 2. TypeScript — 0 chyb

`npx tsc --noEmit` prošlo bez chyb. Kód je typově korektní.

### 3. Dev server — běží na portu 3001

Node process PID 56778 naslouchá na portu 3001 (redwood-broker = Next.js dev).

### 4. Merge konflikty — ŽÁDNÉ

Žádné remote změny k mergi. 2 nepushnuté commity (`7ed9276`, `296329a`) jsou čistě ahead.

### 5. Auth error — ROOT CAUSE: chybí `.env.local`

**Na disku existuje pouze `.env.example`**. Žádný `.env.local` soubor.

NextAuth potřebuje `AUTH_SECRET` (nebo `NEXTAUTH_SECRET`) — bez něj:
- JWT signing selže → auth middleware crashne
- `/api/auth/error` zobrazí "Server error - There is a problem with the server configuration"
- Každá stránka s `auth()` voláním → error

Prisma (`lib/db.ts`) bez `TURSO_DATABASE_URL` fallbackne na `file:./dev.db` (řádek 33):
```typescript
url: remoteUrl ?? process.env.DATABASE_URL ?? "file:./dev.db",
```
Pokud `dev.db` neexistuje nebo nemá schema → Prisma query crashne → "Něco se pokazilo".

---

## Root cause

**Chybí `.env.local` s environment variables.** Konkrétně:

| Proměnná | Potřeba pro | Stav |
|----------|-------------|------|
| `NEXTAUTH_SECRET` nebo `AUTH_SECRET` | JWT signing, session | CHYBÍ → auth error |
| `TURSO_DATABASE_URL` | DB connection (remote Turso) | CHYBÍ → fallback na neexistující dev.db |
| `TURSO_AUTH_TOKEN` | DB auth | CHYBÍ |
| `NEXTAUTH_URL` | Auth callback URLs | CHYBÍ (default http://localhost:3000, ale server je na :3001) |

---

## Fix plan pro implementátora

### Krok 1: Vytvořit `.env.local`

Potřebné proměnné (vzít z Vercel dashboard → Settings → Environment Variables):

```env
# Auth
AUTH_SECRET=<z Vercel>  # nebo NEXTAUTH_SECRET
NEXTAUTH_URL=http://localhost:3001

# Database (Turso)
TURSO_DATABASE_URL=<z Vercel>
TURSO_AUTH_TOKEN=<z Vercel>

# Blob storage
BLOB_READ_WRITE_TOKEN=<z Vercel>
```

**Odkud vzít:** Vercel dashboard → project NWPRJHR → Settings → Environment Variables. Nebo `vercel env pull .env.local`.

### Krok 2: Pushnout 2 nepushnuté commity

```bash
git push origin main
```

Commity: `7ed9276` (product card cleanup) + `296329a` (QR inventory button)

### Krok 3: Pokud Gemini pushoval na origin (a my to nevidíme)

```bash
git fetch origin
git log HEAD..origin/main --oneline  # zjistit co je nového
git pull --rebase origin main        # rebase naše commity na jeho
```

Aktuálně ale origin/main nemá žádné nové commity.

---

## Soubory k úpravě

| # | Soubor | Změna |
|---|--------|-------|
| 1 | `.env.local` | VYTVOŘIT — zkopírovat env vars z Vercel |

**Žádné source code změny nejsou potřeba.** Kód je OK, problém je chybějící konfigurace.
