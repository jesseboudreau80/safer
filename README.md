# Safer Core Scaffold

AI-assisted. Human-approved. Fully auditable.

This repository contains the initial Safer core scaffold focused on multi-tenant foundations, strict tenant isolation, RBAC enforcement, and auditability. OSHA forms and AI logic are intentionally omitted in this iteration.

## What is included
- Express-based backend service skeleton with TypeScript
- Prisma data model and SQLite migrations for tenants, locations, users, memberships, incidents, and audit logs
- RBAC middleware and deny-by-default tenant scoping helpers
- Correlation ID propagation for every request and log entry
- Minimal incident intake API and static UI to exercise authorization flows
- Seed data for one tenant and two locations to validate governance paths

## Data model overview
- **Tenant**: Owns locations, memberships, incidents, audit logs.
- **Location**: Scoped to a tenant; used for incident routing.
- **User**: Platform identity with optional `SUPER_ADMIN` break-glass access.
- **Membership**: Assigns user roles per tenant (and optionally per location) using `TENANT_ADMIN`, `LOCATION_ADMIN`, `REVIEWER`, or `READ_ONLY`.
- **Incident**: Intake entity (no OSHA logic yet) with status and required `correlationId`.
- **AuditLog**: Immutable records of security-sensitive actions with tenant + correlation context.

## Governance & safety guarantees (scaffold)
- Tenant context and user identity are required via `x-tenant-id` and `x-user-id` headers.
- RBAC middleware enforces role checks; platform super admins are permitted only when allowed by middleware.
- Tenant scoping helpers apply `tenantId` filters to all incident reads.
- Correlation IDs are generated or propagated via `x-correlation-id` and echoed back in responses.
- Every incident submission records an audit log entry linked to the tenant and correlation ID.

## Running locally
1. Install dependencies and generate the Prisma client:
   ```bash
   npm install
   npx prisma generate
   ```

2. Apply migrations and seed the database (SQLite at `prisma/dev.db`):
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

3. Start the API + static UI:
   ```bash
   npm run dev
   ```

4. Open http://localhost:4000 to use the static intake UI. Requests require tenant/user headers and correlation IDs (auto-generated if omitted).

## Seeded principals
These stable IDs make it easy to test tenant isolation and role enforcement:
- Tenant: `tenant_acme`
- Locations: `loc_hq`, `loc_warehouse`
- Tenant Admin (full tenant access): `user_tenant_admin`
- Location Admin (warehouse-only): `user_location_admin`
- Reviewer (read/list only in this scaffold): `user_reviewer`

## API quickstart
- **List incidents (tenant scoped)**: `GET /api/incidents`
  - Headers: `x-tenant-id`, `x-user-id`, `x-correlation-id`
- **Submit incident**: `POST /api/incidents`
  - Headers: same as above
  - Body: `{ "locationId": "loc_hq", "title": "...", "description": "..." }`

Authorization responses will return 401/403 if headers are missing, tenant scope is violated, or the user lacks the required role.

## Folder structure
```
src/
  app.ts            Express app wiring (security middleware + routing)
  server.ts         Entrypoint
  middleware/       Correlation ID + auth/RBAC enforcement
  routes/           Incident intake and listing
  services/         Prisma client + audit logging
  utils/            Tenant scoping helpers
web/                Static UI for intake/listing
prisma/             Schema, migrations, seed data
```

## Next steps (not yet implemented)
- OSHA-specific forms (301/300/300A) and exports
- Dual-model AI advisory flows with discrepancy handling
- Reviewer approval queue and feedback capture
- External sinks (Google Sheets, Langfuse tracing) and n8n/MCP hooks
