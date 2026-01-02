import { Prisma } from '@prisma/client';

export const enforceTenant = <T extends Prisma.IncidentWhereInput | Prisma.AuditLogWhereInput | Prisma.LocationWhereInput | Prisma.MembershipWhereInput>(
  tenantId: string,
  where: T = {} as T,
): T => {
  return { ...where, tenantId } as T;
};
