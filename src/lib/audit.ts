import { prisma } from "./db";
import type { Prisma } from "@prisma/client";

interface AuditInput {
  userId?: string;
  userEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  detail?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        userEmail: input.userEmail,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        detail: (input.detail ?? {}) as Prisma.InputJsonValue,
        ipAddress: input.ipAddress,
      },
    });
  } catch {
    // Audit logging must never break the main flow
  }
}

export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return undefined;
}
