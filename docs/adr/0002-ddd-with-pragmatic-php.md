# ADR-002: DDD with Pragmatic PHP Approach

**Status:** ✅ Accepted
**Date:** Early project phase
**Context:** Balance between pure DDD and PHP ecosystem pragmatism.
**Decision:** Use DDD layers but allow Doctrine ORM annotations on entities.
**Consequences:**
- ✅ Maintainability: Clear domain boundaries
- ✅ Framework leverage: Doctrine migrations, validation
- ⚠️ Deviation from pure DDD (domain layer has infrastructure concerns)
