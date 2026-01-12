---
name: draft-recovery-pattern
description: Network error resilience pattern for forms using localStorage draft recovery.
---

# Draft Recovery Pattern

## Problem Statement
Network errors during form submission cause data loss, frustrating users who must re-enter data.

## Solution
Save form data to localStorage only when network errors occur, allowing recovery after page reload.

## Implementation

### React Hook
```typescript
interface Draft {
    data: any;
    savedByError: boolean;
    timestamp: number;
}

function useDraftRecovery(formKey: string) {
    const saveDraft = (data: any, isError: boolean = false) => {
        const draft: Draft = {
            data,
            savedByError: isError,
            timestamp: Date.now()
        };
        localStorage.setItem(`draft_${formKey}`, JSON.stringify(draft));
    };

    const loadDraft = (): Draft | null => {
        const stored = localStorage.getItem(`draft_${formKey}`);
        return stored ? JSON.parse(stored) : null;
    };

    const clearDraft = () => {
        localStorage.removeItem(`draft_${formKey}`);
    };

    return { saveDraft, loadDraft, clearDraft };
}
```

### Form Component
```tsx
function InvoiceForm() {
    const { saveDraft, loadDraft, clearDraft } = useDraftRecovery('invoice');
    const [showDraftAlert, setShowDraftAlert] = useState(false);

    useEffect(() => {
        const draft = loadDraft();
        if (draft?.savedByError) {
            setShowDraftAlert(true);
        }
    }, []);

    const handleSubmit = async (data) => {
        saveDraft(data, false); // Save before submit
        
        try {
            await api.post('/api/invoices', data);
            clearDraft(); // Success: clear draft
            navigate('/invoices');
        } catch (error) {
            if (error.isNetworkError) {
                saveDraft(data, true); // Mark as error draft
                setShowDraftAlert(true);
            }
        }
    };

    const recoverDraft = () => {
        const draft = loadDraft();
        if (draft) {
            setFormData(draft.data);
            setShowDraftAlert(false);
        }
    };

    return (
        <>
            {showDraftAlert && (
                <Alert variant="error">
                    Network error. Draft saved.
                    <button onClick={recoverDraft}>Recover</button>
                    <button onClick={clearDraft}>Discard</button>
                </Alert>
            )}
            <form onSubmit={handleSubmit}>...</form>
        </>
    );
}
```

## Key Features
- ❌ NO auto-save every N seconds
- ✅ Save only on network errors
- ✅ Persist across browser restarts
- ✅ Visual alert when draft available
- ✅ User control (recover or discard)

## Flow Diagram
```
Normal: Fill → Save → API Success → Clear Draft → Navigate
Error:  Fill → Save → API Fail → Mark Error Draft → Show Alert → User Recovers
```

## Best Practices
- Only save on network errors (not validation errors)
- Show prominent alert on page load
- Require user confirmation before restoring
- Clear draft after successful submission
- Set expiry time (e.g., 24 hours)

## References
- See: docs/features/draft-system.md
