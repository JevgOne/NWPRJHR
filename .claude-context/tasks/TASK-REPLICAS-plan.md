# TASK: Turso Embedded Replicas — lokální SQLite replika

**Status:** Plan ready
**Datum:** 2026-07-06

## Kontext

- **Vercel region:** `cdg1` (Paříž) — `vercel.json`
- **Turso DB:** `https://hairora-eu-jevgone.aws-eu-west-1.turso.io` (EU West — Ireland)
- **Adapter:** `@prisma/adapter-libsql@^7.8.0` + `@libsql/client@^0.17.4`
- **Prisma:** `7.8.0`
- **Aktuální latence:** Každý Prisma dotaz = HTTP roundtrip na Turso = ~50-200ms

## Cíl

Čtení z lokální SQLite repliky = ~0ms latence. Zápisy přes remote Turso. Dramatické zrychlení zejména public stránek a dashboard.

---

## 1. Jak embedded replicas fungují

```
┌─────────────────────────┐
│  Vercel Function        │
│  ┌────────────────────┐ │
│  │  /tmp/replica.db   │ │  ← Lokální SQLite soubor
│  │  (embedded replica)│ │
│  └────────┬───────────┘ │
│           │ READ: ~0ms  │
│           │ WRITE: →    │
└───────────┼─────────────┘
            │
            ▼ WRITE + SYNC
┌─────────────────────────┐
│  Turso Primary DB       │
│  (aws-eu-west-1)        │
│  libsql://hairora-eu... │
└─────────────────────────┘
```

- **Reads:** Vždy z lokální repliky — mikrosekundy
- **Writes:** Odeslány na remote primary DB, lokální replika se aktualizuje po úspěšném zápisu
- **Read-your-writes:** Replika, která zápis provedla, vidí změny okamžitě
- **Sync interval:** Automatická synchronizace z remote → lokální replika každých N sekund

---

## 2. Konfigurace — `@libsql/client` Config

`PrismaLibSql` constructor přijímá `Config` z `@libsql/core/api` — ta podporuje:

```typescript
interface Config {
  url: string;              // "file:/tmp/replica.db" (lokální replika)
  authToken?: string;       // Turso auth token
  syncUrl?: string;         // Remote Turso URL pro sync
  syncInterval?: number;    // Auto-sync interval v sekundách
  readYourWrites?: boolean; // Read-your-writes konzistence (default: true)
  offline?: boolean;        // Offline writes (default: false)
}
```

---

## 3. Implementace — změna `src/lib/db.ts`

### Stávající kód:
```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./dev.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return new PrismaClient({ adapter });
}
```

### Nový kód s embedded replicas:
```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function createPrismaClient() {
  const remoteUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const useEmbeddedReplica = process.env.TURSO_EMBEDDED_REPLICA === "true" && remoteUrl;

  if (useEmbeddedReplica) {
    // Embedded replica mode: reads from local SQLite, writes to remote
    const adapter = new PrismaLibSql({
      url: "file:/tmp/turso-replica.db",
      authToken,
      syncUrl: remoteUrl,
      syncInterval: 60,        // Auto-sync every 60 seconds
      readYourWrites: true,    // Ensure write consistency
    });
    return new PrismaClient({ adapter });
  }

  // Standard mode: all queries go to remote (dev or without replica flag)
  const adapter = new PrismaLibSql({
    url: remoteUrl ?? process.env.DATABASE_URL ?? "file:./dev.db",
    authToken,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
```

### Environment variables:
```env
# Existing
TURSO_DATABASE_URL=libsql://hairora-eu-jevgone.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=eyJ...

# New
TURSO_EMBEDDED_REPLICA=true  # Enable embedded replicas on Vercel
```

---

## 4. Vercel serverless — omezení a workaroundy

### Problém: Ephemeral filesystem
Vercel serverless funkce mají `/tmp` adresář, který:
- **Persistuje** v rámci jedné "warm" instance (stejný container)
- **Ztrácí se** při cold startu (nový container)
- **Není sdílený** mezi instancemi

### Dopad na embedded replicas:
| Scénář | Chování |
|--------|---------|
| **Warm start** | Replika v `/tmp` existuje, čtení ~0ms |
| **Cold start** | Replika neexistuje, první sync stáhne data z remote |
| **Sync interval** | Funguje v rámci jedné instance (60s default) |
| **Mezi instancemi** | Každá instance má vlastní repliku |

### Sync strategie pro Vercel:
```typescript
// syncInterval: 60 — automatický sync každých 60s
// readYourWrites: true — po zápisu se okamžitě stáhne update
// Cold start: Automatický initial sync při vytvoření clienta
```

### Velikost repliky:
- Hairora DB je malá (~10-50MB) — initial sync na cold start = ~100-500ms
- Po initial sync: všechny reads jsou lokální = ~0ms
- Trade-off: 100-500ms jednou na cold start vs. 50-200ms na KAŽDÝ dotaz

---

## 5. Fallback strategie

```typescript
function createPrismaClient() {
  const remoteUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const useEmbeddedReplica = process.env.TURSO_EMBEDDED_REPLICA === "true" && remoteUrl;

  try {
    if (useEmbeddedReplica) {
      const adapter = new PrismaLibSql({
        url: "file:/tmp/turso-replica.db",
        authToken,
        syncUrl: remoteUrl,
        syncInterval: 60,
        readYourWrites: true,
      });
      return new PrismaClient({ adapter });
    }
  } catch {
    // Fallback to remote if embedded replica fails
    console.warn("Embedded replica failed, falling back to remote");
  }

  const adapter = new PrismaLibSql({
    url: remoteUrl ?? process.env.DATABASE_URL ?? "file:./dev.db",
    authToken,
  });
  return new PrismaClient({ adapter });
}
```

---

## 6. Očekávaný dopad na latenci

| Operace | Bez repliky | S replikou | Zlepšení |
|---------|-------------|------------|----------|
| Product detail (4 queries) | 200-800ms | 0-5ms | **99%** |
| Dashboard (12 queries) | 600-2400ms | 0-10ms | **99%** |
| Product listing | 100-200ms | 0-2ms | **99%** |
| Homepage (stylists) | 50-200ms | 0-1ms | **99%** |
| Cold start penalty | 0ms | 100-500ms | -500ms jednou |
| Write (create order) | 100-200ms | 100-200ms | 0% (writes go remote) |

**Net effect:** Dramatické zrychlení všech read operací. Writes zůstávají stejné.

---

## 7. Testování

### Krok 1: Lokální test
```bash
# .env.local
TURSO_DATABASE_URL=libsql://hairora-eu-jevgone.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=eyJ...
TURSO_EMBEDDED_REPLICA=true
```

Spustit `npm run dev` a ověřit:
- Čtení funguje (produkty, dashboard)
- Zápisy fungují (vytvořit objednávku, přidat recenzi)
- Data se aktualizují po zápisu (read-your-writes)

### Krok 2: Vercel preview deployment
- Přidat `TURSO_EMBEDDED_REPLICA=true` do Vercel env vars
- Deploy na preview branch
- Otestovat latenci pomocí browser DevTools (Network tab)
- Porovnat TTFB před/po

### Krok 3: Production rollout
- Přidat env var na production
- Monitorovat error rate a latenci
- Fallback: smazat `TURSO_EMBEDDED_REPLICA` env var → okamžitý rollback

---

## 8. Soubory k editaci

| Soubor | Akce | Popis |
|--------|------|-------|
| `src/lib/db.ts` | Edit | Přidat embedded replica konfigurace |
| `.env.local` | Edit | Přidat `TURSO_EMBEDDED_REPLICA=true` |
| Vercel Dashboard | Config | Přidat env var `TURSO_EMBEDDED_REPLICA=true` |

---

## 9. Rizika a mitigace

| Riziko | Pravděpodobnost | Mitigace |
|--------|-----------------|----------|
| Cold start pomalejší (initial sync) | Střední | Malá DB (~50MB), sync < 500ms |
| Data inconsistency mezi instancemi | Nízká | `syncInterval: 60` + `readYourWrites: true` |
| `/tmp` disk space na Vercelu | Velmi nízká | DB je malá, Vercel má 512MB /tmp |
| libsql embedded replica bug | Nízká | Fallback na remote, env var toggle |
| Prisma adapter nekompatibilita | Nízká | `PrismaLibSql` přijímá `Config` přímo — syncUrl je podporovaný |

---

## 10. Alternativa: `@tursodatabase/vercel-experimental`

Od února 2026 existuje `@tursodatabase/vercel-experimental` — partial sync driver speciálně pro Vercel. Stahuje pouze prvních 128KiB schema + hot pages.

**Výhoda:** Menší cold start (stahuje jen potřebné stránky).
**Nevýhoda:** Experimentální, jiné API, vyžaduje refaktoring db.ts.

**Doporučení:** Začít s nativní `@libsql/client` embedded replica (ověřené, stabilní API, funguje s aktuálním `PrismaLibSql`). Migrovat na `@tursodatabase/vercel-experimental` až bude stabilní.

---

## 11. Implementační kroky

| # | Krok | Složitost | Čas |
|---|------|-----------|-----|
| 1 | Upravit `src/lib/db.ts` — přidat embedded replica config | Nízká | 15 min |
| 2 | Lokální test (dev mode) | Nízká | 15 min |
| 3 | Vercel preview deployment + test | Nízká | 20 min |
| 4 | Production rollout + monitoring | Nízká | 10 min |

**Celkový effort:** ~1 hodina.
