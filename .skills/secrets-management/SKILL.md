---
name: secrets-management
description: Secure handling of credentials and secrets in Symfony projects. Never commit real credentials to version control.
---

# Secrets Management

## Golden Rule

**NEVER commit real credentials to version control.**

## Symfony .env File Hierarchy

```
.env                 # Committed: default/placeholder values only
.env.local           # NOT committed: local overrides with real values
.env.prod            # Committed: production placeholders
.env.prod.local      # NOT committed: real production secrets
```

## Placeholder Pattern

Use obvious placeholders that will fail if not overridden:

```bash
# ✅ GOOD - Clear placeholders that force configuration
DB_PASSWORD=CHANGE_ME_IN_ENV_LOCAL
JWT_PASSPHRASE=CHANGE_ME_generate_with_openssl_rand_hex_32
API_KEY=REPLACE_WITH_REAL_KEY

# ❌ BAD - Real credentials in committed files
DB_PASSWORD=Tt26FF12io
JWT_PASSPHRASE=1c12fe55e3a5b6964193641dfd0c445b636d7fe08cab7ba48063889b06c673b2
```

## Database Credentials

```bash
# .env.prod (committed - placeholders only)
DB_HOST=your-production-db-host.example.com
DB_NAME=your_production_db
DB_USER=your_db_user
DB_PASSWORD=CHANGE_ME_IN_ENV_LOCAL
DATABASE_URL=mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:3306/${DB_NAME}

# .env.prod.local (NOT committed - real values)
DB_HOST=real-db-host.hosting.com
DB_NAME=real_db_name
DB_USER=real_user
DB_PASSWORD=RealSecurePassword123!
```

## JWT Configuration

```bash
# .env (committed)
# IMPORTANT: Override in .env.local with a secure passphrase
JWT_PASSPHRASE=CHANGE_ME_generate_with_openssl_rand_hex_32

# .env.local (NOT committed)
JWT_PASSPHRASE=a1b2c3d4e5f6...  # Generated with: openssl rand -hex 32
```

Generate secure passphrase:
```bash
openssl rand -hex 32
```

## Company/Business Data

For demo projects, use generic placeholders:

```bash
# .env.prod (committed)
COMPANY_NAME="Your Company Name"
COMPANY_TAX_ID="00000000X"
COMPANY_EMAIL="info@example.com"
```

## .gitignore Configuration

Ensure local files are never committed:

```gitignore
# .gitignore
.env.local
.env.*.local
```

## Verification Checklist

- [ ] No real passwords in `.env` or `.env.prod`
- [ ] No real API keys in committed files
- [ ] No real JWT passphrases in committed files
- [ ] No real company PII (tax IDs, addresses, phones)
- [ ] `.env.local` and `.env.*.local` in `.gitignore`
- [ ] Placeholders are obvious (CHANGE_ME, REPLACE_WITH, etc.)

## If Credentials Were Exposed

1. **Immediately rotate** all exposed credentials
2. Check git history - credentials may still be in old commits
3. Consider using `git filter-branch` or BFG Repo-Cleaner to remove from history
4. Notify affected parties if production data was exposed
