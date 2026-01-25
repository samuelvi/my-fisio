# Security Audit Status

**Last Updated**: 2026-01-25
**Status**: Complete

## Completed

### Critical Severity
| # | Vulnerability | Status | Commit |
|---|---------------|--------|--------|
| 1 | Credentials in .env.prod | ✅ Already in .gitignore | - |
| 2 | JWT_PASSPHRASE exposed | ✅ Placeholder + instructions | c330ca5 |

### High Severity
| # | Vulnerability | Status | Commit |
|---|---------------|--------|--------|
| 3 | IDOR generalized | ✅ N/A (single-tenant by design) | 8ac5286 |
| 4 | Endpoints without auth | ✅ Protected with IsGranted | 5173472 |
| 5 | Infrastructure exposure | ✅ Token required for details | 6a30cbd |
| 6 | AuditTrail public | ✅ N/A (single-tenant by design) | 8ac5286 |
| 7 | JWT TTL 15 days | ✅ Reduced to 2 hours | f849c1e |
| 8 | VITE_AUTH_* exposed | ✅ Documented as dev convenience | d3718ce |

### Medium Severity
| # | Vulnerability | Status | Commit |
|---|---------------|--------|--------|
| 9 | Filter validation | ✅ Whitelist already implemented | - |
| 10 | Twig get_env() unrestricted | ⚠️ Low risk - authorized users only | - |
| 11 | InvoiceExport no ownership | ✅ N/A (single-tenant by design) | - |
| 12 | InvoicePrefill no ownership | ✅ N/A (single-tenant by design) | - |
| 13 | Appointments userId writable | ✅ Server assigns from auth user | 8050feb |
| 14 | DateTime without validation | ✅ Range validation added | pending |
| 15 | LIKE without wildcard escape | ✅ escapeLikeWildcards() added | pending |
| 16 | No rate limiting | ✅ Symfony RateLimiter configured | pending |
| 17 | CORS misconfigured | ✅ Fixed regex pattern | pending |
| 18 | Logo path traversal | ✅ Path validation added | pending |
| 19 | DomPDF remote enabled | ✅ Disabled isRemoteEnabled | pending |
| 20 | Content-Disposition injection | ✅ Filename sanitized | pending |

### Low Severity
| # | Vulnerability | Status | Notes |
|---|---------------|--------|-------|
| 21 | Debug mode in dev | ✅ Expected | APP_DEBUG=0 in prod |
| 22 | Exception messages | ✅ Handled | Symfony prod mode hides details |
| 23 | Invoice enumeration | ⚠️ Accepted | Low risk - single-tenant |
| 24 | AuditTrail no RBAC | ✅ N/A | Single-tenant by design |
| 25 | HTTPS/HSTS | ⚠️ Infra | Configure in reverse proxy |
| 26 | Security headers | ⚠️ Infra | Configure in reverse proxy/nginx |
| 27 | InvoiceLineInput limits | ✅ Fixed | Added Range constraints |
| 28 | No CSRF | ✅ N/A | JWT stateless API |

## Skills Created

- `.skills/secrets-management/SKILL.md` - Credential handling
- `.skills/security-model/SKILL.md` - Single-tenant security model
- `.skills/dangerous-defaults/SKILL.md` - Parameter safety

## Notes

- Application is **single-tenant** (one clinic, shared data)
- IDOR vulnerabilities do not apply (by design)
- Ownership checks not needed (all authenticated users share access)
