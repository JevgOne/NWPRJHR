import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

export type TransactionClient = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const remoteUrl = process.env.TURSO_DATABASE_URL?.replace(/\s+/g, "");
  const authToken = process.env.TURSO_AUTH_TOKEN?.replace(/\s+/g, "");

  const adapter = new PrismaLibSql({
    url: remoteUrl ?? process.env.DATABASE_URL ?? "file:./dev.db",
    authToken,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
