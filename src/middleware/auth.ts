import { NextFunction, Request, Response } from 'express';
import { prisma } from '../services/db';
import { MembershipRole } from '@prisma/client';
import { isRole, RequestUserContext } from '../types/context';

const unauthorized = (res: Response, message: string) => res.status(401).json({ error: message });

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.header('x-tenant-id');
  const userId = req.header('x-user-id');

  if (!tenantId || !userId) {
    return unauthorized(res, 'Missing tenant or user context');
  }

  const [tenant, user, memberships] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.membership.findMany({ where: { tenantId, userId } }),
  ]);

  if (!tenant || !user) {
    return unauthorized(res, 'Invalid tenant or user');
  }

  if (user.platformRole !== 'SUPER_ADMIN' && memberships.length === 0) {
    return unauthorized(res, 'User lacks tenant access');
  }

  (req as any).tenant = tenant;
  (req as any).userContext = { user, memberships } as RequestUserContext;
  next();
};

export const requireRole = (roles: MembershipRole[], allowPlatformAdmin = true) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userContext = (req as any).userContext as RequestUserContext | undefined;
    const tenant = (req as any).tenant;
    if (!userContext || !tenant) {
      return unauthorized(res, 'Authentication required');
    }

    const { user, memberships } = userContext;
    if (allowPlatformAdmin && user.platformRole === 'SUPER_ADMIN') {
      return next();
    }

    const hasRole = roles.some((role) => isRole(memberships, role));
    if (!hasRole) {
      return unauthorized(res, 'Insufficient role');
    }
    next();
  };
};
