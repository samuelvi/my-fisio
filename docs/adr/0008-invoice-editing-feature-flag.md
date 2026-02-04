# ADR-008: Invoice Editing via Feature Flag

**Status:** ⚠️ Under Review
**Date:** Invoice implementation
**Context:** Should invoices be editable post-creation? (audit trail implications)
**Decision:** Feature flag `VITE_INVOICE_EDIT_ENABLED` controls editability.
**Consequences:**
- ✅ Flexibility (enable in dev, disable in prod)
- ⚠️ **Pending**: Should invoice *numbers* be editable? (regulatory compliance risk)
