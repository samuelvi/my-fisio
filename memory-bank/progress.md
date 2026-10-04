# Progress

- Naming cleanup merged in commit `86fab40`: clone into pcms, Composer/frontend names, installation guide and Makefile messages.
- Reviewed application entry point, patient write flow, event audit handler, Messenger configuration, dev/test Docker definitions and operational docs.
- Consolidated README, architecture, installation, configuration and test guides;
  replaced duplicate index and data-model copies with links.
- Simplified Makefile: lockfile-only setup, Compose health waits, common test
  preparation, ordered lifecycle targets, routes before build, non-mutating video mode.
- Added root AGENTS.md and compact, source-verified project memory.
- Validation: six isolated Make workflow checks passed; local Markdown links and
  phony-target declarations passed; dev/test Compose configuration is valid;
  static review found no important issues.
- Real Docker/application validation remains pending because the daemon is unavailable.
