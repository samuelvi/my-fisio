# Draft System - Technical Documentation

## Architecture Overview

The Draft System follows **Domain-Driven Design (DDD)** principles with a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                     │
│  ┌─────────────────┐  ┌──────────────────────────────┐ │
│  │   useDraft      │  │   DraftAlert / DraftModal    │ │
│  │   (React Hook)  │  │   (UI Components)            │ │
│  └─────────────────┘  └──────────────────────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                  Application Layer                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │             DraftService                        │   │
│  │  • saveDraft()                                  │   │
│  │  • getDraft()                                   │   │
│  │  • restoreDraft()                               │   │
│  │  • discardDraft()                               │   │
│  │  • clearDraft()                                 │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                   Domain Layer                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │             Draft (Value Object)                │   │
│  │  • type: DraftType                              │   │
│  │  • data: T                                      │   │
│  │  • timestamp: number                            │   │
│  │  • formId: string                               │   │
│  │  • savedByError: boolean                        │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│              Infrastructure Layer                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │      LocalStorageDraftRepository                │   │
│  │  • save() → localStorage                        │   │
│  │  • get() → localStorage                         │   │
│  │  • remove() → localStorage                      │   │
│  │  • exists() → boolean                           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Domain Layer

### Draft Value Object

**File**: `assets/domain/Draft.ts`

**Responsibility**: Immutable representation of a draft with business logic

```typescript
export class Draft<T = unknown> {
  constructor(
    public readonly type: DraftType,
    public readonly data: T,
    public readonly timestamp: number,
    public readonly formId: string,
    public readonly savedByError: boolean = false
  ) {}

  static create<T>(type: DraftType, data: T, formId: string): Draft<T>
  static fromData<T>(data: DraftData<T>): Draft<T>
  toData(): DraftData<T>
  getAge(): string
  isForForm(formId: string): boolean
}
```

**Key Concepts**:
- **Value Object**: Immutable, compared by value not identity
- **Factory Methods**: `create()` for new drafts, `fromData()` for deserialization
- **Business Logic**: `getAge()` provides human-readable time (e.g., "hace 2 horas")

### Draft Types

```typescript
export type DraftType = 'invoice' | 'patient' | 'customer';

export interface DraftData<T = unknown> {
  type: DraftType;
  data: T;
  timestamp: number;
  formId: string;
  savedByError?: boolean;
}
```

**savedByError Flag**:
- `true` → Draft was saved due to network error (RED alert)
- `false`/`undefined` → Draft was saved manually (no alert)

## Infrastructure Layer

### LocalStorageDraftRepository

**File**: `assets/infrastructure/storage/LocalStorageDraftRepository.ts`

**Responsibility**: Persist drafts to browser localStorage

**Storage Keys**:
```typescript
const STORAGE_KEYS = {
  invoice: 'draft_invoice',
  patient: 'draft_patient',
  customer: 'draft_customer'
} as const;
```

**Methods**:
- `save<T>(type, data, formId, savedByError)` → Serializes and stores draft
- `get<T>(type)` → Deserializes and validates draft
- `remove(type)` → Deletes draft from storage
- `exists(type)` → Checks if draft exists
- `getTimestamp(type)` → Returns draft creation time

**Events Dispatched**:
- `draft:saved` → When draft is saved
- `draft:discarded` → When draft is discarded

**Error Handling**:
- Catches localStorage quota errors
- Validates draft structure on load
- Removes invalid drafts automatically
- Logs errors but doesn't throw (saving draft is not critical)

## Application Layer

### DraftService

**File**: `assets/application/draft/DraftService.ts`

**Responsibility**: Business logic for draft management

**Key Methods**:

#### saveDraft()
```typescript
saveDraft<T>(type: DraftType, data: T, formId: string, savedByError: boolean = false): void
```
Saves a draft immediately to storage. Used:
1. Before form submission (savedByError: false)
2. After network error (savedByError: true)

#### getDraft()
```typescript
getDraft<T>(type: DraftType): Draft<T> | null
```
Retrieves draft as a Domain object. Returns `null` if no draft exists.

#### restoreDraft()
```typescript
async restoreDraft<T>(type: DraftType): Promise<T | null>
```
Restores draft data and dispatches `DRAFT_RESTORED` event.

#### discardDraft()
```typescript
async discardDraft(type: DraftType): Promise<void>
```
Permanently removes draft and dispatches `DRAFT_DISCARDED` event.

#### clearDraft()
```typescript
clearDraft(type: DraftType): void
```
Clears draft after successful save and dispatches `SAVE_SUCCESS` event.

**Event System**:
```typescript
export const DRAFT_EVENTS = {
  NETWORK_ERROR: 'draft:network-error',
  DRAFT_RESTORED: 'draft:restored',
  DRAFT_DISCARDED: 'draft:discarded',
  SAVE_SUCCESS: 'draft:save-success'
} as const;
```

## Presentation Layer

### useDraft Hook

**File**: `assets/presentation/hooks/useDraft.ts`

**Responsibility**: React integration for draft management

**Interface**:
```typescript
interface UseDraftOptions {
  type: DraftType;
  formId: string;
  onRestore?: (data: any) => void;
  onDiscard?: () => void;
}

interface UseDraftReturn<T> {
  hasDraft: boolean;
  draftAge: string | null;
  draftSavedByError: boolean;
  saveDraft: (data: T, savedByError?: boolean) => void;
  restoreDraft: () => Promise<T | null>;
  discardDraft: () => Promise<void>;
  clearDraft: () => void;
  saveOnNetworkError: (error: any, data: T) => void;
}
```

**Key Features**:

1. **State Management**: Tracks draft existence and age
2. **Event Listeners**: Listens to draft events for updates
3. **Network Error Detection**:
   ```typescript
   const isNetworkError =
     !error.response ||
     error.code === 'ERR_NETWORK' ||
     error.code === 'ECONNABORTED' ||
     error.code === 'ETIMEDOUT';
   ```
4. **Auto-Refresh**: Updates draft age every 60 seconds
5. **Cleanup**: Properly removes event listeners on unmount

### DraftAlert Component

**File**: `assets/components/shared/DraftAlert.tsx`

**Responsibility**: Visual alert for network error drafts

**Props**:
```typescript
interface DraftAlertProps {
  hasDraft: boolean;
  draftAge: string | null;
  draftSavedByError: boolean;
  onRestore: () => void;
  onDiscard: () => void;
}
```

**Behavior**:
- Only visible when `draftSavedByError === true`
- Shows RED alert with error message
- Displays draft age (e.g., "hace 2 minutos")
- Provides "Recuperar borrador" and "Descartar borrador" buttons

### DraftModal Component

**File**: `assets/components/shared/DraftModal.tsx`

**Responsibility**: Confirmation dialogs for restore/discard

**Types**:
- `restore` → "¿Estás seguro de que deseas recuperar el borrador?"
- `discard` → "¿Estás seguro de que deseas descartar el borrador?"

**Features**:
- Uses HeadlessUI Dialog for accessibility
- ESC key support
- Backdrop click support
- Focus trap

## Data Flow

### Save Flow

```
┌─────────────┐
│ User clicks │
│    Save     │
└──────┬──────┘
       │
       v
┌─────────────────────────────────────┐
│ draft.saveDraft(formData)           │
│ (savedByError: false)               │
└──────┬──────────────────────────────┘
       │
       v
┌─────────────────────────────────────┐
│ DraftService.saveDraft()            │
└──────┬──────────────────────────────┘
       │
       v
┌─────────────────────────────────────┐
│ LocalStorageDraftRepository.save()  │
│ → localStorage.setItem()            │
└──────┬──────────────────────────────┘
       │
       v
┌─────────────────────────────────────┐
│ dispatch('draft:saved')             │
└─────────────────────────────────────┘
       │
       v
┌─────────────────────────────────────┐
│ API Call (axios.post/put)           │
└──────┬─────────────┬────────────────┘
       │             │
   Success       Network Error
       │             │
       v             v
┌─────────────┐ ┌───────────────────────────┐
│clearDraft() │ │saveOnNetworkError()       │
│             │ │(savedByError: true)       │
└──────┬──────┘ └───────┬───────────────────┘
       │                │
       v                v
┌─────────────┐ ┌───────────────────────────┐
│ Navigate    │ │ Show RED Alert            │
└─────────────┘ └───────────────────────────┘
```

### Restore Flow

```
┌─────────────┐
│ Page Load   │
└──────┬──────┘
       │
       v
┌─────────────────────────────────────┐
│ useDraft.checkDraft()               │
└──────┬──────────────────────────────┘
       │
       v
┌─────────────────────────────────────┐
│ getDraft()                          │
│ → savedByError === true?            │
└──────┬──────────────────────────────┘
       │
    YES│
       v
┌─────────────────────────────────────┐
│ Show RED Alert                      │
│ "Error de red detectado"            │
└──────┬──────────────────────────────┘
       │
       v (user clicks "Recuperar")
┌─────────────────────────────────────┐
│ Show Confirmation Modal             │
└──────┬──────────────────────────────┘
       │
       v (user confirms)
┌─────────────────────────────────────┐
│ restoreDraft()                      │
│ → onRestore(draftData)              │
└──────┬──────────────────────────────┘
       │
       v
┌─────────────────────────────────────┐
│ setFormData(draftData)              │
│ Form populated                      │
└──────┬──────────────────────────────┘
       │
       v
┌─────────────────────────────────────┐
│ Alert REMAINS visible               │
│ savedByError still true             │
└─────────────────────────────────────┘
```

## State Management

### LocalStorage State

Each draft is stored as a JSON object:

```json
{
  "type": "patient",
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "allergies": "None"
  },
  "timestamp": 1704543210000,
  "formId": "patient-new-123456",
  "savedByError": true
}
```

**Keys**:
- `draft_invoice`
- `draft_patient`
- `draft_customer`

### React State (useDraft)

```typescript
const [hasDraft, setHasDraft] = useState<boolean>(false);
const [draftAge, setDraftAge] = useState<string | null>(null);
const [draftSavedByError, setDraftSavedByError] = useState<boolean>(false);
```

**Update Triggers**:
1. Component mount
2. Draft saved event
3. Draft restored event
4. Draft discarded event
5. Every 60 seconds (age refresh)

## Important Design Decisions

### 1. No Auto-Save Every N Seconds

**Removed in**: commit `fa8198a`

**Rationale**:
- Reduces localStorage writes (performance)
- Clearer UX (only saves on error)
- Prevents stale draft confusion
- Simpler state management

**Before**:
```typescript
// Old code (removed)
useEffect(() => {
  const interval = setInterval(() => {
    saveDraft(formData, false);
  }, 5000);
  return () => clearInterval(interval);
}, [formData]);
```

**After**:
```typescript
// New code
const handleSubmit = async () => {
  draft.saveDraft(formData); // Only on submit
  // ...
};
```

### 2. savedByError Flag Persistence

**Decision**: After restoring a draft with `savedByError: true`, the flag **remains true** until:
1. Form is successfully saved, OR
2. Draft is discarded

**Rationale**:
- User visibility: Alert stays visible until issue resolved
- Prevents accidental data loss
- Clear indication that recovery is needed

### 3. Manual Save Before API Call

**Decision**: Always save draft before making API call

```typescript
draft.saveDraft(formData); // Save first
await axios.post(...); // Then call API
```

**Rationale**:
- Ensures data captured even if API call hangs
- Provides consistent baseline for error recovery
- Simplifies error handling logic

### 4. Network Error Detection

**Decision**: Only save with `savedByError: true` for actual network errors

```typescript
const isNetworkError =
  !error.response || // No response = network failed
  error.code === 'ERR_NETWORK' ||
  error.code === 'ECONNABORTED' ||
  error.code === 'ETIMEDOUT';
```

**Rationale**:
- Validation errors (422) should NOT show red alert
- Server errors (500) have response, not network errors
- Only true connectivity issues warrant draft recovery

## Testing Strategy

### Unit Tests

**Domain**:
- `Draft.test.ts` → Value object methods

**Infrastructure**:
- `LocalStorageDraftRepository.test.ts` → Storage operations

**Application**:
- `DraftService.test.ts` → Business logic

**Presentation**:
- `useDraft.test.tsx` → Hook behavior

### E2E Tests

**Location**: `tests/e2e/drafts/`

**Coverage**:
1. **draft.patient.spec.ts** (10 tests)
   - No auto-save verification
   - Network error save
   - Restore with savedByError persistence
   - Discard functionality
   - Successful save clears draft
   - Edit mode compatibility

2. **draft.invoice.spec.ts** (14 tests)
   - Same coverage as patient
   - Additional invoice-specific scenarios
   - Modal ESC key handling

**Key Test Pattern**:
```typescript
// Verify NO auto-save
await page.fill('input[name="firstName"]', 'Test');
await page.waitForTimeout(6000); // Wait past old auto-save interval
const draftData = await page.evaluate(() => {
  return localStorage.getItem('draft_patient');
});
expect(draftData).toBeNull(); // Should NOT exist
```

## Performance Considerations

### localStorage Limits

- **Quota**: ~5MB per domain (browser dependent)
- **Mitigation**: Only store one draft per type
- **Cleanup**: Drafts cleared on successful save

### Event Listener Optimization

- Debounced form change handlers
- Event listeners properly removed on unmount
- Single service instance (singleton pattern)

### React Re-renders

- `useCallback` for handler functions
- State updates only on actual draft changes
- Age refresh throttled to 60 seconds

## Security Considerations

### Data Exposure

- **Risk**: Sensitive data in localStorage
- **Mitigation**:
  - localStorage is origin-scoped
  - No sensitive data like passwords stored
  - Draft cleared on logout (handled by app)

### XSS Protection

- **Risk**: Malicious data in draft
- **Mitigation**:
  - All form data sanitized before display
  - React's built-in XSS protection
  - No `dangerouslySetInnerHTML` used

## Future Enhancements

### Potential Improvements

1. **IndexedDB Migration**
   - Larger storage capacity
   - Better performance for large drafts
   - Structured queries

2. **Draft Versioning**
   - Multiple draft versions
   - Rollback capability
   - Diff visualization

3. **Cloud Sync**
   - Sync drafts across devices
   - Server-side backup
   - Collaborative editing

4. **Conflict Resolution**
   - Detect simultaneous edits
   - Merge strategies
   - User-controlled resolution

## Troubleshooting Guide

### Common Issues

#### 1. Draft Not Showing After Network Error

**Symptoms**: Network error occurs but no red alert

**Diagnosis**:
```typescript
// Check browser console
console.log('Draft exists:', draft.hasDraft);
console.log('Saved by error:', draft.draftSavedByError);

// Check localStorage
console.log(localStorage.getItem('draft_patient'));
```

**Solutions**:
- Verify `saveOnNetworkError()` called in catch block
- Check error is truly a network error (no response)
- Ensure `<DraftAlert />` component rendered

#### 2. Draft Persists After Save

**Symptoms**: Draft remains in localStorage after successful save

**Diagnosis**:
```typescript
// Add logging
console.log('Clearing draft...');
draft.clearDraft();
console.log('Draft cleared:', !draft.hasDraft);
```

**Solutions**:
- Ensure `clearDraft()` called after success
- Check for errors in success handler
- Verify navigation doesn't interrupt cleanup

#### 3. Multiple Drafts for Same Form

**Symptoms**: Old drafts not being replaced

**Diagnosis**:
```typescript
// Check formId consistency
console.log('Form ID:', formId);
```

**Solutions**:
- Use consistent formId format
- Clear old drafts before creating new ones
- Add draft age validation

## References

- [DDD Patterns](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [React Hooks Best Practices](https://react.dev/reference/react/hooks)
- [Playwright Testing](https://playwright.dev/)

## Changelog

### 2026-01-06
- **REMOVED**: Auto-save every N seconds functionality
- **ADDED**: Explicit tests for NO auto-save behavior
- **FIXED**: savedByError flag persistence after restore

### 2026-01-03
- **ADDED**: Draft system implementation
- **ADDED**: DraftAlert and DraftModal components
- **ADDED**: E2E test coverage

## Contact

For questions or issues with the draft system:
- Review this documentation
- Check E2E tests for usage examples
- Consult codebase comments in implementation files
