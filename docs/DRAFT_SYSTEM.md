# Draft System

## Overview

The Draft System provides automatic data recovery for forms when network errors occur. It **does NOT automatically save form data every N seconds**. Instead, it **only saves when a network error prevents form submission**, ensuring users never lose their work due to connectivity issues.

## Key Features

- ✅ **Network Error Recovery**: Automatically saves form data when API calls fail due to network issues
- ✅ **Visual Alerts**: Red alert banner when draft is saved due to network error
- ✅ **Restore & Discard**: Users can restore or permanently discard saved drafts
- ✅ **Multi-Form Support**: Supports invoices, patients, and customers
- ✅ **Persistent Storage**: Uses localStorage to survive browser restarts
- ❌ **NO Auto-Save**: Does NOT save automatically every N seconds (removed feature)

## How It Works

### Normal Flow (No Errors)

```
1. User fills form
2. User clicks "Save"
3. Draft saved to localStorage (savedByError: false)
4. API call succeeds
5. Draft cleared from localStorage
6. Navigate to success page
```

### Network Error Flow

```
1. User fills form
2. User clicks "Save"
3. Draft saved to localStorage (savedByError: false)
4. API call fails (network error)
5. Draft updated with savedByError: true
6. RED alert banner appears
7. User can restore or discard draft
```

### Restore Flow

```
1. User reloads page
2. Draft with savedByError: true detected
3. RED alert banner shown
4. User clicks "Recuperar borrador"
5. Confirmation modal appears
6. Form populated with draft data
7. Alert remains visible (savedByError still true)
8. User can retry saving or make changes
```

## Usage

### 1. Import the Hook

```typescript
import { useDraft } from '../presentation/hooks/useDraft';
```

### 2. Initialize in Form Component

```typescript
const draft = useDraft<YourFormData>({
  type: 'patient', // or 'invoice', 'customer'
  formId: isEditing ? `patient-edit-${id}` : 'patient-new',
  onRestore: (data) => {
    setFormData(data);
  },
  onDiscard: () => {
    // Optional: reset form
  }
});
```

### 3. Handle Form Submission

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  // Save draft before submitting (not an error, just pre-save)
  draft.saveDraft(formData);

  try {
    // Make API call
    await axios.post('/api/patients', formData);

    // SUCCESS: Clear draft and navigate
    draft.clearDraft();
    navigate('/patients');
  } catch (err: any) {
    // Network error: save draft with error flag
    draft.saveOnNetworkError(err, formData);

    // Handle other types of errors
    if (err.response?.status === 422) {
      setErrors(err.response.data.violations);
    }
  }
};
```

### 4. Add UI Components

```tsx
import DraftAlert from './shared/DraftAlert';
import DraftModal from './shared/DraftModal';

// In your component JSX:
<form onSubmit={handleSubmit}>
  {/* Draft alert (only visible when savedByError: true) */}
  <DraftAlert
    hasDraft={draft.hasDraft}
    draftAge={draft.draftAge}
    draftSavedByError={draft.draftSavedByError}
    onRestore={() => setShowRestoreModal(true)}
    onDiscard={() => setShowDiscardModal(true)}
  />

  {/* Your form fields */}

  {/* Restore confirmation modal */}
  <DraftModal
    isOpen={showRestoreModal}
    onClose={() => setShowRestoreModal(false)}
    onConfirm={handleRestoreDraft}
    title="Recover Draft"
    type="restore"
  />

  {/* Discard confirmation modal */}
  <DraftModal
    isOpen={showDiscardModal}
    onClose={() => setShowDiscardModal(false)}
    onConfirm={handleDiscardDraft}
    title="Discard Draft"
    type="discard"
  />
</form>
```

## Important Notes

### ⚠️ No Auto-Save

The system **does NOT automatically save** form data every N seconds. This feature was **removed** in commit `fa8198a`.

**Why?**
- Reduces unnecessary localStorage writes
- Prevents confusion about which data is the "draft"
- Only saves when truly needed (network errors)

### Behavior After Restore

After restoring a draft that was saved due to a network error:

1. ✅ Form is populated with draft data
2. ✅ Red alert remains visible
3. ✅ `savedByError` flag remains `true`
4. ❌ Modifying fields does NOT update the draft
5. ✅ User must explicitly save again to clear the draft

### Draft Persistence

- **savedByError: true** → Red alert shown, user must take action
- **savedByError: false** → No alert shown (used internally during save)

## Testing

### E2E Tests

The draft system has comprehensive E2E tests covering:

1. ✅ No auto-save verification
2. ✅ Network error draft save
3. ✅ Draft restore functionality
4. ✅ Draft discard functionality
5. ✅ No auto-save after modifications
6. ✅ Successful save clears draft
7. ✅ Edit mode compatibility

Location: `tests/e2e/drafts/`

### Running Tests

```bash
# Run all draft tests
npx playwright test tests/e2e/drafts/

# Run in CI mode (strict)
CI=true npx playwright test tests/e2e/drafts/
```

## Troubleshooting

### Draft Not Saving

**Problem**: Draft not being saved on network error

**Solution**:
1. Check that `draft.saveOnNetworkError(err, formData)` is called in catch block
2. Verify error is actually a network error (no `err.response`)
3. Check browser console for draft service logs

### Alert Not Showing

**Problem**: Red alert not appearing after network error

**Solution**:
1. Verify `<DraftAlert />` component is rendered
2. Check that `draft.draftSavedByError` is true
3. Ensure draft exists in localStorage (dev tools → Application → Local Storage)

### Draft Not Clearing

**Problem**: Draft persists after successful save

**Solution**:
1. Ensure `draft.clearDraft()` is called after successful API call
2. Check that navigation happens AFTER clearing draft
3. Verify no errors in console

## See Also

- [Technical Documentation](../private/docs/DRAFT_TECHNICAL.md) - Detailed architecture and implementation
- [Audit System](AUDIT_SYSTEM.md) - Related system for tracking changes
- [Database Schema](DATABASE_SCHEMA.md) - Database structure
