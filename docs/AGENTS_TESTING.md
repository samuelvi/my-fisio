# AGENTS_TESTING.md - Testing Agent Guide

> **IMPORTANT**: All code, documentation, comments, database schema, API endpoints, and any project-related content MUST be written in **English**.

## Purpose
This agent defines testing conventions and validation practices for the project.

## Testing Guidelines

### UI / E2E (Playwright)
- **Click by accessible name**: always click buttons or links by their accessible name (`getByRole({ name })`). Do not click by `id`, `class`, or CSS selectors.
- **Prefer role-based queries**: use `getByRole` with `name` and `level` for headings, buttons, links, and form inputs.
- **Keep locale deterministic**: set `app_locale` explicitly when the test relies on text.
- **Avoid brittle selectors**: no CSS class selectors or deep DOM paths unless absolutely necessary.
- **Wait on real signals**: wait for URLs, visible text, or API responses—not arbitrary timeouts.

### Test Execution Commands
- **Run all E2E tests**: `make test-e2e`
- **Run a single E2E test**: `make test-e2e file=tests/e2e/filename.spec.js`
- **Run E2E in UI mode**: `make test-e2e-ui [file=...]`
- **Run PHPUnit tests**: `make test`

### Backend / API
- **Validate server responses**: assert status codes and payload shape.
- **Test error cases**: include negative cases for validation and authorization.
- **Use test endpoints only in test env**: ensure they are gated by environment checks.
- **Verification Strategy**: Use `GET /api/test/stats` to verify raw database counts after write operations. This ensures tests are independent of frontend pagination or filters.
- **Test Data**: 
    - `POST /api/test/reset-db-empty`: Clean database, only admin user created.
    - `POST /api/test/reset-db`: Standard dataset (15 patients) for testing list/search features.
