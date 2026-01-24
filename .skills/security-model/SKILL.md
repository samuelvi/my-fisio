---
name: security-model
description: Security model and architecture decisions for this single-tenant physiotherapy application.
---

# Security Model

## Application Type

**Single-tenant application** for a single physiotherapy clinic.

## Authorization Model

### Access Control

| Role | Access Level |
|------|--------------|
| Authenticated user | Full access to all resources |
| Unauthenticated | No access (except public endpoints) |

### Design Decisions

1. **No per-user data isolation**: All authenticated users can access all patients, invoices, records, and appointments. This is intentional - the clinic staff shares access to all patient data.

2. **Appointment.userId**: This field tracks **who created** the appointment (audit/accountability), NOT ownership for access control.

3. **No RBAC needed**: Currently all users have the same permissions. Role-based access control is not implemented because all clinic staff need full access.

## What This Means for Security

### NOT vulnerabilities (by design):

| Behavior | Reason |
|----------|--------|
| User A can see User B's patients | Single-tenant: all patients belong to the clinic |
| User A can edit invoices created by User B | Single-tenant: shared clinic data |
| Any authenticated user can access any record | Intentional: clinic-wide access |

### ARE vulnerabilities (must protect):

| Risk | Required Protection |
|------|---------------------|
| Unauthenticated access | All API endpoints must require authentication |
| Token theft | Reasonable JWT TTL, secure token handling |
| Credential exposure | Secrets in .env.local, not committed |

## Protected Resources

All `/api/*` endpoints MUST require authentication EXCEPT:
- `/api/login` - Authentication endpoint
- `/api/health` - Health check (should not expose sensitive info)

## Future Considerations

If the application evolves to **multi-tenant** (multiple clinics):
- Add `clinicId` or `tenantId` to entities
- Implement Doctrine Extension to filter by tenant
- Add tenant verification in all Providers/Processors

## Checklist for New Endpoints

- [ ] Endpoint requires `#[IsGranted('IS_AUTHENTICATED_FULLY')]` or equivalent
- [ ] No sensitive data exposed to unauthenticated users
- [ ] Error messages don't leak internal details in production
