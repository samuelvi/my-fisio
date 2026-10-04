# Active context

## Current work
Independent PCMS skills library and source-backed System Design, on
`feature/pcms-skills-library`. User approved direct branches without worktrees.
The external sibling repository is `TinaFisioBackendSkills`; it supersedes
`opencode-bundle` for PCMS. The old bundle has user changes and is preserved untouched.
No remote has been approved for the external repository.

## Verified
- External inventory preserves 188 source entries in 166 immutable trees (482 files).
- The external SOUL snapshot matches the user-supplied original byte-for-byte.
- System Design now links critical flows, data/consistency and runtime boundaries.
  It distinguishes source-verified behavior from deployment assumptions.
- Known transaction/audit/numbering limitations are documented in the design;
  do not infer universal command transactions or gapless, unique invoice numbering.

## Validation
- 227 local Markdown links/anchors checked across maintained application/library docs.
- Library source integrity and no-model OpenCode profile discovery passed.
- All 29 library tooling tests passed, including the installed-client smoke.
- Authenticated fresh sessions loaded native PCMS skills, read canonical design,
  applied SOUL and respected read-only scope. A relocated source/design fixture
  also passed; no running application was involved.
- `make opencode-start` uses the external launcher; `make opencode-verify` passed.
  Run/TUI wait for catalog readiness on the same private server and bind PWD.
- Behavioral scenario evidence and limits live in the external library's
  `tests/scenarios/EVALUATION.md`; tooling/integration results in `docs/validation.md`.

## Remaining validation
Docker daemon was unavailable on 2026-10-04. Application container startup,
PHPUnit/Vitest/Playwright and HTTP checks were not run. This change touches
documentation and agent bootstrap, not PHP/React behavior.

## Context hygiene
Memory is plain Markdown for direct agent access. Read the external SOUL and only
the relevant curated `pcms-*` skill. Local `.skills/`, legacy `.agents/` guidance
and the old bundle are historical, not current implementation instructions.
