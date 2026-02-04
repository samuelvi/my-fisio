# ADR-009: Pragmatic Event Sourcing

**Status:** ✅ Accepted
**Date:** 2026-02-04
**Context:** Need for comprehensive audit trails and side-effect management without the complexity of full Event Sourcing (ES).
**Decision:** Adopt "State-Stored with Domain Events" (Pragmatic ES). 
- Source of Truth = SQL Tables (State).
- Events = Dispatched synchronously for Audit/Side-effects.
- Audit = Granularly configured per entity via ENV variables.
**Consequences:**
- ✅ Immediate Consistency (State is always up to date).
- ✅ Full Audit Trail (`audit_trail` + `event_store`).
- ✅ Lower Complexity than Pure ES (No rehydration, no eventual consistency).
- ⚠️ "Write" side is coupled to SQL Schema (unlike Pure ES where Write side is schema-less events).
