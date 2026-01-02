import { Router, Request, Response } from 'express';
import { MembershipRole } from '@prisma/client';
import { prisma } from '../services/db';
import { auditLogService } from '../services/auditLogService';
import { enforceTenant } from '../utils/tenantScope';
import { requireRole } from '../middleware/auth';
import { isRole } from '../types/context';

const router = Router();

router.get('/', requireRole([MembershipRole.TENANT_ADMIN, MembershipRole.REVIEWER, MembershipRole.LOCATION_ADMIN, MembershipRole.READ_ONLY]), async (req: Request, res: Response) => {
  const tenant = (req as any).tenant as { id: string };
  const incidents = await prisma.incident.findMany({
    where: enforceTenant(tenant.id),
    include: { location: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ incidents });
});

router.post('/', requireRole([MembershipRole.TENANT_ADMIN, MembershipRole.LOCATION_ADMIN]), async (req: Request, res: Response) => {
  const tenant = (req as any).tenant as { id: string };
  const { user, memberships } = (req as any).userContext;
  const correlationId = (req as any).correlationId as string;

  const { locationId, title, description } = req.body || {};
  if (!locationId || !title || !description) {
    return res.status(400).json({ error: 'locationId, title, and description are required' });
  }

  const location = await prisma.location.findFirst({ where: { id: locationId, tenantId: tenant.id } });
  if (!location) {
    return res.status(404).json({ error: 'Location not found for tenant' });
  }

  const hasTenantAdmin = isRole(memberships, MembershipRole.TENANT_ADMIN);
  const hasLocationAdmin = isRole(memberships, MembershipRole.LOCATION_ADMIN, locationId);
  if (!(hasTenantAdmin || hasLocationAdmin || user.platformRole === 'SUPER_ADMIN')) {
    return res.status(403).json({ error: 'Not authorized for this location' });
  }

  const incident = await prisma.incident.create({
    data: {
      tenantId: tenant.id,
      locationId,
      title,
      description,
      correlationId,
      status: 'SUBMITTED',
    },
  });

  await auditLogService.record({
    tenantId: tenant.id,
    actorUserId: user.id,
    action: 'INCIDENT_SUBMITTED',
    entityType: 'Incident',
    entityId: incident.id,
    correlationId,
    metadata: {
      title,
      locationId,
    },
  });

  res.status(201).json({ incident });
});

export default router;
