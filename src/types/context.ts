import { Membership, MembershipRole, Tenant, User } from '@prisma/client';

export type RequestUserContext = {
  user: User;
  memberships: Membership[];
};

export type TenantScopedRequest = {
  tenant: Tenant;
  userContext: RequestUserContext;
  correlationId: string;
};

export const isRole = (memberships: Membership[], role: MembershipRole, locationId?: string) => {
  return memberships.some((m) => {
    if (m.role !== role) return false;
    if (locationId && m.locationId && m.locationId !== locationId) return false;
    return true;
  });
};
