# AI Agent Instructions

This document contains important guidelines and best practices for AI agents working on this codebase.

## Environment Variables Documentation

**CRITICAL**: Whenever you add, modify, or remove a variable in `.env`, you **MUST** update the documentation in `README.md`.

### Process:

1. **Adding a new variable**:
   - Add the variable to `.env` with a descriptive comment
   - Document it in the appropriate section of `README.md` under "Environment Configuration"
   - Include the variable name, description, possible values, and examples
   - Explain its purpose and impact on the application

2. **Modifying an existing variable**:
   - Update the variable value in `.env`
   - Update the corresponding documentation in `README.md`
   - Ensure examples reflect the new values or behavior

3. **Removing a variable**:
   - Remove the variable from `.env`
   - Remove or update the corresponding documentation in `README.md`
   - Check if any code references need to be removed or updated

### Documentation Sections in README.md:

Variables should be documented in the following sections:
- **Environment Configuration** → General environment variables
- **Calendar Configuration** → Calendar-related variables (`CALENDAR_*`, `VITE_CALENDAR_*`)
- **Invoice Configuration** → Invoice and company-related variables (`COMPANY_*`)
- **Database Configuration** → Database-related variables (`DATABASE_*`)
- Custom sections as needed for specific features

### Example:

```dotenv
# .env
NEW_FEATURE_ENABLED=true
```

```markdown
# README.md - Environment Configuration section

- **`NEW_FEATURE_ENABLED`**: Enable or disable the new feature (`true`/`false`)

When enabled, users will have access to the new feature in the dashboard. Default: `true`
```

## Entity & Database Management

- **Named Constructors**: Whenever you add, modify, or remove a field in a table/entity, you **MUST** review and update:
    1.  The named constructors (e.g., `create()`) in the Entity class.
    2.  The `__construct()` method of the Entity.
    3.  Ensure they accept **all necessary fields** (typically `NOT NULL` fields without default values) to create a valid entity state.
- **Named Arguments**: Use **PHP 8+ named arguments** when calling constructors or static factory methods (e.g., `create()`). This improves readability, reduces errors with optional parameters, and makes the code self-documenting.
    - *Example*: `Customer::create(firstName: $firstName, lastName: $lastName)` instead of `Customer::create($firstName, $lastName)`.
- **Doctrine Lifecycle Events**: **DO NOT** use Doctrine lifecycle events like `#[ORM\PreUpdate]`, `#[ORM\PrePersist]`, or `#[ORM\HasLifecycleCallbacks]`. All updates to derived fields (like `fullName`) or timestamps (like `updatedAt`) **MUST** be handled manually in the Application layer (e.g., in Processors, Services, or specific Entity methods called by the application).
- **API Resource Pattern**: **ALWAYS** use a separate Resource DTO class (located in `src/Infrastructure/Api/Resource/`) instead of exposing Doctrine Entities directly as API resources if the entity has a private constructor.
    - The API Platform `Provider` must map the Entity to the Resource DTO.
    - The API Platform `Processor` must map the Resource DTO back to the Entity using its named constructor (e.g., `create()`).
    - This ensures Domain encapsulation while keeping API Platform functional.
- **Default Values**: When a string value is unknown or missing, use an **empty string** `''` instead of placeholders like `'Unknown'`, `'N/A'`, or `'Pending'`, unless `null` is explicitly required and supported by the schema.
- **Environment Variables**: Follow the "Environment Variables Documentation" section above.


### 1. Frontend Language
- **MANDATORY**: Always use **TypeScript** (`.ts`, `.tsx`) for all new frontend components and logic.
- Define proper interfaces in `assets/types/index.ts` for all entities and API responses.

### 2. API & Routing Management
- **Route Exposure**: For all new Symfony routes (including API Platform resources) that need to be accessed from React, you **MUST**:
    1.  Explicitly name the operations in the entity (e.g., `new GetCollection(name: 'api_entity_collection')`).
    2.  Add the route name to `config/packages/fos_js_routing.yaml` under `routes_to_expose`.
    3.  Execute `make dump-routes` to regenerate `assets/routing/routes.json`.
- **Usage**: Always use the `Routing` helper in React (e.g., `Routing.generate('route_name', { id: 1 })`) instead of hardcoding URLs.

### 3. Best Practices & Quality
- **Efficiency**: Optimize database queries (avoid N+1) and minimize API payload sizes. Use serialization groups (`#[Groups]`) to control exposed data.
- **Security**:
    - Ensure all new endpoints are protected by appropriate access control in `security.yaml`.
    - Always validate input data on the backend using Symfony Constraints.
    - Handle 401/403/422 errors gracefully in the UI.
- **Style**: Mimic the existing Tailwind CSS patterns. Use localized messages for all user-facing strings including server-side validation messages.
- **Clean Code**:
    - **Guard Clauses**: Use early returns/guard clauses whenever possible to reduce nesting and improve readability. Avoid large `if` blocks wrapping entire function bodies.
    - **DRY**: Re-use components and logic where appropriate.
    - **Naming**: Use descriptive, intention-revealing names for variables, functions, and classes.

### 4. Race Condition Prevention in Forms

**CRITICAL**: All form components that load data asynchronously **MUST** prevent race conditions by disabling form inputs during data loading.

#### Implementation Requirements:

When creating or modifying form components that fetch data (e.g., edit forms):

1. **Disable all form inputs during loading**:
   - Add `disabled={loading}` (or combined loading states like `disabled={loading || loadingPatient}`) to all `<input>`, `<textarea>`, and `<select>` elements
   - This prevents users from modifying fields while data is being fetched or submitted

2. **Add visual feedback for disabled state**:
   - Append loading CSS classes to input className: `${loading ? 'opacity-50 cursor-not-allowed' : ''}`
   - This provides clear visual indication that the form is processing
   - Use consistent styling: `opacity-50` for transparency and `cursor-not-allowed` for cursor feedback

3. **Combine multiple loading states when necessary**:
   - If your form has multiple async operations (e.g., `loading`, `loadingPatient`, `loadingCustomer`), create a combined state:
     ```typescript
     const isLoading = loading || loadingPatient || loadingCustomer;
     ```
   - Use this combined state for disabling inputs and buttons

4. **Disable action buttons**:
   - Submit buttons should use `disabled={loading}` or the combined loading state
   - Cancel/delete buttons should also be disabled during operations
   - Show loading spinners or text changes (e.g., "Saving..." instead of "Save")

#### Example Implementation:

```typescript
// Component with loading state
const [loading, setLoading] = useState<boolean>(false);

// Input field with disabled state and visual feedback
<input
    type="text"
    name="firstName"
    value={formData.firstName}
    onChange={handleChange}
    disabled={loading}
    className={`base-classes ${
        formErrors.firstName ? 'error-classes' : 'normal-classes'
    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
/>

// Submit button
<button
    type="submit"
    disabled={loading}
    className="base-button-classes"
>
    {loading ? t('saving') : t('save')}
</button>
```

#### Why This Matters:

- **Prevents data corruption**: Users can't overwrite data that's being loaded from the server
- **Prevents duplicate submissions**: Users can't click submit multiple times
- **Better UX**: Clear visual feedback about form state
- **Reliable E2E tests**: Playwright tests automatically wait for disabled inputs to become enabled before interacting with them

#### Affected Components:

All form components have been updated to follow this pattern:
- `CustomerForm.tsx`
- `PatientForm.tsx`
- `RecordForm.tsx`
- `InvoiceForm.tsx`

**When creating new forms**: Always implement this pattern from the start to prevent race conditions.

## Task Completion Checklist

**CRITICAL**: Before marking any task as complete, you **MUST** verify:

### 1. Translations
- Check if the new feature adds any UI text (buttons, labels, messages, errors, tooltips, etc.)
- Add translations for both English (`en`) and Spanish (`es`) in the translation system
- Ensure all user-facing text is internationalized
- Test that translations appear correctly in both languages

### 2. Functionality Verification
- Test that the implementation works as expected
- Verify that no steps were skipped during implementation
- Check that all edge cases are handled
- Ensure error messages are user-friendly and translated
- Confirm that the feature integrates correctly with existing functionality

### 3. Code Quality
- Remove debug code (console.log, error_log, etc.) unless intentionally needed
- Clean up commented-out code
- Ensure proper error handling
- Verify that all imports are used
- Check for any TODO comments that should be addressed

### 4. Documentation
- Update README.md if new environment variables were added
- Document any new API endpoints or significant changes
- Update AGENTS.md if new patterns or guidelines should be followed

## General Guidelines

- Always maintain consistency between `.env` and documentation
- Use clear, descriptive variable names
- Include sensible default values
- Group related variables together
- Add comments in `.env` to explain complex variables
- Keep the README documentation user-friendly and comprehensive

---

**Remember**:
- Undocumented variables create confusion and maintenance issues. Always keep the documentation up to date!
- Untranslated text creates a poor user experience. Always add translations for all user-facing text!
- Incomplete testing leads to bugs. Always verify functionality before completing a task!
