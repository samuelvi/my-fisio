# ADR-004: No UnitOfWork Cache (Fresh Data Strategy)

**Status:** ✅ Accepted
**Date:** Mid-project (performance optimization)
**Context:** Stale data issues with Doctrine Identity Map.
**Decision:** Use `getArrayResult()` + manual mapping to bypass UnitOfWork.
**Consequences:**
- ✅ Guaranteed fresh data on every query
- ✅ Predictable behavior
- ⚠️ More verbose repository code (manual array → entity mapping)
- ⚠️ Loses automatic relationship loading (must be explicit)
