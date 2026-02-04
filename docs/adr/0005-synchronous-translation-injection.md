# ADR-005: Synchronous Translation Injection

**Status:** ✅ Accepted
**Date:** Multi-language implementation
**Context:** Avoid 401 errors when fetching translations before login.
**Decision:** Inject translations via Twig (server-side) into `window.APP_TRANSLATIONS`.
**Consequences:**
- ✅ No API calls for translations
- ✅ Available before authentication
- ✅ No "flash of untranslated content"
- ⚠️ Slightly larger HTML payload (~10-20KB)
