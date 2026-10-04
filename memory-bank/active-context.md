# Active context

## Current work
Documentation and developer tooling consolidated on `fix/project-clarity`.
The user approved direct branch work without worktrees for this task.
Integration into main is pending confirmation.

## Verified
- README: 70 lines; Makefile: 270 lines; one 30-line documentation index.
- Six isolated Make workflow checks passed: lockfile setup, routes-before-build,
  video error propagation, shared E2E preparation, argument validation and ordered restart.
- Local links in changed Markdown files resolve; all 78 Make targets are phony.
- Development and test Compose definitions pass `docker compose ... config --quiet`.
- Independent static review found no important issues.

## Remaining validation
Docker daemon was unavailable. Real container startup, Composer validation,
PHPUnit/Vitest/Playwright and application HTTP checks have not run for this change.
When Docker is available, verify mounted paths, then exercise `make dev-install`,
`make build-assets` and the relevant test targets. Stop test containers afterward.

## Context hygiene
Memory is stored as plain Markdown for direct agent access. The configured MCP
writer attempted a duplicated `memory-bank/memory-bank` path; use these canonical
root files rather than creating a second copy.
