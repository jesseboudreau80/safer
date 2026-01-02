import { PrismaClient, MembershipRole, PlatformRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.tenant.findFirst({ where: { slug: 'acme-industries' } });
  if (existing) {
    console.log('Seed data already present.');
    return;
  }

  const tenant = await prisma.tenant.create({
    data: {
      id: 'tenant_acme',
      name: 'Acme Industries',
      slug: 'acme-industries',
    },
  });

  const [hq, warehouse] = await prisma.$transaction([
    prisma.location.create({
      data: { id: 'loc_hq', name: 'Acme HQ', address: '123 Main St, Springfield', tenantId: tenant.id },
    }),
    prisma.location.create({
      data: {
        id: 'loc_warehouse',
        name: 'West Warehouse',
        address: '456 Distribution Ave, Springfield',
        tenantId: tenant.id,
      },
    }),
  ]);

  const [tenantAdmin, reviewer, locationAdmin] = await prisma.$transaction([
    prisma.user.create({
      data: { id: 'user_tenant_admin', name: 'Terry Tenant', email: 'terry@acme.test', platformRole: PlatformRole.NONE },
    }),
    prisma.user.create({
      data: { id: 'user_reviewer', name: 'Riley Reviewer', email: 'riley@acme.test', platformRole: PlatformRole.NONE },
    }),
    prisma.user.create({
      data: { id: 'user_location_admin', name: 'Lena Location', email: 'lena@acme.test', platformRole: PlatformRole.NONE },
    }),
  ]);

  await prisma.$transaction([
    prisma.membership.create({
      data: { id: 'mship_tenant_admin', tenantId: tenant.id, userId: tenantAdmin.id, role: MembershipRole.TENANT_ADMIN },
    }),
    prisma.membership.create({
      data: { id: 'mship_reviewer', tenantId: tenant.id, userId: reviewer.id, role: MembershipRole.REVIEWER },
    }),
    prisma.membership.create({
      data: {
        id: 'mship_location_admin',
        tenantId: tenant.id,
        userId: locationAdmin.id,
        role: MembershipRole.LOCATION_ADMIN,
        locationId: warehouse.id,
      },
    }),
  ]);

  const correlationId = uuidv4();
  const incident = await prisma.incident.create({
    data: {
      tenantId: tenant.id,
      locationId: hq.id,
      title: 'Forklift backed into shelving',
      description: 'Minor property damage, no injuries. Initial intake for governance checks.',
      status: 'SUBMITTED',
      correlationId,
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      actorUserId: tenantAdmin.id,
      action: 'INCIDENT_SUBMITTED',
      entityType: 'Incident',
      entityId: incident.id,
      correlationId,
      metadata: {
        note: 'Seed submission for validation flows.',
      },
    },
  });

  console.log('Seed completed. Tenant:', tenant.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
