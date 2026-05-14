# Dependency Installation Security

Frontend JavaScript dependencies must be installed through the safe dependency workflow. Do not run direct `pnpm add` for project dependencies.

## Purpose

The dependency installation system reduces supply-chain risk before a package enters `package.json` or `pnpm-lock.yaml`.

It enforces these controls:

- dependency lifecycle scripts stay disabled during installs and safe adds;
- packages blocked by repository policy are rejected;
- missing npm registry metadata is rejected;
- deprecated npm packages are rejected;
- OSV vulnerabilities with `HIGH` or `CRITICAL` severity are rejected;
- package versions published less than 7 days ago require manual review;
- selected package versions with lifecycle scripts require manual review;
- CI audits lockfile changes so bypassing the local wrapper still fails review.

## System Components

| Component | Path | Responsibility |
|-----------|------|----------------|
| pnpm workspace policy | `pnpm-workspace.yaml` | Keeps lifecycle scripts disabled with `ignoreScripts: true`, blocks `allowBuilds.esbuild` with `false`, and pins patched transitive versions for audit cleanups. |
| Dependency policy | `config/dependency-policy.json` | Defines blocked severities, lifecycle scripts that require review, minimum package age, allowlist and blocklist. |
| Risk evaluator | `scripts/security/dependency-security.mjs` | Pure package spec parsing, npm metadata mapping, OSV severity evaluation, report formatting, and CLI argument normalization. |
| Package check CLI | `scripts/security/check-package.mjs` | Checks one or more package specs, or audits the current lockfile with `--lockfile`. |
| Safe add CLI | `scripts/security/pnpm-safe-add.mjs` | Checks package risk before running `pnpm add --ignore-scripts`; then runs a high-severity audit. |
| npm scripts | `package.json` | Exposes dependency commands under `deps:*`. |
| Make targets | `Makefile` | Provides the preferred developer interface for dependency checks and additions. |
| CI gates | `.github/workflows/ci.yml` | Verifies pnpm script blocking, audits vulnerabilities, and checks lockfile policy. |
| Unit tests | `assets/tests/security/dependencySecurity.test.ts` | Covers pure evaluator behavior and CLI argument normalization. |

## Policy File

The active policy is stored in `config/dependency-policy.json`:

```json
{
  "blockSeverities": ["HIGH", "CRITICAL"],
  "reviewLifecycleScripts": ["preinstall", "install", "postinstall", "prepare"],
  "minimumVersionAgeDays": 7,
  "allowedPackages": [],
  "blockedPackages": []
}
```

`allowedPackages` is intentionally not a bypass for vulnerabilities. Allowed packages still fail when they have blocked vulnerabilities.

Use `blockedPackages` for known-bad package names, typosquatting attempts, abandoned packages, or packages rejected by manual security review.

## Transitive Vulnerability Overrides

When an upstream package still resolves a vulnerable transitive dependency, `pnpm-workspace.yaml` can pin a patched transitive version under `overrides`.

Current overrides keep `pnpm audit --audit-level high` green for known advisories in `minimatch`, `picomatch`, and `rollup` while preserving the existing direct dependency set.

Review overrides periodically. Remove an override when the parent dependency releases a patched dependency graph.

## Preferred Make Commands

### Check A Package Without Installing

```bash
make deps-check pkg=@heroicons/react@2.2.0
```

This runs:

```bash
pnpm run deps:check -- @heroicons/react@2.2.0
```

Use this before proposing a dependency in an issue, task, or pull request.

### Add A Production Dependency

```bash
make deps-add pkg=@heroicons/react@2.2.0
```

This runs the safe wrapper and, only if the package passes, executes `pnpm add --ignore-scripts`.

Equivalent direct script:

```bash
pnpm run deps:add -- @heroicons/react@2.2.0
```

### Add A Development Dependency

```bash
make deps-add-dev pkg=vitest@2.1.9
```

Equivalent direct script:

```bash
pnpm run deps:add:dev -- vitest@2.1.9
```

### Audit Current Dependencies

```bash
make deps-audit
```

Equivalent direct script:

```bash
pnpm run deps:audit
```

This runs `pnpm audit --audit-level high` and fails on high or critical vulnerability advisories.

### Install From Lockfile Without Scripts

```bash
make deps-install
```

Equivalent direct script:

```bash
pnpm run deps:install
```

This runs `pnpm install --frozen-lockfile --ignore-scripts`.

## Developer Workflow

1. Check the package with `make deps-check pkg=<package>@<version>`.
2. If the result is `PASS`, install with `make deps-add pkg=<package>@<version>` or `make deps-add-dev pkg=<package>@<version>`.
3. If the result is `REVIEW_REQUIRED`, complete manual review before adding the package.
4. If the result is `BLOCK`, do not install the package unless the underlying policy reason is resolved.
5. After dependency changes, run `make deps-audit` and the relevant frontend checks.
6. Document any manual review decision in the pull request.

## Report Statuses

### PASS

```text
PASS @heroicons/react@2.2.0
```

The selected version passed the configured risk checks.

### REVIEW_REQUIRED

```text
REVIEW_REQUIRED fuse.js@7.1.0
- Package fuse.js defines lifecycle script prepare.
```

The package is not automatically installed. Review the package and document the decision before proceeding.

### BLOCK

```text
BLOCK axios@1.6.0
- Vulnerability GHSA-43fc-jf86-j433 has blocked severity HIGH.
```

The package must not be installed in that version.

## Manual Review Checklist

Use this checklist when a package returns `REVIEW_REQUIRED`:

- confirm the package name is not a typosquatting variant;
- inspect npm registry metadata and selected version;
- review repository URL, maintainers, release cadence, and issue activity;
- inspect lifecycle scripts reported by the checker;
- check OSV and `pnpm audit` output;
- prefer an existing dependency when it can solve the same need;
- document the acceptance reason in the pull request.

Only update `config/dependency-policy.json` when a permanent policy exception or permanent package block is needed.

## CI Enforcement

CI runs the dependency gates after `pnpm install --frozen-lockfile`:

```bash
test "$(pnpm config get ignoreScripts)" = "true"
test "$(pnpm config get allowBuilds.esbuild)" = "false"
pnpm run deps:audit
pnpm run deps:check -- --lockfile
```

This catches lockfile changes even if a developer bypasses `make deps-add` locally.

## Troubleshooting

### `Invalid package spec: --`

The CLI normalizes pnpm argument separators. If this still appears, verify the command uses one of these forms:

```bash
make deps-check pkg=@heroicons/react@2.2.0
pnpm run deps:check -- @heroicons/react@2.2.0
```

### `pnpm ignoreScripts must be true`

Run:

```bash
pnpm config get ignoreScripts
```

Expected output:

```text
true
```

If it is not `true`, inspect `pnpm-workspace.yaml` before adding dependencies.

### Latest Package Version Is Too New

Use an explicit stable version:

```bash
make deps-check pkg=@heroicons/react@2.2.0
```

Do not bypass review for a new version only because the package name is familiar.
