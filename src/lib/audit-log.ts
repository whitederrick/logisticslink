import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditLogInput = {
  action: string;
  actorId?: number | null;
  after?: unknown;
  before?: unknown;
  entityId?: number | null;
  entityType: string;
};

function toAuditJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return undefined;

  return JSON.parse(
    JSON.stringify(value, (_key, item) => {
      if (typeof item === "bigint") return item.toString();
      if (item instanceof Date) return item.toISOString();
      return item;
    })
  ) as Prisma.InputJsonValue;
}

export async function recordAuditLog(input: AuditLogInput) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      actorId: input.actorId ?? null,
      afterJson: toAuditJson(input.after),
      beforeJson: toAuditJson(input.before),
      entityId: input.entityId ?? null,
      entityType: input.entityType
    }
  });
}
