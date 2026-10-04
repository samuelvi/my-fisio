# PCMS development context

## Load only what the task needs

1. Check Git status and the current branch before editing.
2. Read `memory-bank/active-context.md` and `memory-bank/system-patterns.md`.
3. For product context, read `memory-bank/product-context.md`. Use `docs/README.md`
   to locate a specific guide; do not load the whole specifications archive.
4. Verify documentation claims against the touched code. Historical specs and
   legacy `.agents/` documents may describe superseded behavior.

## Working conventions

- Communicate in Spanish; write code, comments and technical documentation in English.
- Keep changes focused and follow the surrounding feature's structure.
- Backend: Symfony 7.4 / PHP 8.4. API controllers, resources and state processors
  belong in `src/Infrastructure/Api/`; business commands in `src/Application/`;
  entities and repository interfaces in `src/Domain/`.
- Frontend: React/TypeScript. Start at `assets/app.tsx` and the relevant component;
  supporting layers already exist under `assets/`.
- SQL state is authoritative; synchronous domain events feed event storage/auditing.
- Use Composer and pnpm lockfiles. Follow `docs/security/dependency-installation.md`
  when adding frontend dependencies.
- Use existing Make targets. PHP/build commands run in Docker; browser tooling
  currently runs on the host against the test stack. Check running containers and
  mounted checkout before starting/stopping services. Report unavailable runtime checks.
- Do not read production env files, expose secrets, or commit local env overrides.

## Handoff

Keep memory concise: record verified decisions, source pointers, remaining work,
and actual validation results. Update existing entries instead of duplicating
guides or accumulating session transcripts. Use `make help` for command details.
