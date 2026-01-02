import { prisma } from './db';

interface AuditLogInput {
  tenantId: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  correlationId: string;
}

export const auditLogService = {
  async record(input: AuditLogInput) {
    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata,
        correlationId: input.correlationId,
      },
    });
  },
};
