import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

export type TransactionClient = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const remoteUrl = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  const useEmbeddedReplica = process.env.TURSO_EMBEDDED_REPLICA?.trim() === "true" && remoteUrl;

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
    console.warn("[db] Embedded replica failed, falling back to remote");
  }

  const adapter = new PrismaLibSql({
    url: remoteUrl ?? process.env.DATABASE_URL ?? "file:./dev.db",
    authToken,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
