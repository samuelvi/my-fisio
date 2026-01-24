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

## Development Conveniences

### Auto-fill Login (VITE_AUTH_EMAIL / VITE_AUTH_PASSWORD)

For dev/test environments, the login form can be auto-filled:

```bash
# .env.local (dev only)
AUTH_EMAIL=dev@example.com
AUTH_PASSWORD=devpassword
```

**Security controls:**
- `.env` has empty values by default
- `.env.prod` must NOT define these variables
- Values are only used if non-empty
- Documented with warning comments in .env files

**This is NOT a vulnerability because:**
- Production builds have empty values (no credentials exposed)
- It's a documented development convenience
- The pattern is opt-in (requires explicit configuration)

## Checklist for New Endpoints

- [ ] Endpoint requires `#[IsGranted('IS_AUTHENTICATED_FULLY')]` or equivalent
- [ ] No sensitive data exposed to unauthenticated users
- [ ] Error messages don't leak internal details in production

## Checklist for Production Deployment

- [ ] `AUTH_EMAIL` and `AUTH_PASSWORD` are empty or not defined
- [ ] `JWT_PASSPHRASE` is set in `.env.local` (not committed)
- [ ] `HEALTH_CHECK_TOKEN` is set to a secure value
- [ ] `APP_DEBUG=0` in production
