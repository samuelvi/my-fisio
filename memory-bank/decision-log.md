# Decisions

## Project naming
Use PCMS in prose, `pcms` for the clone directory and frontend package, and `physiotherapy/pcms` for Composer. Existing runtime container/database names remain as configured.

## Documentation consolidation
README is the quick start; `docs/README.md` is the documentation index; detailed operational and feature information lives once in focused guides. Retain unique historical specifications without presenting them as current implementation.

## Lightweight context
Keep verified facts and source pointers in this memory bank. Root `AGENTS.md` points here so future agents need not load the full documentation corpus. Do not store credentials or production environment contents.

## Command simplification
Use Compose v2 health waits rather than sleeps. Installation consumes lockfiles;
remove skeleton creation and per-tool package installers. `build-assets` assumes
dependencies are installed and exports routes before Vite. E2E modes share one
preparation path and propagate failures. Keep useful aliases (`test-unit`,
`dev-quick-start`, `dev-shell`) out of the main help listing.
