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

## Development Conventions

When implementing new modules, listings (CRUD), or actions, adhere strictly to the following technical standards:

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
