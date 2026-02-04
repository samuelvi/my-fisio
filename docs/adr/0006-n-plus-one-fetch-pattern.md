# ADR-006: N+1 Fetch Pattern for Pagination

**Status:** ✅ Accepted
**Date:** Performance optimization
**Context:** `COUNT(*)` queries slow on large tables.
**Decision:** Fetch N+1 records; show "Next" button if N+1 exists.
**Consequences:**
- ✅ ~50% reduction in database load (one query vs two)
- ✅ Constant-time performance (no COUNT)
- ⚠️ No total page count display (acceptable trade-off)
