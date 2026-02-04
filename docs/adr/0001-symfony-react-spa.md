# ADR-001: Symfony + React (Decoupled SPA)

**Status:** ✅ Accepted
**Date:** Early project phase
**Context:** Need for modern UX with robust backend.
**Decision:** Symfony 7.4 (backend API) + React 18 (frontend SPA) with Vite bundling.
**Consequences:**
- ✅ Clear separation of concerns
- ✅ Independent technology upgrades
- ⚠️ Complexity: Two build pipelines (Composer + npm)
- ⚠️ Deployment: Requires Vite build step before production
