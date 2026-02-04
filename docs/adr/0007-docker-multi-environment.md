# ADR-007: Docker Multi-Environment (dev/test/prod)

**Status:** ✅ Accepted
**Date:** Infrastructure setup
**Context:** Avoid polluting dev database with test data.
**Decision:** Separate Docker Compose files for dev, test, prod.
**Consequences:**
- ✅ Environment isolation
- ✅ CI/CD uses dedicated test environment
- ⚠️ Increased configuration maintenance
