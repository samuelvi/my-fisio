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
